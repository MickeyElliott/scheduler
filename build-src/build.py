import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from ref import REF
from ref2 import REF2
from weeks import WEEKS
from meals_data import NUTRITION, RECIPES, GROCERY, MENU, PREP_STEPS
from v2_overrides import FLEX, LOC, ANCHORS
from datetime import date
import copy
WEEKS = copy.deepcopy(WEEKS)
for _w in WEEKS:
    for _d in _w["days"]:
        _d["blocks"] = [copy.deepcopy(b) for b in _d["blocks"]]

ref = copy.deepcopy(dict(REF)); ref.update(copy.deepcopy(REF2))
ref["sessions"].update(copy.deepcopy(FLEX))
for _k,_v in LOC.items():
    if _k in ref["sessions"]: ref["sessions"][_k]["where"] = _v
ref["daily_anchors"] = ANCHORS
ref["nutrition"] = NUTRITION
ref["recipes"] = RECIPES
ref["grocery"] = GROCERY
ref["menu"] = MENU
ref["prep_steps"] = PREP_STEPS
for w in WEEKS:
    for d in w["days"]:
        seen = {}
        for b in d["blocks"]:
            key = f'{d["date"]}|{b["start"]}|{b["track"]}'
            seen[key] = seen.get(key, 0) + 1
            if seen[key] > 1: key += f'#{seen[key]}'
            b["id"] = key
            b["items"] = [{"id": f"{key}|{i}", "text": t} for i, t in enumerate(b["items"])]
        d["blocks"].sort(key=lambda b: b["start"])
PLAN = {"meta": {"version": "2026-11-24 · Week 1 v2", "athlete": "Mickey Elliott (FWPD)",
                 "built": "2026-11-24"}, "ref": ref, "weeks": WEEKS}
HERE = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(HERE, "..")          # site root (GitHub Pages serves this)
planout = os.path.join(out, "plan")     # markdown + raw JSON
os.makedirs(planout, exist_ok=True)
SYNC_JS = open(os.path.join(HERE, "js", "sync.js")).read()
def inline_js(src):
    return src.replace("</", "<\\/")

# ---------------- Family meal page (meals.html) ----------------
PORTION = {
 "oats": "1 jar per breakfast, Tue–Fri.",
 "eggbites": "3 egg bites per breakfast, Tue–Fri.",
 "chicken": "Each container: about 7 oz cooked chicken (palm-and-a-half), 1½ cups rice, a big handful of broccoli.",
 "turkey": "Each bowl: about 1 heaping cup of the turkey mix, ¾–1 cup rice, ½ cup green beans.",
 "chili": "Each container: about 1¾ cups chili (fills a 16–24 oz thermos).",
 "carbs": "Rice: 1½ cups with each chicken dinner, ¾–1 cup in each turkey bowl. Sweet potato: about 1 cup (200 g) with off-day dinners.",
 "salmon": "1 fillet per dinner, with about 1 cup sweet potato and a side salad.",
}
_menu = copy.deepcopy(MENU)
for _d in _menu:
    for _m in _d["meals"]:
        _m[1] = _m[1].replace("Light Meal 3", "Light evening meal")
MEALS = {
 "menu": _menu, "prep": PREP_STEPS, "grocery": GROCERY,
 "recipes": [dict({k:v for k,v in r.items() if k!="macro"}, portion=PORTION.get(r["id"],"")) for r in RECIPES],
 "equipment": ["4 jars with lids (for the oats)", "12-cup muffin tin", "2 sheet pans", "2 pots (one for the chili) + 1 big skillet", "Rice cooker", "About 17 leak-proof containers: 5 for chicken dinners, 6 for turkey bowls, 6 for chili", "Masking tape + marker to label each container with its DAY", "Meat thermometer (chicken is done at 165°F)"],
 "storage": ["FRIDGE: 2 chicken dinners (Tue, Wed), 2 turkey bowls (Mon lunch, Tue work night), 1 chili (Wed work night), 4 oat jars, 12 egg bites, Monday's salmon.",
             "FREEZER: 3 chicken dinners (Thu, Fri, spare), 4 turkey bowls, 5 chili (Fri, Sun + 3 for next week), Saturday's salmon.",
             "Each evening, move the next day's food from the freezer to the fridge. The \"Tonight\" notes on This week tell you what to move.",
             "Cooked food keeps 3–4 days in the fridge. Anything not eaten by then goes in the freezer."],
}
PLAN["ref"]["meals_page"] = MEALS
tpl = open(os.path.join(HERE, "template.html")).read()
data = json.dumps(PLAN, ensure_ascii=False).replace("</", "<\\/")
open(os.path.join(out, "index.html"), "w").write(tpl.replace("/*__SYNC__*/", inline_js(SYNC_JS)).replace("/*__DATA__*/", data))
json.dump(PLAN, open(os.path.join(planout, "plan-data.json"), "w"), ensure_ascii=False, indent=1)
mtpl = open(os.path.join(HERE, "meals_template.html")).read()
open(os.path.join(out, "meals.html"), "w").write(mtpl.replace("/*__SYNC__*/", inline_js(SYNC_JS)).replace("/*__MEALS__*/", json.dumps(MEALS, ensure_ascii=False).replace("</", "<\\/")))

