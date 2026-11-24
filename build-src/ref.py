# Reference content for Valley SWAT prep. Week-agnostic material.
REF = {}

REF["tracks"] = {
  "workout":  {"label": "Workouts",   "color": "#ff5a3c", "icon": "▲"},
  "meal":     {"label": "Meals",      "color": "#3ddc84", "icon": "●"},
  "firearms": {"label": "Firearms",   "color": "#ffb020", "icon": "✛"},
  "caselaw":  {"label": "Case Law",   "color": "#4aa8ff", "icon": "§"},
  "policy":   {"label": "Policy",     "color": "#b57bff", "icon": "◆"},
  "app":      {"label": "Application","color": "#ff6fb1", "icon": "✉"},
  "recovery": {"label": "Sleep/Recovery","color": "#7a8a99", "icon": "☾"},
}

REF["milestones"] = [
  {"id": "ask", "label": "Ask supervisor for recommendation letter", "at": "2026-11-25T21:00"},
  {"id": "baseline", "label": "Baseline test day (PAT + VSWAT)", "at": "2026-11-29T10:30"},
  {"id": "submit", "label": "Target: submit application packet", "at": "2026-12-04T18:45"},
  {"id": "due", "label": "APPLICATION DUE to Cmdr. Klingele", "at": "2026-12-07T09:00", "hard": True},
  {"id": "shiftchange", "label": "Shift change → Fri–Mon 06:30–16:30", "at": "2027-01-01T06:30"},
  {"id": "selection", "label": "VALLEY SWAT SELECTION", "at": "2027-02-19T07:00", "hard": True},
]

REF["standards"] = {
  "pat": {
    "title": "BLEA Entrance PAT (pass/fail gate)",
    "source": "WSCJTC: https://cjtc.wa.gov/physical-ability-test-pat",
    "events": [
      ["Push-ups", "20 correct reps in 90 s", "Then 3:00 rest"],
      ["Sit-ups", "25 correct reps in 90 s", "Then 5:00 rest"],
      ["Squat thrusts", "35 correct reps in 3:00", "Fail any event = fail PAT"],
    ],
    "form": [
      "Push-up: body straight, go down until upper arms are parallel and chest compresses the foam block, lock arms out at the top.",
      "Sit-up: fingers interlocked behind head, elbows touch knees, shoulder blades return to the mat.",
      "Squat thrust: hands to floor, kick both feet back together to a straight plank, feet back in, stand fully with arms overhead.",
      "Rep standards above are as published by WSCJTC/NTN. Confirm with the FWPD proctor which standard they score against.",
    ],
  },
  "vswat": {
    "title": "VSWAT Fitness Assessment (ranked)",
    "source": "Selection announcement, Cmdr. B. Klingele, 11/20/2026",
    "events": [
      ["Part 1, 10:00 AMRAP", "5 pull-ups / 10 push-ups / 15 air squats", "then 3:00 rest"],
      ["Part 2, 3:00 AMRAP", "5 deadlifts @ 75% BW (≈135 lb at 180) / 5 burpees", "then 3:00 rest"],
      ["Part 3, 3:00 AMRAP", "5 deadlifts @ 75% BW / 5 burpees", "Ranked on score"],
    ],
    "form": [
      "Rep standards for pull-ups (kip vs. strict), burpees (chest to floor? jump?) and deadlift lockout are not given in the announcement. Ask a current Valley SWAT member or the test proctor. Until then, train strict pull-ups and chest-to-floor burpees.",
      "Deadlift load = 75% of YOUR weigh-in body weight. If you lose 10 lb the bar drops to about 127.5 lb. Train at 135 lb either way.",
    ],
  },
}

REF["pacing"] = [
  "10-min AMRAP: the pull-ups set your pace. From round 1, break them before failure (3-2, then 2-2-1 later). One failed rep costs more time than a planned break.",
  "Push-ups: sets of 6-4 or 5-5 from the start. Never take a set to failure in rounds 1-4.",
  "Air squats: always unbroken. Breathe in through the nose on the squats and use them to recover.",
  "Pick a target round time from your baseline (e.g. 75 s/round = 8 rounds) and hold it ±5 s. Check the clock every round. If rounds 1-2 are more than 10 s faster than target, you went out too hot.",
  "3-min DL/burpee: deadlifts touch-and-go, reset the grip only if needed. Burpees at a smooth, steady rhythm, ~2.5-3 s each. Walk to the bar, don't rest at it. Target ≈ 25-30 s/round = 6-7 rounds.",
  "The 3:00 rests: walk the first 60 s, take nasal breaths, chalk up, set up at the bar with 20 s left.",
  "The second DL/burpee AMRAP is where rankings are decided. Plan to match or beat your first-AMRAP score.",
]

