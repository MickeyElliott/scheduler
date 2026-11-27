#!/usr/bin/env python3
"""Build the standalone Daily Study PWA into ../study/.

Inputs
  build-src/study_app/rcw.py, rcw_text/*.txt   RCW notes + official text (public law)
  build-src/study_app/cases_new.py              added case law
  $STUDY_SRC (default /workspace/swat-study)    MOS extracts + study notes. Not in the repo:
      study-data.json, source-extracts/doc*.pdf.txt, source-extracts/sections/*
Outputs: study/index.html, study/data.json, study/sw.js, study/manifest.webmanifest
"""
import json, os, re, sys, hashlib, copy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'study_app'))
from rcw import RCW, VERIFIED as RCW_VERIFIED
from cases_new import CASES as NEW_CASES
SRC = os.environ.get('STUDY_SRC', '/workspace/swat-study')
OUT = os.path.join(HERE, '..', 'study')
os.makedirs(OUT, exist_ok=True)
D = json.load(open(os.path.join(SRC, 'study-data.json')))
SEC = os.path.join(SRC, 'source-extracts', 'sections')

def scrub(s):
    if isinstance(s, str):
        s = s.replace('Restated from the Week 1 plan', 'Restated from earlier study notes')
        s = re.sub(r'\bthe (existing |original )?Week ?1 (plan|PowerDMS (pull )?list|study notes|materials)', 'earlier study notes', s)
        s = re.sub(r'\bWeek ?[12] ', 'earlier ', s)
        s = s.replace('Mickey', 'you')
        return s
    if isinstance(s, list): return [scrub(x) for x in s]
    if isinstance(s, dict): return {k: scrub(v) for k, v in s.items()}
    return s

# ---------------- MOS verbatim ----------------
CHAPTERS = [
  dict(ch='4', title='Use of Force', eff='08-23-2018', rev='05-18-2026', doc='doc1'),
  dict(ch='41', title='Patrol', eff='01-01-2002', rev='12-08-2025', doc='doc2'),
  dict(ch='46', title='Critical Incidents, Special Operations and Homeland Security', eff='01-01-2002', rev='03-17-2025', doc='doc3'),
]
INCOMPLETE = {
  '46.2.2': 'The provided text ends mid-sentence at B.3 ("a review by the Chief of the pre-employment psychological"). The rest is not in the source document; check PowerDMS.',
  '46.2.4': 'The provided text ends mid-sentence at B.1 ("a review by the Chief of the pre-employment psychological"). The rest is not in the source document; check PowerDMS.',
}
HDR = re.compile(r'^\s*Federal Way Police Department\s+Chapter\s*#\s*\d+\s*$')
FTR = re.compile(r'^\s*Effective Date:.*Revision Date:.*$')
PGN = re.compile(r'^\s*\d{1,3}\s*$')
MARK = re.compile(r'^(•|·|▪|-\s|–\s|\(?[0-9]{1,2}[.)]\s|\(?[A-Za-z][.)]\s|\([a-z0-9]{1,4}\)\s|[ivxIVX]{1,5}[.)]\s|Principle:|Practice:|Procedure:|Policy:|Purpose:|Note:|NOTE:|Definitions?:|\d+\.\d+(\.\d+)?\s)')

