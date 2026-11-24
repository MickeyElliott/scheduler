# v2 nutrition: 3 meals + 1 shake, patrol-portable, wife-managed prep.
NUTRITION = {
  "targets": [
    ["Structure", "3 meals + 1 Huel shake a day. Carbs go in the meals before and after training"],
    ["Calories", "≈ 2,300 kcal on training days · ≈ 2,200 on recovery days (docx range 2,200-2,400)"],
    ["Protein", "≈ 180-200 g (docx 170-180 minimum), about 45-65 g per meal + 40 g from the shake"],
    ["Carbs", "≈ 220 g, with ~70% in the pre- and post-training meals"],
    ["Fat", "≈ 65-75 g"],
    ["Rate", "Lose 0.5-1.0 lb/week. If you're losing more than 1.5 lb/week for 2 weeks or your performance drops, add 150 kcal of carbs. Performance comes first"],
    ["Hydration", "3.5 L baseline + 0.5-0.75 L per training hour. Patrol car: one 1 L bottle + electrolytes in the cooler, refill at the station. Taper off 60 min before sleep"],
    ["Caffeine", "≤ 400 mg/day. Shift nights: last dose by 01:00 (6 h before 07:30 sleep)"],
  ],
  "supplements": [
    ["Creatine monohydrate", "5 g daily, every day. Mix it into the Huel shake so it can't be forgotten"],
    ["Huel Black Edition", "1 serving/day as the shake (~400 kcal / 40 g protein per docx). Keep powder pre-measured in a shaker in the cooler bag"],
    ["Mars Men (optional)", "Per docx: continue if tolerated. Check the label with your physician"],
    ["Electrolytes", "1 packet on shift nights and after long Zone 2 sessions"],
  ],
  "templates": {
    "shift": {"name": "Shift day (Tue-Fri): sleep 07:30-14:30, train ~16:00 at home", "meals": [
      ["14:45", "Meal 1: Breakfast (pre-training)", "Overnight protein oats jar + 3 egg bites", "≈ 640 kcal · 52 P"],
      ["17:30", "Meal 2: Dinner (post-training, biggest)", "7 oz chili-lime chicken + 1½ cups rice + broccoli", "≈ 730 kcal · 66 P"],
      ["≈ 23:30", "Meal 3: Shift meal (portable)", "Turkey burrito bowl (eat cold or microwave at the station) OR beef chili in a food thermos + apple", "≈ 520-560 kcal · 40-48 P"],
      ["≈ 03:00", "Shake", "Huel Black + 5 g creatine in a shaker", "≈ 400 kcal · 40 P"],
    ], "total": "≈ 2,300 kcal · ≈ 200 P. Nothing heavy after 04:00 or before day sleep"},
    "off": {"name": "Off day (Sat-Mon)", "meals": [
      ["≈ 09:15", "Meal 1: Breakfast", "3 eggs + 1 cup egg whites scramble w/ spinach, ½ cup (dry) oats + berries", "≈ 630 kcal · 52 P"],
      ["post-workout", "Shake", "Huel Black + 5 g creatine", "≈ 400 kcal · 40 P"],
      ["≈ 14:00", "Meal 2: Lunch", "Turkey burrito bowl + 1 cup rice + green beans", "≈ 600 kcal · 48 P"],
      ["≈ 18:30", "Meal 3: Dinner", "6 oz salmon (or 1 bowl chili) + roasted sweet potato + salad · Greek yogurt + berries for dessert", "≈ 740 kcal · 58 P"],
    ], "total": "≈ 2,370 kcal · ≈ 200 P"},
  },
  "rules": [
    "Patrol: everything you eat on shift has to work cold, in one hand, or come out of a thermos. No meals that need plating.",
    "If a call wipes out the shift meal, have the shake first and eat the bowl when you can. Don't skip both.",
    "Can't eat the plan? Plate rule: 2 palms of protein, 1-2 fists of carbs (more on training days), 2 fists of vegetables.",
    "Thanksgiving: walk first, protein first, one plate, one dessert slice.",
    "Food safety (USDA): cooked meat keeps 3-4 days in the fridge. The Thu-Sun portions get frozen on prep day and thawed in the fridge the night before.",
  ],
}

