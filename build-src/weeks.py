# v2 schedule. (start, end, track, title, ref, items, short, flags)
from v2_overrides import FLASH
def B(s,e,t,title,ref=None,items=None,short=None,note=None,flex=False,onshift=False):
    return {"start":s,"end":e,"track":t,"title":title,"short":short or title,"ref":ref,"items":items or [],
            "note":note,"flex":flex,"onShift":onshift}

def night_tail(flex=None, flash=True):
    out=[]
    if flex:
        out.append(B("01:00","02:00","workout","Flex workout at the work gym, only if calls allow",f"session:{flex}",
            ["Full version, short version, or skipped for calls. All three are fine"],short="Flex workout?",flex=True,onshift=True,
            note="Optional. Radio-up, gear staged. Skip it if you're busy and don't make it up."))
    out.append(B("03:00","03:10","meal","Shake: Huel + creatine (shaker in the cooler)","meal:shift",["Shake down + creatine","Refilled water at the station"],short="Shake",onshift=True))
    if flash:
        out.append(B("04:00","04:15","caselaw","Downtime flashcards (optional, parked only)","cases",FLASH[:1],short="Flashcards?",flex=True,onshift=True))
    return out

def post_shift_sleep(wake="14:30", label="Day sleep (7 h)"):
    return [B("06:45","07:15","recovery","Home: wind down, no food",None,["Sunglasses on the drive home","Phone on DND, room dark & cool"],short="Wind down"),
            B("07:30",wake,"recovery",label,None,["Slept 7 h+ (log it)"],short="Sleep")]

def shift_evening(meal_text="Turkey burrito bowl"):
    return [B("19:45","20:00","meal","Pack the cooler & go","meal:shift",[f"Cooler: {meal_text}, Huel shaker + creatine, electrolytes, 1 L water, apple, ice pack"],short="Pack cooler"),
            B("23:30","23:50","meal",f"Shift meal (portable): {meal_text}","meal:shift",["Ate it (whenever calls allowed)","500 mL water"],short="Shift meal",onshift=True)]

def shift_day_core(m1, dry, session, case, policy, app=None, train=("16:00","17:15")):
    out=[B("14:45","15:15","meal","Meal 1: Breakfast (pre-training)","meal:shift",[m1],short="Meal 1"),
         B("15:20","15:40","firearms",dry[1],f"dry:{dry[0]}",dry[2],short="Dry fire"),
         B(train[0],train[1],"workout",session[1],f"session:{session[0]}",session[2],short=session[3]),
         B("17:30","18:00","meal","Meal 2: Dinner (post-training, biggest meal)","meal:shift",["Chili-lime chicken + 1½ cups rice + broccoli"],short="Meal 2"),
         B("18:15","18:50","caselaw",case[1],f"case:{case[0]}",case[2],short="Case law"),
         B("18:50","19:15","policy",policy[1],f"policy:{policy[0]}",policy[2],short="Policy")]
    if app: out.append(B("19:15","19:45","app",app[0],"app",app[1],short=app[2]))
    return out

W=[]
# ================= PRE-WEEK =================
pre={"id":"pre","label":"Pre-week kickoff","range":"Wed Nov 25 – Sun Nov 29, 2026","days":[]}
pre["days"].append({"date":"2026-11-25","title":"Kickoff: commit + ask","theme":"Start the daily anchors and ask for the rec letter at briefing.","blocks":
  night_tail(None,False)+post_shift_sleep()+[
  B("14:45","15:15","meal","Meal 1: Breakfast","meal:shift",["≥ 45 g protein","Creatine 5 g (day 1)"],short="Meal 1"),
  B("15:30","16:15","workout","P1 Movement school + Zone 2 (home)","session:P1",["Completed P1","Filmed 1 push-up set from the side"],short="P1 Movement"),
  B("16:30","17:00","meal","Meal 2: Dinner","meal:shift",["Protein-forward dinner"],short="Meal 2"),
  B("17:00","17:45","app","Brag sheet for your supervisor","app:brag",["1-page brag sheet written","Printed for briefing"],short="Brag sheet"),
  B("17:45","18:15","firearms","Read both VSWAT qual courses","courses",["12 drill time limits on an index card"],short="Qual courses"),
  B("18:15","18:45","app","Order gear","gear",["Pull-up bar + bands","Snap caps (pistol + rifle)","Shot-timer app","Food thermos + cooler bag + ice packs"],short="Order gear"),
  B("19:45","20:00","meal","Pack the cooler & go","meal:shift",["Shift meal + Huel shaker + water"],short="Pack cooler"),
  B("20:30","20:45","app","At briefing: ASK SUPERVISOR for the recommendation letter","app",["Asked in person","Handed over the brag sheet","Agreed due date: Thu Dec 3"],short="Ask Sgt",onshift=True),
  B("23:30","23:50","meal","Shift meal (portable)","meal:shift",["Ate it when calls allowed"],short="Shift meal",onshift=True)]})