REF["pullup_levels"] = [
  {"level": "L0: 0 strict", "prescription": "Band-assisted pull-ups 5×5 (band light enough that rep 5 is hard) + 3×3 eccentric negatives (jump up, 5 s lower) + 3×20 s flexed-arm hang + inverted rows 3×8-10.", "gtg": "Negatives: 3-5 singles spread across the day"},
  {"level": "L1: 1-4 strict", "prescription": "6 sets × (max − 1, min 1) strict, 2:00 rest, + band-assisted back-off 2×6 + 3×3 negatives.", "gtg": "Singles at ~50% of max, 5-8 times/day"},
  {"level": "L2: 5-9 strict", "prescription": "8 sets × 50-60% of max (e.g. max 8 → 8×4), 90 s rest. Finish with 1 set of dead hang to failure.", "gtg": "Sets of 2-3, 5-8 times/day"},
  {"level": "L3: 10+ strict", "prescription": "EMOM 10: 5 strict pull-ups (test-standard reps). Add 10 lb in a backpack once all 10 minutes are clean.", "gtg": "Sets of 4-5, 4-6 times/day"},
]

REF["deadlift_cues"] = [
  "Bar over mid-foot, shins about 1 in from the bar.",
  "Hinge down and grip just outside the legs. Shins come to the bar. Chest up, 'bend the bar' to engage the lats.",
  "Big breath into the belly, brace, push the floor away. Hips and shoulders rise together.",
  "Lock out with glutes, not by leaning back. Lower by sending the hips back first, bar close to the legs.",
  "Stop the set if your lower back rounds or the bar drifts forward. Technique comes before load in week 1.",
  "For the test, use touch-and-go reps (no bouncing) and a double-overhand grip as long as it holds, then switch to mixed grip.",
]

REF["warmups"] = {
  "RAMP-12": [
    "3:00 easy bike/row/jog in place",
    "2 rounds: 5/side world's greatest stretch · 10 glute bridges · 15 band pull-aparts · 10 scap pull-ups (or 20 s dead hang) · 10 pause air squats · 5 inchworm-to-push-up",
    "Specific: 2 × 3 pull-ups (or band) · 2 × 5 push-ups · 2 × 5 squat thrusts, building speed",
  ],
  "RAMP-8": [
    "2:00 easy cardio",
    "1 round: 5/side world's greatest stretch · 10 glute bridges · 15 band pull-aparts · 10 air squats · 20 s dead hang",
  ],
}

REF["mobility"] = [
  "Couch stretch 60 s/side", "90/90 hip switch × 10", "Pigeon 45 s/side",
  "Thoracic openers 8/side", "Lat stretch on rack/door 45 s/side", "Dead hang 30 s",
  "Calf/ankle wall rocks × 15/side", "Box breathing 2 min (4-4-4-4) to downshift",
]

