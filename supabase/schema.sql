-- Scheduler sync schema (Supabase / Postgres)
-- One generic key/value table with last-write-wins per record, guarded by RLS.
-- Safe to re-run.

-- 1. Households + allowlist ------------------------------------------------
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  email        text not null,
  created_at   timestamptz not null default now(),
  primary key (household_id, email),
  constraint email_lowercase check (email = lower(email))
);

-- 2. Synced records ----------------------------------------------------------
-- scope: check | log | settings | edit | mcheck | medit
create table if not exists public.records (
  household_id uuid not null references public.households(id) on delete cascade,
  scope        text not null check (scope in ('check','log','settings','edit','mcheck','medit','study')),
  key          text not null check (length(key) between 1 and 300),
  value        jsonb,
  deleted      boolean not null default false,
  updated_at   timestamptz not null default now(),
  updated_by   text,              -- device id, so a device can ignore its own realtime echoes
  primary key (household_id, scope, key)
);
create index if not exists records_updated_idx on public.records (household_id, updated_at);

-- (re-run safety: old policies may reference an older function)
drop policy if exists "members read household" on public.households;
drop policy if exists "members read membership" on public.household_members;
drop policy if exists "members read records" on public.records;
drop policy if exists "members insert records" on public.records;
drop policy if exists "members update records" on public.records;
drop policy if exists "members delete records" on public.records;

-- 3. Membership check, in a schema the REST API does not expose ------------
create schema if not exists private;
grant usage on schema private to authenticated;
drop function if exists public.is_household_member(uuid);
create or replace function private.is_household_member(h uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h
      and m.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function private.is_household_member(uuid) from public, anon;
grant execute on function private.is_household_member(uuid) to authenticated;

-- 4. Last-write-wins: ignore an update that is older than what is stored --
create or replace function public.records_lww()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return null;   -- keep the newer row
  end if;
  return new;
end;
$$;
drop trigger if exists records_lww on public.records;
create trigger records_lww before update on public.records
  for each row execute function public.records_lww();

-- 5. Row Level Security -----------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.records           enable row level security;

drop policy if exists "members read household" on public.households;
create policy "members read household" on public.households
  for select to authenticated using ((select private.is_household_member(id)));

drop policy if exists "members read membership" on public.household_members;
create policy "members read membership" on public.household_members
  for select to authenticated using ((select private.is_household_member(household_id)));

drop policy if exists "members read records" on public.records;
create policy "members read records" on public.records
  for select to authenticated using ((select private.is_household_member(household_id)));
drop policy if exists "members insert records" on public.records;
create policy "members insert records" on public.records
  for insert to authenticated with check ((select private.is_household_member(household_id)));
drop policy if exists "members update records" on public.records;
create policy "members update records" on public.records
  for update to authenticated using ((select private.is_household_member(household_id)))
  with check ((select private.is_household_member(household_id)));
drop policy if exists "members delete records" on public.records;
create policy "members delete records" on public.records
  for delete to authenticated using ((select private.is_household_member(household_id)));

-- Households/membership are managed only from the dashboard / SQL editor (no client writes).
revoke insert, update, delete on public.households, public.household_members from anon, authenticated;
revoke all on public.records from anon;
grant select on public.households, public.household_members to authenticated;
grant select, insert, update, delete on public.records to authenticated;

-- 6. Realtime ---------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'records') then
    alter publication supabase_realtime add table public.records;
  end if;
end $$;

-- 8. Study module ------------------------------------------------------------
-- Study materials (department policy outlines, flashcards, scenarios, ...) live
-- ONLY in this table, never in the public repo. Allowlisted users can read them;
-- nobody can write through the API (rows are loaded by the project owner).
alter table public.records drop constraint if exists records_scope_check;
alter table public.records add constraint records_scope_check
  check (scope in ('check','log','settings','edit','mcheck','medit','study'));

create table if not exists public.study_content (
  key        text primary key check (char_length(key) between 1 and 64),
  data       jsonb not null,
  version    text not null,
  updated_at timestamptz not null default now()
);
alter table public.study_content enable row level security;

create or replace function private.is_allowlisted()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.household_members m
                 where m.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function private.is_allowlisted() from public, anon;
grant execute on function private.is_allowlisted() to authenticated;

revoke all on public.study_content from anon, authenticated;
grant select on public.study_content to authenticated;
drop policy if exists study_content_select on public.study_content;
create policy study_content_select on public.study_content
  for select to authenticated using ((select private.is_allowlisted()));

-- 7. ALLOWLIST --------------------------------------------------------------
-- >>> EDIT HERE: every email that may sign in and read/write the data. <<<
-- Mickey and his wife share one login email. The real address is already in the
-- live database; it is left out of this public repo on purpose. Replace the
-- placeholder only if you rebuild the project from scratch.
insert into public.households (name) values ('elliott') on conflict (name) do nothing;
insert into public.household_members (household_id, email)
select id, lower('your-login-email@example.com') from public.households where name = 'elliott'
on conflict do nothing;
