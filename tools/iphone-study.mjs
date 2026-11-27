// iPhone emulation test for the Daily Study app (/study/): iPhone 15/16 Pro (home-screen + Safari tab) and SE.
// Covers: today's to-do, card session (tap flip, buttons, swipe both ways), streak persistence, Quick 5, search,
// MOS exact-text reader (+ incomplete flags), RCW/case pages, scenarios, oral board, progress, offline start, layout audits, zero JS errors.
// Usage: serve the repo root on ROOT (default http://127.0.0.1:8765/), then OUT=/workspace/swat-prep node tools/iphone-study.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const ROOT = process.env.ROOT || 'http://127.0.0.1:8765/', OUT = process.env.OUT || '/tmp/out';
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (label, cond, info) => { results.push([cond ? 'PASS' : 'FAIL', label]); console.log(cond ? 'PASS' : 'FAIL', label, info === undefined ? '' : JSON.stringify(info).slice(0, 400)); };
async function browser(port, dev) {
  const dir = '/tmp/chr-iph-' + port; fs.rmSync(dir, { recursive: true, force: true });
  const proc = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--overscroll-history-navigation=0', '--disable-features=OverscrollHistoryNavigation,TouchpadOverscrollHistoryNavigation', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch { await sleep(200); } }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}, errors = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
    if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + JSON.stringify(m.params.exceptionDetails).slice(0, 500));
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) errors.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: dev.w, height: dev.h, deviceScaleFactor: dev.dsf, mobile: true, screenWidth: dev.w, screenHeight: dev.h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
  if (dev.standalone) { await send('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(navigator,'standalone',{get:()=>true})" }); }
  await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: dev.sat, bottom: dev.sab, left: 0, right: 0 } });
  const ev = async (js) => { const r = await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
  const touch = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  return { errors, ev, send,
    go: async (path) => { await send('Page.navigate', { url: 'about:blank' }); await sleep(150); await send('Page.navigate', { url: ROOT + path }); await sleep(300); await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: dev.sat, bottom: dev.sab, left: 0, right: 0 } }); await sleep(1500); await send('Page.resetNavigationHistory'); },
    tap: async (sel) => { const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`);
      if (!r) throw new Error('tap: no ' + sel); await sleep(120); await touch('touchStart', [r]); await sleep(60); await touch('touchEnd', []); await sleep(450); },
    swipe: async (x0, y0, x1, y1, steps = 8, ms = 220) => { await touch('touchStart', [[x0, y0]]); for (let i = 1; i <= steps; i++) { await touch('touchMove', [[x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps]]); await sleep(ms / steps); } await touch('touchEnd', []); await sleep(600); },
    shot: async (n, full) => { let h = null; if (full) { h = await ev('Math.min(document.documentElement.scrollHeight,5000)'); await send('Emulation.setDeviceMetricsOverride', { width: dev.w, height: h, deviceScaleFactor: dev.dsf, mobile: true }); await sleep(300); }
      const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/screenshot-iphone-${n}.png`, Buffer.from(r.result.data, 'base64'));
      if (full) await send('Emulation.setDeviceMetricsOverride', { width: dev.w, height: dev.h, deviceScaleFactor: dev.dsf, mobile: true, screenWidth: dev.w, screenHeight: dev.h }); },
    close: () => { ws.close(); proc.kill(); } };
}
/* layout audit: horizontal overflow, small tap targets, inputs < 16px */
const AUDIT = `(()=>{const vw=innerWidth,out=[],small=[],font=[];
  const sw=document.scrollingElement.scrollWidth;
  document.querySelectorAll('button,a[href],input:not([type=hidden]):not([type=checkbox]),select,textarea,label.check,label.chk,[role=tab]').forEach(e=>{const b=e.getBoundingClientRect(),cs=getComputedStyle(e);
    if(!b.width||!b.height||cs.visibility==='hidden'||e.closest('[hidden],.cal,.drawer:not(.is-open),.sx-ref')||e.matches('.ev,.sx-ref,.drawer__grab'))return;
    if(e.closest('p,li:not(.li-row),.sx-ul,.callout')&&e.tagName==='A')return;   /* inline text links */
    if(b.height<43.5&&b.width<43.5||b.height<36)small.push((e.className||e.tagName).toString().slice(0,40)+' '+Math.round(b.width)+'x'+Math.round(b.height));
    if(e.matches('input,select,textarea')&&parseFloat(cs.fontSize)<16)font.push(e.name||e.className);});
  return {overflow:sw>vw+1?sw-vw:0,small:[...new Set(small)].slice(0,12),nSmall:small.length,font}})()`;