pre["days"].append({"date":"2026-11-26","title":"Thanksgiving","theme":"Walk before the meal, protein first. Set up dry fire safely.","blocks":
  night_tail("F2",False)+post_shift_sleep()+[
  B("14:45","15:00","meal","Meal 1: light breakfast","meal:shift",["Protein-first, light"],short="Meal 1"),
  B("15:00","15:45","workout","P2 Turkey Day walk + rep tax","session:P2",["40-min brisk walk","50 squats / 30 push-ups / 20 sit-ups across the day"],short="Turkey walk"),
  B("16:00","17:30","meal","Meal 2: Thanksgiving dinner","meal:rules",["Protein first, 1 plate","1 dessert slice","No alcohol before shift"],short="Thanksgiving"),
  B("18:00","18:20","firearms","Dry-fire setup + baseline times","dry:DF0",["Safety protocol (no live ammo in room)","Baseline draw / reload / tap-rack logged"],short="Dry fire"),
  B("19:45","20:00","meal","Pack the cooler & go","meal:shift",["Leftover turkey + veg plate, Huel shaker, water"],short="Pack cooler"),
  B("23:30","23:50","meal","Shift meal: Thanksgiving leftovers (turkey + veg)","meal:shift",["Ate it when calls allowed"],short="Shift meal",onshift=True)]})
pre["days"].append({"date":"2026-11-27","title":"Prep the prep","theme":"Easy training. Go over the grocery list with your wife.","blocks":
  night_tail("F1",False)+post_shift_sleep()+[
  B("14:45","15:15","meal","Meal 1: Breakfast","meal:shift",["≥ 45 g protein"],short="Meal 1"),
  B("15:30","16:10","workout","P3 Mobility + Zone 2 (home)","session:P3",["Completed P3"],short="P3 Easy"),
  B("16:30","17:00","meal","Meal 2: Dinner","meal:shift",["Protein-forward dinner"],short="Meal 2"),
  B("17:00","17:30","meal","Walk your wife through meals.html (grocery + prep plan)","grocery",["She has the meals page link","Huel ≥ 7 servings + creatine on hand"],short="Meals w/ wife"),
  B("17:30","17:50","firearms","Dry fire DF1: draw mechanics","dry:DF1",["20 min, safety protocol"],short="Dry fire"),
  B("18:00","18:45","policy","Orientation: re-read the announcement + skim FWPD ch. 4","policy:fwpd4",["Min. quals + 4 selection phases","FWPD ch. 4 contents skimmed"],short="Policy"),
  B("19:45","20:00","meal","Pack the cooler & go","meal:shift",["Shift meal + Huel shaker + water"],short="Pack cooler"),
  B("23:30","23:50","meal","Shift meal (portable)","meal:shift",["Ate it when calls allowed"],short="Shift meal",onshift=True)]})
