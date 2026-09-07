-- Put the hardcoded Admin accounts under Central Student Council.
-- Run this in the Supabase SQL editor for the CSC S.Y.N.C. project.

begin;

update public.organizations
set
  organization_name = 'Central Student Council',
  organization_type = coalesce(organization_type, 'Council'),
  updated_at = now()
where lower(trim(organization_name)) = 'central student council';

insert into public.organizations (organization_name, organization_type, created_at, updated_at)
select 'Central Student Council', 'Council', now(), now()
where not exists (
  select 1
  from public.organizations
  where lower(trim(organization_name)) = 'central student council'
);

update public.profiles
set
  organization_id = (
    select id
    from public.organizations
    where lower(trim(organization_name)) = 'central student council'
    order by updated_at desc nulls last, created_at desc nulls last
    limit 1
  ),
  organization_name = 'Central Student Council',
  updated_at = now()
where lower(email) in (
  'president@aup.edu.ph',
  'vicepresident@aup.edu.ph',
  'gensec@aup.edu.ph',
  'assocgensec@aup.edu.ph',
  'finance@aup.edu.ph',
  'cscadviser@aup.edu.ph',
  'spritdevcouncil@aup.edu.ph',
  'socdevcouncil@aup.edu.ph',
  'physdevcouncil@aup.edu.ph',
  'eacouncil@aup.edu.ph',
  'arccouncil@aup.edu.ph',
  'swbscouncil@aup.edu.ph',
  'idttcouncil@aup.edu.ph'
);

commit;
