/* ==== Study module ====
   Content (department policy outlines, cards, scenarios...) is NOT in this file or the repo.
   It loads from Supabase table study_content (allowlisted login only) and is cached on the device.
   Progress is synced through SYNC scope 'study'. */
const STUDY_LS='sched.study.v1';
let STUDY=null;try{STUDY=JSON.parse(localStorage.getItem(STUDY_LS)||'null')}catch(e){STUDY=null}
let studyState=STUDY?'ready':'none',studyErr='',studyLoading=false,studyChecked=0,SXI=null;
const STUDY_TABS=[['today','Today'],['policy','Policy'],['cards','Flashcards'],['scen','Scenarios'],['cases','Case law'],['oral','Oral board'],['plan','12-week plan'],['verify','To verify']];
const SRC_LABEL={'fwpd-ch4':'Ch. 4','fwpd-ch41':'Ch. 41','fwpd-ch46':'Ch. 46','week1-policy':'Week 1 policy','week1-caselaw':'Case law','week2-caselaw-queue':'Case law (wk 2)'};
const FC_SRC=[['all','All sources'],['fwpd-ch4','FWPD Ch. 4'],['fwpd-ch41','FWPD Ch. 41'],['fwpd-ch46','FWPD Ch. 46'],['week1-policy','Statutes / AG'],['law','Case law']];
const FC_INT={1:1,2:2,3:4,4:8,5:16};/* Leitner: days until next review per box */
const SP=k=>SYNC.get('study',k);
const SPut=(k,v)=>SYNC.put('study',k,v);
const stTab=()=>STUDY_TABS.some(t=>t[0]===S.ui.studyTab)?S.ui.studyTab:'today';

async function loadStudy(force){const db=SYNC.db();if(!db||studyLoading)return;studyLoading=true;
  const had=!!STUDY;if(!had){studyState='loading';studyRefresh()}
  try{const r1=await db.from('study_content').select('key,version');if(r1.error)throw r1.error;
    if(!r1.data.length){studyState=had?'ready':'empty';return}
    const ver=r1.data[0].version;studyChecked=Date.now();
    if(!force&&had&&STUDY.version===ver&&r1.data.every(r=>STUDY.data[r.key]!==undefined)){studyState='ready';return}
    const r2=await db.from('study_content').select('key,data,version');if(r2.error)throw r2.error;
    const data={};r2.data.forEach(r=>data[r.key]=r.data);STUDY={version:ver,at:new Date().toISOString(),data};SXI=null;
    try{localStorage.setItem(STUDY_LS,JSON.stringify(STUDY))}catch(e){}
    studyState='ready';if(had)toast('Study materials updated');studyRefresh()}
  catch(e){studyErr=e.message||String(e);studyState=STUDY?'ready':'error';studyRefresh()}
  finally{studyLoading=false}}
function dropStudy(why){if(STUDY){try{localStorage.removeItem(STUDY_LS)}catch(e){}STUDY=null;SXI=null}studyState=why;studyRefresh()}
function studyRefresh(){if(S.ui.view==='study'||S.ui.view==='day')rerender()}
SYNC.onStatus(st=>{if(st.mode==='synced'&&(!STUDY||Date.now()-studyChecked>36e5))loadStudy();
  else if(st.mode==='signedout'&&(STUDY||studyState!=='none'))dropStudy('none');
  else if(st.mode==='denied')dropStudy('denied')});

/* ---- indexes + section matching ---- */
const numT=s=>s.split('.').map(Number);
const cmpT=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]??-1,y=b[i]??-1;if(x!==y)return x-y}return 0};
function secRanges(sec){const out=[],re=/(\d+\.\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+\.\d+(?:\.\d+)?))?/g;let m;while((m=re.exec(sec)))out.push([numT(m[1]),numT(m[2]||m[1])]);return out}
function secHas(p,num){const n=numT(num);return secRanges(p.section).some(([a,b])=>{
  if(n.length<a.length)return a.slice(0,n.length).join('.')===num||b.slice(0,n.length).join('.')===num;
  return cmpT(n.slice(0,a.length),a)>=0&&cmpT(n.slice(0,b.length),b)<=0})}
const CASE_STOP=new Set(['State','States','United','County','Los','Angeles','New','York','City','Washington','Tennessee','Kentucky','Ohio','Knock','King','Connor','Stuart','Harris','Rickard','Felix']);
function SX(){if(SXI)return SXI;const D=STUDY.data,cards=D.cards||[],pol=D.policy||[];
  const cases=(D.cases||[]).map(c=>{const kw=[...new Set((c.name.match(/\b[A-Z][a-z]{2,}\b/g)||[]).filter(w=>!CASE_STOP.has(w)))];if(/Kentucky v\. King/.test(c.name))kw.push('Kentucky v. King');return Object.assign({kw},c)});
  const polCards={};pol.forEach(p=>{polCards[p.id]=cards.filter(c=>c.source===p.source&&(c.section===p.section||(c.section.match(/\d+\.\d+(?:\.\d+)?/g)||[]).some(n=>secHas(p,n)))).map(c=>c.id)});
  return SXI={D,cards,pol,cases,polCards,sc:D.scenarios||[],oral:D.oral||[],sched:D.schedule||[],flags:D.flags||[],meta:D.meta||{},byCard:Object.fromEntries(cards.map(c=>[c.id,c]))}}
const SEC_RE=/(?:\b(?:MOS|FWPD|§§?|Standards?|ch\.)\s*)?\b((?:4|41|46)\.\d{1,2}(?:\.\d{1,2})?)\b/gi;
function polFor(num){return SX().pol.find(p=>secHas(p,num))}
function findRefs(text){const x=SX(),secs=new Map(),cs=new Map();let m;SEC_RE.lastIndex=0;
  while((m=SEC_RE.exec(text))){const num=m[1],explicit=/MOS|FWPD|§|Standard|ch\./i.test(m[0]);if(num.split('.').length<3&&!explicit)continue;const p=polFor(num);if(p&&!secs.has(p.id))secs.set(p.id,p)}
  x.cases.forEach(c=>{if(c.kw.some(k=>new RegExp('\\b'+k.replace(/\./g,'\\.')+'\\b').test(text)))cs.set(c.id,c)});
  const extra=new Set();(text.match(/RCW\s*\d+[A-Z]?\.\d+(?:\.\d+)?/g)||[]).forEach(r=>{const num=r.replace(/RCW\s*/,'');
    x.pol.forEach(p=>{if(p.title.includes(num)&&!secs.has(p.id))secs.set(p.id,p)});
    x.cards.forEach(k=>{if(k.section.includes(num))extra.add(k.id)})});
  return {secs:[...secs.values()],cases:[...cs.values()],extra:[...extra]}}
