-- Fix organization-name sync conflicts for Admin account edits.
-- Run this in the Supabase SQL editor for the project used by CSC S.Y.N.C.

begin;

-- Normalize existing names before duplicate detection.
update public.organizations
set
  organization_name = regexp_replace(trim(regexp_replace(coalesce(organization_name, ''), '\s+', ' ', 'g')), '[\s._-]+$', ''),
  updated_at = coalesce(updated_at, now())
where organization_name is distinct from regexp_replace(trim(regexp_replace(coalesce(organization_name, ''), '\s+', ' ', 'g')), '[\s._-]+$', '');

update public.organizations
set
  organization_name = concat('Organization ', left(id::text, 8)),
  updated_at = coalesce(updated_at, now())
where nullif(trim(organization_name), '') is null;

-- Merge duplicate organization rows that only differ by repeated/case-spaced names.
with ranked_organizations as (
  select
    id,
    lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', '')) as normalized_name,
    first_value(id) over (
      partition by lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', ''))
      order by updated_at desc nulls last, created_at desc nulls last, id
    ) as keeper_id
  from public.organizations
  where nullif(trim(organization_name), '') is not null
),
duplicates as (
  select id, keeper_id
  from ranked_organizations
  where id <> keeper_id
)
update public.profiles p
set organization_id = d.keeper_id
from duplicates d
where p.organization_id = d.id;

with ranked_organizations as (
  select
    id,
    lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', '')) as normalized_name,
    first_value(id) over (
      partition by lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', ''))
      order by updated_at desc nulls last, created_at desc nulls last, id
    ) as keeper_id
  from public.organizations
  where nullif(trim(organization_name), '') is not null
),
duplicates as (
  select id, keeper_id
  from ranked_organizations
  where id <> keeper_id
)
update public.calendar_items c
set organization_id = d.keeper_id
from duplicates d
where c.organization_id = d.id;

with ranked_organizations as (
  select
    id,
    lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', '')) as normalized_name,
    first_value(id) over (
      partition by lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', ''))
      order by updated_at desc nulls last, created_at desc nulls last, id
    ) as keeper_id
  from public.organizations
  where nullif(trim(organization_name), '') is not null
),
duplicates as (
  select id, keeper_id
  from ranked_organizations
  where id <> keeper_id
)
update public.concerns c
set organization_id = d.keeper_id
from duplicates d
where c.organization_id = d.id;

with ranked_organizations as (
  select
    id,
    lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', '')) as normalized_name,
    first_value(id) over (
      partition by lower(regexp_replace(trim(regexp_replace(organization_name, '\s+', ' ', 'g')), '[\s._-]+$', ''))
      order by updated_at desc nulls last, created_at desc nulls last, id
    ) as keeper_id
  from public.organizations
  where nullif(trim(organization_name), '') is not null
),
duplicates as (
  select id
  from ranked_organizations
  where id <> keeper_id
)
delete from public.organizations o
using duplicates d
where o.id = d.id;

update public.profiles p
set
  organization_name = o.organization_name,
  updated_at = now()
from public.organizations o
where p.organization_id = o.id
  and coalesce(p.organization_name, '') is distinct from o.organization_name;

update public.calendar_items c
set
  organization_name = o.organization_name,
  updated_at = now()
from public.organizations o
where c.organization_id = o.id
  and coalesce(c.organization_name, '') is distinct from o.organization_name;

update public.concerns c
set
  organization_name = o.organization_name,
  updated_at = now()
from public.organizations o
where c.organization_id = o.id
  and coalesce(c.organization_name, '') is distinct from o.organization_name;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.organizations'::regclass
      and conname = 'organizations_organization_name_key'
  ) then
    alter table public.organizations
      add constraint organizations_organization_name_key unique (organization_name);
  end if;
end $$;

commit;