REF["sessions"] = {
  "P1": {"name": "Kickoff: movement school + Zone 2", "dur": 45, "where": "Home",
    "blocks": [
      ["Warm-up", ["RAMP-8"]],
      ["Form practice (not for fatigue)", [
        "Push-ups: 3 × 8 at PAT standard (film one set from the side)",
        "PAT sit-ups: 3 × 10, fingers interlocked behind head, elbows to knees",
        "Squat thrusts: 3 × 8, practice a straight plank and full stand",
        "Dead hang 3 × max (log the time)",
      ]],
      ["Engine", ["Zone 2 walk/jog 25 min: you should be able to speak full sentences (≈120-140 bpm)"]],
      ["Cool-down", ["Mobility × 5 picks"]],
    ],
    "scale": "If you're stiff after the shift, swap the jog for a brisk walk."},
  "P2": {"name": "Thanksgiving: Turkey Day walk + rep tax", "dur": 45, "where": "Outdoors/Home",
    "blocks": [
      ["Before the meal", ["Brisk walk 40 min (family welcome)"]],
      ["Rep tax through the day", ["50 air squats + 30 push-ups + 20 PAT sit-ups, in any sets"]],
    ],
    "scale": "Take this seriously, but don't skip family time over it."},
  "P3": {"name": "Pre-week: Mobility + Zone 2", "dur": 40, "where": "Home/Gym",
    "blocks": [
      ["Engine", ["Zone 2 bike/incline walk 25 min"]],
      ["Mobility", ["Full mobility list (≈15 min)"]],
      ["Grip", ["Dead hang 3 × max"]],
    ], "scale": "Easy day. You should finish feeling better than when you started."},
  "P4": {"name": "Post-shift: easy walk + setup", "dur": 30, "where": "Home",
    "blocks": [["Recovery", ["30-min easy walk in daylight (resets the body clock)", "Mobility × 5 picks"]]],
    "scale": "Rest day. Install the pull-up bar and test it."},
  "S0": {"name": "BASELINE TEST DAY: PAT + VSWAT", "dur": 105, "where": "Gym (bar, plates, pull-up bar, timer)",
    "blocks": [
      ["Pre", ["Weigh in on waking (log it) + resting HR", "Set up timer app, a partner to count reps if possible, and phone video of one set per event"]],
      ["Warm-up", ["RAMP-12"]],
      ["1. Max strict pull-ups (fresh)", ["1 all-out set, dead hang to chin over bar. Log the reps → this sets your pull-up level (L0-L3)", "Rest 5:00"]],
      ["2. BLEA PAT, official order and rests", [
        "Push-ups 90 s: keep going past 20 and record the MAX",
        "Rest 3:00",
        "Sit-ups 90 s: record the MAX",
        "Rest 5:00",
        "Squat thrusts 3:00: record the MAX",
      ]],
      ["3. Deadlift technique work-up (rest 10:00 first)", [
        "Empty bar 2×5 → 95×5 → 115×3 → 135×5",
        "Stop at the heaviest load where all 5 reps are clean (neutral back) and log it",
      ]],
      ["4. VSWAT Assessment (rest 10:00 first)", [
        "10:00 AMRAP 5 pull-ups / 10 push-ups / 15 air squats (use a band if you have <3 strict and log the band)",
        "Rest 3:00 → 3:00 AMRAP 5 DL @135 (or your clean load) / 5 burpees",
        "Rest 3:00 → repeat 3:00 AMRAP",
        "Log rounds + extra reps for each part",
      ]],
      ["Cool-down", ["10-min walk + full mobility. Eat Meal 2 within 45 min"]],
    ],
    "scale": "This is your 'before' picture. Give honest maximal effort with perfect standards. Skip a part only for pain (not discomfort)."},
  "S1": {"name": "Strength A + Engine", "dur": 80, "where": "Gym",
    "blocks": [
      ["Warm-up", ["RAMP-12"]],
      ["A. Deadlift: technique strength", ["5 × 5 @ 75-85% of your baseline clean load (target 115-135)", "3 s lowering on rep 1 of each set · rest 2:00", "Re-read the deadlift cues before set 1"]],
      ["B. Superset ×5", ["B1 Pull-ups: use your LEVEL prescription", "B2 Push-ups: 5 sets × 60% of PAT max (strict), rest 90 s after the pair"]],
      ["C. Superset ×3", ["C1 Goblet squat 3 × 12 (or air squat 3 × 20 with a 2 s pause)", "C2 Hollow hold 3 × 20-30 s"]],
      ["D. Engine: the weak link", ["Zone 2 30:00 bike / rower / incline treadmill, HR ≈ 120-140 or nasal-breathing only"]],
      ["Cool-down", ["Mobility × 6 picks"]],
    ],
    "scale": "If the back is fatigued, cut deadlifts to 3 sets. Never trade form for 135 this week."},
  "S2": {"name": "PAT Power + Intervals (pre-shift)", "dur": 60, "where": "Gym/Home + bike or rower",
    "blocks": [
      ["Warm-up", ["RAMP-12"]],
      ["A. PAT push-ups", ["5 sets × 50% of PAT max, strict to standard, 60 s rest"]],
      ["B. PAT sit-ups", ["4 sets × 50% of PAT max, 60 s rest, fingers interlocked, elbows to knees"]],
      ["C. Squat thrust EMOM 10:00", ["8 reps every minute (scale 6, push to 10 if easy). The test pace is ~12/min, so build up to it"]],
      ["D. Intervals", ["8 × (0:30 hard @ RPE 8 / 1:30 easy) on bike or rower"]],
      ["Cool-down", ["5:00 easy + mobility × 4"]],
    ],
    "scale": "First shift night tonight. Cap the intervals at 6 if you slept less than 7 h."},
  "S3": {"name": "Engine + Pull Volume (pre-shift)", "dur": 55, "where": "Home/Gym",
    "blocks": [
      ["Warm-up", ["RAMP-8"]],
      ["A. Zone 2", ["35:00 continuous at conversational pace. Log avg HR (this should drop over the weeks)"]],
      ["B. Pull volume", ["Pull-ups: 5 sets × 50% max (or band 5×5) · 90 s rest", "Band pull-aparts 3 × 20", "Dead hang 3 × max"]],
      ["C. Core", ["Dead bug 3 × 10/side", "Side plank 3 × 30 s/side"]],
      ["Cool-down", ["Mobility × 4"]],
    ],
    "scale": "Hard work at low intensity. If you're wrecked from last night, do the Zone 2 work and only half the pull volume."},
  "S4": {"name": "VSWAT Practice: pacing rehearsal (pre-shift)", "dur": 60, "where": "Gym (bar + plates)",
    "blocks": [
      ["Warm-up", ["RAMP-12", "Deadlift primer: bar × 5, 95 × 5, working load × 3"]],
      ["A. 6:00 AMRAP @ target pace", ["5 pull-ups (your level/band) / 10 push-ups / 15 air squats", "Use the baseline round time minus 3 s as your split. Break pull-ups 3-2 from round 1", "Log rounds + reps"]],
      ["Rest 3:00", ["Walk + nasal breathing"]],
      ["B. 2 × 2:00 AMRAP", ["5 deadlifts @ 115-135 / 5 burpees", "3:00 rest between · touch-and-go DL · steady burpee rhythm", "Log both scores (aim: round 2 ≥ round 1)"]],
      ["C. Accessory", ["Inverted row 3 × 10", "Glute bridge 3 × 15"]],
      ["Cool-down", ["Mobility × 5"]],
    ],
    "scale": "Hold about 85% effort. Today is for pacing practice, not a max test."},
  "S5": {"name": "Recovery + Mobility (pre-shift)", "dur": 35, "where": "Home",
    "blocks": [
      ["Recovery", ["Zone 1-2 walk 20:00", "Full mobility list", "GTG: 3 easy pull-up sets (well short of failure)"]],
    ],
    "scale": "Fourth night shift in a row. Do the minimum here, and show up for it."},
  "S6": {"name": "Strength B (post-shift)", "dur": 70, "where": "Gym",
    "blocks": [
      ["Warm-up", ["RAMP-12"]],
      ["A. Deadlift", ["5 × 3 @ 135 if Monday's sets were crisp, otherwise your clean load. Explode off the floor · rest 2:00"]],
      ["B. Ladders ×3", ["Pull-up ladder 1-2-3 (L0: band 2-3-4) · Push-up ladder 5-10-15 · rest 2:00 between ladders"]],
      ["C. Superset ×3", ["C1 Reverse lunge 8/leg", "C2 Farmer carry 40 yd heavy DBs (grip for DL/pull-ups)"]],
      ["D. Burpee EMOM 5:00", ["5 burpees each minute in ≤15 s, smooth and chest to floor"]],
      ["Optional", ["10:00 Zone 2"]],
    ],
    "scale": "FATIGUE RULE: if you slept under 5 h or resting HR is 10+ bpm over baseline, do 3 sets each and skip D."},
  "S7": {"name": "Week-1 Checkpoint: PAT mock + Zone 2", "dur": 65, "where": "Gym/Home",
    "blocks": [
      ["Warm-up", ["RAMP-12"]],
      ["PAT mock, official order/rests", ["Push-ups 90 s (max) → 3:00 → Sit-ups 90 s (max) → 5:00 → Squat thrusts 3:00 (max)", "Log it and compare with baseline"]],
      ["Engine", ["Zone 2 30:00"]],
      ["Cool-down", ["Mobility × 5"]],
    ],
    "scale": "You'll shoot live fire after this. Keep the Zone 2 truly easy so your hands are steady."},
}

