// iPhone emulation test: iPhone 15/16 Pro (393x852@3) and SE (375x667@2), Safari tab + home-screen (standalone) mode.
// Touch input, safe-area insets (59/34 Pro standalone), swipe/drag gestures, layout audits, zero-JS-error check.
// Usage: OUT=/workspace/swat-prep node tools/iphone.mjs   (serve the repo on ROOT first)
// Optional: E2E_EMAIL/E2E_PASS (temp allowlisted user) adds signed-in Study/flashcard checks; those shots are named *-signedin-* (never commit).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const ROOT = process.env.ROOT || 'http://127.0.0.1:8765/', OUT = process.env.OUT || '/tmp/out';
const EMAIL = process.env.E2E_EMAIL, PASS = process.env.E2E_PASS;
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
let port = 9371;
for (const dev of devices.filter(d => !process.env.DEV || d.key === process.env.DEV)) {
  console.log('\n=== ' + dev.label);
  const b = await browser(port++, dev), P = dev.key;
  await b.go('index.html?nosw#view=calendar&week=w1&date=2026-11-30');
  ok(`${P}: standalone flag`, await b.ev(`document.documentElement.classList.contains('is-standalone')`) === dev.standalone);
  ok(`${P}: tab bar visible`, await b.ev(`getComputedStyle(document.getElementById('tabbar')).display==='flex'`));
  ok(`${P}: agenda is the phone default`, await b.ev(`!!document.querySelector('.ag-strip')&&!document.getElementById('cal')`));
  const hdr = await b.ev(`(()=>{const h=document.querySelector('.app-header'),r=h.getBoundingClientRect(),i=document.querySelector('.app-header__inner').getBoundingClientRect();return {top:r.top,innerTop:i.top,h:r.height}})()`);
  ok(`${P}: header content clears the status bar`, hdr.innerTop >= dev.sat, hdr);
  const tb = await b.ev(`(()=>{const t=document.getElementById('tabbar'),r=t.getBoundingClientRect(),btn=t.querySelector('.tabbar__b').getBoundingClientRect();return {bottom:r.bottom,btnBottom:btn.bottom,btnH:btn.height,vh:innerHeight}})()`);
  ok(`${P}: tab bar sits above the home indicator`, tb.bottom === tb.vh && tb.vh - tb.btnBottom >= dev.sab - 0.5 && tb.btnH >= 44, tb);
  let a = await b.ev(AUDIT); ok(`${P}: calendar agenda: no overflow / small targets`, !a.overflow && !a.nSmall, a);
  await b.shot(`${P}-calendar-agenda`);
  // swipe left in agenda -> next day
  const d0 = await b.ev(`SchedSync&&JSON.parse(localStorage.getItem('vswatprep.v1')).ui.date`);
  await b.swipe(dev.w * .8, dev.h * .6, dev.w * .15, dev.h * .62);
  const d1 = await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.date`);
  ok(`${P}: swipe left in agenda moves to the next day`, d1 > d0, [d0, d1]);
  await b.swipe(dev.w * .2, dev.h * .6, dev.w * .85, dev.h * .6);
  ok(`${P}: swipe right goes back`, await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.date`) === d0);
  // vertical scroll gesture must not change day
  await b.swipe(dev.w * .5, dev.h * .7, dev.w * .45, dev.h * .3);
  ok(`${P}: vertical drag does not change day`, await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.date`) === d0);
  await b.ev('scrollTo(0,0)');
  // agenda item -> bottom sheet; drag to dismiss
  await b.tap('.ag-item[data-agblock]');
  ok(`${P}: tapping a block opens the sheet`, await b.ev(`document.getElementById('drawer').classList.contains('is-open')`));
  await sleep(400); a = await b.ev(AUDIT); ok(`${P}: sheet: tap targets`, !a.nSmall, a);
  await b.shot(`${P}-sheet`);
  const head = await b.ev(`(()=>{const r=document.querySelector('#drawer .drawer__head').getBoundingClientRect();return [r.x+r.width*.4,r.y+20]})()`);
  await b.swipe(head[0], head[1], head[0], head[1] + 60, 6, 300);
  ok(`${P}: short drag snaps back`, await b.ev(`document.getElementById('drawer').classList.contains('is-open')&&!document.getElementById('drawer').style.transform`));
  await b.swipe(head[0], head[1], head[0], head[1] + 260, 8, 240);
  await sleep(300);
  ok(`${P}: drag down dismisses the sheet`, await b.ev(`!document.getElementById('drawer').classList.contains('is-open')`));
  // week grid toggle
  await b.tap('[data-calmode=grid]');
  ok(`${P}: week grid toggle`, await b.ev(`!!document.getElementById('cal')`));
  await b.shot(`${P}-calendar-grid`);
  await b.tap('[data-calmode=agenda]');
  // Day view via tab bar + swipe
  await b.tap('[data-tb=day]');
  ok(`${P}: Today tab opens Day view`, await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.view==='day'`));
  a = await b.ev(AUDIT); ok(`${P}: day view: overflow / targets`, !a.overflow && !a.nSmall, a);
  await b.shot(`${P}-day`);
  const dd0 = await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.date`);
  await b.swipe(dev.w * .85, dev.h * .55, dev.w * .1, dev.h * .56);
  ok(`${P}: swipe in Day view`, await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.date`) > dd0);
  // check an item and verify touch toggles it, then undo
  const chk = await b.ev(`(()=>{const c=document.querySelector('.tl-card label.check input');return c?c.id||c.dataset.id||'x':null})()`);
  if (chk) { const before = await b.ev(`document.querySelector('.tl-card label.check input').checked`); await b.tap('.tl-card label.check'); const after = await b.ev(`document.querySelector('.tl-card label.check input').checked`);
    ok(`${P}: tapping a checklist row toggles it`, before !== after); await b.tap('.tl-card label.check'); }
  // More sheet
  await b.tap('[data-tb=more]');
  ok(`${P}: More sheet opens`, await b.ev(`document.getElementById('drawer').dataset.mode==='more'`));
  await sleep(350); await b.shot(`${P}-more`);
  await b.tap('[data-more=settings]');
  ok(`${P}: More -> Settings`, await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.view==='settings'&&document.querySelector('[data-tb=more]').classList.contains('is-on')`));
  a = await b.ev(AUDIT); ok(`${P}: settings: inputs 16px+, no overflow`, !a.overflow && !a.font.length, a);
  await sleep(600);
  ok(`${P}: reminders card in Settings explains the next step`, await b.ev(dev.standalone ? `/Sign in first/.test(document.querySelector('[data-pushbox]').innerText)` : `/Add to Home Screen/.test(document.querySelector('[data-pushbox]').innerText)`));
  await b.shot(`${P}-settings-reminders`);
  await b.shot(`${P}-settings`);
  // Study signed out
  await b.tap('[data-tb=study]'); a = await b.ev(AUDIT); ok(`${P}: study (signed out): overflow / targets`, !a.overflow && !a.nSmall, a);
  await b.shot(`${P}-study-signed-out`);
  ok(`${P}: Study gate has inline email sign-in`, await b.ev(`!!document.querySelector('#main form[data-gatesignin] input[type=email]')`));
  ok(`${P}: tab bar has Food`, await b.ev(`!!document.querySelector('[data-tb=food]')`));
  // fresh open (30+ min since last use) lands on Today
  await b.ev(`(()=>{addEventListener('visibilitychange',e=>e.stopImmediatePropagation(),true);addEventListener('pagehide',e=>e.stopImmediatePropagation(),true);const s=JSON.parse(localStorage.getItem('vswatprep.v1'));s.ui.view='settings';s.ui.lastOpen=Date.now()-31*60e3;localStorage.setItem('vswatprep.v1',JSON.stringify(s))})()`);
  await b.go('index.html?nosw');
  ok(`${P}: fresh open lands on Today`, await b.ev(`JSON.parse(localStorage.getItem('vswatprep.v1')).ui.view==='day'`));
  // sync popover: email only
  await b.go('index.html?nosw#view=study');
  for (let i = 0; i < 40 && (await b.ev(`document.querySelector('#syncHost .sync').dataset.mode`)) !== 'signedout'; i++) await sleep(250);
  ok(`${P}: Study tab links to the Daily Study app (signed out)`, await b.ev(`(()=>{const a=document.querySelector('a[data-dslink]');if(!a)return false;const r=a.getBoundingClientRect();return new URL(a.href).pathname.endsWith('/study/')&&r.height>=44&&r.right<=innerWidth})()`));
  await b.tap('#syncHost .sync__pill');
  ok(`${P}: sign-in popover is email-only (no code, no password)`, await b.ev(`!!document.querySelector('.sync__pop input[type=email]')&&!document.querySelector('.sync__pop input[name=code],.sync__pop input[type=password]')`));
  const pop = await b.ev(`(()=>{const r=document.querySelector('.sync__pop').getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,vw:innerWidth}})()`);
  ok(`${P}: popover fits on screen`, pop.l >= 0 && pop.r <= pop.vw && pop.t >= dev.sat, pop);
  a = await b.ev(AUDIT); ok(`${P}: popover input 16px`, !a.font.length, a);
  await b.shot(`${P}-sign-in`);
  // Meals
  await b.go('meals.html?nosw');
  ok(`${P}: meals opens on Today with amounts`, await b.ev(`document.body.dataset.tab==='today'&&!!document.querySelector('.panel .parts, .panel [class*=part]')`));
  await b.shot(`${P}-meals-today`);
  await b.ev(`(()=>{const q=document.getElementById('q');q.value='chicken';q.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(300);
  ok(`${P}: ingredient search finds matches`, await b.ev(`document.querySelectorAll('.panel mark').length>0`));
  a = await b.ev(AUDIT); ok(`${P}: meals search: overflow / font`, !a.overflow && !a.font.length, a);
  await b.shot(`${P}-meals-search`);
  await b.tap('#qx'); await b.tap('#tab-week'); await sleep(200);
  ok(`${P}: meals bottom tabs`, await b.ev(`(()=>{const n=document.querySelector('nav.tabsbar').getBoundingClientRect();return getComputedStyle(document.querySelector('nav.tabsbar')).position==='fixed'&&Math.abs(n.bottom-innerHeight)<1})()`));
  a = await b.ev(AUDIT); ok(`${P}: meals week: overflow / targets`, !a.overflow && !a.nSmall, a);
  await b.shot(`${P}-meals-week`);
  await b.tap('#tab-grocery'); await sleep(300);
  const box = await b.ev(`(()=>{const r=document.querySelector('.panel .box').getBoundingClientRect(),c=document.querySelector('.panel .chk').getBoundingClientRect();return [r.width,c.height]})()`);
  ok(`${P}: big grocery checkboxes`, box[0] >= 28 && box[1] >= 48, box);
  await b.ev(`(()=>{const h=[...document.querySelectorAll('.store-h')].sort((a,b)=>b.parentElement.offsetHeight-a.parentElement.offsetHeight)[0];scrollTo(0,h.getBoundingClientRect().top+scrollY+120)})()`); await sleep(400);
  const st = await b.ev(`(()=>{const hs=[...document.querySelectorAll('.store-h')];const stuck=hs.find(h=>{const r=h.getBoundingClientRect();return Math.abs(r.top-${dev.sat})<2});return stuck?stuck.textContent.slice(0,30):null})()`);
  ok(`${P}: grocery section header sticks under the status bar`, !!st, st);
  await b.shot(`${P}-meals-grocery`);
  const cb0 = await b.ev(`document.querySelector('.panel .chk input').checked`); await b.tap('.panel .chk'); const cb1 = await b.ev(`document.querySelector('.panel .chk input').checked`);
  ok(`${P}: grocery checkbox toggles on tap`, cb0 !== cb1); await b.tap('.panel .chk');
  await b.tap('#tab-cook'); await b.shot(`${P}-meals-cook`);
  await b.tap('#tab-week'); await b.tap('#editBtn'); a = await b.ev(AUDIT); ok(`${P}: meals edit mode targets / inputs`, !a.nSmall && !a.font.length, a); await b.tap('#editBtn');
  // signed-in flashcards (optional)
  if (EMAIL && dev.key !== 'pro-safari') {
    await b.go('index.html?nosw#view=study');
    // real UI: type just the email in the Study gate, tap Sign in
    for (let i = 0; i < 40 && !(await b.ev(`!!document.querySelector('#main form[data-gatesignin] input')`)); i++) await sleep(250);
    await b.ev(`document.querySelector('#main form[data-gatesignin] input').value=${JSON.stringify('  ' + EMAIL.toUpperCase() + ' ')}`);
    await b.tap('#main form[data-gatesignin] button');
    let t0 = Date.now(); while (Date.now() - t0 < 20000 && !(await b.ev(`!!document.querySelector('#main .sx-start')&&!document.querySelector('#main .sx-gate')`))) await sleep(300);
    ok(`${P}: email-only sign-in via the Study form (caps + spaces) loads study`, await b.ev(`!!document.querySelector('#main .sx-start')`));
    await sleep(800); await b.shot(`${P}-signedin-study-today`);
    ok(`${P}: Study shows the small reminders prompt with a 44px+ Enable button`, await b.ev(`(()=>{const e=document.querySelector('[data-pushbox][data-compact] [data-push=enable]');return !!e&&e.getBoundingClientRect().height>=44})()`));
    await b.shot(`${P}-signedin-study-reminder-prompt`);
    await b.tap('#main [data-tabs=study] [data-key=cards]'); await sleep(400);
    const startBtn = await b.ev(`(()=>{const x=['new','all','due'].map(k=>document.querySelector('#main [data-sxgo='+k+']')).find(e=>e&&!e.disabled);return x?x.dataset.sxgo:null})()`);
    if (startBtn) await b.tap(`#main [data-sxgo=${startBtn}]`); await sleep(400);
    ok(`${P}: flashcard session is full screen`, await b.ev(`(()=>{const c=document.querySelector('.sx-sesscard');if(!c)return false;const r=c.getBoundingClientRect();return getComputedStyle(c).position==='fixed'&&r.top===0&&Math.abs(r.height-innerHeight)<1})()`));
    await b.tap('.sx-sesscard [data-sess=show]'); await sleep(300);
    await b.shot(`${P}-signedin-flashcard`);
    const before = await b.ev(`document.querySelector('.sx-sess__top .mono').textContent`);
    const fr = await b.ev(`(()=>{const r=document.querySelector('.sx-flip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
    await b.swipe(fr[0], fr[1], fr[0] + 230, fr[1] + 10, 10, 260); await sleep(500);
    const after = await b.ev(`document.querySelector('.sx-sess__top .mono')?.textContent`);
    ok(`${P}: swipe right grades the card and advances`, before !== after, [before, after]);
    await b.tap('.sx-sesscard [data-sess=show]'); const fr2 = await b.ev(`(()=>{const r=document.querySelector('.sx-flip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
    await b.swipe(fr2[0], fr2[1], fr2[0] - 230, fr2[1], 10, 260); await sleep(500);
    ok(`${P}: swipe left = missed (re-queued)`, await b.ev(`/\\/ ?\\d+/.test(document.querySelector('.sx-sess__top .mono').textContent)`));
    await b.tap('.sx-sesscard [data-sess=close]');
    await b.go('index.html?nosw#view=study'); await sleep(800);
    await b.tap('[data-quick5]'); await sleep(500);
    if (await b.ev(`!!document.getElementById('q5')`)) {
      await b.tap('#q5 [data-q5=show]'); await sleep(300);
      const q = await b.ev(`(()=>{const r=document.getElementById('q5').getBoundingClientRect(),g=document.querySelector('#q5 .sx-got').getBoundingClientRect();return {h:r.height,vh:innerHeight,gotBottom:g.bottom,gotH:g.height}})()`);
      ok(`${P}: Quick 5 full screen, answer buttons in thumb zone`, Math.abs(q.h - q.vh) < 1 && q.gotBottom > q.vh * .7 && q.gotH >= 56, q);
      await b.shot(`${P}-signedin-quick5`);
      await b.tap('#q5 [data-q5=close]');
    } else ok(`${P}: Quick 5 button found`, false);
    await b.ev(`SchedSync.current.signOut()`); await sleep(1500);
    ok(`${P}: sign-out wipes cached study content`, await b.ev(`localStorage.getItem('sched.study.v1')===null`));
  }
  const own = b.errors.filter(e => !/chrome-extension:\/\/|\[InjectContentScripts\]/.test(e));   /* ignore the headless browser's own extension noise */
  ok(`${P}: zero JS errors`, own.length === 0, own);
  b.close();
}
const fails = results.filter(r => r[0] === 'FAIL'); console.log(`\n${results.length - fails.length}/${results.length} passed`); fails.forEach(f => console.log('FAIL', f[1]));
process.exit(fails.length ? 1 : 0);