function linkify(text){if(!STUDY)return esc(text);const x=SX();let h=esc(text);
  h=h.replace(SEC_RE,(all,num)=>{const explicit=/MOS|FWPD|§|Standard|ch\./i.test(all);if(num.split('.').length<3&&!explicit)return all;const p=polFor(num);return p?`<button type="button" class="sx-ref" data-study="pol:${esc(p.id)}">${all}</button>`:all});
  return h}
const dueCount=ids=>{const t=todayIso();return ids.filter(id=>{const p=SP('fc|'+id);return p&&p.due<=t}).length};
function refChips(secs,cases,{max=8,extra=[]}={}){const x=SX();const chips=[];
  secs.slice(0,max).forEach(p=>chips.push(`<button type="button" class="sx-chip" style="--c:var(--t-policy)" data-study="pol:${esc(p.id)}">§ ${esc(p.section.split(' ')[0])}</button>`));
  cases.slice(0,max).forEach(c=>chips.push(`<button type="button" class="sx-chip" style="--c:var(--t-caselaw)" data-study="case:${esc(c.id)}">${esc(/^Knock/.test(c.name)?'Knock & announce':(c.kw[0]||c.name).slice(0,28))}</button>`));
  const ids=[...new Set(extra.concat(secs.flatMap(p=>x.polCards[p.id]||[]).concat(cases.flatMap(c=>x.cards.filter(k=>/caselaw/.test(k.source)&&c.kw.some(w=>k.section.includes(w)||k.q.includes(w))).map(k=>k.id)))))];
  if(ids.length)chips.push(`<button type="button" class="sx-chip sx-chip--go" data-study="drill:${ids.join(',')}">▶ ${ids.length} card${ids.length>1?'s':''}${dueCount(ids)?` · ${dueCount(ids)} due`:''}</button>`);
  return chips.join('')}
/* links shown on a plan block (day view card + drawer) */
function studyLinksFor(b){if(!['caselaw','policy'].includes(b.track))return '';
  if(!STUDY)return `<div class="sx-links"><button type="button" class="sx-chip sx-chip--lock" data-signin>🔒 Sign in to load linked study cards</button></div>`;
  let t=[b.title,b.short,b.note,...(b.items||[]).map(i=>i.text)].join(' ');
  if(b.ref){String(b.ref).split(';').forEach(r=>{const [k,v]=r.split(':');if(k==='policy'&&v){const p=R.policy.find(x=>x.id===v);if(p)t+=' '+p.title+' '+p.read.join(' ')}if(k==='case'&&v)v.split(',').forEach(id=>{const c=R.cases.find(x=>x.id===id);if(c)t+=' '+c.name})})}
  const {secs,cases,extra}=findRefs(t);if(!secs.length&&!cases.length&&!extra.length)return '';
  return `<div class="sx-links"><span class="sx-links__label">Study</span>${refChips(secs,cases,{extra})}</div>`}

/* ---- review engine (flashcards, case quizzes, quick 5) ---- */
const cardItem=c=>({key:'fc|'+c.id,id:c.id,kind:'fc',q:c.q,a:c.a,meta:`${SRC_LABEL[c.source]||c.source} · ${c.section} · ${c.difficulty}`,diff:c.difficulty});
const caseItem=c=>({key:'case|'+c.id,id:c.id,kind:'case',q:c.quiz,a:c.answer,meta:`${c.name} · ${c.cite}`});
function grade(it,ok){const t=todayIso();
  if(it.kind==='fc'){const p=SP(it.key)||{b:0,n:0,ok:0,miss:0};const b=ok?Math.min(5,(p.b||0)+1):1;
    SPut(it.key,{b,due:addD(t,FC_INT[b]),n:(p.n||0)+1,ok:(p.ok||0)+(ok?1:0),miss:(p.miss||0)+(ok?0:1),last:t})}
  else{const p=SP(it.key)||{n:0};SPut(it.key,{ok,n:(p.n||0)+1,last:t})}}
let fcSess=null,q5=null;
function newSess(items,title){return items.length?{items:items.slice(),i:0,shown:false,got:0,miss:0,again:new Set(),title}:null}
function sessStep(sess,ok){const it=sess.items[sess.i];grade(it,ok);if(ok)sess.got++;else{sess.miss++;if(!sess.again.has(it.key)){sess.again.add(it.key);sess.items.push(it)}}sess.i++;sess.shown=false}
function sessHtml(sess,{big=false}={}){if(sess.i>=sess.items.length){const tot=sess.got+sess.miss;
    return `<div class="sx-done"><div class="sx-done__big">${sess.got}<span>/${tot}</span></div><p class="muted">${esc(sess.title)} done. Missed cards come back tomorrow; the ones you got move up a box.</p>
      <div class="row" style="justify-content:center">${big?'<button class="btn btn--primary sx-big" data-q5="again">Another 5</button><button class="btn sx-big" data-q5="close">Done</button>':'<button class="btn btn--primary" data-sess="close">Back to deck</button>'}</div></div>`}
  const it=sess.items[sess.i],n=sess.items.length;
  return `<div class="sx-sess ${big?'sx-sess--big':''}"><div class="sx-sess__top"><span class="faint small mono">${sess.i+1} / ${n}</span><div class="sx-dots">${sess.items.map((_,k)=>`<i class="${k<sess.i?'is-done':k===sess.i?'is-on':''}"></i>`).join('')}</div>${big?'':'<button class="btn btn--sm btn--ghost" data-sess="close">End</button>'}</div>
    <div class="sx-flip ${sess.shown?'is-flipped':''}" ${sess.shown?'':`data-${big?'q5':'sess'}="show"`} role="button" tabindex="0" aria-label="${sess.shown?'Answer':'Show answer'}">
      <div class="sx-flip__face sx-flip__front"><div class="sx-flip__meta">${esc(it.meta)}</div><div class="sx-flip__q">${esc(it.q)}</div><div class="sx-flip__hint">Tap to show the answer</div></div>
      <div class="sx-flip__face sx-flip__back"><div class="sx-flip__meta">${esc(it.q)}</div><div class="sx-flip__a">${esc(it.a)}</div></div></div>
    <div class="sx-sess__act">${sess.shown?`<button class="btn sx-miss ${big?'sx-big':''}" data-${big?'q5':'sess'}="miss">✗ Missed it</button><button class="btn sx-got ${big?'sx-big':''}" data-${big?'q5':'sess'}="got">✓ Got it</button>`:`<button class="btn btn--primary ${big?'sx-big':''}" data-${big?'q5':'sess'}="show">Show answer</button>`}</div></div>`}
