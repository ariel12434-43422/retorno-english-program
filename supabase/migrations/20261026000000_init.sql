-- Retorno English-speaking program: storage, access rules and push subscriptions.
-- The app keeps its data as JSON documents addressed by a path (for example "patients/p1").
-- Paths under "mgr/" are visible to managers only.

create table if not exists public.docs (
  path        text primary key,
  collection  text not null,
  body        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
create index if not exists docs_collection_idx on public.docs (collection);

-- managers (by sign-in email) and staff allowed into the app
create table if not exists public.app_admins  (email text primary key);
create table if not exists public.app_members (email text primary key, staff_id text, added_at timestamptz not null default now());

-- phones and browsers that asked for notifications
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid(),
  email      text,
  sub        jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.my_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where lower(email) = my_email())
$$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from app_members where lower(email) = my_email())
$$;

create or replace function public.my_staff_id() returns text
language sql stable security definer set search_path = public as $$
  select staff_id from app_members where lower(email) = my_email() limit 1
$$;

-- the very first person to sign in becomes the manager; after that only managers add people
create or replace function public.bootstrap_admin() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if not exists (select 1 from app_admins) then
    insert into app_admins (email) values (my_email());
  end if;
  return is_admin();
end $$;

-- who may write a given path
create or replace function public.can_write(p text, b jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when is_admin() then true
    when not is_member() then false
    when p like 'mgr/%' or p in ('meta/staff', 'meta/settings') then false
    -- staff link only themselves, and only to the staff member the manager assigned to their email
    when p like 'links/%' then p = 'links/' || auth.uid()::text and (b ->> 'staff') = my_staff_id()
    else true
  end
$$;

-- deep merge used by partial updates (nested objects merge, everything else replaces)
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb) returns jsonb
language sql immutable as $$
  select case
    when jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then (
      select coalesce(jsonb_object_agg(k,
        case when a ? k and b ? k then public.jsonb_deep_merge(a -> k, b -> k)
             when b ? k then b -> k else a -> k end), '{}'::jsonb)
      from (select jsonb_object_keys(a) k union select jsonb_object_keys(b)) s)
    else b end
$$;

create or replace function public.docs_update(p text, patch jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  update docs set body = jsonb_deep_merge(body, patch), updated_at = now(), updated_by = auth.uid() where path = p;
  if not found then raise exception 'document % does not exist', p using errcode = 'P0002'; end if;
end $$;

alter table public.docs        enable row level security;
alter table public.app_admins  enable row level security;
alter table public.app_members enable row level security;
alter table public.push_subs   enable row level security;

drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (is_member() and (path not like 'mgr/%' or is_admin()));
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (can_write(path, body));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated using (can_write(path, body)) with check (can_write(path, body));
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated using (can_write(path, body));

drop policy if exists admins_read on public.app_admins;
create policy admins_read on public.app_admins for select to authenticated using (is_admin() or lower(email) = my_email());
drop policy if exists admins_write on public.app_admins;
create policy admins_write on public.app_admins for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists members_read on public.app_members;
create policy members_read on public.app_members for select to authenticated using (is_admin() or lower(email) = my_email());
drop policy if exists members_write on public.app_members;
create policy members_write on public.app_members for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists subs_own on public.push_subs;
create policy subs_own on public.push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- live updates for the app
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
