/* ==== iPhone / touch ==== */
const MQ_PHONE=matchMedia('(max-width:640px)'),MQ_SHEET=matchMedia('(max-width:820px)'),isPhone=()=>MQ_PHONE.matches;
const STANDALONE=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
document.documentElement.classList.toggle('is-standalone',STANDALONE);
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
/* haptics where supported (Android); iOS Safari has no vibrate API, so this is a no-op there */
const buzz=ms=>{try{const u=navigator.userActivation;if(navigator.vibrate&&(!u||u.hasBeenActive))navigator.vibrate(ms)}catch(e){}};
/* header height -> --header-h (sticky offsets stay right when the header changes size) */
(()=>{const h=$('.app-header');if(!h||!window.ResizeObserver)return;new ResizeObserver(()=>document.documentElement.style.setProperty('--header-h',h.offsetHeight+'px')).observe(h)})();

/* ---- bottom tab bar ---- */
const IC={day:'<path d="M4 6h16M4 6v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6M8 3v5M16 3v5M8 12h4v4H8z"/>',
  calendar:'<path d="M4 5h16v15H4zM4 10h16M9 5v15M15 5v15"/>',
  study:'<path d="M3 7l9-4 9 4-9 4zM7 9v5c0 1.7 2.2 3 5 3s5-1.3 5-3V9M21 7v6"/>',
  tracks:'<path d="M4 18V9M10 18V5M16 18v-7M22 18H2"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'};
