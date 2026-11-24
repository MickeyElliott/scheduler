#!/usr/bin/env python3
"""Build the SQL that loads private study materials into public.study_content.

The study JSON is NOT in this repo (it contains department policy text).
Usage: python3 tools/seed-study.py /path/to/study-data.json > /tmp/seed.sql
Then run the SQL in the Supabase SQL editor (or via the Supabase MCP).
"""
import hashlib, json, sys

src = sys.argv[1]
raw = open(src, 'rb').read()
d = json.loads(raw)
ver = hashlib.sha256(raw).hexdigest()[:12]
meta = {k: v for k, v in d['meta'].items() if k not in ('work_dir', 'deliverables')}
sources = [{k: v for k, v in s.items() if k not in ('source_file', 'extract')} for s in d['sources']]
rows = {
    'meta': {'meta': meta, 'counts': d['counts'], 'sources': sources},
    'policy': d['policy_sections'], 'cases': d['case_law'], 'cards': d['flashcards'],
    'scenarios': d['scenarios'], 'oral': d['interview_prep'],
    'schedule': d['weekly_schedule'], 'flags': d['gaps_and_flags'],
}
tag = '$study_' + ver + '$'
out = ['begin;', 'delete from public.study_content;']
for k, v in rows.items():
    j = json.dumps(v, ensure_ascii=False)
    assert tag not in j
    out.append(f"insert into public.study_content (key, data, version) values ('{k}', {tag}{j}{tag}::jsonb, '{ver}');")
out.append('commit;')
out.append("select key, version, length(data::text) from public.study_content order by key;")
print('\n'.join(out))
