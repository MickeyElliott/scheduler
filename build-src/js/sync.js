/* SchedSync: tiny offline-first sync layer shared by index.html and meals.html.
 * - Every synced value is a record (scope, key) -> {v: value, d: deleted, t: ISO updated_at}.
 * - Records live in localStorage (the offline cache). Changes go into a write queue.
 * - When Supabase is configured (config.js) and the user is signed in, the queue is
 *   flushed with upserts, remote rows are pulled, and a realtime channel streams changes.
 * - Conflicts: last write wins per record (client compares updated_at; the DB trigger
 *   ignores an update older than the stored row).
 * Without config it runs in local-only mode with the same API.
 */
(function () {
  'use strict';
  const CFG = Object.assign({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '', SUPABASE_JS: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm' }, window.SCHED_CONFIG || {});
  const CACHE_KEY = 'sched.sync.v1';
  const SEP = '\u0001';
  const ms = t => (t ? Date.parse(t) : 0);
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  function readCache() {
    let c; try { c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { c = null; }
    c = c || {}; c.recs = c.recs || {}; c.queue = c.queue || []; c.device = c.device || rid(); c.lastPull = c.lastPull || null;
    return c;
  }
  function writeCache(c) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* quota */ } }

  function create(opts) {
    opts = opts || {};
    let cache = readCache(); writeCache(cache);
    const listeners = new Set();
    let status = { mode: 'local', pending: cache.queue.length, email: null, message: '' };
    let sb = null, hid = null, channel = null, flushing = false, flushTimer = null, retryMs = 2000, started = false;
    const configured = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

    const setStatus = patch => { status = Object.assign({}, status, patch, { pending: cache.queue.length }); listeners.forEach(f => { try { f(status); } catch (e) { console.error(e); } }); };
    const mutate = fn => { cache = readCache(); const r = fn(cache); writeCache(cache); return r; };
    const nowAfter = prev => { let t = Date.now(); if (prev && ms(prev) >= t) t = ms(prev) + 1; return new Date(t).toISOString(); };

    /* ---------- local API ---------- */
    function map(scope) {
      const out = {}, p = scope + SEP;
      for (const k in cache.recs) if (k.startsWith(p) && !cache.recs[k].d) out[k.slice(p.length)] = cache.recs[k].v;
      return out;
    }
    function get(scope, key) { const r = cache.recs[scope + SEP + key]; return r && !r.d ? r.v : undefined; }
    function put(scope, key, value) {
      mutate(c => {
        const k = scope + SEP + key, prev = c.recs[k];
        c.recs[k] = { v: value == null ? null : value, d: value == null, t: nowAfter(prev && prev.t) };
        if (!c.queue.includes(k)) c.queue.push(k);
      });
      setStatus({}); scheduleFlush(300);
    }
    function putMany(list) {           // [[scope, key, value], ...] in one cache write
      if (!list.length) return;
      mutate(c => { for (const [scope, key, value] of list) { const k = scope + SEP + key, prev = c.recs[k];
        c.recs[k] = { v: value == null ? null : value, d: value == null, t: nowAfter(prev && prev.t) }; if (!c.queue.includes(k)) c.queue.push(k); } });
      setStatus({}); scheduleFlush(300);
    }
    /* seed: add a record only if this device has never seen it (used to upload pre-sync local data) */
    function seed(scope, key, value, t) {
      const k = scope + SEP + key;
      if (cache.recs[k]) return false;
      mutate(c => { if (!c.recs[k]) { c.recs[k] = { v: value, d: false, t: t || '2000-01-01T00:00:00.000Z' }; c.queue.push(k); } });
      return true;
    }
    function hasScope(scope) { const p = scope + SEP; return Object.keys(cache.recs).some(k => k.startsWith(p)); }

    /* ---------- merge a remote row (LWW) ---------- */
    function mergeRows(rows) {
      const changed = [];
      mutate(c => {
        for (const row of rows) {
          const k = row.scope + SEP + row.key, t = new Date(row.updated_at).toISOString(), local = c.recs[k];
          if (!local || ms(t) > ms(local.t)) {
            c.recs[k] = { v: row.deleted ? null : row.value, d: !!row.deleted, t };
            const qi = c.queue.indexOf(k); if (qi >= 0) c.queue.splice(qi, 1);
            changed.push({ scope: row.scope, key: row.key, value: row.deleted ? null : row.value });
          } else if (ms(t) < ms(local.t) && !c.queue.includes(k)) {
            c.queue.push(k);                        // ours is newer: make sure it goes up
          }
          if (!c.lastPull || ms(t) > ms(c.lastPull)) c.lastPull = t;
        }
      });
      if (changed.length && opts.onRemote) { try { opts.onRemote(changed); } catch (e) { console.error(e); } }
      return changed.length;
    }

    /* ---------- remote ---------- */
    function scheduleFlush(delay) { clearTimeout(flushTimer); flushTimer = setTimeout(flush, delay || 0); }
    async function flush() {
      if (!sb || !hid || flushing) return;
      if (!navigator.onLine) { setStatus({ mode: 'offline' }); return; }
      cache = readCache();
      if (!cache.queue.length) { setStatus({ mode: 'synced' }); return; }
      flushing = true; setStatus({ mode: 'syncing' });
      try {
        while (cache.queue.length) {
          const keys = cache.queue.slice(0, 200);
          const rows = keys.map(k => { const [scope, key] = k.split(SEP); const r = cache.recs[k] || { v: null, d: true, t: new Date().toISOString() };
            return { household_id: hid, scope, key, value: r.d ? null : r.v, deleted: !!r.d, updated_at: r.t, updated_by: cache.device }; });
          const sent = Object.fromEntries(keys.map(k => [k, (cache.recs[k] || {}).t]));
          const { error } = await sb.from('records').upsert(rows, { onConflict: 'household_id,scope,key' });
          if (error) throw error;
          mutate(c => { c.queue = c.queue.filter(k => !(k in sent) || (c.recs[k] && c.recs[k].t !== sent[k])); });
        }
        retryMs = 2000; setStatus({ mode: 'synced', message: '' });
      } catch (e) {
        console.warn('[sync] flush failed', e && e.message);
        setStatus({ mode: navigator.onLine ? 'error' : 'offline', message: (e && e.message) || 'Sync failed' });
        scheduleFlush(retryMs); retryMs = Math.min(retryMs * 2, 60000);
      } finally { flushing = false; }
    }
    async function pull(full) {
      if (!sb || !hid || !navigator.onLine) return;
      cache = readCache();
      const since = !full && cache.lastPull ? new Date(ms(cache.lastPull) - 120000).toISOString() : null;
      let from = 0; const page = 1000;
      for (;;) {
        let q = sb.from('records').select('scope,key,value,deleted,updated_at').eq('household_id', hid).order('updated_at', { ascending: true }).range(from, from + page - 1);
        if (since) q = q.gt('updated_at', since);
        const { data, error } = await q;
        if (error) { setStatus({ mode: 'error', message: error.message }); return; }
        mergeRows(data || []);
        if (!data || data.length < page) break;
        from += page;
      }
    }
    function subscribe() {
      if (channel) sb.removeChannel(channel);
      channel = sb.channel('records-' + hid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'records', filter: 'household_id=eq.' + hid }, p => { if (p.new && p.new.scope) mergeRows([p.new]); setStatus({}); })
        .subscribe(st => { if (st === 'SUBSCRIBED') { pull(false).then(() => flush()); } });
    }
    async function start(session) {
      setStatus({ email: session.user.email, mode: 'syncing' });
      const { data, error } = await sb.from('household_members').select('household_id').limit(1);
      if (error) { setStatus({ mode: navigator.onLine ? 'error' : 'offline', message: error.message }); setTimeout(() => start(session), 15000); return; }
      if (!data || !data.length) { hid = null; setStatus({ mode: 'denied', message: session.user.email + ' is not on the allowlist.' }); return; }
      hid = data[0].household_id; started = true;
      await pull(!cache.lastPull);
      await flush();
      subscribe();
    }
    let libTries = 0;
    async function init() {
      if (!configured) { setStatus({ mode: 'local' }); return; }
      setStatus({ mode: 'loading' });
      let mod;
      try { mod = await import(CFG.SUPABASE_JS); libTries = 0; } catch (e) {
        libTries++; setStatus({ mode: navigator.onLine ? 'error' : 'offline', message: 'Could not load the sync library. Retrying…' });
        setTimeout(init, Math.min(30000, 2000 * 2 ** (libTries - 1))); return; }
      sb = mod.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'sched-auth' },
        realtime: { params: { eventsPerSecond: 10 } },
      });
      sb.auth.onAuthStateChange((evt, session) => {
        if (evt === 'SIGNED_OUT') { hid = null; started = false; if (channel) { sb.removeChannel(channel); channel = null; } setStatus({ mode: 'signedout', email: null }); }
        else if (session && !started && (evt === 'SIGNED_IN' || evt === 'INITIAL_SESSION')) { setTimeout(() => start(session), 0); }
      });
      const { data } = await sb.auth.getSession();
      if (!data.session) setStatus({ mode: 'signedout' });
      if (/access_token=|error_description=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    }
    addEventListener('online', () => { if (sb && hid) { pull(false).then(flush); } setStatus({ mode: sb && hid ? 'syncing' : status.mode }); });
    addEventListener('offline', () => { if (sb) setStatus({ mode: 'offline' }); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && sb && hid) pull(false).then(flush); });
    setInterval(() => { if (sb && hid && cache.queue.length) flush(); }, 30000);
    /* another tab on this device wrote the cache */
    addEventListener('storage', e => {
      if (e.key !== CACHE_KEY) return;
      const before = cache; cache = readCache(); const changed = [];
      for (const k in cache.recs) { const a = before.recs[k], b = cache.recs[k]; if (!a || a.t !== b.t) { const [scope, key] = k.split(SEP); changed.push({ scope, key, value: b.d ? null : b.v }); } }
      if (changed.length && opts.onRemote) opts.onRemote(changed);
      setStatus({});
    });

    const api = {
      init, map, get, put, putMany, seed, hasScope, configured,
      status: () => status,
      onStatus(f) { listeners.add(f); f(status); return () => listeners.delete(f); },
      async signIn(email) {
        if (!sb) throw new Error('Sync is not configured');
        const { error } = await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
        if (error) throw error;
      },
      async signOut() { if (sb) await sb.auth.signOut(); },
      async syncNow() { if (sb && hid) { await pull(true); await flush(); } },
      db: () => (sb && hid ? sb : null),   /* signed-in + allowlisted client, else null */
      _debug: () => ({ hid, cache: readCache(), client: sb }),
    };
    window.SchedSync.current = api;  /* handle for debugging/tests */
    return api;
  }

  /* ---------- status pill + sign-in popover (uses the host page's CSS vars) ---------- */
  const CSS = `
.sync{position:relative;display:inline-flex}
.sync__pill{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:99px;font:600 12px/1 var(--font,system-ui);color:var(--text-2,#aab);background:var(--surface,#1b1f27);border:1px solid var(--border-2,rgba(255,255,255,.1));cursor:pointer;white-space:nowrap;transition:border-color .2s,background .2s}
.sync__pill:hover{border-color:var(--border-3,rgba(255,255,255,.2))}
.sync__dot{width:8px;height:8px;border-radius:50%;background:var(--text-3,#778);flex:none}
.sync[data-mode=synced] .sync__dot{background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.15)}
.sync[data-mode=syncing] .sync__dot,.sync[data-mode=loading] .sync__dot{background:#60a5fa;animation:sync-pulse 1s ease-in-out infinite}
.sync[data-mode=offline] .sync__dot{background:#fbbf24}
.sync[data-mode=error] .sync__dot,.sync[data-mode=denied] .sync__dot{background:#ff6b5e}
.sync[data-mode=signedout] .sync__dot{background:#a78bfa}
@keyframes sync-pulse{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.sync__dot{animation:none!important}}
.sync__pop{position:absolute;right:0;top:calc(100% + 8px);z-index:120;width:min(320px,calc(100vw - 24px));padding:16px;border-radius:14px;background:var(--surface-2,#222833);border:1px solid var(--border-2,rgba(255,255,255,.12));box-shadow:0 18px 40px -12px rgba(0,0,0,.7);font:400 14px/1.5 var(--font,system-ui);color:var(--text,#eee);opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .2s,transform .2s}
.sync.is-open .sync__pop{opacity:1;transform:none;pointer-events:auto}
.sync__pop h4{margin:0 0 6px;font-size:14px}
.sync__pop p{margin:0 0 10px;color:var(--text-2,#aab);font-size:13px}
.sync__pop input{width:100%;padding:9px 11px;border-radius:10px;border:1px solid var(--border-2,rgba(255,255,255,.12));background:var(--bg,#111);color:inherit;font:inherit;margin-bottom:8px}
.sync__pop button{font:600 13px/1 var(--font,system-ui);padding:9px 12px;border-radius:10px;border:1px solid var(--border-2,rgba(255,255,255,.12));background:var(--surface-3,#2a303b);color:inherit;cursor:pointer}
.sync__pop button.primary{background:var(--accent,#7fd8a4);color:#111;border-color:transparent}
.sync__row{display:flex;gap:8px;flex-wrap:wrap}
.sync__n{min-width:18px;padding:2px 5px;border-radius:99px;background:#fbbf24;color:#111;font-size:10.5px;text-align:center;display:none}
.sync__msg{font-size:12.5px;margin-top:8px;color:var(--text-2,#aab)}`;
  const LABEL = { local: 'Local only', loading: 'Connecting…', signedout: 'Sign in to sync', syncing: 'Syncing…', synced: 'Synced', offline: 'Offline', error: 'Sync error', denied: 'No access' };
  function mountIndicator(host, sync) {
    if (!document.getElementById('sync-css')) { const s = document.createElement('style'); s.id = 'sync-css'; s.textContent = CSS; document.head.appendChild(s); }
    host.innerHTML = `<div class="sync" data-mode="local"><button class="sync__pill" type="button" aria-haspopup="dialog" aria-expanded="false"><span class="sync__dot"></span><span class="sync__label">Local only</span><span class="sync__n" hidden></span></button><div class="sync__pop" role="dialog" aria-label="Sync"></div></div>`;
    const root = host.firstElementChild, pill = root.querySelector('.sync__pill'), lab = root.querySelector('.sync__label'), badge = root.querySelector('.sync__n'), pop = root.querySelector('.sync__pop');
    let sentTo = null;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function draw(st) {
      root.dataset.mode = st.mode;
      lab.textContent = (LABEL[st.mode] || st.mode) + (st.pending && st.mode !== 'local' ? ` · ${st.pending} pending` : '');
      badge.hidden = !(st.pending && st.mode !== 'local'); badge.textContent = st.pending || '';
      pill.title = lab.textContent;
      let h;
      if (st.mode === 'local') h = `<h4>Local only</h4><p>Saved in this browser. Add the Supabase URL and key to <code>config.js</code> to sync between devices.</p>`;
      else if (st.mode === 'signedout') h = sentTo ? `<h4>Check your email</h4><p>We sent a sign-in link to <b>${esc(sentTo)}</b>. Open it on this device.</p><div class="sync__row"><button type="button" data-act="again">Use a different email</button></div>`
        : `<h4>Sign in to sync</h4><p>Get a one-tap sign-in link by email. Your changes stay saved here meanwhile${st.pending ? ` (${st.pending} waiting to upload)` : ''}.</p><form data-act="send"><input type="email" required placeholder="you@example.com" autocomplete="email" aria-label="Email"><div class="sync__row"><button class="primary" type="submit">Email me a link</button></div></form>`;
      else h = `<h4>${esc(LABEL[st.mode] || st.mode)}</h4><p>${st.email ? `Signed in as <b>${esc(st.email)}</b>. ` : ''}${st.mode === 'offline' ? `No connection. ${st.pending} change(s) saved here and will upload when you're back online.` : st.mode === 'synced' ? 'Everything is up to date across devices.' : st.mode === 'denied' ? 'This email is not on the allowlist.' : esc(st.message || '')}</p><div class="sync__row"><button type="button" data-act="now">Sync now</button><button type="button" data-act="out">Sign out</button></div>`;
      pop.innerHTML = h + '<div class="sync__msg" aria-live="polite"></div>';
    }
    sync.onStatus(draw);
    const msg = t => { const m = pop.querySelector('.sync__msg'); if (m) m.textContent = t; };
    pill.addEventListener('click', e => { e.stopPropagation(); const o = root.classList.toggle('is-open'); pill.setAttribute('aria-expanded', o); if (o) { const i = pop.querySelector('input'); if (i) setTimeout(() => i.focus(), 50); } });
    document.addEventListener('click', e => { if (!root.contains(e.target)) { root.classList.remove('is-open'); pill.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-open')) { root.classList.remove('is-open'); pill.focus(); } });
    pop.addEventListener('submit', async e => { e.preventDefault(); const em = pop.querySelector('input').value; msg('Sending…');
      try { await sync.signIn(em); sentTo = em; draw(sync.status()); } catch (err) { msg(err.message || 'Could not send the link'); } });
    pop.addEventListener('click', async e => { const a = e.target.closest('[data-act]'); if (!a || a.tagName === 'FORM') return;
      if (a.dataset.act === 'again') { sentTo = null; draw(sync.status()); }
      if (a.dataset.act === 'now') { msg('Syncing…'); await sync.syncNow(); msg('Done'); }
      if (a.dataset.act === 'out') { await sync.signOut(); } });
    return root;
  }

  window.SchedSync = { create, mountIndicator, newId: rid };
})();