function deckFilter(){const src=S.ui.fcSrc||'all',dif=S.ui.fcDiff||'all';return SX().cards.filter(c=>(src==='all'||(src==='law'?/caselaw/.test(c.source):c.source===src))&&(dif==='all'||c.difficulty===dif))}
function deckStats(cards){const t=todayIso(),st={due:[],fresh:[],box:[0,0,0,0,0,0]};cards.forEach(c=>{const p=SP('fc|'+c.id);if(!p){st.fresh.push(c);st.box[0]++}else{st.box[p.b||1]++;if(p.due<=t)st.due.push(c)}});
  st.due.sort((a,b)=>SP('fc|'+a.id).due.localeCompare(SP('fc|'+b.id).due));return st}
/* Patrol quick 5: only cards you've already studied (no new law while driving), due first */
function pickQuick5(){const all=SX().cards,t=todayIso(),seen=all.filter(c=>SP('fc|'+c.id));
  const due=seen.filter(c=>SP('fc|'+c.id).due<=t).sort((a,b)=>SP('fc|'+a.id).due.localeCompare(SP('fc|'+b.id).due));
  const rest=seen.filter(c=>!due.includes(c)).sort((a,b)=>(SP('fc|'+a.id).b-SP('fc|'+b.id).b)||(SP('fc|'+a.id).last||'').localeCompare(SP('fc|'+b.id).last||''));
  let pick=due.concat(rest).slice(0,5);if(pick.length<5)pick=pick.concat(all.filter(c=>!SP('fc|'+c.id)&&c.difficulty==='easy').slice(0,5-pick.length));
  return pick.map(cardItem)}