REF["daily_anchors"] = [
  {"id": "creatine", "text": "Creatine 5 g"},
  {"id": "protein", "text": "Protein ≥ 175 g"},
  {"id": "kcal", "text": "Calories 2,200-2,400"},
  {"id": "water", "text": "Water ≥ 3.5 L (+ electrolytes on shift)"},
  {"id": "steps", "text": "8,000+ steps"},
  {"id": "gtg", "text": "Grease-the-groove pull-ups (sub-max)"},
  {"id": "mob", "text": "10 min mobility"},
  {"id": "sleep", "text": "7 h sleep in a dark, cool room"},
  {"id": "caff", "text": "No caffeine within 6 h of sleep"},
]

REF["nutrition"] = {
  "targets": [
    ["Calories", "2,300 kcal on training days · 2,200 on recovery days (docx range 2,200-2,400)"],
    ["Protein", "180 g (docx 170-180). ~45 g per main meal"],
    ["Carbs", "≈ 220 g training days, mostly around the workout · ≈ 190 g on recovery days"],
    ["Fat", "≈ 70-75 g"],
    ["Rate", "Aim to lose 0.5-1.0 lb/week. If you drop more than 1.5 lb/week for 2 weeks, add 150 kcal of carbs; performance comes first"],
    ["Hydration", "3.5 L baseline + 0.5-0.75 L per training hour. On shift: 1 electrolyte serving + 1 L bottle. Stop big drinks 60 min before sleep"],
    ["Caffeine", "≤ 400 mg/day. Shift nights: last dose by 01:00 (6 h before 07:30 sleep). No caffeine after the halfway point of your last shift"],
  ],
  "supplements": [
    ["Creatine monohydrate", "5 g daily, any time, every day including rest days (per docx). Mix into Huel or water"],
    ["Huel Black Edition", "1-2 servings/day (~400 kcal / 40 g protein each, per docx) for shift convenience, not as every meal"],
    ["Mars Men (optional)", "Per docx: continue if tolerated. Sleep, protein, training and fat loss are the main recovery/hormone drivers. Check the label with your physician"],
    ["Electrolytes", "1 serving on shift nights and after long Zone 2 sessions (sodium ≈ 500-1,000 mg)"],
  ],
  "templates": {
    "shift": {"name": "Night-shift day (Tue-Fri, sleep 07:30-14:30)", "meals": [
      ["14:45", "M1 'Breakfast'", "Overnight protein oats + 2 egg muffins", "≈ 550 kcal · 42 P"],
      ["17:00", "M2 Post-workout", "6 oz chili-lime chicken + 1 cup rice + 1.5 cups roasted broccoli", "≈ 590 kcal · 57 P"],
      ["19:45", "Pre-shift snack", "1 cup 0% Greek yogurt + ½ cup berries + 1 tbsp honey", "≈ 230 kcal · 24 P"],
      ["23:00", "On shift", "Huel Black (1 serving)", "≈ 400 kcal · 40 P"],
      ["02:30", "M3 'Lunch' on shift", "Turkey taco bowl + 100 g sweet potato + green beans", "≈ 500 kcal · 47 P"],
      ["05:00", "Optional", "Beef jerky 1 oz + apple, or skip if not hungry", "≈ 175 kcal · 11 P"],
      ["07:00", "Post-shift", "Nothing heavy. ½ cup cottage cheese only if hungry", "≈ 90 kcal · 12 P"],
    ], "total": "Core ≈ 2,270 kcal · 210 P. Optional items add ≈ 265 kcal: skip them on recovery days or if your weight stalls"},
    "off": {"name": "Off day (Sat-Mon, sleep ~01:00-09:00)", "meals": [
      ["09:15", "M1", "3-egg + 1 cup egg-white scramble, spinach, ½ cup (dry) oats w/ berries", "≈ 530 kcal · 50 P"],
      ["12:15", "M2 Post-workout", "Turkey taco bowl + 1 cup rice", "≈ 585 kcal · 48 P"],
      ["15:30", "Snack", "Huel Black or Greek yogurt + fruit", "≈ 300-400 kcal · 30-40 P"],
      ["18:00", "M3 Dinner", "6 oz salmon (or 1 portion beef chili) + 200 g roasted sweet potato + salad", "≈ 610 kcal · 40 P"],
      ["21:00", "Evening", "Cottage cheese ¾ cup + berries", "≈ 170 kcal · 18 P"],
    ], "total": "≈ 2,300 kcal · ≈ 196 P with Huel as the snack (≈ 2,130 kcal with yogurt instead)"},
  },
  "rules": [
    "Plate rule when you can't prep: palm-sized protein ×2, fist of carbs, two fists of vegetables, thumb of fat.",
    "Don't eat a large meal between 00:00 and 06:00. Keep on-shift food moderate and protein-forward.",
    "Thanksgiving: protein first, one plate, one dessert slice, a 40-min walk before eating. Don't try to 'save calories' by skipping meals.",
    "USDA food safety: cooked poultry and meat keep 3-4 days refrigerated, so freeze the Fri-Sun portions on prep day.",
  ],
}