pre["days"].append({"date":"2026-11-28","title":"Off: reset + shop","theme":"Short sleep, gear set up, groceries bought.","blocks":
  night_tail("F1",False)+[
  B("06:45","07:15","recovery","Home: wind down",None,["Dark, cool room"],short="Wind down"),
  B("07:30","13:00","recovery","Short anchor sleep (5.5 h)",None,["Bed by 23:30 tonight"],short="Sleep"),
  B("13:15","13:45","meal","Meal 1: Breakfast","meal:off",["Egg scramble + oats"],short="Meal 1"),
  B("14:00","14:45","workout","P4 Easy walk + set up the home gym","session:P4",["30-min daylight walk","Pull-up bar + bands set up"],short="P4 Walk/setup"),
  B("15:00","16:15","app","Gather letter material","app:outline",["Training transcript pulled","Certs, commendations, notable calls listed"],short="Letter prep"),
  B("16:30","16:40","meal","Shake: Huel + creatine","meal:off",["Shake + creatine"],short="Shake"),
  B("17:00","17:20","firearms","Dry fire DF2: reloads + malfunctions","dry:DF2",["20 min, safety protocol"],short="Dry fire"),
  B("18:00","18:45","meal","Meal 3: Dinner","meal:off",["Protein-forward dinner"],short="Meal 3"),
  B("19:00","20:15","meal","Grocery run with your wife (list in meals.html)","grocery",["Everything on the list","Thermos + cooler bag if needed"],short="Groceries"),
  B("23:30","23:59","recovery","Lights out (baseline tomorrow)",None,["In bed by 23:30"],short="Bed")]})
pre["days"].append({"date":"2026-11-29","title":"Baseline + meal prep","theme":"Know your numbers. Fill the fridge.","blocks":[
  B("08:30","08:45","recovery","Wake: weigh + resting HR",None,["Weight logged","Resting HR logged"],short="Weigh in"),
  B("09:00","09:20","meal","Meal 1: light, 90+ min before the test","meal:off",["Oats + banana + Greek yogurt"],short="Meal 1"),
  B("10:30","12:15","workout","S0 Baseline: pull-up max · PAT · deadlift · VSWAT","session:S0",["Pull-up max → level set","PAT logged","DL clean load logged","VSWAT scores logged"],short="BASELINE TEST"),
  B("12:20","12:30","meal","Shake: Huel + creatine","meal:off",["Shake + creatine"],short="Shake"),
  B("13:00","13:30","meal","Meal 2: Lunch","meal:off",["≥ 45 g protein + carbs"],short="Meal 2"),
  B("13:30","15:30","meal","Meal prep (your wife leads, meals.html). You chop, portion, label","recipe:all",["Chicken · turkey bowls · chili","Egg bites · oats jars · rice/veg","Labeled by day; Thu-Sun portions frozen"],short="Meal prep"),
  B("16:00","16:20","firearms","Dry fire: re-test baseline times","dry:DF0",["Best/avg times logged"],short="Dry fire"),
  B("16:30","17:15","app","Letter of interest: outline","app:outline",["Bullet outline for all 6 sections"],short="Letter outline"),
  B("18:30","19:15","meal","Meal 3: Dinner","meal:off",["Protein + veg + carbs"],short="Meal 3"),
  B("19:30","20:00","caselaw","Week 1 preview","cases",["Skimmed all 8 case cards"],short="Preview")]})
W.append(pre)

