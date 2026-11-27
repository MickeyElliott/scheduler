/* ---- Study reminders (Web Push) ----
   Inlined after study.js (shares SYNC, S, $, go, toast, todayIso). The VAPID PUBLIC key comes from config.js; the private key
   lives only in Supabase (Vault / function secrets). Subscriptions and prefs are rows in public.push_subscriptions (household RLS). */
const PUSH_KEY=(window.SCHED_CONFIG||{}).VAPID_PUBLIC_KEY||'',PUSH_TZ='America/Los_Angeles',PUSH_DEFAULT='19:00';
const pushEnv=()=>{const ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return{ios,standalone:navigator.standalone===true||matchMedia('(display-mode: standalone)').matches,supported:'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}};
const ptNow=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:PUSH_TZ,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return{date:`${p.year}-${p.month}-${p.day}`,min:+p.hour*60+ +p.minute}};
const pushLabel=t=>{const[h,m]=t.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`};
const pushB64=s=>{const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))};
const pushAb=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
let PUSHS={busy:false,msg:'',row:null,sub:null,perm:null};
async function pushReg(){if(!('serviceWorker' in navigator))return null;let r=await navigator.serviceWorker.getRegistration();if(!r){try{r=await navigator.serviceWorker.register('sw.js')}catch(e){return null}}
  return Promise.race([navigator.serviceWorker.ready,new Promise(res=>setTimeout(()=>res(null),4000))])}
async function pushLoad(){const e=pushEnv();PUSHS.sub=null;PUSHS.row=null;PUSHS.perm='Notification' in window?Notification.permission:null;
  if(!e.supported||(e.ios&&!e.standalone))return;
  const reg=await pushReg();if(!reg)return;PUSHS.sub=await reg.pushManager.getSubscription();
  const db=SYNC.db();if(PUSHS.sub&&db){const{data}=await db.from('push_subscriptions').select('enabled,remind_time,last_error').eq('endpoint',PUSHS.sub.endpoint).maybeSingle();PUSHS.row=data||null}}
function pushState(){const e=pushEnv();
  if(!PUSH_KEY)return{k:'off',msg:'Reminders are not configured for this build.'};
  if(e.ios&&!e.standalone)return{k:'install',msg:'iPhone only allows reminders from the home-screen app. In Safari tap Share → Add to Home Screen → Add, open SWAT Prep from its icon, then come back here and tap Enable reminders.'};
  if(!e.supported)return{k:'nosupport',msg:e.ios?'Reminders need iOS 16.4 or newer.':'This browser can’t receive push reminders.'};
  if(!SYNC.db())return{k:'signin',msg:'Sign in first (tap the dot in the top right, or use the box on the Study page) so your reminder can be saved.'};
  if(PUSHS.perm==='denied')return{k:'denied',msg:'Notifications are blocked for this app. On iPhone: Settings → Notifications → SWAT Prep → Allow Notifications, then come back.'};
  if(PUSHS.sub&&PUSHS.row)return{k:PUSHS.row.enabled?'on':'paused'};
  return{k:'ready'}}
function pushHtml(compact){const st=pushState(),k=st.k,t=(PUSHS.row&&PUSHS.row.remind_time)||PUSH_DEFAULT;
  const time=`<label class="field push__time">Remind me at<input class="input" type="time" step="900" value="${t}" data-push-time aria-label="Reminder time (Pacific)"></label>`;
  const msg=`<p class="push__msg small ${/^(Could|Failed|Notifications are)/.test(PUSHS.msg)?'push__msg--bad':'faint'}" role="status" aria-live="polite">${esc(PUSHS.msg)}</p>`;
  if(compact){if(k==='on'||k==='paused'||k==='off'||k==='signin'||k==='nosupport'||k==='denied'||S.ui.pushDismiss)return'';
    if(k!=='ready')return `<div class="card push push--compact"><div><b>🔔 Daily drill reminder</b><p class="muted small">Needs the home-screen app.</p></div><div class="row"><button class="btn btn--sm" data-push="settings">How</button><button class="btn btn--sm btn--ghost" data-push="dismiss" aria-label="Dismiss">✕</button></div></div>`;
    return `<div class="card push push--compact"><div><b>🔔 Daily drill reminder</b><p class="muted small">A nudge at ${pushLabel(PUSH_DEFAULT)}, before your shift, with what to drill.</p>${msg}</div><div class="row"><button class="btn btn--sm btn--primary" data-push="enable">Enable reminders</button><button class="btn btn--sm btn--ghost" data-push="dismiss" aria-label="Dismiss">✕</button></div></div>`}
  let h=`<div class="card__title">Study reminders</div>`;
  if(k==='ready')h+=`<p class="muted small">A push notification each day with how many cards are due and what to drill. ${pushLabel(PUSH_DEFAULT)} suits your night shift (Tue–Fri 20:30): after dinner, before you leave. Time is Pacific.</p>${time}<div class="row mt-4"><button class="btn btn--primary" data-push="enable">Enable reminders</button></div>${msg}`;
  else if(k==='on'||k==='paused')h+=`<div class="push__sw"><div><b>Daily reminder</b><div class="faint small">${k==='on'?`Every day at ${pushLabel(t)} Pacific`:'Paused'}</div></div><button type="button" class="switch" role="switch" aria-checked="${k==='on'}" data-push="${k==='on'?'pause':'resume'}" aria-label="Daily reminder on or off"><i></i></button></div>${time}<div class="row mt-4"><button class="btn" data-push="test">Send test</button><button class="btn btn--ghost" data-push="remove">Remove from this device</button></div>${PUSHS.row&&PUSHS.row.last_error?`<p class="push__msg push__msg--bad small">Last send failed: ${esc(PUSHS.row.last_error)}</p>`:''}${msg}`;
  else h+=`<p class="muted small">${esc(st.msg)}</p>${msg}`;
  return h}
async function pushRefresh(){const boxes=$$('[data-pushbox]');if(!boxes.length)return;await pushLoad();
  boxes.forEach(b=>{const c=b.hasAttribute('data-compact');if(!document.contains(b))return;b.dataset.ready='1';const keep=document.activeElement&&b.contains(document.activeElement)&&document.activeElement.matches('[data-push-time]');if(keep)return;
    if(c){b.innerHTML=pushHtml(true)}else{b.className='card push';b.innerHTML=pushHtml(false)}})}
const pushSay=(m)=>{PUSHS.msg=m||'';$$('.push__msg').forEach(n=>{n.textContent=PUSHS.msg;n.classList.toggle('push__msg--bad',/^(Could|Failed|Notifications are)/.test(PUSHS.msg))})};
const pushTime=el=>{const b=el&&el.closest('[data-pushbox]'),i=b&&b.querySelector('[data-push-time]');return i&&/^\d\d:\d\d$/.test(i.value)?i.value:PUSH_DEFAULT};
const pushSlot=t=>{const n=ptNow(),[h,m]=t.split(':').map(Number);return h*60+m<=n.min?n.date:null};   /* time already passed today: don't fire an immediate reminder */
async function pushEnable(btn){
  try{PUSHS.busy=true;pushSay('');const t=pushTime(btn);
    const perm=Notification.permission==='granted'?'granted':await Notification.requestPermission();   /* first await: stays inside the tap */
    if(perm!=='granted'){PUSHS.perm=perm;await pushRefresh();return pushSay(perm==='denied'?'Notifications are blocked for this app. On iPhone: Settings → Notifications → SWAT Prep.':'Reminders stay off until you tap Allow.')}
    const reg=await pushReg();if(!reg)return pushSay('Could not start the background worker. Close and reopen the app, then try again.');
    let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushB64(PUSH_KEY)});
    const j=sub.toJSON(),db=SYNC.db(),ctx=SYNC.ctx&&SYNC.ctx();if(!db||!ctx)return pushSay('Could not save: sign in first.');
    const f={user_email:ctx.email,p256dh:j.keys.p256dh,auth:j.keys.auth,enabled:true,remind_time:t,tz:PUSH_TZ,last_sent_on:pushSlot(t),user_agent:navigator.userAgent.slice(0,200),updated_at:new Date().toISOString()};
    const{data:ex}=await db.from('push_subscriptions').select('id').eq('endpoint',sub.endpoint).maybeSingle();
    const{error}=ex?await db.from('push_subscriptions').update(f).eq('endpoint',sub.endpoint):await db.from('push_subscriptions').insert(Object.assign({household_id:ctx.hid,endpoint:sub.endpoint},f,{updated_at:undefined}));
    if(error)return pushSay('Could not save: '+error.message);
    await pushRefresh();pushSay(`Reminders on. First one ${pushSlot(t)?'tomorrow':'today'} at ${pushLabel(t)}. Tap Send test to see how it looks.`);toast('Reminders on')
  }catch(e){pushSay('Could not enable: '+(e&&e.message||e))}finally{PUSHS.busy=false}}
async function pushPatch(patch,say){const db=SYNC.db();if(!db||!PUSHS.sub)return;const{error}=await db.from('push_subscriptions').update(Object.assign({updated_at:new Date().toISOString()},patch)).eq('endpoint',PUSHS.sub.endpoint);
  if(error)return pushSay('Could not save: '+error.message);await pushRefresh();if(say)pushSay(say)}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-push]');if(!b)return;const a=b.dataset.push;
  if(a==='enable')return pushEnable(b);
  if(a==='dismiss'){S.ui.pushDismiss=1;save();return pushRefresh()}
  if(a==='settings')return go('settings');
  if(a==='pause')return pushPatch({enabled:false},'Paused.');
  if(a==='resume'){const t=pushTime(b);return pushPatch({enabled:true,remind_time:t,last_sent_on:pushSlot(t)},'Reminders on.')}
  if(a==='test'){const db=SYNC.db();if(!db||!PUSHS.sub)return;b.disabled=true;pushSay('Sending…');
    try{const{data,error}=await db.functions.invoke('push-reminders',{body:{action:'test',endpoint:PUSHS.sub.endpoint}});
      if(error){let m=error.message;try{const j=await error.context.json();m=j.error||(j.status?'push service said '+j.status:m)}catch(_){}pushSay('Failed: '+m);await pushRefresh()}
      else pushSay('Sent. It should arrive in a few seconds. If nothing shows, check Settings → Notifications → SWAT Prep.')}
    catch(err){pushSay('Failed: '+(err.message||err))}finally{b.disabled=false}return}
  if(a==='remove'){try{const db=SYNC.db();if(PUSHS.sub){await db.from('push_subscriptions').delete().eq('endpoint',PUSHS.sub.endpoint);await PUSHS.sub.unsubscribe()}}catch(_){}await pushRefresh();pushSay('Removed from this device.')}});
document.addEventListener('change',e=>{const i=e.target.closest('[data-push-time]');if(!i||!PUSHS.sub||!PUSHS.row)return;
  const t=/^\d\d:\d\d$/.test(i.value)?i.value:PUSH_DEFAULT;pushPatch({remind_time:t,last_sent_on:pushSlot(t)},`Saved. Daily at ${pushLabel(t)} Pacific.`)});
new MutationObserver(()=>{if($$('[data-pushbox]:not([data-ready])').length){if(!PUSHS.busy)PUSHS.msg='';pushRefresh()}}).observe(document.getElementById('main')||document.body,{childList:true,subtree:true});
SYNC.onStatus(()=>{if($$('[data-pushbox]').length)pushRefresh()});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='open-study')studyGo('today')});