REF["recipes"] = [
  {"id": "chicken", "name": "Sheet-pan chili-lime chicken (10 portions)", "time": "45 min",
   "ing": ["5 lb boneless skinless chicken breast", "2 tbsp olive oil", "2 limes (juice + zest)", "1 tbsp chili powder, 2 tsp cumin, 2 tsp garlic powder, 1 tsp smoked paprika, 2 tsp salt"],
   "steps": ["Oven 425°F. Butterfly the thick breasts so they're even.", "Toss with oil, lime and spices.", "Roast 18-22 min to 165°F internal. Rest 5 min, then slice.", "Portion 6 oz cooked × 10. Fridge 4, freeze 6."],
   "macro": "per 6 oz cooked ≈ 280 kcal · 53 P · 6 F"},
  {"id": "turkey", "name": "Turkey taco bowl base (6 portions)", "time": "30 min",
   "ing": ["3 lb 93/7 ground turkey", "2 bell peppers + 1 onion, diced", "1 can (15 oz) black beans, rinsed", "1 jar (16 oz) salsa", "2 tbsp taco seasoning (low sodium)"],
   "steps": ["Brown the turkey in a large skillet and drain.", "Add the peppers/onion and cook 5 min.", "Stir in the beans, salsa and seasoning, then simmer 10 min.", "Portion into 6 containers with sweet potato or rice + green beans."],
   "macro": "per portion (no carbs) ≈ 380 kcal · 44 P · 13 F"},
  {"id": "chili", "name": "Lean beef & bean chili (6 portions)", "time": "50 min (or slow cooker)",
   "ing": ["2 lb 93% lean ground beef", "1 onion, 4 cloves garlic", "2 cans (15 oz) kidney/pinto beans", "1 can (28 oz) crushed tomatoes", "2 tbsp chili powder, 1 tbsp cumin, salt"],
   "steps": ["Brown the beef, then add onion and garlic.", "Add everything else and simmer 30 min.", "Portion × 6 and freeze 3."],
   "macro": "per portion ≈ 420 kcal · 40 P · 12 F · 35 C"},
  {"id": "eggmuffin", "name": "Egg muffins (24)", "time": "30 min",
   "ing": ["18 large eggs", "2 cups (16 oz) liquid egg whites", "2 cups chopped spinach, 1 bell pepper, ½ onion", "½ cup shredded reduced-fat cheese", "salt/pepper/hot sauce"],
   "steps": ["Oven 350°F. Spray 2 muffin tins.", "Whisk the eggs and whites, then add the veg.", "Fill the cups ¾ full and top with cheese.", "Bake 20-22 min. Keeps 5 days refrigerated, or freeze."],
   "macro": "per 2 muffins ≈ 150 kcal · 14 P · 9 F"},
  {"id": "oats", "name": "Overnight protein oats (5 jars)", "time": "10 min",
   "ing": ["250 g rolled oats (50 g/jar)", "850 g 0% Greek yogurt (170 g/jar)", "500 g frozen mixed berries", "5 tbsp chia seeds", "milk/water to loosen, cinnamon"],
   "steps": ["Layer each jar: 50 g oats, 170 g yogurt, 1 tbsp chia, 100 g berries and a splash of milk.", "Refrigerate. Good for 4-5 days."],
   "macro": "per jar ≈ 400 kcal · 28 P · 8 F · 55 C"},
  {"id": "carbs", "name": "Carb & veg batch", "time": "60 min (concurrent)",
   "ing": ["3 cups dry jasmine rice (≈ 9 cups cooked)", "4 lb sweet potatoes, cubed", "3 lb broccoli florets", "2 lb frozen green beans"],
   "steps": ["Rice cooker: 3 cups rice.", "Roast the sweet potato at 425°F for 30 min and the broccoli at 425°F for 18 min with 1 tbsp oil each.", "Steam the green beans when portioning.", "Portion 1 cup rice or 200 g potato per container."],
   "macro": "1 cup rice ≈ 205 kcal · 45 C · 200 g sweet potato ≈ 180 kcal · 41 C"},
  {"id": "salmon", "name": "Salmon (cook fresh on off days)", "time": "15 min",
   "ing": ["4 × 6 oz salmon fillets"],
   "steps": ["Air fryer 400°F 8-10 min or oven 425°F 12 min. Season with salt, pepper and lemon.", "Eat within 2 days."],
   "macro": "per 6 oz ≈ 350 kcal · 38 P · 21 F"},
]

