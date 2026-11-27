# Scheduler: Valley SWAT prep

A plan and tracker for Valley SWAT selection prep, plus a meal page for the person doing the meal prep.

| Page | Link | For |
|---|---|---|
| Tracker | https://mickeyelliott.github.io/scheduler/ | Calendar, day plan, tracks, progress, logs, settings |
| Meals | https://mickeyelliott.github.io/scheduler/meals.html | Today's meals with amounts, food search, week menu, shopping list, cooking |
| Daily Study | https://mickeyelliott.github.io/scheduler/study/ | Separate study app, no login: today's cards, MOS exact text, case law, RCWs |

## Daily Study app (`study/`)

A separate home-screen app just for studying. There's no login: progress is saved on the phone.

- **Today.** Opens on today's to-do list: the card session (cards that are due plus a few new ones, mixed across MOS, case law and RCW), an RCW of the day, a case of the day, an MOS section of the day, and an optional scenario or oral-board question. It also shows a day streak and has Quick 5.
- **Practice.** Flashcards by pillar (due, new 10, shuffle 20). Tap a card to flip it, swipe right for got it, swipe left to see it again. Same Leitner boxes as SWAT Prep: 1, 2, 4, 8, 16 days. Also scenarios with the model answer hidden until you reveal it, and oral-board questions with a 2-minute timer.
- **Library.** One search box covers everything.
  - **MOS:** the exact text of FWPD MOS Ch. 4 (rev. 05-18-2026), Ch. 41 (rev. 12-08-2025) and Ch. 46 (rev. 03-17-2025), by chapter and section number. Each section shows its source and revision date, links to its study points and cards, and has a flag where the source text is cut off (46.2.2, 46.2.4).
  - **Case law:** federal and Washington cases, each with the holding and a link to the opinion.
  - **RCWs:** 29 sections, each with a plain-English summary, the key language, the official text (copied from app.leg.wa.gov on 2026-11-26) and a link to the official page.
- **Progress.** Streak, the last 14 days, cards seen and mastered by pillar, and reading counts. Settings for new cards per day, plus export, import and reset.
- **Offline.** Works with no signal after the first open, because its own service worker caches the app and its data.
- **Install.** Open the link above in Safari, then Share → Add to Home Screen → Add. It installs as "Daily Study".
- **Progress is per device.** It doesn't sync, and it doesn't carry over from SWAT Prep's Study tab.
- **Building it.** `python3 build-src/build_study.py` builds the app. It reads the RCW and case notes in `build-src/study_app/`, plus the MOS extracts and study notes from `$STUDY_SRC` (default `/workspace/swat-study`). Those source files are not committed. Only the built `study/data.json` is.

## What it does

- **Opens on Today.** After 30+ minutes away it jumps to today: a "Right now / Up next" card with one Open button, earlier blocks folded away, and meal blocks link to the food page.
- **Sign-in is just the email.** Tap the dot (or Study → Sign in), type the shared email, tap Sign in. No password, no code, no email. See [SETUP.md](SETUP.md#signing-in-each-phone-once).

- **Remembers where you were.** Each device keeps its own view, tab, week, day, open sections, filters, scroll position and open block.
- **Syncs between devices** through Supabase: checkmarks, logs, schedule settings, plan edits, grocery and packing checks, and meal edits.
  - Works offline. Changes queue up and upload when the phone has signal again.
  - Changes from the other device show up live, in about a second.
  - When two devices change the same thing, the newest change wins.
  - If you are not signed in, everything still saves on that device. The status pill in the header shows the state: Local only, Synced, Offline · N pending, or Sign in to sync.
- **Edit the plan.**
  - Open any block, tap **Edit**, and change the day, time, track, title, notes, checklist or status (done, moved or skipped). You can also delete it.
  - **Add block** is on the calendar and the day view.
  - Edits are stored on top of the base plan. **Reset to plan** undoes one, and Settings → Plan edits lists all of them.
- **Study tab (private).** A banner at the top links to the Daily Study app. Policy outlines for FWPD MOS Ch. 4 (rev. 05-18-2026), Ch. 41 and Ch. 46, plus case-law briefs with quizzes and an oral-board section where you fill in your own examples.
  - Flashcards use spaced repetition (Leitner boxes). Patrol quick 5 is a big-button mode for downtime in the car.
  - Scenarios step through each decision point.
  - Study opens on one Start button for due cards; Oral board, the 12-week map and the "To verify" list are under More.
  - Study blocks on the calendar and day view link to the matching sections and cards.
  - The content is **not in this repo**. It lives in Supabase (`study_content`), only the allowlisted login can read it, and it's saved on the device after the first load so it works without signal. Progress syncs like everything else. Signing out removes the saved copy.
- **Study reminders.** Optional daily push notification on iPhone (home-screen app, iOS 16.4+): how many cards are due and what to drill. Turn it on under More → Settings → Study reminders; default 7:00 PM Pacific, changeable. See [SETUP.md](SETUP.md#study-reminders-push-notifications).
- **iPhone app.** Both pages install to the home screen (Safari → Share → Add to Home Screen) and run full screen, offline too. See [SETUP.md](SETUP.md#iphone-put-it-on-the-home-screen).
  - Phone layout: bottom tab bar (Today, Week, Food, Study, More; Progress, Tracks, Logs and Settings are under More), a compact header, and 44px+ tap targets.
  - The calendar opens as a one-day agenda with a week strip. Swipe left or right to change day, or switch to the week grid.
  - Details and the editor open as bottom sheets; drag them down to close.
  - Flashcards and Patrol quick 5 are full screen. Swipe right for got it, left for missed.
  - Meal page: opens on Today (each meal with its amounts, what to pack tonight, tomorrow's preview), a search box that finds a food across the shopping list, meals and recipes, bottom tabs (Today, This week, Shop, Cook), big checkboxes, and grocery section headers that stay at the top while you scroll.
- **Meal page edit mode.** The Edit button lets you change, remove or add meals and add or remove grocery items. Removed items can be put back.

See [SETUP.md](SETUP.md) for the Supabase and sign-in setup.

## Layout

```
index.html, meals.html   built pages (served by GitHub Pages)
config.js                Supabase URL + publishable key (public by design; RLS protects the data)
build-src/               templates, plan data (Python) and js/sync.js; run: python3 build-src/build.py
plan/                    plan-data.json and week1-plan.md generated by the build
supabase/schema.sql      tables, row-level security, realtime, allowlist, study_content table (no content)
tools/                   headless-Chrome screenshot, two-device sync and study tests, study seed script
icons/, *.webmanifest    home-screen icons and app manifests (tracker + meals + study)
study/                   Daily Study app (index.html, data.json, sw.js, manifest), built by build-src/build_study.py
sw.js                    offline app shell (never caches Supabase calls or study content)
docs/screenshots/        screenshots (iphone-*.png are signed-out phone views)
```

> SWAT Prep's Study tab content still lives only in Supabase, behind the login. The **Daily Study app is public on purpose**: `study/data.json` contains the exact text of MOS Ch. 4, 41 and 46 and the study notes, so it can work without a login. The source PDFs, the extracts and the private study JSON are never committed.
>
> This repo is public, so the plan content (workouts, meals, study topics) can be read by anyone. Your synced progress, logs and edits are stored in Supabase and only the allowlisted login can read them.
