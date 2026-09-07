-- Allow Admin Accounts tab edits to persist through a database-side update.
-- Run this in the Supabase SQL editor for the CSC S.Y.N.C. project.

create or replace function public.update_admin_managed_profile(
  p_profile_id_text text,
  p_previous_email text,
  p_previous_username text,
  p_profile jsonb
)
returns setof public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  target_organization_id uuid;
  payload_email text;
  payload_organization_name text;
begin
  if not public.is_enabled_admin() then
    raise exception 'Admin access required.';
  end if;

  payload_email := nullif(lower(trim(coalesce(p_profile->>'email', p_previous_email, ''))), '');

  if p_profile_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$' then
    target_id := p_profile_id_text::uuid;
  end if;

  select profiles.id
    into target_id
  from public.profiles
  where (target_id is not null and profiles.id = target_id)
     or (nullif(lower(trim(p_previous_email)), '') is not null and lower(profiles.email) = lower(trim(p_previous_email)))
     or (payload_email is not null and lower(profiles.email) = payload_email)
     or (nullif(lower(trim(p_previous_username)), '') is not null and lower(profiles.username) = lower(trim(p_previous_username)))
  order by profiles.updated_at desc nulls last, profiles.created_at desc nulls last
  limit 1;

  if target_id is null and payload_email is not null then
    select users.id
      into target_id
    from auth.users
    where lower(users.email) = payload_email
    order by users.created_at desc
    limit 1;
  end if;

  if target_id is null then
    raise exception 'No matching auth user/profile was found for %.', coalesce(payload_email, p_previous_email, p_previous_username, p_profile_id_text);
  end if;

  payload_organization_name := nullif(trim(p_profile->>'organization_name'), '');

  if nullif(p_profile->>'organization_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$' then
    target_organization_id := nullif(p_profile->>'organization_id', '')::uuid;
  end if;

  if payload_organization_name is not null then
    if target_organization_id is null then
      select organizations.id
        into target_organization_id
      from public.organizations
      where lower(trim(organizations.organization_name)) = lower(payload_organization_name)
      order by organizations.updated_at desc nulls last, organizations.created_at desc nulls last
      limit 1;
    end if;

    if target_organization_id is not null then
      update public.organizations
      set organization_name = payload_organization_name,
          updated_at = coalesce(nullif(p_profile->>'updated_at', '')::timestamptz, now())
      where id = target_organization_id;
    elsif nullif(p_profile->>'organization_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$' then
      target_organization_id := nullif(p_profile->>'organization_id', '')::uuid;

      update public.organizations
      set organization_name = payload_organization_name,
          updated_at = coalesce(nullif(p_profile->>'updated_at', '')::timestamptz, now())
      where id = target_organization_id
      returning id into target_organization_id;
    end if;

    if target_organization_id is null then
      insert into public.organizations (
        organization_name,
        organization_type,
        created_at,
        updated_at
      )
      values (
        payload_organization_name,
        'Organization',
        now(),
        coalesce(nullif(p_profile->>'updated_at', '')::timestamptz, now())
      )
      returning id into target_organization_id;
    end if;
  end if;

  insert into public.profiles (
    id,
    username,
    full_name,
    email,
    role,
    account_type,
    organization_id,
    organization_name,
    contact_number,
    phone_number,
    is_enabled,
    permissions,
    approval_status,
    created_at,
    updated_at
  )
  values (
    target_id,
    coalesce(nullif(trim(p_previous_username), ''), payload_email),
    nullif(trim(p_profile->>'full_name'), ''),
    payload_email,
    coalesce(nullif(trim(p_profile->>'role'), ''), 'organization_manager'),
    nullif(trim(p_profile->>'account_type'), ''),
    target_organization_id,
    payload_organization_name,
    nullif(trim(p_profile->>'contact_number'), ''),
    nullif(trim(coalesce(p_profile->>'phone_number', p_profile->>'contact_number')), ''),
    coalesce((p_profile->>'is_enabled')::boolean, true),
    coalesce(p_profile->'permissions', '{}'::jsonb),
    'approved',
    now(),
    coalesce(nullif(p_profile->>'updated_at', '')::timestamptz, now())
  )
  on conflict (id) do update
  set
    username = coalesce(excluded.username, profiles.username),
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    account_type = excluded.account_type,
    organization_id = excluded.organization_id,
    organization_name = excluded.organization_name,
    contact_number = excluded.contact_number,
    phone_number = excluded.phone_number,
    is_enabled = excluded.is_enabled,
    permissions = excluded.permissions,
    approval_status = coalesce(profiles.approval_status, excluded.approval_status),
    updated_at = excluded.updated_at;

  return query
    select *
    from public.profiles
    where id = target_id;
end;
$$;

grant execute on function public.update_admin_managed_profile(text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
