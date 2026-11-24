import { spawn } from 'node:child_process';
const port = 9333;
const chrome = spawn('google-chrome', ['--headless=new','--no-sandbox','--disable-gpu',`--remote-debugging-port=${port}`,'--user-data-dir=/tmp/chr-swat','about:blank'], {stdio:'ignore'});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let ver; for (let i=0;i<50;i++){ try{ ver = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break;}catch{ await sleep(200);} }
const page = ver.find(t=>t.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0; const pend={}; const errors=[];
ws.onmessage = ev => { const m=JSON.parse(ev.data); if(m.id&&pend[m.id]){pend[m.id](m);delete pend[m.id];}
  if(m.method==='Runtime.exceptionThrown') errors.push('EXC '+JSON.stringify(m.params.exceptionDetails).slice(0,600));
  if(m.method==='Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type)) errors.push('CONSOLE '+m.params.args.map(a=>a.value||a.description).join(' '));
  if(m.method==='Log.entryAdded' && m.params.entry.level==='error') errors.push('LOG '+m.params.entry.text+' '+(m.params.entry.url||''));
};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
const fs = await import('node:fs');
const root=process.env.ROOT||'http://127.0.0.1:8765/';
const shots = JSON.parse(process.argv[2]);
for (const s of shots){
  await send('Emulation.setDeviceMetricsOverride',{width:s.w||1440,height:s.h||1000,deviceScaleFactor:s.dsf||1,mobile:!!s.mobile});
  await send('Page.navigate',{url:'about:blank'}); await sleep(300); await send('Page.navigate',{url: root+(s.page||'index.html')+'#'+(s.hash||'')}); await sleep(1500);
  if (s.js){ const r=await send('Runtime.evaluate',{expression:s.js,awaitPromise:true,returnByValue:true}); if(r.result?.exceptionDetails) errors.push('EVAL '+JSON.stringify(r.result.exceptionDetails).slice(0,400)); else if (r.result?.result?.value!==undefined) console.log('eval',s.name,JSON.stringify(r.result.result.value)); await sleep(700);}
  const full = s.full ? await send('Runtime.evaluate',{expression:'Math.min(document.documentElement.scrollHeight,6000)',returnByValue:true}) : null;
  if (full) await send('Emulation.setDeviceMetricsOverride',{width:s.w||1440,height:full.result.result.value,deviceScaleFactor:s.dsf||1,mobile:!!s.mobile});
  const r = await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(`${process.env.OUT||'/workspace/scheduler/docs/screenshots'}/${s.name}.png`, Buffer.from(r.result.data,'base64'));
  console.log('shot', s.name);
}
console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
ws.close(); chrome.kill();