# ---------------- Markdown plan ----------------
DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
def fd(s):
    y,m,dd = map(int, s.split("-")); x = date(y,m,dd)
    return f'{DOW[x.weekday()]} {x.strftime("%b")} {x.day}'
T = ref["tracks"]
L = []
P = L.append
P("# Valley SWAT Selection Prep: Week 1 Plan v2 (+ Pre-Week Kickoff)")
P("**Ofc. Mickey Elliott · Federal Way PD** · Built Tue Nov 24, 2026 · Week 1 = Mon Nov 30 – Sun Dec 6, 2026\n")
P("> Companion to the interactive tracker `index.html`. Times are Pacific. Shift assumption (from your prep doc): **Tue–Fri 20:30–06:30 nights, off Sat–Mon**, through Dec 31, 2026. From Jan 1, 2027 you're on Fri–Mon 06:30–16:30 days. Shift days are editable in the tracker's Settings.\n")
P("## Milestones")
for m in ref["milestones"]:
    P(f'- **{m["at"].replace("T"," ")}**: {m["label"]}' + (" ⚠" if m.get("hard") else ""))
P("\n## The standard you're training for")
for k in ["pat","vswat"]:
    s = ref["standards"][k]; P(f'### {s["title"]}'); P("| Event | Standard | Note |\n|---|---|---|")
    for e in s["events"]: P(f"| {e[0]} | {e[1]} | {e[2]} |")
    for f in s["form"]: P(f"- {f}")
    P(f'_Source: {s["source"]}_\n')
P("### VSWAT firearms courses (40 rds / 40 pts each)")
c = ref["firearms"]["courses"]
for name,rows in [("Pistol",c["pistol"]),("Carbine",c["carbine"])]:
    P(f"**{name}**\n\n| # | Line | Drill | Limit | Rds |\n|---|---|---|---|---|")
    for r in rows: P(f"| {r[0]} | {r[1]} | {r[2]} | **{r[3]}** | {r[4]} |")
    P("")
P(c["rules"] + "\n")
P("## Daily anchors (every day)")
for a in ref["daily_anchors"]: P(f'- [ ] {a["text"]}')
P("\n## Day-by-day schedule")
for w in WEEKS:
    P(f'\n### {w["label"]} · {w["range"]}')
    for d in w["days"]:
        P(f'\n#### {fd(d["date"])}: {d["title"]}')
        if d.get("theme"): P(f'_{d["theme"]}_\n')
        P("| Time | Track | Block | Checklist |\n|---|---|---|---|")
        for b in d["blocks"]:
            items = "<br>".join("☐ " + i["text"] for i in b["items"])
            ref_s = f' _(→ {b["ref"]})_' if b.get("ref") else ""
            P(f'| {b["start"]}–{b["end"]} | {T[b["track"]]["label"]} | **{b["title"]}**{ref_s} | {items} |')