def clean(raw):
    lines = [l.rstrip() for l in raw.split('\n')]
    lines = [l for l in lines if not (HDR.match(l) or FTR.match(l) or PGN.match(l))]
    lines = [re.sub(r'\s{3,}\d{1,3}$', '', l) for l in lines]           # stray trailing page numbers
    paras, cur = [], None
    for l in lines:
        if not l.strip():
            if cur: paras.append(cur); cur = None
            continue
        ind = len(l) - len(l.lstrip()); t = l.strip()
        t = re.sub(r'^(•|·|▪|\(?[0-9A-Za-z]{1,4}[.)])\s{2,}', r'\1 ', t)   # "A.        Text" -> "A. Text"
        t = re.sub(r'^(Principle:|Practice:|Procedure:|Policy:|Purpose:)\s{2,}', r'\1 ', t)
        t = re.sub(r'(?<=\S) {3,}(?=\S)', '   ', t)
        if cur and not MARK.match(t) and not (cur['t'].endswith(':') and len(cur['t']) < 70):
            cur['t'] += ' ' + t
        else:
            if cur: paras.append(cur)
            cur = {'i': ind, 't': t}
    if cur: paras.append(cur)
    out = []                                                            # rejoin paragraphs split by a page break
    for p in paras:
        if out and not re.search(r'[.:;?!)"”]$', out[-1]['t']) and re.match(r'^[a-z(]', p['t']) and not MARK.match(p['t']):
            out[-1]['t'] += ' ' + p['t']
        else: out.append(p)
    if not out: return []
    base = min(p['i'] for p in out)
    return [[min(3, (p['i'] - base + 2) // 8), p['t']] for p in out]

def sec_title(num, title):
    t = title[len(num):].strip() if title.startswith(num) else title
    return t.rstrip(':').strip()

def nums_in(s):
    return re.findall(r'\b(\d{1,2}\.\d+(?:\.\d+)?)\b', s or '')

mos = []
allnums = []
for C in CHAPTERS:
    ix = json.load(open(os.path.join(SEC, f"ch{C['ch']}_index.json")))
    secs = []
    if C['ch'] == '4':                                                  # Chapter 4 Philosophy precedes 4.1.1
        doc = open(os.path.join(SRC, 'source-extracts', C['doc'] + '.pdf.txt')).read().split('\n')
        first = ix[0]['start_line']
        raw = '\n'.join(doc[:first - 1])
        m = re.search(r'PHILOSOPHY', raw)
        if m: raw = raw[m.start():]
        ps = clean(raw)
        if ps and ps[0][1].upper().startswith('PHILOSOPHY'):
            ps[0][1] = ps[0][1][len('PHILOSOPHY'):].lstrip(' :')
            if not ps[0][1]: ps = ps[1:]
        secs.append(dict(num='4.0', label='Philosophy', title='Philosophy', paras=ps))
    for x in ix:
        raw = open(os.path.join(SEC, os.path.basename(x['file']))).read()
        paras = clean(raw)
        if paras and paras[0][1].startswith(x['num']): paras[0][1] = paras[0][1][len(x['num']):].strip()
        if paras and sec_title(x['num'], x['title']).lower().startswith(paras[0][1].rstrip(':').lower()[:30]) and len(paras[0][1]) < 90: paras = paras[1:]
        s = dict(num=x['num'], label=x['num'], title=sec_title(x['num'], x['title']), paras=paras)
        if x['num'] in INCOMPLETE: s['incomplete'] = INCOMPLETE[x['num']]
        secs.append(s); allnums.append(x['num'])
    mos.append(dict(ch=C['ch'], title=C['title'], eff=C['eff'], rev=C['rev'],
      source=f"Federal Way Police Department Manual of Standards, Chapter {C['ch']} — {C['title']}. Effective {C['eff']}; revision {C['rev']}.",
      sections=secs))

def expand(sec):
    """'4.4.1–4.4.7' -> all indexed nums in range; '46.2 / 46.2.1' -> both; 'Chapter 4 Philosophy' -> 4.0"""
    if 'Philosophy' in sec: return ['4.0']
    out = []
    for a, b in re.findall(r'(\d{1,2}\.\d+(?:\.\d+)?)\s*[–-]\s*(\d{1,2}\.\d+(?:\.\d+)?)', sec):
        ia, ib = allnums.index(a) if a in allnums else None, allnums.index(b) if b in allnums else None
        if ia is not None and ib is not None: out += allnums[ia:ib + 1]
    for n in nums_in(sec):
        if n in allnums and n not in out: out.append(n)
    return out

# ---------------- study points (policy outlines) ----------------
points = []
for p in scrub(D['policy_sections']):
    points.append(dict(id=p['id'], ch=p['source'].replace('fwpd-ch', ''), section=p['section'], title=p['title'], summary=p['summary'],
      rules=p.get('key_rules', []), thresholds=p.get('thresholds', []), oral=p.get('oral_board', ''), swat=p.get('swat_relevance', ''),
      flags=p.get('flags', []), cites=p.get('citations', []), secs=expand(p['section'])))
for ch in mos:
    for s in ch['sections']:
        s['pts'] = [p['id'] for p in points if s['num'] in p['secs']]

# ---------------- cases ----------------
cases = []
for c in scrub(D['case_law']):
    wa = c['name'].startswith('State v.')
    cases.append(dict(id=c['id'], court='WA' if wa else 'US', name=c['name'], cite=c['cite'], holding=c['holding'], factors=c.get('factors', []),
      swat=c.get('swat', ''), quiz=c.get('quiz', ''), answer=c.get('answer', ''), verified=c.get('verified', ''), cites=c.get('citations', []), src=''))
for c in NEW_CASES:
    cases.append(dict(c, factors=c.get('factors', []), cites=[c['cite']]))
assert len({c['id'] for c in cases}) == len(cases)

# ---------------- RCWs ----------------
rcws = []
for r in RCW:
    full = open(os.path.join(HERE, 'study_app', 'rcw_text', r['cite'] + '.txt')).read().strip()
    assert r['quote'] in full, r['cite']
    body, _, hist = full.rpartition('\n[')
    if not body: body, hist = full, ''
    hist = ('[' + hist).replace(' s ', ' § ').strip() if hist else ''
    body = re.sub(r'RCW\s{2,}', 'RCW ', body)
    quote = re.sub(r'RCW\s{2,}', 'RCW ', r['quote'])
    rcws.append(dict(cite=r['cite'], title=r['title'], group=r['group'], summary=r['summary'], points=r['points'], quote=quote,
      text=body.split('\n'), history=hist, url=f"https://app.leg.wa.gov/RCW/default.aspx?cite={r['cite']}", verified=RCW_VERIFIED))

# ---------------- flashcards ----------------
def pillar(c):
    if c['source'].startswith('fwpd'): return 'mos'
    if c['section'].startswith('RCW'): return 'rcw'
    return 'case'
cards = []
for c in scrub(D['flashcards']):
    pl = pillar(c)
    link = None
    if pl == 'mos':
        ns = expand(c['section']); link = ns[0] if ns else None
    elif pl == 'rcw':
        m = re.search(r'RCW ([0-9A-Z.]+\d)', c['section']); link = m.group(1) if m else None
    cards.append(dict(id=c['id'], p=pl, q=c['q'], a=c['a'], ref=c['section'], link=link, tags=c.get('tags', [])))
caseids = {c['id'] for c in cases}
for r in RCW:
    for i, (q, a) in enumerate(r['cards']):
        cards.append(dict(id=f"rcw-{r['cite']}-{i+1}", p='rcw', q=q, a=a, ref='RCW ' + r['cite'], link=r['cite'], tags=[r['group']]))
for c in NEW_CASES:
    cards.append(dict(id=f"case-{c['id']}", p='case', q=c['quiz'], a=c['answer'], ref=f"{c['name']}, {c['cite']}", link=c['id'], tags=['case-law', c['court']]))
assert len({c['id'] for c in cards}) == len(cards)

scen = scrub(D['scenarios'])
oral = [dict(id=o['id'], topic=o['topic'], q=o['question'], framework=o['framework'], hooks=o.get('policy_hooks', []), fill=o.get('placeholders', [])) for o in scrub(D['interview_prep'])]
flags = [dict(id=f['id'], sev=f['severity'], item=f['item'], rec=f.get('recommendation', '')) for f in scrub(D['gaps_and_flags']) if f['id'] != 'gap-ch4-newer-than-week1']

DATA = dict(
  meta=dict(name='Daily Study', built='2026-11-26',
    note='Study aid, not legal advice. MOS text is reproduced as provided (FWPD Chapters 4, 41, 46); RCW text copied from app.leg.wa.gov on 2026-11-26. Check the official source before relying on any rule.'),
  mos=mos, points=points, cases=cases, rcw=rcws, cards=cards, scenarios=scen, oral=oral, flags=flags)
blob = json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))
for bad in ['Mickey', 'Elliott', 'hotmail', '/workspace', '/home/box', 'attachments/']:
    assert bad not in blob, bad
ver = hashlib.sha256(blob.encode()).hexdigest()[:10]
open(os.path.join(OUT, 'data.json'), 'w').write(blob)

tpl = open(os.path.join(HERE, 'study_template.html')).read()
js = open(os.path.join(HERE, 'js', 'daily.js')).read()
app_ver = hashlib.sha256((tpl + js).encode()).hexdigest()[:8]
html = tpl.replace('/*__APP__*/', js.replace('</', '<\\/')).replace('__DATAVER__', ver)
open(os.path.join(OUT, 'index.html'), 'w').write(html)
sw = open(os.path.join(HERE, 'study_sw.js')).read().replace('__VERSION__', f'ds-{app_ver}-{ver}').replace('__DATAVER__', ver)
open(os.path.join(OUT, 'sw.js'), 'w').write(sw)
json.dump({
  "id": "./", "name": "Daily Study", "short_name": "Daily Study",
  "description": "Daily MOS, case law and RCW study: today's cards, flashcards, scenarios and an exact-text reference.",
  "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
  "background_color": "#0b0e13", "theme_color": "#0b0e13",
  "icons": [{"src": "../icons/study-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "../icons/study-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "../icons/study-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]
}, open(os.path.join(OUT, 'manifest.webmanifest'), 'w'), indent=2)
cnt = dict(mos_sections=sum(len(c['sections']) for c in mos), study_points=len(points), cases=len(cases),
  cases_wa=sum(c['court'] == 'WA' for c in cases), cases_us=sum(c['court'] == 'US' for c in cases), rcw=len(rcws),
  cards={k: sum(c['p'] == k for c in cards) for k in ('mos', 'case', 'rcw')}, scenarios=len(scen), oral=len(oral), data_kb=len(blob.encode()) // 1024, ver=ver)
print(json.dumps(cnt))