# ================= WEEK 1 =================
w1={"id":"w1","label":"Week 1: Build the base, hard","range":"Mon Nov 30 – Sun Dec 6, 2026","days":[]}
w1["days"].append({"date":"2026-11-30","title":"Strength A · Graham/Garner · Letter draft","theme":"Off day. Big training day and the full letter draft.","blocks":[
  B("09:00","09:15","recovery","Wake: weigh + resting HR",None,["Weight","Resting HR"],short="Weigh in"),
  B("09:15","09:45","meal","Meal 1: Breakfast","meal:off",["Egg scramble + oats + berries"],short="Meal 1"),
  B("10:30","11:50","workout","S1 Strength A + Engine (home or work gym)","session:S1",["Warm-up","Deadlift 5×5 (log load)","Pull-ups per level ×5","Push-ups 5×60%","Goblet squat + hollow ×3","Zone 2 30 min","Mobility"],short="S1 Strength A"),
  B("12:00","12:10","meal","Shake: Huel + creatine","meal:off",["Shake + creatine"],short="Shake"),
  B("12:30","13:15","caselaw","Graham v. Connor + Tennessee v. Garner","case:graham,garner",["Read both holdings","3-5 bullets each","Both quizzes out loud"],short="Case law"),
  B("13:15","13:45","policy","RCW 10.120: Washington's use-of-force statute","policy:rcw10120",["Read 10.120.010-.020","Recite 'necessary' + the deadly-force trigger"],short="Policy"),
  B("14:00","14:30","meal","Meal 2: Lunch","meal:off",["Turkey burrito bowl"],short="Meal 2"),
  B("14:45","15:05","firearms","Dry fire DF1: draw + recoil mechanics","dry:DF1",["Draw → press at a 2.0 s par × 20"],short="Dry fire"),
  B("15:15","17:00","app","Letter of interest: full draft","app:outline",["Full draft ≤ 2 pages","Read aloud once","Draft + brag sheet sent to supervisor"],short="Letter draft"),
  B("18:30","19:15","meal","Meal 3: Dinner","meal:off",["Salmon + sweet potato + salad","Yogurt + berries"],short="Meal 3"),
  B("21:30","21:45","recovery","Mobility + late wind-down",None,["10-min mobility","Bed ~02:00 (sleep in before tomorrow's first night)"],short="Wind down")]})
w1["days"].append({"date":"2026-12-01","title":"PAT power · Barnes · FWPD ch. 4 · night 1","theme":"First night. Study early, nap, train before you leave.","blocks":[
  B("10:00","10:15","recovery","Wake (slept 02:00-10:00)",None,["Weight","8 h in bed"],short="Wake"),
  B("10:30","11:00","meal","Meal 1: Breakfast","meal:shift",["Oats jar + 3 egg bites"],short="Meal 1"),
  B("11:30","12:15","caselaw","Barnes v. Felix (+ Scott v. Harris)","case:barnes,scott",["Read the Barnes syllabus","Explain 'moment-of-threat' and why it was rejected"],short="Case law"),
  B("12:15","12:45","policy","FWPD MOS ch. 4 §4.1.1-4.1.6","policy:fwpd4",["Read incl. footnotes 1, 2, 11","10 force factors from memory"],short="Policy"),
  B("13:00","13:20","firearms","Dry fire DF2: malfunctions + reloads","dry:DF2",["Tap-rack at a 1.6 s par × 10","Slide-lock reload at a 3.0 s par × 10"],short="Dry fire"),
  B("13:30","15:00","recovery","Pre-shift nap (90 min)",None,["Napped 60-90 min"],short="Nap"),
  B("15:45","17:00","workout","S2 PAT power + intervals (home gym)","session:S2",["Push-ups 5×50%","Sit-ups 4×50%","Squat-thrust EMOM 10","Intervals 8×30/90"],short="S2 PAT power"),
  B("17:30","18:00","meal","Meal 2: Dinner (post-training)","meal:shift",["Chicken + rice + broccoli"],short="Meal 2"),
  B("18:00","19:15","app","Letter revision #1","app:outline",["Revised","Cut to ≤ 2 pages"],short="Letter rev"),
]+shift_evening()})
w1["days"].append({"date":"2026-12-02","title":"Pull volume · Payton · AG model policy","theme":"Night 2. Moderate pre-shift session. Tonight's flex hour is low-fatigue only, because tomorrow is the hard day.","blocks":
  night_tail("F1")+post_shift_sleep()+shift_day_core("Oats jar + 3 egg bites",("DF3","Dry fire DF3: strong/weak hand",["Strong-hand-only at a 2.6 s par","Weak-hand transfer at a 2.4 s par","3 × full Drill 6 dry"]),
   ("S3","S3 Engine + pull volume (home gym)",["Zone 2 35 min (log avg HR)","Pull volume 5 sets","Core"],"S3 Pull + Z2"),
   ("payton","Payton v. New York + Steagald",["Holdings + quiz","3-question pre-entry checklist"]),
   ("agmodel","AG model use-of-force policy + RCW 9A.16.040",["Critical decision making + de-escalation","Civil vs. criminal standards"]),
   ("Letter: peer review",["Sent to a current/former SWAT member or trusted Sgt"],"Peer review"))+shift_evening("Beef chili in the thermos + apple")})