P("\n---\n## 1 · Workouts")
P("**v2 structure (patrol-friendly):** The primary session is **before shift** at the home gym (~16:00, or the work gym right before shift). The secondary session is an **optional on-shift flex hour** at the work gym (~01:00 nominal, whenever calls allow): F1 = Zone 2 + mobility (full 45–60 min / short 20–30), F2 = low-fatigue mobility + pull-up practice. Skip rule: if calls stack up, skip it and don't make it up. No flex the night after a heavy session (Fri 12/4). F2 only the night before the hardest session (Thu 12/3). Nothing desk-bound on shift. Optional case-law flashcards only while parked in downtime. Off days use the home or work gym mid-morning.\n")
P("**Philosophy for Week 1 (hard, but smart):** 6 training sessions + 1 recovery, daily grease-the-groove pull-ups, and 10 min of mobility. Volume and frequency are high while intensity is controlled (≈ 80-85%) except on the baseline/checkpoint tests. Your cardio is the weak link, so Zone 2 work shows up 4×. Deadlift technique comes before load. Train *before* shifts. The on-shift hour is a bonus, never required.\n")
P("### Pull-up progression (set your level from the baseline max)")
P("| Level | Session prescription | Grease the groove |\n|---|---|---|")
for l in ref["pullup_levels"]: P(f'| {l["level"]} | {l["prescription"]} | {l["gtg"]} |')
P("\n### AMRAP pacing strategy"); [P(f"- {x}") for x in ref["pacing"]]
P("\n### Deadlift to 135: cues"); [P(f"- {x}") for x in ref["deadlift_cues"]]
P("\n### Warm-ups")
for k,v in ref["warmups"].items():
    P(f"**{k}**"); [P(f"- {x}") for x in v]
P("\n### Mobility menu"); P(" · ".join(ref["mobility"]))
P("\n### Sessions")
for sid,s in ref["sessions"].items():
    P(f'\n#### {sid}: {s["name"]} (~{s["dur"]} min · {s["where"]})')
    for t,items in s["blocks"]:
        P(f"**{t}**")
        for i in items:
            for x in (ref["warmups"].get(i) or [i]): P(f"- {x}")
    P(f'> **Scale/notes:** {s["scale"]}')
P("\n---\n## 2 · Meal prep & nutrition")
n = ref["nutrition"]
P("| Target | Detail |\n|---|---|"); [P(f"| {t[0]} | {t[1]} |") for t in n["targets"]]
P("\n**Supplements**\n\n| Item | Use |\n|---|---|"); [P(f"| {t[0]} | {t[1]} |") for t in n["supplements"]]
for k,t in n["templates"].items():
    P(f'\n### {t["name"]}\n\n| Time | Meal | What | Macros |\n|---|---|---|---|')
    for m in t["meals"]: P(f"| {m[0]} | {m[1]} | {m[2]} | {m[3]} |")
    P(f'_{t["total"]}_')
P("\n**Rules**"); [P(f"- {x}") for x in n["rules"]]
P("\n### Menu by day (with pack lists and freezer moves)")
for d in ref["menu"]:
    P(f'**{d["label"]}**: {d["note"]}'); [P(f"- {m[0]}: {m[1]}: {m[2]}") for m in d["meals"]]
    if d.get("pack"): P("  - Pack: " + "; ".join(d["pack"]))
    if d.get("tonight"): P("  - Tonight: " + d["tonight"])
P("\n> **Family meal page:** `meals.html` (plain-language, phone-friendly, self-contained) has the per-day menu, the pack list for each work night, the Sunday prep timeline, the grocery checklist and recipes with portions. Your wife runs groceries (Sat) and Sunday prep from it.\n")
P("\n### Grocery list (1 week · shop Sat 11/28 and again Sat 12/5)")
for cat,items in ref["grocery"]:
    P(f"**{cat}**"); [P(f"- [ ] {i}") for i in items]
P("\n### Sunday prep session (≈ 2 h)")
for t,x in ref["prep_steps"]: P(f"- **{t}** {x}")
P("")
for r in ref["recipes"]:
    P(f'#### {r["name"]} (makes {r["makes"]} · {r["time"]})'); P("Ingredients: " + "; ".join(r["ing"])); 
    for i,s in enumerate(r["steps"],1): P(f"{i}. {s}")
    P(f'_{r["macro"]}_\n')
P("\n---\n## 3 · Firearms")
f = ref["firearms"]
P("### Dry-fire safety rules (every session)"); [P(f"{i}. {x}") for i,x in enumerate(f["safety"],1)]
P("\n### Par-time ladder\n\n| Skill | Week-1 start par | Sun 12/6 target | Course link |\n|---|---|---|---|")
for r in f["par_table"]: P(f"| {r[0]} | {r[1]} | **{r[2]}** | {r[3]} |")
P("\n### Daily dry-fire routines")
for k,dr in f["dry"].items():
    P(f'**{k}: {dr["name"]}** ({dr["min"]} min)'); [P(f"- {x}") for x in dr["reps"]]
