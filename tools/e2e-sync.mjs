// Two independent headless Chromes (= two devices) signed in as the same test user.
// Usage: E2E_EMAIL=... E2E_PASS=... node tools/e2e-sync.mjs   (serve the repo on ROOT first)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const ROOT = process.env.ROOT || 'http://127.0.0.1:8765/', OUT = process.env.OUT || '/tmp/out';
const EMAIL = process.env.E2E_EMAIL, PASS = process.env.E2E_PASS;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function browser(name, port) {
  const dir = '/tmp/chr-e2e-' + name; fs.rmSync(dir, { recursive: true, force: true });
  const proc = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch { await sleep(200); } }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}, errors = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
    if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 400));
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) errors.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const b = {
    name, errors,
    go: async (path) => { await send('Page.navigate', { url: 'about:blank' }); await sleep(200); await send('Page.navigate', { url: ROOT + path }); await sleep(2500); },
    ev: async (js) => { const r = await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(name + ' eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; },
    offline: (on) => send('Network.emulateNetworkConditions', { offline: on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }),
    shot: async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${n}.png`, Buffer.from(r.result.data, 'base64')); },
    close: () => { ws.close(); proc.kill(); },
  };
  return b;
}
const results = []; const ok = (label, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', label, info]); console.log(cond ? 'PASS' : 'FAIL', label, info === undefined ? '' : JSON.stringify(info)); };
const until = async (b, js, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await b.ev(js); if (v) return { v, ms: Date.now() - t0 }; await sleep(250); } return null; };
const status = `document.querySelector('#syncHost .sync').dataset.mode+' | '+document.querySelector('#syncHost .sync__label').textContent`;

const A = await browser('A', 9341), B = await browser('B', 9342);
try {
  // signed-out state on device A
  await A.go('index.html#view=calendar&week=w1');
  ok('A starts signed out', /signedout/.test(await A.ev(status)), await A.ev(status));
  await A.ev(`document.querySelector('#syncHost .sync__pill').click()`); await sleep(400); await A.shot('e2e-signin-popover');
  await A.ev(`document.querySelector('#syncHost .sync__pill').click()`);
  // sign both "devices" in (password sign-in for the test user; real users use the magic link)
  for (const b of [A, B]) {
    if (b === B) await b.go('index.html#view=calendar&week=w1');
    await b.ev(`SchedSync.current._debug().client.auth.signInWithPassword({email:${JSON.stringify(EMAIL)},password:${JSON.stringify(PASS)}}).then(r=>r.error&&r.error.message)`);
    const s = await until(b, `/^synced/.test(${status})`, 10000); ok(b.name + ' signed in and synced', !!s, await b.ev(status));
  }
  await A.shot('e2e-synced-indicator');
  // device B opens the wife's page (same origin -> same session)
  await B.go('meals.html#grocery'); ok('B meals page synced', !!(await until(B, `/^synced/.test(${status})`)), await B.ev(status));
  // 1) A checks a tracker checkbox -> lands in DB; B (tracker) would see it; check via B cache
  await A.go('index.html#view=tracks&track=meal'); await until(A, `/^synced/.test(${status})`);
  await A.ev(`(()=>{const c=document.querySelector('[data-gprog] input[data-mchk]');c.click();return c.dataset.mchk})()`);
  const g1 = await A.ev(`document.querySelector('[data-gprog] input[data-mchk]').dataset.mchk`);
  let r = await until(B, `!!document.querySelector('input[data-k=${JSON.stringify(JSON.stringify(g1)).slice(1,-1)}]')?.checked`);
  ok('realtime: grocery check on A (tracker) appears on B (meals) without reload', !!r, r && r.ms + ' ms');
  // 2) B adds a grocery item in edit mode -> shows in A's tracker grocery list
  await B.ev(`(async()=>{if(!document.body.classList.contains('is-editing'))document.querySelector('#editBtn').click();await new Promise(r=>setTimeout(r,200));const f=document.querySelector('.gadd');f.t.value='E2E realtime item';f.querySelector('button').click()})()`);
  r = await until(A, `document.querySelector('[data-gprog]').textContent.includes('E2E realtime item')`);
  ok('realtime: grocery item added on B appears on A', !!r, r && r.ms + ' ms');
  await B.shot('e2e-meals-edit-synced'); await A.shot('e2e-tracker-after-remote');
  // 3) A edits a plan block -> B tracker sees the override
  await B.go('index.html#view=day&date=2026-12-03'); await until(B, `/^synced/.test(${status})`);
  await A.go('index.html#view=calendar&week=w1&block=2026-12-03|16:00|workout&edit'); await sleep(500);
  await A.ev(`(()=>{const f=document.querySelector('#editForm');f.title.value='E2E edited block';document.querySelector('button[type=submit][form=editForm]').click()})()`);
  r = await until(B, `[...document.querySelectorAll('.tl-card__title')].some(x=>x.textContent.includes('E2E edited block'))`);
  ok('realtime: block edit on A appears on B', !!r, r && r.ms + ' ms');
  await A.shot('e2e-edit-drawer-after-save');
  // 4) offline queue on A
  await A.go('index.html#view=day&date=2026-12-01'); await until(A, `/^synced/.test(${status})`);
  await A.offline(true); await A.ev(`dispatchEvent(new Event('offline'))`);
  await A.ev(`(()=>{const c=document.querySelector('input[data-chk]');c.click();return c.dataset.chk})()`);
  const item = await A.ev(`document.querySelector('input[data-chk]').dataset.chk`);
  await sleep(800); const offs = await A.ev(status); ok('offline: change queued', /offline/.test(offs) && /1 pending/.test(offs), offs);
  await A.shot('e2e-offline-pending');
  await A.offline(false); await A.ev(`dispatchEvent(new Event('online'))`);
  r = await until(A, `/^synced/.test(${status})&&!/pending/.test(${status})`, 12000); ok('back online: queue flushed', !!r, await A.ev(status));
  await B.go('index.html#view=day&date=2026-12-01'); await until(B, `/^synced/.test(${status})`);
  r = await until(B, `!!document.querySelector('input[data-chk=${JSON.stringify(JSON.stringify(item)).slice(1,-1)}]')?.checked`);
  ok('offline change reached B', !!r, item);
  // 5) persistence after reload: B reload keeps session
  await B.go('index.html#view=calendar&week=w1'); ok('session persists across reload', !!(await until(B, `/^synced/.test(${status})`)), await B.ev(status));
  console.log('errors A', A.errors); console.log('errors B', B.errors);
} catch (e) { results.push(['FAIL','exception',e.message]); console.log('ERROR', e.message); console.log('errors A', A.errors); console.log('errors B', B.errors); }
finally { A.close(); B.close(); }
console.log(results.filter(r => r[0] === 'FAIL').length ? 'SOME FAILED' : 'ALL PASSED');
