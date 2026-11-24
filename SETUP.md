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

## You need to do this once (Supabase dashboard)

1. **Auth → URL Configuration**
   - Site URL: `https://mickeyelliott.github.io/scheduler/`
   - Redirect URLs: add `https://mickeyelliott.github.io/scheduler/**`

   Without this, the sign-in link sends you to `localhost` instead of the site.
2. **Email delivery.** Supabase's built-in email only sends to addresses that are members of your Supabase organization, and only a few emails per hour.
   - If the shared login email is the one you use to sign in to Supabase, you're set.
   - If not, either invite that email to the organization (Organization → Team), or set up custom SMTP under **Auth → SMTP Settings**. Resend's free tier works.

## Signing in (each phone or computer, once)

1. Open the tracker or the meal page and tap the status pill in the top right (**Sign in to sync**).
2. Enter the shared email and tap **Email me a link**.
3. Open the email *on that same device* and tap the link. The page shows **Synced**.

Sessions refresh themselves, so you stay signed in until you tap **Sign out** or clear the browser's data.
If you saved the page to your home screen on an iPhone, the home-screen app keeps its own storage. Sign in from inside it, or just use Safari.

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