function openQ5(){if(!STUDY){toast('Sign in to load study materials');return}q5=newSess(pickQuick5(),'Quick 5');if(!q5){toast('No cards yet');return}
  let el=$('#q5');if(!el){el=document.createElement('div');el.id='q5';el.className='sx-q5';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Patrol quick 5');document.body.appendChild(el)}
  drawQ5();requestAnimationFrame(()=>el.classList.add('is-open'));document.body.style.overflow='hidden'}
function drawQ5(){const el=$('#q5');if(!el||!q5)return;el.innerHTML=`<div class="sx-q5__bar"><b>⚡ Patrol quick 5</b><button class="btn sx-q5__x" data-q5="close" aria-label="Close">✕</button></div><div class="sx-q5__body">${sessHtml(q5,{big:true})}</div>`;const f=$('[data-q5="show"],[data-q5="got"],[data-q5="again"]',el);f&&f.focus({preventScroll:true})}
function closeQ5(){const el=$('#q5');if(!el)return;el.classList.remove('is-open');document.body.style.overflow='';q5=null;setTimeout(()=>{if(!q5&&el.parentNode)el.remove()},300);if(S.ui.view==='study'||S.ui.view==='day')rerender()}

/* ---- tab bodies ---- */
const sxList=a=>a&&a.length?`<ul class="sx-ul">${a.map(x=>`<li>${linkify(x)}</li>`).join('')}</ul>`:'';
const sevTag=s=>`<span class="tag" style="--c:${s==='high'?'var(--danger,#f87171)':s==='medium'?'var(--t-firearms)':'var(--text-3)'}">${esc(s)}</span>`;
const curWeek=(date)=>{const w=SX().sched,d=date||todayIso();return w.find(x=>{const [a,b]=x.dates.split(' to ');return d>=a&&d<=b})||(d<w[0].dates.slice(0,10)?w[0]:w[w.length-1])};
function studyGate(){const sync=SYNC.status(),m=studyState;
  if(!SYNC.configured)return `<div class="card sx-gate"><div class="sx-gate__icon">🔒</div><h2>Study materials need sync</h2><p class="muted">config.js has no Supabase project, so there's nowhere to load them from.</p></div>`;
  if(m==='loading'||(sync.mode==='syncing'&&m!=='error'&&SYNC.db()))return `<div class="card sx-gate"><div class="sx-spin" aria-hidden="true"></div><h2>Loading study materials…</h2><p class="muted">First load only. After this they're saved on this device for offline use.</p><div class="sx-skel"><i></i><i></i><i></i></div></div>`;
  if(m==='denied'||sync.mode==='denied')return `<div class="card sx-gate"><div class="sx-gate__icon">⛔</div><h2>This login isn't allowed</h2><p class="muted">${esc(sync.email||'This email')} isn't on the allowlist, so the study materials stay locked.</p></div>`;
  if(m==='error')return `<div class="card sx-gate"><div class="sx-gate__icon">⚠️</div><h2>Couldn't load study materials</h2><p class="muted">${esc(studyErr)}</p><button class="btn btn--primary" data-sxretry>Try again</button></div>`;
  if(m==='empty')return `<div class="card sx-gate"><div class="sx-gate__icon">📭</div><h2>No study materials in the database yet</h2></div>`;
  if(sync.mode==='offline'&&sync.email)return `<div class="card sx-gate"><div class="sx-gate__icon">📡</div><h2>Offline</h2><p class="muted">You're signed in, but the study materials haven't been saved to this device yet. They'll load as soon as you have signal.</p></div>`;
  return `<div class="card sx-gate"><div class="sx-gate__icon">🔒</div><h2>Sign in to load study materials</h2><p class="muted">Policy outlines, flashcards, scenarios and oral-board prep come from department documents, so they're kept private and only load for your login. After the first load they're saved on this device, so they work in the car without signal.</p><button class="btn btn--primary" data-signin>Sign in to sync</button></div>`}

function sxToday(){const x=SX(),w=curWeek(),done=!!SP('wk|'+w.week),st=deckStats(x.cards),open=x.flags.filter(f=>!SP('flag|'+f.id));
  const d=dayObj(todayIso()),blocks=d?d.blocks.filter(b=>['caselaw','policy'].includes(b.track)&&b.status!=='skipped'):[];
  return `<div class="grid grid-2">
   <div class="card sx-hero"><div class="eyebrow">Week ${w.week} of ${x.sched.length} · ${esc(fmtRange(w.dates))}</div><h2 class="sx-hero__t">${linkify(w.theme)}</h2><p class="faint small">${esc(w.shift)}</p>${sxList(w.focus)}
     <div class="callout callout--info mt-4"><b>Daily rhythm.</b> ${linkify(w.daily)}</div>
     <label class="check mt-4"><input type="checkbox" data-sxk="wk|${w.week}" ${done?'checked':''}><span class="check__box">${CHECK_SVG}</span><span class="check__text"><b>Week output:</b> ${linkify(w.output)}</span></label></div>
   <div class="stack">
     <div class="card"><div class="card__title">Flashcards</div><div class="sx-kpis"><div><b>${st.due.length}</b><span>due today</span></div><div><b>${st.fresh.length}</b><span>new</span></div><div><b>${st.box[5]}</b><span>mastered</span></div></div>${boxBar(st)}
       <div class="row mt-4"><button class="btn btn--primary" data-sxgo="due" ${st.due.length?'':'disabled'}>Review ${st.due.length} due</button><button class="btn" data-sxgo="new">Learn 10 new</button><button class="btn" data-quick5>⚡ Quick 5</button></div></div>
     ${blocks.length?`<div class="card"><div class="card__title">Today's study blocks</div>${blocks.map(b=>`<div class="sx-blk"><button class="sx-blk__t" data-sxblock="${esc(b.bid)}"><span class="mono faint">${b.start}</span> ${esc(b.title)}</button>${studyLinksFor(b)}</div>`).join('')}</div>`:''}
     <div class="card"><div class="card__title">To verify</div><p class="muted small">${open.length} of ${x.flags.length} gaps still open${open.filter(f=>f.severity==='high').length?`, ${open.filter(f=>f.severity==='high').length} high`:''}.</p><button class="btn btn--sm" data-sxtab="verify">Open the list</button></div>
   </div></div>`}
const fmtRange=r=>{const [a,b]=r.split(' to ');return fmtD(a)+' – '+fmtD(b)};
function boxBar(st){const tot=st.box.reduce((a,b)=>a+b,0)||1,cols=['var(--text-3)','#f87171','#fb923c','#fbbf24','#a3e635','var(--ok,#4ade80)'];
  return `<div class="sx-boxes" title="Leitner boxes">${st.box.map((n,i)=>n?`<i style="flex:${n};background:${cols[i]}" title="${i?'Box '+i:'New'}: ${n}"></i>`:'').join('')}</div><div class="sx-boxes__leg faint small">${st.box.map((n,i)=>`<span><i style="background:${cols[i]}"></i>${i?'Box '+i:'New'} ${n}</span>`).join('')}</div>`}

function sxPolicy(){const x=SX(),ch=S.ui.studyCh||'all',q=S.ui.studyQ||'';
  const chs=[['all','All',x.pol.length],...['fwpd-ch4','fwpd-ch41','fwpd-ch46'].map(k=>[k,SRC_LABEL[k],x.pol.filter(p=>p.source===k).length])];
  const srcs=(x.meta.sources||[]).filter(s=>/^fwpd/.test(s.id));
  return `<div class="sx-srcs">${srcs.map(s=>`<span class="sx-src"><b>${esc(SRC_LABEL[s.id]||s.id)}</b> rev. ${esc(s.revision_date||'?')}</span>`).join('')}</div>
   <div class="sx-tools">${tabsHtml('sxch',chs.map(([k,l,n])=>({key:k,html:`${esc(l)}<span class="tab__meta">${n}</span>`})),ch,{pill:true,label:'Chapter'})}
     <label class="sx-search"><span class="sr-only">Search policy</span><input class="input" type="search" id="sxQ" placeholder="Search rules, sections, words…" value="${esc(q)}" autocomplete="off"></label></div>
   <p class="faint small" id="sxCount"></p>
   <div id="sxPol">${x.pol.filter(p=>ch==='all'||p.source===ch).map(p=>{const n=(x.polCards[p.id]||[]).length;
     return `<div class="sx-item" id="sx-${esc(p.id)}" data-text="${esc([p.section,p.title,p.summary,...p.key_rules,...p.citations,p.swat_relevance].join(' ').toLowerCase())}">${acc(`<span class="sx-sec mono">§ ${esc(p.section)}</span> ${esc(p.title)}`,
       `<p>${linkify(p.summary)}</p><h4 class="sx-h">Key rules</h4>${sxList(p.key_rules)}${p.thresholds&&p.thresholds.length?`<h4 class="sx-h">Thresholds</h4>${sxList(p.thresholds)}`:''}
        <div class="callout callout--info"><b>SWAT relevance.</b> ${linkify(p.swat_relevance)}</div>
        ${p.oral_board&&p.oral_board.length?`<h4 class="sx-h">Board questions</h4>${sxList(p.oral_board)}`:''}
        ${(p.flags||[]).map(f=>`<div class="callout callout--warn">⚑ ${linkify(f)}</div>`).join('')}
        <div class="sx-cites">${p.citations.map(c=>`<span class="sx-cite">${esc(c)}</span>`).join('')}</div>
        ${n?`<div class="row mt-4"><button class="btn btn--sm" data-study="drill:${(x.polCards[p.id]||[]).join(',')}">▶ Drill ${n} card${n>1?'s':''}${dueCount(x.polCards[p.id])?` · ${dueCount(x.polCards[p.id])} due`:''}</button></div>`:''}`,
       {id:'p-'+p.id,sub:`${esc(SRC_LABEL[p.source])}${n?` · ${n} cards`:''}${(p.flags||[]).length?' · ⚑':''}`,c:'var(--t-policy)'})}</div>`}).join('')}</div>`}
function filterPolicy(){const q=(S.ui.studyQ||'').trim().toLowerCase(),words=q.split(/\s+/).filter(Boolean);let n=0;
  $$('#sxPol .sx-item').forEach(el=>{const ok=words.every(w=>el.dataset.text.includes(w));el.hidden=!ok;if(ok)n++;if(words.length&&ok)$('details',el).open=true});
  const c=$('#sxCount');if(c)c.textContent=words.length?`${n} section${n===1?'':'s'} match “${q}”`:''}

function sxCards(){const cards=deckFilter(),st=deckStats(cards);
  if(fcSess)return `<div class="card sx-sesscard"><div class="eyebrow mb-4">${esc(fcSess.title)}</div>${sessHtml(fcSess)}</div>`;
  return `<div class="sx-tools"><label class="field">Source<select class="select" id="fcSrc">${FC_SRC.map(([k,l])=>`<option value="${k}" ${k===(S.ui.fcSrc||'all')?'selected':''}>${l}</option>`).join('')}</select></label>
     <label class="field">Difficulty<select class="select" id="fcDiff">${[['all','All'],['easy','Easy'],['medium','Medium'],['hard','Hard']].map(([k,l])=>`<option value="${k}" ${k===(S.ui.fcDiff||'all')?'selected':''}>${l}</option>`).join('')}</select></label></div>
   <div class="card"><div class="sx-kpis"><div><b>${cards.length}</b><span>cards</span></div><div><b>${st.due.length}</b><span>due today</span></div><div><b>${st.fresh.length}</b><span>new</span></div><div><b>${st.box[5]}</b><span>mastered</span></div></div>${boxBar(st)}
     <div class="row mt-4"><button class="btn btn--primary" data-sxgo="due" ${st.due.length?'':'disabled'}>Review ${st.due.length} due</button><button class="btn" data-sxgo="new" ${st.fresh.length?'':'disabled'}>Learn ${Math.min(10,st.fresh.length)} new</button><button class="btn" data-sxgo="all">Run all ${cards.length}</button><button class="btn" data-quick5>⚡ Patrol quick 5</button></div>
     <p class="faint small mt-3">Leitner boxes: a card you get moves up a box and comes back later (1, 2, 4, 8, then 16 days). A miss sends it back to box 1 for tomorrow. Quick 5 only uses cards you've already studied, since new law shouldn't be learned in the car.</p></div>
   ${acc(`Browse ${cards.length} cards`,`<div class="sx-browse">${cards.map(c=>{const p=SP('fc|'+c.id);return `<div class="sx-bc"><div class="sx-bc__q">${esc(c.q)}</div><div class="reveal" tabindex="0">${esc(c.a)}</div><div class="faint small">${esc(SRC_LABEL[c.source]||c.source)} · ${esc(c.section)} · ${c.difficulty}${p?` · box ${p.b}, next ${fmtD(p.due)}`:' · new'}</div></div>`}).join('')}</div>`,{id:'browse',cls:'acc--quiet'})}`}

const RATE=[['nailed','Nailed it','var(--ok,#4ade80)'],['partial','Partly','var(--t-firearms)'],['missed','Missed','#f87171']];
function sxScen(){const x=SX(),id=x.sc.some(s=>s.id===S.ui.scId)?S.ui.scId:x.sc[0].id,s=x.sc.find(z=>z.id===id),n=s.decision_points.length;
  S.ui.scStep=S.ui.scStep||{};const step=Math.min(S.ui.scStep[id]||0,n+1),rec=SP('sc|'+id)||{},notes=rec.notes||{};const rated=x.sc.filter(z=>(SP('sc|'+z.id)||{}).rating).length;
  const dots=Array.from({length:n+2},(_,i)=>`<button type="button" class="sx-step ${i<step?'is-done':''} ${i===step?'is-on':''}" data-scstep="${i}" aria-label="${i===0?'Setting':i<=n?'Decision '+i:'Model answer'}">${i===0?'◎':i<=n?i:'★'}</button>`).join('<i class="sx-step__line"></i>');
  let body;
  if(step===0)body=`<div class="eyebrow">The call</div><p class="sx-scen__set">${esc(s.setting)}</p><p class="faint small">${n} decision points. Answer each out loud or in a few words before you reveal the model answer.</p>`;
  else if(step<=n)body=`<div class="eyebrow">Decision ${step} of ${n}</div><h3 class="sx-scen__q">${esc(s.decision_points[step-1])}</h3>
      <label class="field mt-4">Your call<textarea class="input" rows="3" data-scnote="${esc(id)}" data-i="${step-1}" placeholder="What do you do, and under what authority?">${esc(notes[step-1]||'')}</textarea></label>`;
  else body=`<div class="eyebrow">Model answer</div><div class="sx-model reveal ${rec.rating?'is-shown':''}" tabindex="0">${linkify(s.model_answer)}</div>
      <div class="sx-cites mt-4">${s.citations.map(c=>`<span class="sx-cite">${linkify(c)}</span>`).join('')}</div>
      <div class="callout callout--info mt-4"><b>Oral-board hook.</b> ${linkify(s.oral_board_hook)}</div>
      <div class="mt-5"><div class="faint small mb-2">How did you do?</div><div class="sx-rate">${RATE.map(([k,l,c])=>`<button type="button" class="sx-rate__b ${rec.rating===k?'is-on':''}" style="--c:${c}" data-scrate="${k}">${l}</button>`).join('')}</div></div>`;
  return `<div class="sx-tools"><label class="field" style="flex:1">Scenario<select class="select" id="scSel">${x.sc.map((z,i)=>{const r=(SP('sc|'+z.id)||{}).rating;return `<option value="${z.id}" ${z.id===id?'selected':''}>${i+1}. ${esc(z.title)}${r?' · '+RATE.find(q=>q[0]===r)[1]:''}</option>`}).join('')}</select></label><span class="faint small">${rated} of ${x.sc.length} rated</span></div>
   <div class="card sx-scen"><h2 class="sx-scen__title">${esc(s.title)}</h2><div class="sx-steps">${dots}</div><div class="sx-scen__body" key="${step}">${body}</div>
     <div class="row sx-scen__nav"><button class="btn" data-scnav="-1" ${step===0?'disabled':''}>← Back</button><span style="flex:1"></span>${step<=n?`<button class="btn btn--primary" data-scnav="1">${step===n?'Model answer →':'Next →'}</button>`:`<button class="btn btn--primary" data-scnext>Next scenario →</button>`}</div></div>`}

function sxCases(){const x=SX(),got=x.cases.filter(c=>(SP('case|'+c.id)||{}).ok).length;
  return `<div class="row mb-4"><button class="btn btn--primary" data-sxgo="cases">Quiz all ${x.cases.length}</button><span class="faint small">${got} of ${x.cases.length} answered right last time</span></div>
  ${x.cases.map(c=>{const r=SP('case|'+c.id);return `<div class="sx-item" id="sx-${esc(c.id)}">${acc(`${esc(c.name)}${r?` <span class="sx-res ${r.ok?'is-ok':'is-miss'}">${r.ok?'✓':'✗'}</span>`:''}`,
    `<div class="faint small mono">${esc(c.cite)}</div><p class="faint small">${esc(c.verified)}</p><p><b>Holding.</b> ${esc(c.holding)}</p>${c.factors&&c.factors.length?`<h4 class="sx-h">Factors / rules</h4>${sxList(c.factors)}`:''}
     <div class="callout callout--info"><b>For SWAT.</b> ${linkify(c.swat)}</div>
     <div class="quiz"><b>Quiz.</b> ${esc(c.quiz)}<div class="reveal" tabindex="0">${esc(c.answer)}</div><div class="row mt-3"><button class="btn btn--sm sx-miss" data-casegrade="${esc(c.id)}|0">✗ Missed</button><button class="btn btn--sm sx-got" data-casegrade="${esc(c.id)}|1">✓ Got it</button></div></div>
     <div class="sx-cites mt-3">${(c.citations||[]).map(z=>`<span class="sx-cite">${esc(z)}</span>`).join('')}</div>`,
    {id:'c-'+c.id,sub:esc(c.cite),c:'var(--t-caselaw)'})}</div>`}).join('')}`}

function sxOral(){const x=SX();let filled=0,tot=0;
  const h=x.oral.map((o,i)=>{const r=SP('oral|'+o.id)||{},f=r.f||{};tot+=o.placeholders.length;const nf=o.placeholders.filter((_,k)=>(f[k]||'').trim()).length;filled+=nf;
    return `<div class="sx-item" id="sx-${esc(o.id)}">${acc(`<span class="sx-sec mono">${i+1}</span> ${esc(o.question)}`,
      `<div class="eyebrow">${esc(o.topic)}</div><div class="sx-frame">${linkify(o.framework)}</div>
       <div class="sx-cites mt-3">${o.policy_hooks.map(z=>`<span class="sx-cite">${linkify(z)}</span>`).join('')}</div>
       <h4 class="sx-h">Your examples <span class="faint small" style="font-weight:400">(synced)</span></h4>
       ${o.placeholders.map((p,k)=>`<label class="field">${esc(p.replace(/^\[|\]$/g,''))}<textarea class="input" rows="2" data-oral="${esc(o.id)}" data-f="${k}">${esc(f[k]||'')}</textarea></label>`).join('')}
       <label class="field">Your answer, in bullets<textarea class="input" rows="4" data-oral="${esc(o.id)}" data-f="ans" placeholder="Opening line · 3 points · close">${esc(f.ans||'')}</textarea></label>
       <div class="row mt-3"><button class="btn btn--sm" data-timer="120">⏱ 2-minute practice</button><span class="mono faint" data-timerout></span><span class="sx-saved faint small" data-saved="${esc(o.id)}"></span></div>`,
      {id:'o-'+o.id,sub:`${esc(o.topic)} · ${nf}/${o.placeholders.length} examples`,c:'var(--t-app)'})}</div>`}).join('');
  return `<p class="muted">Each framework gives you the structure; fill in your own examples so the answer is yours. Everything you type syncs between your devices.</p><div class="sx-prog mb-4">${bar(tot?Math.round(100*filled/tot):0,'var(--t-app)')}<span class="faint small mono">${filled}/${tot} examples</span></div>${h}`}

function sxPlan(){const x=SX(),cur=curWeek(),t=todayIso();
  return `<div class="sx-weeks">${x.sched.map(w=>{const done=!!SP('wk|'+w.week),past=w.dates.split(' to ')[1]<t,on=w===cur;
    return `<div class="sx-week ${on?'is-now':''} ${past?'is-past':''}" id="sx-wk${w.week}"><div class="sx-week__n">${done?'✓':w.week}</div><div class="sx-week__b">${acc(`${esc(w.theme)}${on?' <span class="tag tag--ok">This week</span>':''}`,
      `<p class="faint small">${esc(w.shift)}</p>${sxList(w.focus)}<div class="callout callout--info"><b>Daily.</b> ${linkify(w.daily)}</div>
       <label class="check mt-3"><input type="checkbox" data-sxk="wk|${w.week}" ${done?'checked':''}><span class="check__box">${CHECK_SVG}</span><span class="check__text"><b>Output:</b> ${linkify(w.output)}</span></label>`,
      {id:'w-'+w.week,open:on,sub:`Week ${w.week} · ${esc(fmtRange(w.dates))}`})}</div></div>`}).join('')}</div>`}

function sxVerify(){const x=SX(),all=S.ui.flagAll!==false,ord={high:0,medium:1,low:2};const L=x.flags.slice().sort((a,b)=>ord[a.severity]-ord[b.severity]);const done=L.filter(f=>SP('flag|'+f.id)).length;
  return `<div class="sx-tools"><div><b>${done} of ${L.length}</b> <span class="muted">verified</span></div>${tabsHtml('sxflag',[{key:'open',label:'Open'},{key:'all',label:'All'}],all?'all':'open',{pill:true,label:'Show'})}</div>
   <div class="sx-prog mb-4">${bar(Math.round(100*done/L.length),'var(--ok,#4ade80)')}</div>
   <ul class="checklist sx-flags">${L.filter(f=>all||!SP('flag|'+f.id)).map(f=>`<li><label class="check"><input type="checkbox" data-sxk="flag|${esc(f.id)}" ${SP('flag|'+f.id)?'checked':''}><span class="check__box">${CHECK_SVG}</span><span class="check__text">${sevTag(f.severity)} ${linkify(f.item)}<span class="sx-rec">${linkify(f.recommendation)}</span></span></label></li>`).join('')||'<li class="empty">All verified.</li>'}</ul>`}

/* ---- view ---- */
const SXB={today:sxToday,policy:sxPolicy,cards:sxCards,scen:sxScen,cases:sxCases,oral:sxOral,plan:sxPlan,verify:sxVerify};
function renderStudy(){const tab=stTab();S.ui.studyTab=tab;
  const st=STUDY?deckStats(SX().cards):null,open=STUDY?SX().flags.filter(f=>!SP('flag|'+f.id)).length:0;
  const meta=STUDY?SX().meta.meta||{}:{};
  const tabs=STUDY_TABS.map(([k,l])=>({key:k,html:esc(l)+(k==='cards'&&st&&st.due.length?`<span class="tab__meta">${st.due.length}</span>`:k==='verify'&&STUDY?`<span class="tab__meta">${open}</span>`:'')}));
  $('#main').innerHTML=`<section class="view sx"><div class="page-head"><div><div class="eyebrow">${STUDY?`Policy · flashcards · scenarios · oral board`:'Private study materials'}</div><h1>Study</h1></div>
    <div class="row">${STUDY?`<span class="faint small sx-offline" title="Saved on this device ${esc((STUDY.at||'').slice(0,10))}">● Saved for offline</span>`:''}<button class="btn sx-q5btn" data-quick5 ${STUDY?'':'disabled'}>⚡ Patrol quick 5</button></div></div>
    <div class="mb-5 sx-tabsrow">${tabsHtml('study',tabs,tab,{label:'Study sections'})}</div>
    <div class="sx-body" key="${tab}">${STUDY?SXB[tab]():studyGate()}</div></section>`;
  bindTabs($('#main'),(id,k)=>{clearTimeout(scrollT);
    if(id==='study'){S.ui.studyTab=k;fcSess=fcSess&&k==='cards'?fcSess:null;save();renderStudy();restoreScroll()}
    else if(id==='sxch'){S.ui.studyCh=k;save();renderStudy();restoreScroll()}
    else if(id==='sxflag'){S.ui.flagAll=k==='all';save();renderStudy()}});
  const q=$('#sxQ');if(q){q.oninput=()=>{S.ui.studyQ=q.value;save();filterPolicy()};filterPolicy()}
  const a=$('#fcSrc'),b=$('#fcDiff');if(a)a.onchange=()=>{S.ui.fcSrc=a.value;save();renderStudy()};if(b)b.onchange=()=>{S.ui.fcDiff=b.value;save();renderStudy()};
  const sc=$('#scSel');if(sc)sc.onchange=()=>{S.ui.scId=sc.value;save();renderStudy();window.scrollTo({top:0})};
  animateIn($('#main'));
  if(S.ui.studyFocus){const f=S.ui.studyFocus;S.ui.studyFocus=null;save();requestAnimationFrame(()=>{const el=document.getElementById('sx-'+f);if(!el)return;el.hidden=false;const d=$('details',el);if(d)d.open=true;
    el.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'});el.classList.add('sx-flash');setTimeout(()=>el.classList.remove('sx-flash'),1600)})}}
function studyGo(tab,extra){if($('#drawer').classList.contains('is-open'))closeDrawer(true);Object.assign(S.ui,{studyTab:tab},extra||{});S.ui.scroll['study:'+tab]=0;go('study')}
function startSess(items,title){fcSess=newSess(items,title);if(!fcSess){toast('Nothing to review');return}studyGo('cards')}
/* ---- events ---- */
document.addEventListener('click',e=>{const t=e.target;let el;
  if(t.closest('[data-signin]')){e.preventDefault();const p=$('#syncHost .sync__pill');if(p){p.click();scrollTo({top:0,behavior:'smooth'})}return}
  if(t.closest('[data-quick5]')){openQ5();return}
  if(t.closest('[data-sxretry]')){studyState='loading';rerender();loadStudy(true);return}
  if((el=t.closest('[data-q5]'))){const a=el.dataset.q5;if(a==='close')return closeQ5();if(a==='again'){q5=newSess(pickQuick5(),'Quick 5');return drawQ5()}
    if(!q5)return;if(a==='show')q5.shown=true;else if(a==='got'||a==='miss')sessStep(q5,a==='got');drawQ5();return}
  if((el=t.closest('[data-sess]'))&&fcSess){const a=el.dataset.sess;if(a==='close'){fcSess=null;return rerender()}
    if(a==='show')fcSess.shown=true;else sessStep(fcSess,a==='got');const y=scrollY;renderStudy();scrollTo(0,y);return}
  if(!STUDY)return;
  if((el=t.closest('[data-study]'))){e.preventDefault();const [k,v]=[el.dataset.study.slice(0,el.dataset.study.indexOf(':')),el.dataset.study.slice(el.dataset.study.indexOf(':')+1)];
    if(k==='pol'){const p=SX().pol.find(z=>z.id===v);if(!p)return;return studyGo('policy',{studyCh:'all',studyQ:'',studyFocus:v})}
    if(k==='case')return studyGo('cases',{studyFocus:v});
    if(k==='drill'){const items=v.split(',').map(id=>SX().byCard[id]).filter(Boolean).map(cardItem);return startSess(items,`Drill: ${items.length} linked cards`)}
    return}
  if((el=t.closest('[data-sxtab]')))return studyGo(el.dataset.sxtab);
  if((el=t.closest('[data-sxblock]'))){openDrawer(el.dataset.sxblock,el);return}
  if((el=t.closest('[data-sxgo]'))){const k=el.dataset.sxgo,cards=S.ui.view==='study'&&stTab()==='cards'?deckFilter():SX().cards,st=deckStats(cards);
    if(k==='due')return startSess(st.due.map(cardItem),`Review: ${st.due.length} due`);
    if(k==='new'){const f=st.fresh.slice(0,10);return startSess(f.map(cardItem),`Learn: ${f.length} new`)}
    if(k==='all')return startSess(cards.map(cardItem),`Run all ${cards.length}`);
    if(k==='cases')return startSess(SX().cases.map(caseItem),'Case-law quiz');return}
  if((el=t.closest('[data-casegrade]'))){const [id,ok]=el.dataset.casegrade.split('|');grade({kind:'case',key:'case|'+id},ok==='1');toast(ok==='1'?'Nice':'Logged, review it again');rerender();return}
  if((el=t.closest('[data-scstep]'))){const id=stScId();S.ui.scStep=S.ui.scStep||{};S.ui.scStep[id]=+el.dataset.scstep;save();renderStudy();return}
  if((el=t.closest('[data-scnav]'))){const id=stScId();S.ui.scStep=S.ui.scStep||{};S.ui.scStep[id]=Math.max(0,(S.ui.scStep[id]||0)+(+el.dataset.scnav));save();renderStudy();return}
  if(t.closest('[data-scnext]')){const L=SX().sc,i=L.findIndex(z=>z.id===stScId());S.ui.scId=L[(i+1)%L.length].id;save();renderStudy();scrollTo({top:0});return}
  if((el=t.closest('[data-scrate]'))){const id=stScId(),r=SP('sc|'+id)||{};SPut('sc|'+id,Object.assign({},r,{rating:el.dataset.scrate,at:todayIso()}));renderStudy();toast('Rated');return}
  if((el=t.closest('[data-timer]'))){runTimer(el);return}});
const stScId=()=>{const L=SX().sc;return L.some(s=>s.id===S.ui.scId)?S.ui.scId:L[0].id};
document.addEventListener('keydown',e=>{if(q5&&$('#q5')){if(e.key==='Escape')return closeQ5();if(e.target.matches&&e.target.matches('input,textarea'))return;
    if(!q5.shown&&(e.key===' '||e.key==='Enter')&&q5.i<q5.items.length){e.preventDefault();q5.shown=true;drawQ5()}else if(q5.shown&&(e.key==='1'||e.key==='2')){sessStep(q5,e.key==='2');drawQ5()}return}
  if(S.ui.view==='study'&&fcSess&&stTab()==='cards'&&!(e.target.matches&&e.target.matches('input,textarea,select'))&&fcSess.i<fcSess.items.length){
    if(!fcSess.shown&&(e.key===' '||e.key==='Enter')){e.preventDefault();fcSess.shown=true;renderStudy()}else if(fcSess.shown&&(e.key==='1'||e.key==='2')){sessStep(fcSess,e.key==='2');renderStudy()}}});
document.addEventListener('change',e=>{const t=e.target;if(t.matches('input[data-sxk]')){SPut(t.dataset.sxk,t.checked?{done:true,at:todayIso()}:null);
  if(S.ui.view==='study'&&stTab()==='verify')setTimeout(rerender,S.ui.flagAll===false&&t.checked?380:0)}});
let oralT={};
document.addEventListener('input',e=>{const t=e.target;
  if(t.matches('textarea[data-oral]')){const id=t.dataset.oral;clearTimeout(oralT[id]);oralT[id]=setTimeout(()=>{const r=SP('oral|'+id)||{},f=Object.assign({},r.f||{});
      $$(`textarea[data-oral="${CSS.escape(id)}"]`).forEach(x=>{f[x.dataset.f]=x.value});SPut('oral|'+id,{f,at:new Date().toISOString()});const s=$(`[data-saved="${CSS.escape(id)}"]`);if(s){s.textContent='Saved ✓';setTimeout(()=>s.textContent='',1200)}},600)}
  if(t.matches('textarea[data-scnote]')){const id=t.dataset.scnote;clearTimeout(oralT['sc'+id]);oralT['sc'+id]=setTimeout(()=>{const r=SP('sc|'+id)||{},notes=Object.assign({},r.notes||{});notes[t.dataset.i]=t.value;SPut('sc|'+id,Object.assign({},r,{notes}))},600)}});
function runTimer(btn){const out=btn.parentNode.querySelector('[data-timerout]');if(btn._iv){clearInterval(btn._iv);btn._iv=null;btn.textContent='⏱ 2-minute practice';out.textContent='';return}
  let s=+btn.dataset.timer;btn.textContent='■ Stop';const tick=()=>{out.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;out.classList.toggle('is-low',s<=15);if(s--<=0){clearInterval(btn._iv);btn._iv=null;btn.textContent='⏱ 2-minute practice';out.textContent='Time';if(navigator.vibrate)navigator.vibrate(200)}};tick();btn._iv=setInterval(tick,1000)}
/* compact card for the day view */
function studyDayCard(date){if(!STUDY)return SYNC.configured?`<div class="card sx-mini sx-mini--lock"><span>📚 Study materials are locked on this device.</span><button class="btn btn--sm" data-signin>Sign in</button></div>`:'';
  const w=curWeek(date),st=deckStats(SX().cards);
  return `<div class="card sx-mini"><div class="sx-mini__t"><div class="eyebrow">Study · week ${w.week}</div><b>${linkify(w.theme)}</b></div>
    <div class="row"><button class="btn btn--sm btn--primary" data-sxgo="due" ${st.due.length?'':'disabled'}>${st.due.length} due</button><button class="btn btn--sm" data-quick5>⚡ Quick 5</button><button class="btn btn--sm" data-sxtab="today">Open study</button></div></div>`}
