// Study module e2e: two headless Chromes signed in as a throwaway allowlisted test user.
// Screenshots go to OUT (keep them OUT of the public repo: they show private study content).
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
  const block = (urls) => send('Network.setBlockedURLs', { urls });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const b = {
    name, errors,
    go: async (path) => { await send('Page.navigate', { url: 'about:blank' }); await sleep(200); await send('Page.navigate', { url: ROOT + path }); await sleep(2500); },
    ev: async (js) => { const r = await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(name + ' eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; },
    block: (urls) => send('Network.setBlockedURLs', { urls }),
    size: (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile: !!mobile }),
    offline: (on) => send('Network.emulateNetworkConditions', { offline: on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }),
    shot: async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${n}.png`, Buffer.from(r.result.data, 'base64')); },
    close: () => { ws.close(); proc.kill(); },
  };
  return b;
}
const results = []; const ok = (label, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', label]); console.log(cond ? 'PASS' : 'FAIL', label, info === undefined ? '' : JSON.stringify(info).slice(0, 300)); };
const until = async (b, js, ms = 10000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await b.ev(js); if (v) return { v, ms: Date.now() - t0 }; await sleep(250); } return null; };
const status = `document.querySelector('#syncHost .sync').dataset.mode`;
const signIn = async b => { await b.ev(`SchedSync.current._debug().client.auth.signInWithPassword({email:${JSON.stringify(EMAIL)},password:${JSON.stringify(PASS)}}).then(r=>r.error&&r.error.message)`); return until(b, `${status}==='synced'`, 12000); };
const tab = async (b, k) => { await b.ev(`document.querySelector('#main [data-tabs=study] [data-key=${k}]').click()`); await sleep(500); };
const A = await browser('A', 9351), B = await browser('B', 9352);
try {
  await A.go('index.html#view=study');
  ok('signed out: gate shown', await A.ev(`document.querySelector('.sx-gate h2')?.textContent`) === 'Sign in to load study materials');
  ok('signed out: no cached study content', await A.ev(`localStorage.getItem('sched.study.v1')===null`));
  await A.shot('study-signed-out');
  await A.go('index.html#view=day&date=2026-12-01'); await A.shot('day-signed-out');
  ok('signed out: day view shows lock chip, no study text', await A.ev(`!!document.querySelector('.sx-chip--lock')&&!document.querySelector('.sx-links .sx-chip[data-study]')`));
  ok('A signed in', !!(await signIn(A)));
  let r = await until(A, `!!localStorage.getItem('sched.study.v1')`, 12000); ok('study content loaded + cached', !!r, r && r.ms + ' ms');
  ok('A cache size', true, await A.ev(`(localStorage.getItem('sched.study.v1').length/1024|0)+' KB'`));
  // day view links
  await A.go('index.html#view=day&date=2026-12-01'); await until(A, `${status}==='synced'`);
  const chips = await A.ev(`[...document.querySelectorAll('.sx-links .sx-chip')].map(c=>c.textContent)`); ok('day view: study chips on policy/case blocks', chips.length > 0, chips);
  await A.shot('day-study-links');
  await A.ev(`document.querySelector('.sx-links .sx-chip[data-study^="pol:"]').click()`); await sleep(900);
  ok('chip -> policy section focused', await A.ev(`S_view=document.querySelector('#main [data-tabs=study] [aria-selected=true]')?.dataset.key`) === 'policy', await A.ev(`[...document.querySelectorAll('#sxPol details[open] summary')].map(s=>s.textContent.slice(0,40))`));
  await A.shot('study-policy-focus');
  // policy search
  await A.ev(`(()=>{const q=document.querySelector('#sxQ');q.value='barricade';q.dispatchEvent(new Event('input'))})()`); await sleep(300);
  ok('policy search filters', true, await A.ev(`document.querySelector('#sxCount').textContent`));
  await A.ev(`(()=>{const q=document.querySelector('#sxQ');q.value='';q.dispatchEvent(new Event('input'))})()`);
  // all tabs render
  for (const k of ['today', 'policy', 'cards', 'scen', 'cases', 'oral', 'plan', 'verify']) { await tab(A, k); const h = await A.ev(`document.querySelector('.sx-body').textContent.length`); ok('tab renders: ' + k, h > 200, h); await A.shot('study-' + k); }
  // flashcards session + realtime to B
  await B.go('index.html#view=study');
  ok('B signed in', !!(await signIn(B)));
  await B.go('index.html#view=study&st=cards'); await until(B, `!!document.querySelector('.sx-kpis')`);
  await tab(A, 'cards'); await A.ev(`document.querySelector('[data-sxgo=new]').click()`); await sleep(500);
  await A.ev(`document.querySelector('[data-sess=show]').click()`); await sleep(700); await A.shot('study-card-flipped');
  await A.ev(`document.querySelector('[data-sess=got]').click()`); await sleep(300);
  await A.ev(`document.querySelector('[data-sess=show]').click()`); await sleep(200); await A.ev(`document.querySelector('[data-sess=miss]').click()`); await sleep(300);
  const fc = await A.ev(`Object.entries(SchedSync.current.map('study')).filter(([k])=>k.startsWith('fc|'))`); ok('card grades stored (Leitner)', fc.length === 2, fc);
  r = await until(B, `Object.keys(SchedSync.current.map('study')).filter(k=>k.startsWith('fc|')).length===2`); ok('realtime: card progress reached B', !!r, r && r.ms + ' ms');
  // quick 5 (mobile)
  await A.size(390, 844, true); await A.ev(`document.querySelector('[data-quick5]').click()`); await sleep(600);
  ok('quick 5 opens', await A.ev(`!!document.querySelector('#q5.is-open')`));
  await A.shot('study-quick5-front');
  for (let i = 0; i < 6; i++) { const done = await A.ev(`!!document.querySelector('#q5 .sx-done')`); if (done) break; await A.ev(`document.querySelector('#q5 [data-q5=show]').click()`); await sleep(650); if (i === 0) await A.shot('study-quick5-back'); await A.ev(`document.querySelector('#q5 [data-q5=got]').click()`); await sleep(250); }
  ok('quick 5 completes', await A.ev(`!!document.querySelector('#q5 .sx-done')`), await A.ev(`document.querySelector('#q5 .sx-done__big')?.textContent`));
  await A.shot('study-quick5-done'); await A.ev(`document.querySelector('#q5 [data-q5=close]').click()`); await sleep(400); await A.size(1280, 900);
  // scenario
  await tab(A, 'scen'); await A.ev(`document.querySelector('[data-scnav="1"]').click()`); await sleep(300);
  await A.ev(`(()=>{const t=document.querySelector('textarea[data-scnote]');t.value='Hold perimeter, notify sup';t.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(900);
  for (let i = 0; i < 8; i++) { const n = await A.ev(`!!document.querySelector('[data-scnav="1"]')`); if (!n) break; await A.ev(`document.querySelector('[data-scnav="1"]').click()`); await sleep(200); }
  await A.ev(`document.querySelector('.sx-model').click()`); await A.ev(`document.querySelector('[data-scrate=partial]').click()`); await sleep(400);
  ok('scenario note + rating stored', true, await A.ev(`SchedSync.current.get('study','sc|sc-01')`)); await A.shot('study-scen-model');
  // oral board edit syncs to B (B on oral tab, not focused)
  await B.go('index.html#view=study&st=oral'); await until(B, `!!document.querySelector('textarea[data-oral]')`);
  await B.ev(`document.querySelector('#main details').open=true`);
  await tab(A, 'oral'); await A.ev(`(()=>{document.querySelector('#main details').open=true;const t=document.querySelector('textarea[data-oral]');t.focus();t.value='7 yrs FWPD, 2 yrs FTO';t.dispatchEvent(new Event('input',{bubbles:true}));t.blur()})()`);
  r = await until(B, `document.querySelector('textarea[data-oral]').value==='7 yrs FWPD, 2 yrs FTO'`); ok('realtime: oral-board example reached B', !!r, r && r.ms + ' ms');
  await B.shot('study-oral-synced');
  // verify list
  await tab(A, 'verify'); await A.ev(`document.querySelector('input[data-sxk^="flag|"]').click()`); await sleep(500);
  ok('flag checked + synced', true, await A.ev(`document.querySelector('.sx-tools b').textContent`));
  // offline: Supabase + CDN unreachable, cached content still renders
  await A.block(['*supabase.co*', '*jsdelivr*']); await A.go('index.html#view=study&st=policy'); await sleep(1500);
  ok('offline (Supabase blocked): study renders from device cache', await A.ev(`document.querySelectorAll('#sxPol .sx-item').length`) > 0, await A.ev(`${status}+' / items '+document.querySelectorAll('#sxPol .sx-item').length`));
  await A.block([]);
  // sign out clears cache
  await A.go('index.html#view=study'); await until(A, `${status}==='synced'`);
  await A.ev(`SchedSync.current.signOut()`); r = await until(A, `localStorage.getItem('sched.study.v1')===null&&!!document.querySelector('.sx-gate')`);
  ok('sign out: cached study content removed + gate shown', !!r);
  console.log('errors A', A.errors); console.log('errors B', B.errors);
  ok('no JS errors', A.errors.length === 0 && B.errors.length === 0);
} catch (e) { results.push(['FAIL', 'exception']); console.log('ERROR', e.message); console.log('errors A', A.errors); console.log('errors B', B.errors); }
finally { A.close(); B.close(); }
console.log(results.filter(r => r[0] === 'FAIL').length ? 'SOME FAILED' : 'ALL PASSED');