w1["days"].append({"date":"2026-12-03","title":"VSWAT pacing · emergency aid · RCW 10.116","theme":"Night 3. Hard rehearsal before shift and no flex workout tonight. Lock in the letter.","blocks":
  night_tail("F2")+post_shift_sleep()+shift_day_core("Oats jar + 3 egg bites",("DF4","Dry fire DF4: carbine mount/transitions/SAFE",["Mount at a 1.3 s par","Shoulder transition with SAFE at a 2.5 s par","Malfunction/reload at a 3.5 s par"]),
   ("S4","S4 VSWAT pacing rehearsal (home gym)",["6-min AMRAP @ target split (log)","2 × 2-min DL/burpee (log both)","Accessory"],"S4 VSWAT pacing"),
   ("brigham","Brigham City + State v. Schultz / Boisselle",["Federal vs. WA test side by side","Quiz answered"]),
   ("rcw10116","RCW 10.116: tactics & equipment",["Tear-gas 4 steps memorized","'Barricaded subject' + 'hostage situation' definitions","Face-covering SWAT exception"]),
   ("Finalize the letter",["Peer comments applied","Saved as PDF","Rec letter due tonight: confirmed"],"Finalize letter"))+shift_evening()+[
  B("20:30","20:45","app","At briefing: collect your supervisor's rec letter","app",["Rec letter received (PDF/signed)"],short="Rec letter",onshift=True)]})
w1["days"].append({"date":"2026-12-04","title":"Recovery · Kentucky v. King · SUBMIT","theme":"Night 4. Light before shift, easy flex hour if calls allow. SUBMIT the packet.","blocks":
  night_tail(None)+post_shift_sleep()+shift_day_core("Oats jar + 3 egg bites",("DF5","Dry fire DF5: SOM + rifle → pistol",["Hallway SOM at a 6 s / 7 s par","Transition at a 2.0 s par × 10"]),
   ("S5","S5 Recovery + mobility (home)",["Zone 1-2 walk 20 min","Full mobility","3 easy pull-up sets"],"S5 Recovery"),
   ("king","Kentucky v. King",["Holding + quiz","Note: ask the DPA how WA applies King"]),
   ("rcw1031","RCW 10.31.040 + 10.93.190 + FWPD 4.1.7-4.1.10",["Read all four","Duty to intervene in 30 s"]),
   ("SUBMIT the application through your chain of command",["Email Sgt/Lt → Cmdr. Klingele with both PDFs","Subject: 'Valley SWAT Selection: Letter of Interest & Recommendation, Ofc. M. Elliott'","Sent copy saved"],"SUBMIT"))+shift_evening("Beef chili in the thermos + apple")})