REF["grocery"] = [
  ["Protein", [
    "Chicken breast, boneless skinless: 5 lb", "Ground turkey 93/7: 3 lb", "Ground beef 93% lean: 2 lb",
    "Salmon fillets: 4 × 6 oz (≈ 1.5 lb)", "Eggs: 2 dozen", "Liquid egg whites: 32 oz",
    "Greek yogurt 0% plain: 3 × 32 oz tubs", "Cottage cheese low-fat: 2 × 16 oz", "Beef jerky (low sugar): 4 oz",
    "Huel Black Edition: confirm you have ≥ 10 servings", "Reduced-fat shredded cheese: 8 oz"]],
  ["Carbs", [
    "Rolled oats: 42 oz canister", "Jasmine rice: 2 lb bag (3 cups for prep)", "Sweet potatoes: 4 lb",
    "Black beans 1 can + kidney/pinto 2 cans (15 oz)", "Bananas: 6", "Apples: 6", "Frozen mixed berries: 2 lb", "Honey (if out)"]],
  ["Veg", [
    "Broccoli florets: 3 lb", "Frozen green beans: 2 lb", "Baby spinach: 10 oz clamshell", "Bell peppers: 4",
    "Onions: 3", "Garlic: 1 head", "Limes: 2 · Lemons: 2", "Salad mix: 2 bags", "Crushed tomatoes 28 oz: 1 can", "Salsa: 16 oz jar"]],
  ["Pantry/Other", [
    "Olive oil", "Chili powder, cumin, smoked paprika, garlic powder, taco seasoning", "Chia seeds (12 oz)",
    "Electrolyte packets (14)", "Creatine monohydrate: check ≥ 30 servings", "Hot sauce",
    "Meal-prep containers × 20 (if needed)", "Food scale (if needed)"]],
]

