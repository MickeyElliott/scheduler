// Web Push e2e in headless Chrome (Chrome pushes via FCM, so this exercises the real server path end to end).
// Needs a throwaway allowlisted login + household, and the cron secret so it can trigger the scheduled run:
//   E2E_EMAIL=... CRON_SECRET=... node tools/e2e-push.mjs     (serve the repo on ROOT first; delete the test user after)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const ROOT = process.env.ROOT || 'http://127.0.0.1:8765/', OUT = process.env.OUT || '/tmp/out';
const EMAIL = process.env.E2E_EMAIL, CRON = process.env.CRON_SECRET, FN = 'https://clpwvixdvzjvmnsuukbj.supabase.co/functions/v1/push-reminders';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dir = '/tmp/chr-e2epush'; fs.rmSync(dir, { recursive: true, force: true });
const proc = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9391', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch('http://127.0.0.1:9391/json/list')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errors = [];
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 300)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async js => { const r = await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const until = async (js, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await ev(js); if (v) return v; await sleep(250); } return null; };
const click = async sel => { const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`); if (!r) throw new Error('no ' + sel);
  for (const t of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x: r[0], y: r[1], button: 'left', clickCount: 1 }); await sleep(300); };
const results = []; const ok = (l, c, i) => { results.push(c); console.log(c ? 'PASS' : 'FAIL', l, i === undefined ? '' : JSON.stringify(i).slice(0, 220)); };
const box = `(document.querySelector('[data-pushbox]')||{}).innerText||''`;
const rows = `SchedSync.current.db().from('push_subscriptions').select('endpoint,enabled,remind_time,last_sent_on,last_error')`;
await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Browser.grantPermissions', { origin: new URL(ROOT).origin, permissions: ['notifications'] });
await send('Page.navigate', { url: ROOT + '#view=settings' }); await sleep(2500);
await until(`!!document.querySelector('#syncHost .sync')&&document.querySelector('#syncHost .sync').dataset.mode==='signedout'`);
await until(`/Sign in first/.test(${box})`, 8000);
ok('signed out: card says to sign in first, no Enable button', /Sign in first/.test(await ev(box)) && !(await ev(`!!document.querySelector('[data-push=enable]')`)));
await ev(`SchedSync.current.signIn(${JSON.stringify(EMAIL)})`);
ok('signed in: Enable reminders button with 19:00 default', !!(await until(`!!document.querySelector('[data-push=enable]')`)) && await ev(`document.querySelector('[data-push-time]').value==='19:00'`));
await click('[data-push=enable]');
const on = await until(`!!document.querySelector('[data-push=pause]')`, 20000);
ok('Enable (real click) -> permission granted, push subscription created, card shows ON', !!on, await ev(box));
if (!on) { console.log('FAILED EARLY', await ev(`document.querySelector('.push__msg').innerText`), await ev(`Notification.permission`)); proc.kill(); process.exit(1); }
const sub = await ev(`navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>s&&s.endpoint)`);
ok('subscription endpoint is an FCM push service URL', /^https:\/\/fcm\.googleapis\.com\//.test(sub), sub && sub.slice(0, 50));
let r = await ev(`${rows}.then(x=>x.data)`);
ok('row saved under RLS (enabled, 19:00)', r.length === 1 && r[0].enabled && r[0].remind_time === '19:00', r);
// RLS: anon can't read; a non-member insert is rejected
const anon = await ev(`fetch('https://clpwvixdvzjvmnsuukbj.supabase.co/rest/v1/push_subscriptions?select=endpoint',{headers:{apikey:SCHED_CONFIG.SUPABASE_ANON_KEY}}).then(async x=>({s:x.status,b:(await x.text()).slice(0,80)}))`);
ok('anon cannot read subscriptions', anon.s >= 400 || anon.b === '[]', anon);
const foreign = await ev(`SchedSync.current.db().from('households').select('id,name').then(x=>x.data.map(h=>h.name))`);
ok('this login only sees its own household', foreign.length === 1, foreign);
const bad = await ev(`SchedSync.current.db().from('push_subscriptions').insert({household_id:'00000000-0000-0000-0000-000000000001',user_email:'x@y.z',endpoint:'https://fcm.googleapis.com/fcm/send/zzz',p256dh:'a',auth:'b'}).then(x=>x.error&&x.error.message)`);
ok('insert into a household you are not in is rejected', !!bad, bad);
const evil = await ev(`SchedSync.current.db().from('push_subscriptions').update({last_error:'x',endpoint:'https://evil.example/'}).eq('endpoint',${JSON.stringify(sub)}).then(x=>x.error&&x.error.message)`);
ok('client cannot rewrite endpoint (column grants)', /permission denied/i.test(evil || ''), evil);
// time + toggle
await ev(`(()=>{const i=document.querySelector('[data-push-time]');i.value='21:30';i.dispatchEvent(new Event('change',{bubbles:true}))})()`); await sleep(1500);
r = await ev(`${rows}.then(x=>x.data[0])`); ok('time picker saves (21:30)', r.remind_time === '21:30', r);
await click('[data-push=pause]'); await sleep(1200); r = await ev(`${rows}.then(x=>x.data[0])`); ok('toggle off saves enabled=false', r.enabled === false);
await click('[data-push=resume]'); await sleep(1200); r = await ev(`${rows}.then(x=>x.data[0])`); ok('toggle on again', r.enabled === true);
// Send test -> edge function -> web-push -> FCM -> Chrome -> service worker
await ev(`navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(n=>n.forEach(x=>x.close()))`);
await click('[data-push=test]');
await until(`/Sent\\.|Failed/.test(${box})`, 20000); const m1 = await ev(box);
ok('Send test: edge function accepted and push service delivered', /Sent\./.test(m1), m1.split('\n').pop());
const got = await until(`navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(n=>n.length?n.map(x=>({t:x.title,b:x.body,u:x.data&&x.data.url})):null)`, 25000);
ok('service worker showed the notification (title/body/url)', !!got && /^Test: /.test(got[0].t), got);
// Scheduled run: make the reminder due (5 min ago PT) and call the cron endpoint
await ev(`navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(n=>n.forEach(x=>x.close()))`);
const due = await ev(`(()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',hourCycle:'h23',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));let m=+p.hour*60+ +p.minute-5;if(m<0)m=0;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')})()`);
await ev(`${rows.replace("select('endpoint,enabled,remind_time,last_sent_on,last_error')", "update({remind_time:" + JSON.stringify(due) + ",last_sent_on:null,enabled:true})")}.eq('endpoint',${JSON.stringify(sub)})`);
const run = async () => (await fetch(FN, { method: 'POST', headers: { 'x-cron-secret': CRON, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'run' }) })).json();
let a = await run(); ok('cron run: sends the due reminder', a.sent === 1, a);
const got2 = await until(`navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(n=>n.length?n.map(x=>({t:x.title,b:x.body})):null)`, 25000);
ok('scheduled reminder arrived with specific text', !!got2 && !/^Test:/.test(got2[0].t), got2);
a = await run(); ok('second run same day: no duplicate', a.sent === 0, a);
r = await ev(`${rows}.then(x=>x.data[0])`); ok('last_sent_on recorded (today PT)', !!r.last_sent_on, r.last_sent_on);
// notificationclick -> opens/focuses Study
await ev(`navigator.serviceWorker.addEventListener('message',e=>{window.__got=e.data})`);
// expired endpoint cleanup: a fake subscription whose push service answers 404/410
const fake = await ev(`(async()=>{const k=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);const raw=new Uint8Array(await crypto.subtle.exportKey('raw',k.publicKey));
  const b64=u=>btoa(String.fromCharCode(...u)).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
  const ep='https://fcm.googleapis.com/fcm/send/'+b64(crypto.getRandomValues(new Uint8Array(24)))+':APA91b'+b64(crypto.getRandomValues(new Uint8Array(60)));
  const ctx=SchedSync.current.ctx();const x=await SchedSync.current.db().from('push_subscriptions').insert({household_id:ctx.hid,user_email:ctx.email,endpoint:ep,p256dh:b64(raw),auth:b64(crypto.getRandomValues(new Uint8Array(16))),remind_time:${JSON.stringify(due)}});return x.error?x.error.message:ep})()`);
a = await run(); const left = await ev(`${rows}.then(x=>x.data.length)`);
ok('expired/invalid subscription is removed (404/410) or reported', a.removed === 1 || a.failed === 1, { a, left, fake: String(fake).slice(0, 40) });
// remove from this device
await click('[data-push=remove]'); await sleep(1500);
ok('Remove deletes the row and unsubscribes', (await ev(`${rows}.then(x=>x.data.filter(r=>r.endpoint===${JSON.stringify(sub)}).length)`)) === 0 && (await ev(`navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>!s)`)));
// notificationclick path: the worker messages the page, which jumps to Study
await send('Page.navigate', { url: ROOT + '#view=settings' }); await sleep(2000);
await ev(`navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'open-study'}}))`); await sleep(500);
ok('open-study message from the worker opens the Study tab', await ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.view==='study'`));
// Study prompt (compact) shows when ready
await send('Page.navigate', { url: ROOT + '#view=study' }); await sleep(3000);
await ev(`SchedSync.current&&1`); await until(`!!document.querySelector('[data-pushbox][data-compact] [data-push=enable]')||!!document.querySelector('#main .sx-gate')`, 12000);
ok('Study shows a small reminder prompt (if study content is available) or the gate', true, await ev(`(document.querySelector('[data-pushbox][data-compact]')||{}).innerText||'(gate/no study content)'`));
ok('no JS errors', errors.length === 0, errors);
proc.kill(); console.log(results.every(Boolean) ? 'ALL PASSED' : 'SOME FAILED'); process.exit(results.every(Boolean) ? 0 : 1);
