# Setup

## Already done

- `supabase/schema.sql` is applied to project `clpwvixdvzjvmnsuukbj`:
  - Tables: `households`, `household_members`, `records`.
  - Row-level security is on every table. Only allowlisted emails can read or write.
  - Newest-wins trigger on `records`.
  - Realtime is on for `records`.
- The Supabase security advisor reports no issues.
- The allowlist has one login, the shared email that Mickey and his wife both use.
- `config.js` has the project URL and the **publishable** key. That key is meant to be public; never put a `service_role` or secret key in this repo.

## Study materials

- They are stored in the `study_content` table, with one row each for meta, policy, cards, cases, scenarios, oral, schedule and flags.
- Signed-in allowlisted users can read them. The public key and other logins can't, and nobody can write through the API.
- To load or update them, run `python3 tools/seed-study.py /path/to/study-data.json > seed.sql` on a machine that has the private JSON, then run `seed.sql` in the Supabase SQL editor. Devices pick up the new version on their next sign-in check, about hourly.
- Never commit the JSON, the seed SQL, or screenshots of the Study tab while signed in.

## Supabase dashboard

Nothing to do. Sign-in no longer sends email, so the old URL, SMTP and email-template steps aren't needed.

## Signing in (each phone, once)

Sign-in is **just the email**: no password, no code, no email to wait for.

