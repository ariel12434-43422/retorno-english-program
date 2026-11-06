-- LeadManager leads: kept under "lm/…", visible only to the managers and to the staff the manager allows
-- (meta/leadaccess → {"staff": ["<staff id>", …]}). A secret address key for LeadManager lives in app_secrets.

create or replace function public.can_leads() returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or (is_member() and exists (
    select 1 from docs d, jsonb_array_elements_text(coalesce(d.body -> 'staff', '[]'::jsonb)) s(id)
    where d.path = 'meta/leadaccess' and s.id = my_staff_id()))
$$;
grant execute on function public.can_leads() to authenticated;

create or replace function public.can_write(p text, b jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when is_admin() then true
    when not is_member() then false
    when p like 'mgr/%' or p in ('meta/staff', 'meta/settings', 'meta/leadaccess') then false
    when p like 'lm/%' then can_leads()
    -- staff link only themselves, and only to the staff member the manager assigned to their email
    when p like 'links/%' then p = 'links/' || auth.uid()::text and (b ->> 'staff') = my_staff_id()
    else true
  end
$$;

drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated
  using (is_member() and (path not like 'mgr/%' or is_admin()) and (path not like 'lm/%' or can_leads()));

-- who sees the leads at the start: the manager (always) and Ariel
insert into public.docs (path, collection, body) values ('meta/leadaccess', 'meta', '{"staff": ["sxf0r804c"]}')
  on conflict (path) do nothing;

-- the key in LeadManager's sending address
insert into public.app_secrets (k, v) values ('leads', encode(gen_random_bytes(18), 'hex')) on conflict (k) do nothing;
