-- =====================================================================
--  005 - Live friend request notifications
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  Lets the app hear about new friend requests instantly (Supabase Realtime).
--  Row level security still applies: you only get events for rows you can see.
--  Without this the app still notices new requests, just a bit later
--  (when you switch back to the tab, or within a minute).
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
end $$;
