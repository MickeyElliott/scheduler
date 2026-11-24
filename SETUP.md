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

## You need to do this once (Supabase dashboard)

1. **Auth → URL Configuration**
   - Site URL: `https://mickeyelliott.github.io/scheduler/`
   - Redirect URLs: add `https://mickeyelliott.github.io/scheduler/**`

   Without this, the sign-in link sends you to `localhost` instead of the site.
2. **Email delivery.** Supabase's built-in email only sends to addresses that are members of your Supabase organization, and only a few emails per hour.
   - If the shared login email is the one you use to sign in to Supabase, you're set.
   - If not, either invite that email to the organization (Organization → Team), or set up custom SMTP under **Auth → SMTP Settings**. Resend's free tier works.
3. **Put the sign-in code in the email (needed for the iPhone home-screen app).** Go to **Authentication → Emails → Templates → Magic Link** (older dashboards: Auth → Email Templates) and add this line to the message body, then save:

   ```html
   <p>Or type this code in the app: <strong>{{ .Token }}</strong></p>
   ```

   A home-screen app on iPhone opens email links in Safari, which has separate storage, so the link signs in Safari instead of the app. The code signs in the app itself.

## Signing in (each phone or computer, once)

1. Open the tracker or the meal page and tap the status pill in the top right (**Sign in to sync**).
2. Enter the shared email and tap **Email me a link**.
3. Open the email *on that same device* and tap the link, **or** type the 6-digit code from the email into the box under "Check your email". The page shows **Synced**.

Sessions refresh themselves, so you stay signed in until you tap **Sign out** or clear the browser's data.

## iPhone: put it on the home screen

Do this in **Safari** (other browsers on iPhone may not offer the full-screen app).

Tracker (Mickey):
1. Open `https://mickeyelliott.github.io/scheduler/` in Safari.
2. Tap the **Share** button (square with an arrow; at the bottom, or behind **⋯** in the address bar on iOS 26).
3. Scroll down and tap **Add to Home Screen**. Leave **Open as Web App** on if it's shown, keep the name "SWAT Prep" and tap **Add**.
4. Open **SWAT Prep** from the home screen, tap the status dot (top right) → enter the shared email → **Email me a link**. Then switch to Mail, copy the **6-digit code**, come back and type it in. Don't tap the link: it would sign in Safari, not the app.

Meal page (on your wife's phone):
1. Open `https://mickeyelliott.github.io/scheduler/meals.html` in Safari.
2. **Share → Add to Home Screen → Add**. It installs as "Meals" with its own icon and opens straight to the meal plan.
3. Sign in inside it the same way (code, not link) if she wants checkmarks to sync.

Good to know:
- The home-screen app has its **own storage**, separate from Safari: its own sign-in, saved study copy and screen state. Deleting the icon deletes that storage.
- It works without signal after the first open (the page shell is cached; study content is in the app's local storage after the first signed-in load). Changes made offline upload later.
- Updates arrive on their own: pages are fetched fresh whenever there's signal. If something looks stale, close the app from the app switcher and reopen it.
- iPhone ignores web vibration, so swipes have no haptic buzz there.
- In a plain Safari tab, iOS may clear the site's saved data after about 7 days without a visit; the home-screen app is exempt from that. Synced data comes back after signing in again either way.

Optional, once both devices are signed in: **Auth → Sign In / Providers → turn off "Allow new users to sign up"**. Nobody else could see the data anyway, but this stops strangers from creating empty accounts.

## Allowing another email

Run this in the SQL editor:

```sql
insert into public.household_members (household_id, email)
select id, lower('someone@example.com') from public.households where name = 'elliott';
```

## Changing the plan or the pages

Edit the files in `build-src/`, then run `python3 build-src/build.py` and commit `index.html`, `meals.html` and `plan/`.

Tests:
- `node tools/shoot.mjs '<json>'` takes screenshots.
- `tools/e2e-sync.mjs` runs two headless browsers as two devices. It needs a throwaway test login and household, so delete them afterwards.
- `OUT=/some/dir node tools/iphone.mjs` emulates iPhone 15/16 Pro and SE (Safari and home-screen mode, with safe-area insets and touch gestures) and checks layout, tap sizes, swipes, the bottom sheets and zero JS errors. With `E2E_EMAIL`/`E2E_PASS` it also tests the signed-in flashcards; keep those screenshots out of the repo.
- `python3 tools/make-icons.py` regenerates the home-screen icons in `icons/`.
