-- Web Push reminders (run once; safe to re-run). No secrets in this file.
-- The VAPID private key and the cron secret live in Supabase Vault (see SETUP.md), never in the repo.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 1. One row per phone/browser that subscribed ---------------------------------
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_email   text not null,
  endpoint     text not null unique check (endpoint like 'https://%' and length(endpoint) < 1000),
  p256dh       text not null check (length(p256dh) < 300),
  auth         text not null check (length(auth) < 100),
  enabled      boolean not null default true,
  remind_time  text not null default '19:00' check (remind_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),   -- local time in tz
  tz           text not null default 'America/Los_Angeles',
  last_sent_on date,            -- local date of the last reminder, so it goes out once a day
  last_error   text,
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists push_subscriptions_household_idx on public.push_subscriptions (household_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "members read push" on public.push_subscriptions;
drop policy if exists "members insert push" on public.push_subscriptions;
drop policy if exists "members update push" on public.push_subscriptions;
drop policy if exists "members delete push" on public.push_subscriptions;
create policy "members read push" on public.push_subscriptions
  for select to authenticated using ((select private.is_household_member(household_id)));
create policy "members insert push" on public.push_subscriptions
  for insert to authenticated with check ((select private.is_household_member(household_id)));
create policy "members update push" on public.push_subscriptions
  for update to authenticated using ((select private.is_household_member(household_id)))
  with check ((select private.is_household_member(household_id)));
create policy "members delete push" on public.push_subscriptions
  for delete to authenticated using ((select private.is_household_member(household_id)));

revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant insert (household_id, user_email, endpoint, p256dh, auth, enabled, remind_time, tz, last_sent_on, user_agent)
  on public.push_subscriptions to authenticated;
grant update (user_email, p256dh, auth, enabled, remind_time, tz, last_sent_on, last_error, user_agent, updated_at)
  on public.push_subscriptions to authenticated;

-- The server-side role (used only by the Edge Function) needs explicit grants in this project.
grant select on public.households, public.household_members, public.records, public.study_content to service_role;
grant select, update, delete on public.push_subscriptions to service_role;

-- 2. Secret reader for the Edge Function only (service role) -------------------
create or replace function public.push_secret(secret_name text)
returns text
language sql security definer
set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1; $$;
revoke all on function public.push_secret(text) from public, anon, authenticated;
grant execute on function public.push_secret(text) to service_role;

-- 3. Schedule: every 15 minutes ask the function to send due reminders ---------
-- (Run after the 'push_cron_secret' vault secret exists. The job reads it from Vault at run time.)
select cron.unschedule(jobid) from cron.job where jobname = 'push-reminders';
select cron.schedule('push-reminders', '*/15 * * * *', $job$
  select net.http_post(
    url := 'https://clpwvixdvzjvmnsuukbj.supabase.co/functions/v1/push-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
    body := '{"action":"run"}'::jsonb,
    timeout_milliseconds := 30000);
$job$);