const devices = [
  { key: 'pro', w: 393, h: 852, dsf: 3, sat: 59, sab: 34, standalone: true, label: 'iPhone 15/16 Pro · home-screen app' },
  { key: 'pro-safari', w: 393, h: 659, dsf: 3, sat: 0, sab: 0, standalone: false, label: 'iPhone 15/16 Pro · Safari tab (toolbars take ~190px)' },
  { key: 'se', w: 375, h: 667, dsf: 2, sat: 20, sab: 0, standalone: true, label: 'iPhone SE · home-screen app' },
];

const waitFor = async (b, js, ms = 8000) => { for (let i = 0; i < ms / 100; i++) { if (await b.ev(js)) return true; await sleep(100); } return false; };
const LS = 'dailystudy.v1';
let port = 9471;
for (const dev of devices.filter(d => !process.env.DEV || d.key === process.env.DEV)) {
  console.log('\n=== ' + dev.label);
  const b = await browser(port++, dev), P = dev.key, N = n => `study-${P}-${n}`;
  await b.go('study/'); await b.ev(`localStorage.clear()`); await b.go('study/');
  ok(`${P}: data loads and Today renders`, await waitFor(b, `!!document.querySelector('.hero')`));
  ok(`${P}: no login anywhere`, await b.ev(`!document.querySelector('input[type=email],input[type=password]')&&!/sign in|log in/i.test(document.body.innerText)`));
  ok(`${P}: Today has 5 to-dos (cards, RCW, case, MOS, optional)`, await b.ev(`document.querySelectorAll('.todo__i').length===5`));
  const plan = await b.ev(`+document.querySelector('.hero__nums b').textContent`);
  ok(`${P}: first day = 6 new cards, mixed pillars`, plan === 6, plan);
  const L = await b.ev(`(()=>{const h=document.querySelector('.hdr').getBoundingClientRect(),t=document.querySelector('.tabbar').getBoundingClientRect(),ti=document.querySelector('.hdr__t').getBoundingClientRect();return {ti:ti.top,tb:t.bottom,tt:t.top,ih:innerHeight,tabH:document.querySelector('.tabbar a').getBoundingClientRect().height}})()`);
  ok(`${P}: header clears the status bar / notch`, L.ti >= dev.sat, L);
  ok(`${P}: tab bar pinned to bottom, 44pt+ targets`, Math.abs(L.tb - L.ih) < 1.5 && L.tabH >= 44, L);
  let a = await b.ev(AUDIT); ok(`${P}: Today layout (no overflow, tap targets)`, !a.overflow && !a.nSmall && !a.font.length, a);
  await b.shot(N('today'));
  // MOS resource from Today
  await b.tap('a.li[href="#mos/4"]');
  ok(`${P}: Ch. 4 list shows source + revision 05-18-2026`, await b.ev(`/revision 05-18-2026/.test(document.querySelector('.src').innerText)&&document.querySelectorAll('.li').length>=40`));
  // session
  await b.go('study/'); await waitFor(b, `!!document.querySelector('#startBtn')`);
  await b.tap('#startBtn');
  ok(`${P}: Start opens a flashcard`, await waitFor(b, `!!document.querySelector('#fc .fc__q')`));
  await b.shot(N('card-front'));
  await b.tap('#fc'); await sleep(500);
  ok(`${P}: tap flips the card`, await b.ev(`document.querySelector('#fc').classList.contains('flip')`));
  await b.shot(N('card-back'));
  a = await b.ev(AUDIT); ok(`${P}: card layout`, !a.overflow && !a.nSmall, a);
  await b.tap('#gOk'); await sleep(400);
  ok(`${P}: Got it grades the card (box 1, due tomorrow)`, await b.ev(`(()=>{const s=JSON.parse(localStorage.getItem('${LS}'));const v=Object.values(s.fc);return v.length===1&&v[0].b===1&&v[0].due>window.__ds.today()})()`));
  const fcBox = async () => b.ev(`(()=>{const r=document.querySelector('#fc').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,r.width]})()`);
  let [cx, cy, cw] = await fcBox();
  await b.swipe(cx - 40, cy, cx + cw * 0.6, cy, 10, 260); await sleep(300);
  ok(`${P}: swipe right = got it`, await b.ev(`Object.keys(JSON.parse(localStorage.getItem('${LS}')).fc).length===2`));
  [cx, cy, cw] = await fcBox();
  await b.swipe(cx + 40, cy, cx - cw * 0.6, cy, 10, 260); await sleep(300);
  ok(`${P}: swipe left = again (re-queued)`, await b.ev(`(()=>{const s=JSON.parse(localStorage.getItem('${LS}'));return Object.values(s.fc).some(v=>v.miss===1)&&s.sess.again.length===1&&/\\+1 again/.test(document.querySelector('.prog').innerText)})()`));
  // vertical drag must not grade
  [cx, cy, cw] = await fcBox();
  const before = await b.ev(`JSON.parse(localStorage.getItem('${LS}')).sess.done`);
  await b.swipe(cx, cy + 60, cx + 10, cy - 80, 8, 200);
  ok(`${P}: vertical scroll gesture does not grade`, await b.ev(`JSON.parse(localStorage.getItem('${LS}')).sess.done`) === before);
  for (let i = 0; i < 12 && await b.ev(`!!document.querySelector('#gOk')`); i++) await b.tap('#gOk');
  ok(`${P}: session finishes with a summary`, await b.ev(`!!document.querySelector('.done-card')&&/Done!/.test(document.querySelector('.done-card').innerText)`));
  await b.shot(N('done'));
  await b.go('study/'); await waitFor(b, `!!document.querySelector('.hero')`);
  ok(`${P}: cards to-do checked off + streak 1 after reload`, await b.ev(`document.querySelector('.todo__i[data-k=cards]').classList.contains('is-done')&&document.querySelector('#streakN').textContent==='1'`));
  // Quick 5
  await b.tap('.quick a[href="#quick"]');
  ok(`${P}: Quick 5 = 5 cards`, await b.ev(`/^0\\/5/.test(document.querySelector('.prog .mono').textContent)`));
  // daily RCW: mark read checks it off
  await b.go('study/'); await waitFor(b, `!!document.querySelector('.hero')`);
  await b.tap('.todo__i[data-k=rcw]');
  ok(`${P}: RCW page has summary, key quote, official text + app.leg.wa.gov link`, await b.ev(`!!document.querySelector('.quote')&&[...document.querySelectorAll('a[target=_blank]')].some(a=>/^https:\\/\\/app\\.leg\\.wa\\.gov\\/RCW\\/default\\.aspx\\?cite=/.test(a.href))&&/Official text/.test(document.body.innerText)`));
  a = await b.ev(AUDIT); ok(`${P}: RCW page layout`, !a.overflow && !a.nSmall, a);
  await b.shot(N('rcw'));
  await b.tap('#markRead');
  await b.tap('#back');
  ok(`${P}: Back returns to Today with RCW checked off`, await b.ev(`!!document.querySelector('.todo__i[data-k=rcw].is-done')`));
  // Library search
  await b.tap('.tabbar a[data-tab=lib]');
  ok(`${P}: Library opens on MOS chapters`, await b.ev(`document.querySelectorAll('#pane .li').length===3`));
  await b.shot(N('library'));
  await b.ev(`(()=>{const q=document.querySelector('#q');q.value='chokehold';q.dispatchEvent(new Event('input'))})()`); await sleep(400);
  ok(`${P}: search "chokehold" finds RCW 10.116.020 and MOS 4.1.4`, await b.ev(`!!document.querySelector('#res a[href="#rcw/10.116.020"]')&&!!document.querySelector('#res a[href="#sec/4.1.4"]')&&!!document.querySelector('#res mark')`));
  a = await b.ev(AUDIT); ok(`${P}: search input is 16px (no iOS zoom)`, !a.font.length && !a.overflow, a);
  await b.shot(N('search'));
  await b.ev(`(()=>{const q=document.querySelector('#q');q.value='46.2.2';q.dispatchEvent(new Event('input'))})()`); await sleep(400);
  await b.tap('#res a[href="#sec/46.2.2"]');
  ok(`${P}: MOS 46.2.2 shows exact text, rev 03-17-2025, and an INCOMPLETE flag`, await b.ev(`/Refer to Standard 21\\.3\\.2 regarding selection process\\./.test(document.querySelector('.verb').innerText)&&/revision 03-17-2025/.test(document.querySelector('.src').innerText)&&/Incomplete in source/.test(document.querySelector('.callout--warn').innerText)`));
  await b.shot(N('mos-46-2-2'));
  await b.ev(`location.hash='#sec/4.4.6'`); await sleep(500);
  ok(`${P}: MOS 4.4.6 verbatim + linked study points + drill button`, await b.ev(`/Lawful purposes are limited to the following:/.test(document.querySelector('.verb').innerText)&&document.querySelectorAll('details.acc').length>=1&&!!document.querySelector('[data-drill]')`));
  a = await b.ev(AUDIT); ok(`${P}: MOS reader layout`, !a.overflow && !a.nSmall, a);
  await b.shot(N('mos-4-4-6'), true);
  await b.tap('[data-drill]');
  ok(`${P}: Drill opens that section's cards`, await waitFor(b, `!!document.querySelector('#fc')`));
  await b.ev(`location.hash='#case/ferrier'`); await sleep(500);
  ok(`${P}: case page (Ferrier) has holding + opinion link`, await b.ev(`/refuse/.test(document.querySelector('.card').innerText)&&!!document.querySelector('a[target=_blank][href*="justia"]')`));
  await b.shot(N('case'));
  // Practice
  await b.tap('.tabbar a[data-tab=practice]');
  a = await b.ev(AUDIT); ok(`${P}: Practice layout`, !a.overflow && !a.nSmall, a);
  await b.shot(N('practice'));
  await b.tap('a[href="#deck/rcw:new"]');
  ok(`${P}: RCW deck (new 10) only has RCW cards`, await b.ev(`/RCW/.test(document.querySelector('.fc__f .tag').textContent)&&/^0\\/10/.test(document.querySelector('.prog .mono').textContent)`));
  await b.ev(`location.hash='#scn/sc-01'`); await sleep(500);
  await b.tap('#rev');
  ok(`${P}: scenario reveals the model answer`, await b.ev(`!document.querySelector('#ans').hidden`));
  await b.tap('[data-rate="2"]');
  ok(`${P}: scenario rating saved`, await b.ev(`JSON.parse(localStorage.getItem('${LS}')).sc['sc-01'].rating===2`));
  await b.ev(`location.hash='#oral/iq-02'`); await sleep(500);
  await b.tap('#tgo'); await sleep(1300);
  ok(`${P}: oral-board timer runs`, await b.ev(`document.querySelector('#tm').textContent!=='2:00'`));
  await b.tap('#rev'); ok(`${P}: oral framework reveals`, await b.ev(`!document.querySelector('#ans').hidden`));
  // Progress
  await b.tap('.tabbar a[data-tab=me]');
  ok(`${P}: Progress shows streak, pillars and reading counts`, await b.ev(`document.querySelectorAll('.days i').length===14&&/RCWs read/.test(document.body.innerText)&&/1\\/29/.test(document.body.innerText)`));
  a = await b.ev(AUDIT); ok(`${P}: Progress layout`, !a.overflow && !a.nSmall && !a.font.length, a);
  await b.shot(N('progress'));
  if (P === 'pro') {
    const m = await b.ev(`fetch('manifest.webmanifest').then(r=>r.json())`);
    ok(`manifest: own name, scope ./, start_url ./, standalone`, m.name === 'Daily Study' && m.scope === './' && m.start_url === './' && m.display === 'standalone', m);
    const icons = await b.ev(`Promise.all(${JSON.stringify(['../icons/study-180.png', '../icons/study-192.png', '../icons/study-512.png', '../icons/study-maskable-512.png'])}.map(u=>fetch(u).then(r=>r.status)))`);
    ok(`icons all load`, icons.every(s => s === 200), icons);
    ok(`apple-touch-icon + title set`, await b.ev(`document.querySelector('link[rel=apple-touch-icon]').href.endsWith('/icons/study-180.png')&&document.querySelector('meta[name=apple-mobile-web-app-title]').content==='Daily Study'`));
    // offline: wait for the service worker, then cut the network and reopen
    ok(`service worker controls the page (scope /study/)`, await waitFor(b, `navigator.serviceWorker.controller&&navigator.serviceWorker.getRegistration().then(r=>r&&r.scope.endsWith('/study/'))`, 10000) || (await b.go('study/'), await waitFor(b, `!!navigator.serviceWorker.controller`, 8000)));
    await b.send('Network.enable');
    await b.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await b.go('study/');
    ok(`offline: app opens and shows Today`, await waitFor(b, `!!document.querySelector('.hero')`, 6000));
    await b.ev(`location.hash='#sec/46.1.10'`); await sleep(400);
    ok(`offline: MOS reference readable`, await b.ev(`document.querySelector('.verb').innerText.length>1000`));
    await b.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  }
  const own = b.errors.filter(e => !/chrome-extension:\/\/|\[InjectContentScripts\]|net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
  ok(`${P}: zero JS errors`, own.length === 0, own);
  b.close();
}
const fails = results.filter(r => r[0] === 'FAIL'); console.log(`\n${results.length - fails.length}/${results.length} passed`); fails.forEach(f => console.log('FAIL', f[1]));
process.exit(fails.length ? 1 : 0);