const TABBAR=[['day','Today'],['calendar','Week'],['study','Study'],['tracks','Tracks'],['more','More']];
const MORE=[['dash','Progress','Streaks, % by track and week'],['logs','Logs','Workouts, range and weights'],['settings','Settings','Shift, units and sync']];
function renderTabbar(){if(S.ui.view!=='study')$$('body>.sx-sesscard').forEach(e=>e.remove());const tb=$('#tabbar');if(!tb)return;
  if(!tb.firstChild){tb.innerHTML=TABBAR.map(([k,l])=>`<button class="tabbar__b" data-tb="${k}" type="button"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg><span>${l}</span></button>`).join('');
    tb.addEventListener('click',e=>{const b=e.target.closest('[data-tb]');if(!b)return;const k=b.dataset.tb;buzz(6);
      if(k==='more')return openMore();
      if(k==='day'){const t=todayIso();if(S.ui.view==='day'&&dayObj(t))return go('day',{date:t});return go('day')}
      if(k===S.ui.view){scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});return}go(k)})}
  const cur=MORE.some(m=>m[0]===S.ui.view)?'more':S.ui.view;
  $$('[data-tb]',tb).forEach(b=>{const on=b.dataset.tb===cur;b.classList.toggle('is-on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
  document.body.dataset.view=S.ui.view}
function openMore(){lastFocus=document.activeElement;
  const dr=mountDrawer(`<div class="drawer__inner"><div class="drawer__head"><div style="flex:1"><h2 id="drawerTitle">More</h2></div><button class="btn btn--icon" data-close aria-label="Close">✕</button></div>
    <div class="drawer__body"><div class="more-list">${MORE.map(([k,l,s])=>`<button class="more-item ${S.ui.view===k?'is-on':''}" data-more="${k}"><b>${l}</b><span>${s}</span></button>`).join('')}
    <a class="more-item" href="meals.html"><b>Meal plan ↗</b><span>The page your wife uses: menu, packing, groceries</span></a></div></div></div>`,'more');
  $$('[data-more]',dr).forEach(b=>b.onclick=()=>{closeDrawer(true);go(b.dataset.more)});setTimeout(()=>{const f=$('[data-close]',dr);f&&f.focus({preventScroll:true})},60)}

/* phone: a running flashcard session goes full screen at body level (outside animated/contained ancestors) */
function portalSess(){$$('body>.sx-sesscard').forEach(e=>e.remove());if(!isPhone()||S.ui.view!=='study')return;
  const c=$('#main .sx-sesscard');if(c){c.setAttribute('role','dialog');c.setAttribute('aria-modal','true');c.setAttribute('aria-label','Flashcards');document.body.appendChild(c);const f=$('[data-sess="show"],.sx-got,[data-sess="close"]',c);f&&f.focus({preventScroll:true})}}
/* ---- calendar agenda (phone default) ---- */
const calModeToggle=m=>`<div class="seg" role="group" aria-label="Calendar layout"><button class="seg__b" data-calmode="agenda" aria-pressed="${m==='agenda'}">Agenda</button><button class="seg__b" data-calmode="grid" aria-pressed="${m==='grid'}">Week grid</button></div>`;
function agendaDate(w){const t=todayIso();return w.days.some(d=>d.date===S.ui.date)?S.ui.date:(w.days.some(d=>d.date===t)?t:w.days[0].date)}
function renderAgenda(){const w=week(),date=agendaDate(w),t=todayIso();S.ui.date=date;const d=dayObj(date),p=parseD(date);
  const items=d.blocks.map(b=>({b,s:toMin(b.start)})).concat(shiftSegs(date).map(([a,z])=>({shift:[a,z],s:a}))).sort((x,y)=>x.s-y.s||(x.shift?-1:1));
  let h=`<section class="view view--agenda"><div class="page-head ag-head"><div style="min-width:0"><div class="eyebrow" style="white-space:nowrap">${esc(w.label.split(':')[0])}${date===t?' · Today':''}</div><h1>${DOW[p.getDay()]}, ${MON[p.getMonth()]} ${p.getDate()}</h1></div><span class="spacer"></span>${calModeToggle('agenda')}</div>
    <div class="ag-strip" role="tablist" aria-label="Days">${w.days.map(x=>{const q=parseD(x.date),pc=dayPct(x);return `<button class="ag-day ${x.date===date?'is-on':''} ${x.date===t?'is-today':''}" role="tab" aria-selected="${x.date===date}" data-agday="${x.date}"><span class="ag-day__dow">${DOW[q.getDay()].slice(0,2)}</span><span class="ag-day__n">${q.getDate()}</span><span class="ag-day__p" style="--p:${pc}"></span></button>`}).join('')}</div>
    <div class="ag-sub"><span class="muted">${esc(d.title)}</span><span class="faint small mono">${dayPct(d)}%</span></div>
    <div class="ag-list">`;
  if(!items.length)h+=`<div class="empty card">Nothing planned. Rest day.</div>`;
  items.forEach(({b,shift},n)=>{
    if(shift){h+=`<div class="ag-item ag-item--shift" style="--i:${n}"><div class="ag-time">${fmtM(shift[0])}<small>${fmtM(shift[1])}</small></div><div class="ag-body"><b>On shift · patrol</b><span class="faint small">${shift[0]===0?'Ends '+fmtM(shift[1]):'Starts '+fmtM(shift[0])}</span></div></div>`;return}
    const done=(b.items.length&&blockPct(b)===100)||b.status==='done',cnt=b.items.length?`${b.items.filter(x=>S.checks[x.id]).length}/${b.items.length}`:'';
    h+=`<button class="ag-item ${done?'is-done':''} ${b.status==='skipped'?'is-skipped':''} ${b.flex?'is-flex':''}" style="--c:${tcol(b.track)};--i:${n}" data-agblock="${esc(b.bid)}"><div class="ag-time">${b.start}<small>${b.end}</small></div>
      <div class="ag-body"><span class="ag-title">${esc(b.title)}</span><span class="ag-meta"><i style="background:${tcol(b.track)}"></i>${esc(tlabel(b.track))}${b.flex?' · optional':''}${b.status&&b.status!=='done'?' · '+b.status:''}</span></div>
      <span class="ag-end">${done?`<span class="ag-done">${CHECK_SVG}</span>`:cnt?`<span class="mono small faint">${cnt}</span>`:''}</span></button>`});
  h+=`</div><div class="ag-foot"><button class="btn" data-addblk="${date}">＋ Add block</button><button class="btn btn--primary" data-agopen="${date}">Open day checklist →</button></div>
    <p class="faint small ag-hint">Swipe left or right to change day.</p></section>`;
  $('#main').innerHTML=h;
  $$('[data-agday]').forEach(el=>el.onclick=()=>{if(el.dataset.agday===S.ui.date)return;const dir=el.dataset.agday>S.ui.date?1:-1;S.ui.date=el.dataset.agday;save();slideView(dir)});
  $$('[data-agblock]').forEach(el=>el.onclick=()=>openDrawer(el.dataset.agblock,el));
  $$('[data-agopen]').forEach(el=>el.onclick=()=>go('day',{date:el.dataset.agopen}));
  const on=$('.ag-day.is-on');on&&on.scrollIntoView({block:'nearest',inline:'center'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-calmode]');if(!b)return;S.ui.calMode=b.dataset.calmode;save();renderView()});
MQ_PHONE.addEventListener('change',()=>{if(S.ui.view==='calendar')renderView();renderTabbar()});

/* ---- swipe between days (agenda + day view) ---- */
function slideView(dir){renderView();if(reduceMotion())return;const v=$('#main .view');
  v&&v.animate([{transform:`translateX(${dir*36}px)`,opacity:.2},{transform:'none',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'})}
function stepDay(dir){const days=allDays(),i=days.findIndex(x=>x.date===S.ui.date),n=days[i+dir];if(i<0||!n){buzz(12);return}
  S.ui.date=n.date;S.ui.week=dayObj(n.date).week;save();buzz(6);slideView(dir);if(S.ui.view==='day')scrollTo(0,0)}
function swipeable(){return (S.ui.view==='day'&&isPhone())||(S.ui.view==='calendar'&&isPhone()&&S.ui.calMode!=='grid')}
(()=>{let x0,y0,t0,ok=false;const m=$('#main');
  m.addEventListener('touchstart',e=>{ok=false;if(e.touches.length!==1||!swipeable())return;const t=e.touches[0],el=e.target;
    if(t.clientX<24||el.closest('input,textarea,select,.tabs,.ag-strip,.cal,[data-noswipe],.sx-flip'))return;
    for(let p=el;p&&p!==m;p=p.parentElement){if(p.scrollWidth>p.clientWidth+4&&/(auto|scroll)/.test(getComputedStyle(p).overflowX))return}
    x0=t.clientX;y0=t.clientY;t0=Date.now();ok=true},{passive:true});
  m.addEventListener('touchend',e=>{if(!ok)return;ok=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)>64&&Math.abs(dx)>Math.abs(dy)*1.6&&Date.now()-t0<700)stepDay(dx<0?1:-1)},{passive:true});
  m.addEventListener('touchcancel',()=>ok=false,{passive:true})})();

/* ---- bottom sheet: grab handle + drag to dismiss ---- */
(()=>{const dr=$('#drawer');let y0=null,dy=0,t0=0;
  dr.addEventListener('touchstart',e=>{if(!MQ_SHEET.matches||e.touches.length!==1)return;const el=e.target;
    const body=$('.drawer__body',dr),inHead=el.closest('.drawer__grab,.drawer__head'),atTop=body&&body.contains(el)&&body.scrollTop<=0;
    if(!(inHead||atTop)||el.closest('input,textarea,select,button:not(.drawer__grab),a'))return;
    y0=e.touches[0].clientY;dy=0;t0=Date.now()},{passive:true});
  dr.addEventListener('touchmove',e=>{if(y0==null)return;dy=e.touches[0].clientY-y0;
    if(dy<=0){if(dr.style.transform){dr.style.transform='';dr.style.transition=''}return}
    if(e.cancelable)e.preventDefault();dr.style.transition='none';dr.style.transform=`translateY(${dy}px)`;$('#scrim').style.opacity=String(Math.max(0,1-dy/400))},{passive:false});
  const end=()=>{if(y0==null)return;const v=dy/Math.max(1,Date.now()-t0);y0=null;dr.style.transition='';$('#scrim').style.opacity='';
    if(dy>110||(dy>30&&v>.55)){buzz(8);closeDrawer();requestAnimationFrame(()=>dr.style.transform='')}else dr.style.transform=''};
  dr.addEventListener('touchend',end);dr.addEventListener('touchcancel',end)})();

/* ---- flashcards: swipe right = got it, left = missed ---- */
(()=>{let card=null,x0=0,y0=0,dx=0,lock=null;
  document.addEventListener('touchstart',e=>{const c=e.target.closest('.sx-flip.is-flipped');if(!c||e.touches.length!==1)return;card=c;x0=e.touches[0].clientX;y0=e.touches[0].clientY;dx=0;lock=null},{passive:true});
  document.addEventListener('touchmove',e=>{if(!card)return;const t=e.touches[0];dx=t.clientX-x0;const dy=t.clientY-y0;
    if(lock==null&&(Math.abs(dx)>8||Math.abs(dy)>8))lock=Math.abs(dx)>Math.abs(dy)?'x':'y';if(lock!=='x')return;
    if(e.cancelable)e.preventDefault();card.style.transition='none';card.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;
    card.dataset.swipe=dx>40?'got':dx<-40?'miss':''},{passive:false});
  const end=()=>{if(!card)return;const c=card;card=null;if(lock!=='x')return;const go2=Math.abs(dx)>90?(dx>0?'got':'miss'):null;c.style.transition='';
    if(!go2){c.style.transform='';c.dataset.swipe='';return}
    buzz(go2==='got'?10:[8,40,8]);const btn=c.closest('.sx-sess')&&$(go2==='got'?'.sx-got':'.sx-miss',c.closest('.sx-sess'));
    if(reduceMotion()){btn&&btn.click();return}
    c.style.transform=`translateX(${dx>0?120:-120}vw) rotate(${dx>0?18:-18}deg)`;c.style.opacity='0';setTimeout(()=>btn&&btn.click(),190)};
  document.addEventListener('touchend',end);document.addEventListener('touchcancel',()=>{if(card){card.style.transform='';card.style.transition='';card=null}})})();

/* ---- offline app shell ---- */
if('serviceWorker' in navigator&&!/[?&]nosw\b/.test(location.search)&&(location.protocol==='https:'||location.hostname==='127.0.0.1'||location.hostname==='localhost'))
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