REF["gear"] = [
  "Doorway pull-up bar + loop resistance bands (light/medium/heavy)",
  "Shot-timer app with a PAR mode (or a real shot timer) + interval timer app",
  "Snap caps/dummy rounds for the duty pistol AND rifle (inert, colored)",
  "Dry-fire target: 1/3-scale or reduced IPSC/B-8 taped on a safe backstop wall",
  "Gym access with a barbell + 2 × 45 lb plates (135 lb) and a pull-up bar",
  "Blackout curtains/eye mask + earplugs/white noise for day sleep",
  "Body-weight scale. Weigh daily on waking and track the 7-day average",
]

REF["firearms"] = {
  "safety": [
    "Use a dedicated dry-fire area with a backstop that would stop a round (exterior wall/body-armor panel/bookcase), never a wall people are behind.",
    "Unload: drop the magazine, lock the slide/bolt open, check the chamber visually AND physically. Check it twice.",
    "NO LIVE AMMUNITION IN THE ROOM. Put all magazines and loose rounds in another room, locked. Use only inert dummy rounds in a different color.",
    "Say it out loud: 'This is dry practice. The weapon is unloaded.' Set a timer to bound the session (15-20 min).",
    "When you finish, say: 'Dry practice is over.' Do NOT do 'one more rep' after reloading. Reload in a different room and holster immediately.",
    "Follow FWPD firearms policy for dry practice with duty weapons. If you're unsure, use a SIRT/blue gun for draws and a duty-identical training gun for manipulations.",
  ],
  "par_table": [
    ["Pistol: draw → first shot (7 yd, A-zone)", "2.00 s", "1.70 s", "Drills 1 & 5: 6 rds in 5 s at 7 yd needs ≈ 1.5 s draw + 0.6 splits live"],
    ["Pistol: slide-lock reload → shot", "3.00 s", "2.50 s", "Drill 3: 6 rds in 10 s with a reload"],
    ["Pistol: tap-rack → shot (dummy round)", "1.60 s", "1.30 s", "Drill 2: 7 rds in 15 s with one malfunction"],
    ["Pistol: draw → 1st shot STRONG hand only", "2.60 s", "2.20 s", "Drill 6: 12 rds in 15 s (2H head / SHO / WHO)"],
    ["Pistol: transfer to WEAK hand → shot", "2.40 s", "2.00 s", "Drill 6"],
    ["Carbine: low ready → first shot (25 yd)", "1.30 s", "1.00 s", "All carbine drills"],
    ["Carbine: shoulder transition with SAFE on/off", "2.50 s", "2.00 s", "Drill 2: 3 strong + 3 support in 12 s"],
    ["Carbine: tap-rack/reload → shot", "3.50 s", "3.00 s", "Drill 3: 10 rds in 18 s, dummy + reload"],
    ["Carbine → pistol transition → head shot", "2.00 s", "1.60 s", "Drill 6: 2 rifle + 1 pistol to head in 5 s"],
  ],
  "dry": {
    "DF0": {"name": "Dry-fire setup + baseline times", "min": 20, "reps": [
      "Run the full safety protocol and set up the station",
      "10 slow-motion draws (5 s each), smooth and perfect",
      "Use the shot timer: 5 draw → first shot, 5 reloads, 5 tap-racks. Log your BEST and AVERAGE times as the baseline",
    ]},
    "DF1": {"name": "Pistol draw & recoil-control mechanics (Drills 1, 5)", "min": 20, "reps": [
      "10 slow draws (3 s), then 10 at a natural pace with no timer",
      "20 draw → 1 press at PAR 2.0 s (Sun target 1.7 s), on a reduced 7-yd target",
      "10 draw → 'two-press' (press, reset, press), focusing on the reset",
      "Finish: 5 perfect slow reps",
    ]},
    "DF2": {"name": "Malfunctions + reloads (Drills 2, 3)", "min": 20, "reps": [
      "Load a mag with 1 inert dummy. 10 × tap-rack → press at PAR 1.6 s",
      "10 × slide-lock (empty mag) reload → press at PAR 3.0 s",
      "5 × from the holster: draw → press → 'click' → tap-rack → press",
      "Stage practice: mags in the exact carrier positions you'll use at selection",
    ]},
    "DF3": {"name": "Strong/weak hand + head box (Drill 6)", "min": 20, "reps": [
      "10 × draw → 4 presses on a head box (reset each press)",
      "10 × strong-hand-only presses from compressed ready (PAR 2.6 s from the holster)",
      "10 × transfer to the weak hand → press (PAR 2.4 s). Cant if that's what you train",
      "3 × full Drill 6 sequence dry, 15 s par (12 presses)",
    ]},
    "DF4": {"name": "Carbine: mount, shoulder transitions, SAFE (Carbine Drills 2, 3)", "min": 20, "reps": [
      "15 × low ready → mount → press at PAR 1.3 s, safe off on the mount, SAFE ON before lowering",
      "10 × strong → SAFE → support shoulder → off safe → press (PAR 2.5 s)",
      "10 × dummy in the mag → malfunction clear → press, and 5 × reload → press (PAR 3.5 s)",
    ]},
    "DF5": {"name": "Movement + transitions (Pistol Drill 4, Carbine Drills 4, 6)", "min": 20, "reps": [
      "Hallway SOM: from ready, heel-toe walk forward 4-5 steps doing 5 body presses + 1 head (PAR 6 s pistol, 7 s carbine)",
      "10 × carbine 2 presses on the head → transition (dead trigger/click) → draw → 1 press on the head (PAR 2.0 s)",
      "Notice whether the sights move when you step, and smooth the walk out",
    ]},
    "DF6": {"name": "Dry run of the FULL pistol course", "min": 20, "reps": [
      "Run Pistol Drills 1-6 dry against the official time limits, with dummy rounds for Drills 2 and 3",
      "Write down which drill felt hardest. That becomes next week's focus",
      "3 × draw → press at PAR 1.7 s to close",
    ]},
  },
  "live": {
    "title": "Live fire: VSWAT courses under the clock (Sun 12/6)",
    "logistics": [
      "Range needs 50 yd (carbine) + room to move 15→7 and 10→3 yd. FWPD range/open range day or a public range that allows draw + movement (confirm first)",
      "Bring: duty pistol + carbine, 6 pistol mags, 4 rifle mags, 10 pistol & 5 rifle dummy rounds, IPSC/B-8 + head targets, shot timer, pasters/marker, score sheet (Logs tab), partner to set dummies/count",
      "Ammo: pistol ≈ 200 rds · rifle ≈ 140 rds",
    ],
    "plan": [
      ["Warm-up (pistol)", "25 rds", "5 × 5 at 7 yd slow fire for a group, then 3 draw-and-1 (no timer)"],
      ["Pistol course: RUN 1, cold-ish", "40 rds", "Shoot it exactly as written. Partner randomizes the dummy + the short mag. Score it"],
      ["Remedial on the worst drill", "50 rds", "Repeat that drill 3-5× with the timer"],
      ["Pistol course: RUN 2", "40 rds", "Score it. Compare against 32 (VSWAT min) / 28 (FW new officer min)"],
      ["Carbine zero check", "10 rds", "Confirm zero at 50 yd"],
      ["Carbine course: RUN 1", "39 rifle + 1 pistol", "Exactly as written. Score it"],
      ["Remedial: SOM + 10-in-5 s", "≈ 60 rds", "Carbine Drill 4 ×3, Drill 5 ×3"],
      ["Optional carbine RUN 2", "39 rifle + 1 pistol", "If time and ammo allow"],
    ],
    "scoring": "Score per drill: hits, misses, rounds over time. Points = hits − over-time rounds (1-pt penalty each). Any miss = fails the 100%-hits requirement. Confirm zone scoring (body/head boxes) with VSWAT range staff, since the course sheet doesn't define the zones.",
  },
  "courses": {
    "pistol": [
      ["1", "25 yd", "From holster, draw and fire 3 rds", "12 s", 3, "Marksmanship"],
      ["2", "15 yd", "Dummy randomly in first 5 rds; draw, fire 7 total", "15 s", 7, "Malfunction clearance"],
      ["3", "10 yd", "First mag random <4 rds; draw, fire 6 total", "10 s", 6, "Speed reload"],
      ["4", "10→3 yd", "SOM from ready: 5 body + 1 head", "6 s", 6, "SOM, marksmanship"],
      ["5", "7 yd", "Draw and fire 6", "5 s", 6, "Recoil control"],
      ["6", "5 yd", "Draw: 4 head 2H, 4 body SHO, 4 body WHO", "15 s", 12, "Strong/weak hand"],
    ],
    "carbine": [
      ["1", "50 yd", "5 rds to body, any position", "20 s", 5, "Marksmanship"],
      ["2", "25 yd", "3 body strong side + 3 body support side; SAFE when transitioning", "12 s", 6, "Strong/support"],
      ["3", "25 yd", "Mag preset: 1 dummy + up to 7 live; fire 10 (malf + speed reload)", "18 s", 10, "Malfunction/manipulation"],
      ["4", "15→7 yd", "SOM: 5 body + 1 head, all before the 7-yd line", "7 s", 6, "SOM, zone transition"],
      ["5", "10 yd", "10 to the body", "5 s", 10, "Recoil management"],
      ["6", "7 yd", "Rifle loaded with 2: 2 head (rifle), transition, 1 head (pistol)", "5 s", 3, "Accuracy & transition"],
    ],
    "rules": "40 rds / 40 pts. 100% hits required. Min 80% (32 pts) · FW NEW SWAT OFFICER min 70% (28 pts). Each round fired over time = −1 pt. FWPD pistol + rifle quals are pass/fail (≤ 2 attempts); VSWAT courses are one attempt and ranked.",
  },
}