RECIPES = [
  {"id": "oats", "name": "Overnight protein oats", "makes": "4 jars (Tue-Fri breakfasts)", "time": "10 min",
   "ing": ["200 g rolled oats (½ cup + 2 tbsp per jar)", "680 g plain 0% Greek yogurt (¾ cup per jar)", "400 g frozen mixed berries", "4 tbsp chia seeds", "Cinnamon, splash of milk"],
   "steps": ["In each jar: 50 g oats, 170 g yogurt, 1 tbsp chia, 100 g berries, cinnamon, splash of milk.", "Stir, lid, refrigerate. Good for 4-5 days."],
   "macro": "per jar ≈ 400 kcal · 28 g protein"},
  {"id": "eggbites", "name": "Egg bites (muffin tin)", "makes": "12 bites (3 per breakfast, Tue-Fri)", "time": "30 min",
   "ing": ["12 large eggs", "1 cup liquid egg whites", "1 cup chopped spinach, ½ bell pepper, ¼ onion", "¼ cup shredded reduced-fat cheese", "Salt, pepper"],
   "steps": ["Oven 350°F. Grease a 12-cup muffin tin.", "Whisk the eggs and whites, then stir in the veg.", "Fill the cups ¾ full and top with cheese.", "Bake 20-22 min. Cool, then refrigerate. Keeps 5 days."],
   "macro": "per 3 bites ≈ 240 kcal · 24 g protein"},
  {"id": "chicken", "name": "Sheet-pan chili-lime chicken", "makes": "5 portions of 7 oz cooked (Tue-Fri dinners + 1 spare)", "time": "40 min",
   "ing": ["3 lb boneless skinless chicken breast", "1 tbsp olive oil", "1 lime (juice + zest)", "2 tsp chili powder, 1 tsp cumin, 1 tsp garlic powder, 1 tsp smoked paprika, 1½ tsp salt"],
   "steps": ["Oven 425°F. Butterfly thick breasts so they cook evenly.", "Toss with oil, lime and spices.", "Roast 18-22 min to 165°F inside. Rest 5 min, then slice.", "Portion into 5 containers with 1½ cups rice + broccoli. Fridge 2 (Tue, Wed), freeze 3 (Thu, Fri, spare)."],
   "macro": "per 7 oz chicken ≈ 330 kcal · 62 g protein"},
  {"id": "turkey", "name": "Turkey burrito bowls", "makes": "6 bowls (2 shift meals + 3 lunches + 1 spare)", "time": "30 min",
   "ing": ["3 lb 93/7 ground turkey", "2 bell peppers + 1 onion, diced", "1 can (15 oz) black beans, rinsed", "1 jar (16 oz) salsa", "2 tbsp low-sodium taco seasoning", "Rice (from the batch) + frozen green beans"],
   "steps": ["Brown the turkey and drain.", "Add peppers and onion, cook 5 min.", "Stir in beans, salsa and seasoning, simmer 10 min.", "Bowls: turkey mix + ¾-1 cup rice + green beans. Use leak-proof containers. These are eaten in the patrol car, cold or microwaved.", "Fridge 2 (Mon lunch, Tue shift), freeze 4."],
   "macro": "per bowl ≈ 560-600 kcal · 46-48 g protein"},
  {"id": "chili", "name": "Lean beef & bean chili (thermos meal)", "makes": "6 bowls (2 shift meals + 1 dinner + 3 frozen for next week)", "time": "50 min",
   "ing": ["2 lb 93% lean ground beef", "1 onion + 4 cloves garlic", "2 cans (15 oz) kidney or pinto beans", "1 can (28 oz) crushed tomatoes", "2 tbsp chili powder, 1 tbsp cumin, salt"],
   "steps": ["Brown the beef with the onion and garlic.", "Add everything else and simmer 30 min.", "Portion into 6. Fridge 1, freeze 5.", "Shift nights: heat until steaming. Pre-heat the thermos with boiling water for 5 min, dump it, then fill with chili."],
   "macro": "per bowl ≈ 420 kcal · 40 g protein"},
  {"id": "carbs", "name": "Rice, sweet potatoes & veg", "makes": "the week's sides", "time": "60 min (runs alongside)",
   "ing": ["4 cups dry jasmine rice (≈ 12 cups cooked)", "1½ lb sweet potatoes, cubed", "2 lb broccoli florets", "1 lb frozen green beans", "1 tbsp olive oil"],
   "steps": ["Rice cooker: 4 cups rice.", "Roast the sweet potato at 425°F for 30 min.", "Roast the broccoli at 425°F for 15-18 min.", "Green beans go straight into the turkey bowls frozen (they thaw in the fridge)."],
   "macro": "1 cup rice ≈ 205 kcal · 200 g sweet potato ≈ 180 kcal"},
  {"id": "salmon", "name": "Salmon (cook the day of)", "makes": "2 dinners (Mon + Sat)", "time": "15 min",
   "ing": ["2 × 6 oz salmon fillets (frozen bag is fine)", "Lemon, salt, pepper"],
   "steps": ["Fresh: cook within 2 days (Monday's). Frozen: thaw in the fridge overnight (Saturday's).", "Air fryer at 400°F for 8-10 min, or oven at 425°F for 12 min."],
   "macro": "per fillet ≈ 350 kcal · 38 g protein"},
]