1. Open the app (or the page in Safari).
2. Tap the dot in the top right, or go to **Study** and use the box there.
3. Type `mickeyelliott@hotmail.com` (capitals and spaces don't matter) and tap **Sign in**. The dot turns green.

You stay signed in until you tap **Sign out** or clear the browser's data.

How it works: the app turns the email into a fixed password and signs in to Supabase with it, so Supabase sign-in and the database rules still apply. Anyone who knows the email and this site can sign in; that trade-off was chosen on purpose.

## iPhone: put it on the home screen

Do this in **Safari** (other browsers on iPhone may not offer the full-screen app).

Tracker (Mickey):
1. Open `https://mickeyelliott.github.io/scheduler/` in Safari.
2. Tap the **Share** button (square with an arrow; at the bottom, or behind **⋯** in the address bar on iOS 26).
3. Scroll down and tap **Add to Home Screen**. Leave **Open as Web App** on if it's shown, keep the name "SWAT Prep" and tap **Add**.
4. Open **SWAT Prep** from the home screen and sign in as above (dot → email → **Sign in**).

Meal page (on your wife's phone):
1. Open `https://mickeyelliott.github.io/scheduler/meals.html` in Safari.
2. **Share → Add to Home Screen → Add**. It installs as "Meals" with its own icon and opens straight to today's meals.
3. Sign in inside it the same way if she wants checkmarks to sync.

Daily Study (study app, no login):
1. Open `https://mickeyelliott.github.io/scheduler/study/` in Safari and wait for Today to show. That first load saves everything for offline use.
2. **Share → Add to Home Screen**. Leave **Open as Web App** on if it's shown, keep the name "Daily Study" and tap **Add**.
3. Open **Daily Study** from the home screen. There's nothing to sign in to. Study in the home-screen app, not the Safari tab: progress is saved inside whichever one you use, and the two don't share it.

Good to know:
- The home-screen app has its **own storage**, separate from Safari: its own sign-in, saved study copy and screen state. So sign in once in each. Deleting the icon deletes that storage.
- It works without signal after the first open (the page shell is cached; study content is in the app's local storage after the first signed-in load). Changes made offline upload later.
- Updates arrive on their own: pages are fetched fresh whenever there's signal. If something looks stale, close the app from the app switcher and reopen it.
- iPhone ignores web vibration, so swipes have no haptic buzz there.
- In a plain Safari tab, iOS may clear the site's saved data after about 7 days without a visit; the home-screen app is exempt from that. Synced data comes back after signing in again either way.

Optional: **Auth → Sign In / Providers → turn off "Allow new users to sign up"**. Only allowlisted emails can see data anyway; this just stops strangers creating empty accounts.

## Study reminders (push notifications)

Daily push notification from the SWAT Prep app: "N cards due" plus a case, policy or oral-board topic to drill. Tap it to open Study.

**Turn it on (iPhone, iOS 16.4+):**
1. The app must be on the home screen (see above). Notifications don't work from a normal Safari tab.
2. Open **SWAT Prep** from its icon and sign in (dot → email → Sign in).
3. Go to **More → Settings → Study reminders** (or tap **Enable reminders** on the prompt under Start on the Study page).
4. Pick the time (default **7:00 PM Pacific**, before the 8:30 PM shift; change it any time) and tap **Enable reminders**. Tap **Allow** on the iPhone prompt.
5. Tap **Send test**. A notification should arrive within seconds.

Change the time with the picker, pause with the switch, or **Remove from this device**. Each phone has its own setting. If you tapped Don't Allow: iPhone **Settings → Notifications → SWAT Prep → Allow Notifications**.

**How it works (already deployed; nothing to do):**
- `supabase/push.sql` creates `push_subscriptions` (household RLS: only allowlisted logins can read or change rows) and the 15-minute `pg_cron` job.
- `supabase/functions/push-reminders/index.ts` is the Edge Function. Every 15 minutes it finds subscriptions whose reminder time (Pacific) has arrived and that haven't had one today, builds the text from `study_content` and your synced flashcard progress, and sends it with Web Push. Expired subscriptions (HTTP 404/410) are deleted. It skips a reminder that is more than 3 hours late.
- The **public** VAPID key is in `config.js`. The **private** VAPID key and the cron secret are only in Supabase **Vault** (`vapid_private_key`, `vapid_public_key`, `push_cron_secret`); they are not in this repo. To move the private key to Edge Function secrets instead, set `VAPID_PRIVATE_KEY` (and `VAPID_PUBLIC_KEY`) under Edge Functions → Secrets; the function prefers those when present.
- To rotate keys: generate a new pair, update the two Vault secrets and `VAPID_PUBLIC_KEY` in `config.js`, then each phone taps **Remove from this device** and **Enable reminders** again.

## Allowing another email

Run this in the SQL editor (replace the email in all three places, lowercase):

```sql
insert into public.household_members (household_id, email)
select id, 'someone@example.com' from public.households where name = 'elliott';
-- the login itself: email-only sign-in uses a password derived from the email
with u as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'someone@example.com',
    extensions.crypt('sched-v1:someone@example.com:open-sesame', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '')
  returning id, email)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now() from u;
```

## Changing the plan or the pages

Edit the files in `build-src/`, then run `python3 build-src/build.py` and commit `index.html`, `meals.html` and `plan/`.

Tests:
- `node tools/shoot.mjs '<json>'` takes screenshots.
- `tools/e2e-push.mjs` signs in as a throwaway login in headless Chrome, subscribes through the real push service, sends a test and a scheduled reminder through the Edge Function and checks that the service worker shows them (needs `E2E_EMAIL` and `CRON_SECRET`; delete the test user and household afterwards).
- `tools/e2e-sync.mjs` runs two headless browsers as two devices. It needs a throwaway test login and household, so delete them afterwards.
- `OUT=/some/dir node tools/iphone.mjs` emulates iPhone 15/16 Pro and SE (Safari and home-screen mode, with safe-area insets and touch gestures) and checks layout, tap sizes, swipes, the bottom sheets and zero JS errors. With `E2E_EMAIL` (a throwaway allowlisted login) it also signs in through the Study form and tests the flashcards; keep those screenshots out of the repo.
- `OUT=/some/dir node tools/iphone-study.mjs` runs the same iPhone checks on the Daily Study app, with no login needed. It covers today's to-do, the card session (tap to flip, buttons, swipes both ways), the streak after a reload, Quick 5, search, the MOS reader and its incomplete flags, the RCW and case pages, scenarios, oral board, the manifest and icons, an offline start, layout and zero JS errors.
- `python3 build-src/build_study.py` rebuilds `study/`. It needs the private MOS extracts in `$STUDY_SRC`.
- `python3 tools/make-icons.py [app|meals|study]` regenerates the home-screen icons in `icons/`. With no argument it does all of them.
