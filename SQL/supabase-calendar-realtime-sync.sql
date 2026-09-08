-- Enable prompt Supabase Realtime sync for CSC-S.Y.N.C. calendar data.
-- Run this in the Supabase SQL editor for the project used by the admin dashboard.

alter table public.calendar_items replica identity full;
alter table public.conference_room_bookings replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'calendar_items'
  ) then
    alter publication supabase_realtime add table public.calendar_items;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conference_room_bookings'
  ) then
    alter publication supabase_realtime add table public.conference_room_bookings;
  end if;
end $$;

-- Verification: table flags and realtime publication membership.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relreplident as replica_identity,
  exists (
    select 1
    from pg_publication_tables p
    where p.pubname = 'supabase_realtime'
      and p.schemaname = n.nspname
      and p.tablename = c.relname
  ) as realtime_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('calendar_items', 'conference_room_bookings')
order by c.relname;

-- Verification: policies that control which rows each account can receive.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('calendar_items', 'conference_room_bookings')
order by tablename, policyname;
