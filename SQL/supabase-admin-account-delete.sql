create or replace function public.delete_admin_managed_profile(p_profile_id uuid)
returns table (id uuid, email text, username text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_profile public.profiles%rowtype;
begin
  if not public.is_enabled_admin() then
    raise exception 'Admin access required.';
  end if;

  if p_profile_id = auth.uid() then
    raise exception 'You cannot delete the active Manager account.';
  end if;

  select * into target_profile
  from public.profiles
  where profiles.id = p_profile_id
  for update;

  if not found then
    raise exception 'Profile not found.';
  end if;

  return query
    delete from public.profiles
    where profiles.id = p_profile_id
    returning profiles.id, profiles.email, profiles.username;

  begin
    delete from auth.users
    where users.id = p_profile_id;
  exception
    when insufficient_privilege or undefined_table then
      null;
  end;
end;
$$;

grant execute on function public.delete_admin_managed_profile(uuid) to authenticated;
notify pgrst, 'reload schema';