GROCERY = [
  ["Produce", ["Baby spinach: 1 clamshell (5 oz)", "Bell peppers: 3", "Onions: 2", "Garlic: 1 head", "Limes: 1 · Lemons: 1", "Sweet potatoes: 1½ lb", "Broccoli florets: 2 lb", "Salad mix: 1 bag", "Apples: 4", "Bananas: 3"]],
  ["Meat & seafood", ["Chicken breast, boneless skinless: 3 lb", "Ground turkey 93/7: 3 lb", "Ground beef 93% lean: 2 lb", "Salmon fillets: 2 × 6 oz (or a frozen bag)"]],
  ["Dairy & eggs", ["Eggs: 2 dozen", "Liquid egg whites: 32 oz carton", "Plain 0% Greek yogurt: 2 × 32 oz tubs", "Reduced-fat shredded cheese: small bag", "Milk (splash for the oats)"]],
  ["Pantry & canned", ["Rolled oats (large canister)", "Jasmine rice: 2 lb bag (4 cups used)", "Black beans: 1 can · Kidney or pinto beans: 2 cans", "Crushed tomatoes: 1 can (28 oz)", "Salsa: 1 jar (16 oz)", "Chia seeds", "Spices: chili powder, cumin, smoked paprika, garlic powder, low-sodium taco seasoning, cinnamon", "Olive oil"]],
  ["Frozen", ["Mixed berries: 2 lb bag", "Green beans: 1 lb bag"]],
  ["Other", ["Huel Black Edition: 7 servings (check supply)", "Creatine monohydrate: check supply", "Electrolyte packets: 7", "Leak-proof meal containers (if needed)", "Food thermos 16-24 oz + insulated lunch cooler + ice pack (one-time)"]],
]