l = f["live"]; P(f'\n### {l["title"]}'); [P(f"- {x}") for x in l["logistics"]]
P("\n| Block | Rounds | Notes |\n|---|---|---|"); [P(f"| {p[0]} | {p[1]} | {p[2]} |") for p in l["plan"]]
P(f'\n{l["scoring"]}\n')
P("**Score sheet (print):**\n\n| Course | Drill | Limit | Rds | Hits | Misses | Over-time rds | Time |\n|---|---|---|---|---|---|---|---|")
for name,rows in [("Pistol",c["pistol"]),("Carbine",c["carbine"])]:
    for r in rows: P(f"| {name} | {r[0]}: {r[2]} | {r[3]} | {r[4]} | | | | |")
P("\n**Gear:**"); [P(f"- {x}") for x in ref["gear"]]
P("\n---\n## 4 · Case law (Week 1)")
P("Method: read the holding, write 3–5 bullets, then say 'why it matters' out loud as if answering the interview panel. All citations were checked against the opinions or official reporters.\n")
for cs in ref["cases"]:
    P(f'### {cs["name"]} · {cs["cite"]} · _{cs["day"]}_'); P(f'**Holding.** {cs["holding"]}')
    if cs.get("factors"): P(f'\n{cs["factors"]}')
    P(f'\n**Why it matters for SWAT.** {cs["swat"]}\n\n**Self-quiz:** {cs["quiz"]}\n\n<details><summary>Answer</summary>{cs["answer"]}</details>\n\nSource: {cs["url"]}\n')
P("**Queued for Week 2+:**"); [P(f"- {x}") for x in ref["case_queue"]]
P("\n---\n## 5 · Washington / Federal Way policy (Week 1)")
for p in ref["policy"]:
    P(f'### {p["day"]}: {p["title"]}'); P(p["url"]); [P(f"- {x}") for x in p["read"]]; P(f'\n**Self-quiz:** {p["quiz"]}\n')
P("**Pull from your own copy (PowerDMS / Valley SWAT):**"); [P(f"- {x}") for x in ref["pull_from_powerdms"]]
P("\n---\n## 6 · Application packet (due Mon Dec 7, 2026 · 09:00)")
a = ref["app"]; [P(f"- {x}") for x in a["deliverables"]]
P("\n**Letter of interest outline (≤ 2 pages):**"); [P(f"{i}. {x}") for i,x in enumerate(a["outline"],1)]
P(f'\n{a["brag"]}\n')
P("Timeline: Wed 11/25 ask your supervisor (in person, hand over the brag sheet) → Sun 11/29 outline → Mon 11/30 full draft → Tue revise → Wed peer review → Thu finalize + collect the rec letter → **Fri 12/4 submit through the chain of command** (3 days of buffer) → Mon 12/7 09:00 hard deadline.")
P("\n---\n## Assumptions & open items")
for x in [
 "Training: the primary session is pre-shift at the home gym (~16:00). The on-shift flex hour (~01:00) is a nominal slot: do it whenever calls allow, short version or skipped is fine.",
 "Meals: 3 meals + 1 shake (~2,300 kcal / ~200 g protein training days). Your wife leads the Sat grocery run and Sun prep from meals.html. A food thermos + insulated cooler + ice packs are assumed for the car.",
 "Old v1 checkbox IDs don't carry over (block times changed). Nothing was checked yet since the plan starts Wed 11/25. Settings and logs are kept (same storage key).",
 "Shift: Tue–Fri 20:30–06:30 (your prep doc). Off-day sleep is anchored ~01:00/02:00–09:00/10:00, with a 7 h day sleep 07:30–14:30 on shift days. Adjust in Settings.",
 "You're assumed to be working Thanksgiving night (Thu 11/26) per the Tue–Fri rotation.",
 "Home gym has a barbell + plates and a pull-up bar. The work gym is a full gym (used for the optional flex hour or as a pre-shift alternative).",
 "Live fire Sun 12/6 assumes range access with 50 yd + movement and a partner for dummy rounds. Swap to Sat or Mon if needed.",
 "VSWAT rep standards (pull-up kip vs strict, burpee standard, deadlift lockout) and the qual-course scoring zones aren't defined in the documents. Confirm with VSWAT staff.",
 "Macros are estimates from typical USDA/label values. Check them with a food scale for the first week.",
 "Selection start time on Feb 19, 2027 isn't stated, so the countdown uses 07:00 as a placeholder.",
]: P(f"- {x}")
open(os.path.join(planout, "week1-plan.md"), "w").write("\n".join(L) + "\n")
print("built", sum(len(d["blocks"]) for w in WEEKS for d in w["days"]), "blocks")
