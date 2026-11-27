// Edge Function: push-reminders
//  POST {action:'run'}                      header x-cron-secret   -> send every reminder that is due (called by pg_cron every 15 min)
//  POST {action:'preview', household:name}  header x-cron-secret   -> return the text that would be sent (nothing is sent)
//  POST {action:'test', endpoint}           Authorization: user JWT -> send one reminder now to that subscription
// Deployed with verify_jwt=false: it does its own checks (cron secret, or a signed-in allowlisted user).
// The VAPID private key comes from the VAPID_PRIVATE_KEY function secret if set, else from Supabase Vault.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUBJECT = "mailto:mickeyelliott@hotmail.com";
const PUSH_HOSTS = /^https:\/\/(web\.push\.apple\.com|fcm\.googleapis\.com|[a-z0-9.-]+\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)\//;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function secret(name: string, env?: string): Promise<string> {
  const e = env && Deno.env.get(env); if (e) return e;
  const { data, error } = await sb.rpc("push_secret", { secret_name: name });
  if (error || !data) throw new Error("missing secret " + name);
  return data as string;
}
let vapidReady = false;
async function initVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(SUBJECT, await secret("vapid_public_key", "VAPID_PUBLIC_KEY"), await secret("vapid_private_key", "VAPID_PRIVATE_KEY"));
  vapidReady = true;
}

/* local date / time in a zone */
function localParts(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
}
const clip = (s: string, n: number) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

/* "N cards due" + one case/policy/oral title that rotates daily. Short on purpose. */
async function buildMessage(hid: string, tz: string) {
  const today = localParts(new Date(), tz).date;
  const [recs, content] = await Promise.all([
    sb.from("records").select("key,value").eq("household_id", hid).eq("scope", "study").like("key", "fc|%").eq("deleted", false),
    sb.from("study_content").select("key,data").in("key", ["cards", "cases", "policy", "oral"]),
  ]);
  const by: Record<string, any[]> = {}; (content.data || []).forEach((r: any) => by[r.key] = r.data || []);
  const ids = new Set((by.cards || []).map((c: any) => c.id));
  const seen = (recs.data || []).filter((r: any) => r.value && ids.has(String(r.key).slice(3)));
  const due = seen.filter((r: any) => r.value.due && r.value.due <= today).length;
  const fresh = Math.max(0, ids.size - seen.length);
  const topics = [
    ...(by.cases || []).map((c: any) => clip(c.name, 50)),
    ...(by.policy || []).map((p: any) => clip(p.title, 50)),
    ...(by.oral || []).map((o: any) => clip(o.topic, 50)),
  ].filter(Boolean);
  const day = Math.floor(Date.parse(today + "T00:00:00Z") / 864e5);
  const focus = topics.length ? topics[day % topics.length] : "";
  const title = due > 0 ? `${due} card${due > 1 ? "s" : ""} due` : fresh > 0 ? "Time to drill" : "Quick review";
  const lead = due > 0 ? "" : fresh > 0 ? `${Math.min(10, fresh)} new cards waiting. ` : "";
  const body = clip(`${lead}${focus ? "Today: " + focus + ". " : ""}Tap to start.`, 110);
  return { title, body, url: "index.html#view=study", tag: "drill" };
}

async function sendTo(sub: any, msg: unknown) {
  if (!PUSH_HOSTS.test(sub.endpoint)) return { ok: false, status: 400, error: "endpoint host not allowed" };
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(msg), { TTL: 6 * 3600 });
    return { ok: true, status: 201 };
  } catch (e: any) {
    return { ok: false, status: e?.statusCode || 0, error: clip(e?.body || e?.message || String(e), 200) };
  }
}

async function run() {
  await initVapid();
  const { data: subs, error } = await sb.from("push_subscriptions").select("*").eq("enabled", true);
  if (error) throw error;
  const now = new Date(), msgCache = new Map<string, any>(), out = { checked: subs?.length || 0, sent: 0, removed: 0, failed: 0 };
  for (const s of subs || []) {
    let lp; try { lp = localParts(now, s.tz); } catch { continue; }
    const [h, m] = String(s.remind_time).split(":").map(Number), at = h * 60 + m;
    if (s.last_sent_on && s.last_sent_on >= lp.date) continue;       // already sent today
    if (lp.min < at || lp.min >= at + 180) continue;                  // not yet, or more than 3 h late: skip today
    // claim today's slot first so overlapping runs can't double-send
    const { data: claimed } = await sb.from("push_subscriptions").update({ last_sent_on: lp.date, updated_at: now.toISOString() })
      .eq("id", s.id).eq("enabled", true).or(`last_sent_on.is.null,last_sent_on.lt.${lp.date}`).select("id");
    if (!claimed || !claimed.length) continue;
    const k = s.household_id + "|" + s.tz;
    if (!msgCache.has(k)) msgCache.set(k, await buildMessage(s.household_id, s.tz));
    const r = await sendTo(s, msgCache.get(k));
    if (r.ok) { out.sent++; await sb.from("push_subscriptions").update({ last_error: null }).eq("id", s.id); }
    else if (r.status === 404 || r.status === 410) { out.removed++; await sb.from("push_subscriptions").delete().eq("id", s.id); }
    else { out.failed++; await sb.from("push_subscriptions").update({ last_error: `${r.status} ${r.error}`, last_sent_on: s.last_sent_on }).eq("id", s.id); } // retry next run
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let body: any = {}; try { body = await req.json(); } catch { /* empty */ }
  try {
    const cron = req.headers.get("x-cron-secret");
    if (cron) {
      if (cron !== await secret("push_cron_secret", "PUSH_CRON_SECRET")) return json({ error: "forbidden" }, 403);
      if (body.action === "run") return json(await run());
      if (body.action === "preview") {
        const { data: h } = await sb.from("households").select("id").eq("name", String(body.household || "")).maybeSingle();
        if (!h) return json({ error: "no such household" }, 404);
        return json(await buildMessage(h.id, "America/Los_Angeles"));
      }
      return json({ error: "unknown action" }, 400);
    }
    if (body.action === "test") {
      const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: u } = await sb.auth.getUser(jwt);
      const email = u?.user?.email?.toLowerCase();
      if (!email) return json({ error: "sign in first" }, 401);
      const { data: mem } = await sb.from("household_members").select("household_id").eq("email", email);
      const hids = (mem || []).map((m: any) => m.household_id);
      const { data: sub } = await sb.from("push_subscriptions").select("*").eq("endpoint", String(body.endpoint || "")).in("household_id", hids.length ? hids : ["00000000-0000-0000-0000-000000000000"]).maybeSingle();
      if (!sub) return json({ error: "subscription not found" }, 404);
      await initVapid();
      const m = await buildMessage(sub.household_id, sub.tz);
      const r = await sendTo(sub, { ...m, title: "Test: " + m.title });
      if (!r.ok && (r.status === 404 || r.status === 410)) await sb.from("push_subscriptions").delete().eq("id", sub.id);
      return json(r, r.ok ? 200 : 502);
    }
    return json({ error: "unauthorized" }, 401);
  } catch (e: any) {
    return json({ error: clip(e?.message || String(e), 200) }, 500);
  }
});