# Wife-facing week menu. type: off | shift | postshift
MENU = [
  {"date": "2026-11-30", "label": "Mon Nov 30", "type": "off", "note": "Day off. Big training day.", "meals": [
    ["9:15 am", "Breakfast", "Egg + egg-white scramble with spinach, oats with berries"],
    ["12:00 pm", "Shake", "Huel + creatine (after his workout)"],
    ["2:00 pm", "Lunch", "Turkey burrito bowl"],
    ["6:30 pm", "Dinner", "Salmon, roasted sweet potato, salad · yogurt + berries for dessert"]]},
  {"date": "2026-12-01", "label": "Tue Dec 1", "type": "shift", "note": "First work night. He's up at 10 am, trains at home ~4 pm, leaves ~8 pm.", "meals": [
    ["10:30 am", "Breakfast", "Overnight oats jar + 3 egg bites"],
    ["5:30 pm", "Dinner", "Chili-lime chicken + rice + broccoli"],
    ["~11:30 pm", "Shift meal (packed)", "Turkey burrito bowl"],
    ["~3:00 am", "Shake (packed)", "Huel + creatine"]], "pack": ["Turkey burrito bowl (leak-proof container)", "Huel powder pre-measured in a shaker + creatine", "Electrolyte packet + 1 L water bottle", "Apple", "Ice pack in the cooler bag"]},
  {"date": "2026-12-02", "label": "Wed Dec 2", "type": "shift", "note": "Work night. Sleeps 7:30 am-2:30 pm.", "meals": [
    ["2:45 pm", "Breakfast", "Overnight oats jar + 3 egg bites"],
    ["5:30 pm", "Dinner", "Chili-lime chicken + rice + broccoli"],
    ["~11:30 pm", "Shift meal (packed)", "Beef chili in the thermos + apple"],
    ["~3:00 am", "Shake (packed)", "Huel + creatine"]], "pack": ["Chili heated until steaming → pre-heated thermos", "Spoon", "Huel shaker + creatine", "Electrolytes + water bottle", "Apple"], "tonight": "Move Thursday's chicken dinner + turkey bowl from the freezer to the fridge."},
  {"date": "2026-12-03", "label": "Thu Dec 3", "type": "shift", "note": "Work night. Hard training day.", "meals": [
    ["2:45 pm", "Breakfast", "Overnight oats jar + 3 egg bites"],
    ["5:30 pm", "Dinner", "Chili-lime chicken + rice + broccoli (thawed)"],
    ["~11:30 pm", "Shift meal (packed)", "Turkey burrito bowl"],
    ["~3:00 am", "Shake (packed)", "Huel + creatine"]], "pack": ["Turkey burrito bowl", "Huel shaker + creatine", "Electrolytes + water bottle", "Apple"], "tonight": "Move Friday's chicken dinner + one chili from the freezer to the fridge."},
  {"date": "2026-12-04", "label": "Fri Dec 4", "type": "shift", "note": "Last work night of the week.", "meals": [
    ["2:45 pm", "Breakfast", "Overnight oats jar + 3 egg bites"],
    ["5:30 pm", "Dinner", "Chili-lime chicken + rice + broccoli (thawed)"],
    ["~11:30 pm", "Shift meal (packed)", "Beef chili in the thermos + apple"],
    ["~3:00 am", "Shake (packed)", "Huel + creatine"]], "pack": ["Chili (thawed, heated) → thermos", "Spoon", "Huel shaker + creatine", "Electrolytes + water bottle", "Apple"], "tonight": "Move 2 turkey bowls, 1 salmon fillet and 1 chili from the freezer to the fridge for the weekend."},
  {"date": "2026-12-05", "label": "Sat Dec 5", "type": "postshift", "note": "Gets home ~7 am and sleeps until ~12:30. Trains mid-afternoon.", "meals": [
    ["1:00 pm", "Breakfast", "Egg scramble + oats + berries"],
    ["4:15 pm", "Shake", "Huel + creatine (after his workout)"],
    ["6:30 pm", "Dinner", "Salmon, sweet potato, salad"],
    ["9:00 pm", "Light Meal 3", "Turkey burrito bowl (small portion) or Greek yogurt + berries"]]},
  {"date": "2026-12-06", "label": "Sun Dec 6", "type": "off", "note": "Fitness check in the morning, at the range midday. PREP DAY for next week.", "meals": [
    ["8:30 am", "Breakfast", "Egg scramble + oats + berries"],
    ["10:45 am", "Shake", "Huel + creatine"],
    ["3:45 pm", "Lunch (late)", "Turkey burrito bowl"],
    ["6:30 pm", "Dinner", "Beef chili + salad · yogurt + berries"]]},
]

PREP_STEPS = [
  ["0:00", "Oven to 425°F. Start the rice cooker (4 cups rice). Take out every container."],
  ["0:05", "Season the chicken (oil, lime, spices) and put it on a sheet pan. Cube the sweet potatoes onto a 2nd pan."],
  ["0:15", "Chicken + sweet potatoes into the oven (chicken 18-22 min, potatoes 30 min)."],
  ["0:20", "Big skillet: brown the turkey, drain, add peppers + onion."],
  ["0:35", "Chicken out (check 165°F) and rest. Broccoli into the oven, 15-18 min."],
  ["0:40", "Finish the turkey: beans, salsa, seasoning, simmer 10 min."],
  ["0:45", "Pot #2: brown the beef with onion + garlic, add beans, tomatoes, spices, simmer 30 min."],
  ["0:55", "Oven down to 350°F. Mix the egg bites and bake 20-22 min."],
  ["1:00", "Make 4 overnight-oat jars."],
  ["1:20", "Slice the chicken. Portion 5 chicken dinners (7 oz chicken + 1½ cups rice + broccoli)."],
  ["1:30", "Portion 6 turkey bowls (turkey mix + ¾-1 cup rice + frozen green beans)."],
  ["1:40", "Chili done: portion into 6."],
  ["1:50", "Label everything with the DAY it's for. Fridge: 2 chicken (Tue, Wed), 2 turkey (Mon, Tue), 1 chili (Wed), oats, egg bites, Monday's salmon. FREEZER: everything else."],
  ["2:00", "Done. Clean up and refill Huel shakers + creatine for the week."],
]