w1["days"].append({"date":"2026-12-05","title":"Strength B · Knock-and-announce · FWPD ch. 46","theme":"Post-shift. Short sleep, then strength (follow the fatigue rule).","blocks":
  night_tail("F1")+[
  B("06:45","07:15","recovery","Home: wind down",None,["Dark, cool room"],short="Wind down"),
  B("07:30","12:30","recovery","Anchor sleep (5 h)",None,["Bed by 23:00 tonight"],short="Sleep"),
  B("13:00","13:30","meal","Meal 1: Breakfast","meal:off",["Egg scramble + oats"],short="Meal 1"),
  B("14:00","14:20","firearms","Dry fire DF6: full pistol course dry","dry:DF6",["All 6 drills at official times","Hardest drill noted"],short="Dry fire"),
  B("15:00","16:10","workout","S6 Strength B (home or work gym)","session:S6",["Fatigue rule checked","DL 5×3 (log load)","3 ladders","Lunge/carry ×3","Burpee EMOM 5"],short="S6 Strength B"),
  B("16:15","16:25","meal","Shake: Huel + creatine","meal:off",["Shake + creatine"],short="Shake"),
  B("17:00","17:45","caselaw","Knock-and-announce cluster + State v. Coyle","case:knock",["Wilson/Richards/Banks/Hudson","Coyle: 4 steps + 3 purposes"],short="Case law"),
  B("17:45","18:15","policy","FWPD reporting/qual + SWAT standards (ch. 46)","policy:fwpd46",["4.2-4.3 + 46.2.2, 46.2.9, 33.6.2","PowerDMS pull list"],short="Policy"),
  B("18:30","19:15","meal","Meal 2: Dinner","meal:off",["Salmon + sweet potato + salad"],short="Meal 2"),
  B("19:30","20:30","meal","Grocery run with your wife (meals.html list)","grocery",["Full list bought for Sunday's prep"],short="Groceries"),
  B("20:30","21:00","firearms","Range prep","live",["Range confirmed","≈200 pistol / 140 rifle rds","Dummies, targets, timer, score sheet","Partner confirmed"],short="Range prep"),
  B("21:00","21:20","meal","Meal 3: light","meal:off",["Small turkey bowl or yogurt + berries"],short="Meal 3"),
  B("23:00","23:30","recovery","Lights out",None,["In bed by 23:00"],short="Bed")]})
w1["days"].append({"date":"2026-12-06","title":"Checkpoint: PAT mock · live fire · prep","theme":"Measure, shoot the real courses, refill the fridge, review the week.","blocks":[
  B("08:00","08:15","recovery","Wake: weigh + resting HR",None,["Weight","Resting HR"],short="Weigh in"),
  B("08:30","09:00","meal","Meal 1: Breakfast","meal:off",["Egg scramble + oats"],short="Meal 1"),
  B("09:30","10:40","workout","S7 PAT mock + Zone 2 (home gym)","session:S7",["PAT mock logged (vs baseline)","Zone 2 30 min"],short="S7 PAT mock"),
  B("10:45","10:55","meal","Shake: Huel + creatine","meal:off",["Shake + creatine","Electrolytes for the range"],short="Shake"),
  B("12:30","15:30","firearms","Live fire: VSWAT pistol ×2 + carbine ×1-2","live",["Warm-up 25 rds","Pistol run 1 scored","Remedial on the worst drill","Pistol run 2 scored","Carbine zero check","Carbine run 1 scored","Remedial SOM + 10-in-5","Scores entered in Logs"],short="LIVE FIRE"),
  B("15:45","16:15","meal","Meal 2: Late lunch","meal:off",["Turkey burrito bowl"],short="Meal 2"),
  B("16:15","18:15","meal","Meal prep for Week 2 (your wife leads). You chop, portion, label","recipe:all",["Batch cooked","Portioned + labeled by day","Thu-Sun frozen"],short="Meal prep"),
  B("18:30","19:15","meal","Meal 3: Dinner","meal:off",["Beef chili + salad","Yogurt + berries"],short="Meal 3"),
  B("19:15","19:50","caselaw","Week 1 self-test + interview practice","cases",["All 8 quizzes answered cold","2-min voice memo: a dynamic-entry use-of-force scenario","5 expected interview questions"],short="Self-test"),
  B("19:50","20:15","policy","Build the 1-page cheat sheet","policy",["RCW 10.120 · 10.116 · 10.31.040 · 10.93.190 · FWPD ch. 4"],short="Cheat sheet"),
  B("20:15","21:00","recovery","Weekly review","dashboard",["Dashboard reviewed","7-day avg weight","Baseline vs. checkpoint","Week 2 pull-up level + DL load set"],short="Review"),
  B("21:00","21:15","app","Deadline check (due Mon 09:00)","app",["Receipt confirmed (or will confirm Mon AM)"],short="Deadline check")]})
W.append(w1)
WEEKS=W
