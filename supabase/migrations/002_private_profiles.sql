-- =====================================================================
--  002 - Private profiles + safe username search
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  Before: any logged-in user could read EVERY profile, and the search
--  box treated % and _ as wildcards, so it could list all users.
--  After:  profiles are only visible to people who have a reason to see
--          them, and searching goes through search_users() which does a
--          plain "username starts with" match (no wildcards).
-- =====================================================================


-- 1. Who may see a profile?
--    yourself, admins, anyone you have a friendship row with (pending or
--    accepted), and anyone who played in a game you're allowed to see.
create or replace function public.can_view_profile(pid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select pid = auth.uid()
      or public.has_permission('admin.manage_all')
      or public.has_permission('stats.compare_anyone')
      or exists (
        select 1 from public.friendships f
        where (f.requester_id = auth.uid() and f.addressee_id = pid)
           or (f.addressee_id = auth.uid() and f.requester_id = pid)
      )
      or exists (
        select 1 from public.game_participants gp
        where gp.user_id = pid and public.can_view_game(gp.game_id)
      );
$$;

-- Replace the old "everyone can read" policy
drop policy if exists "profiles: read" on public.profiles;
create policy "profiles: read" on public.profiles
  for select to authenticated
  using (public.can_view_profile(id));


-- 2. Username search for the "add friend" box.
--    - at least 3 characters
--    - literal "starts with" match: % and _ are just characters here
--    - only returns public-facing columns, max 10 results
create or replace function public.search_users(term text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and char_length(trim(term)) >= 3
    and starts_with(lower(p.username), lower(trim(term)))
    and p.id <> auth.uid()
  order by p.username
  limit 10;
$$;

revoke execute on function public.search_users(text) from public, anon;
grant  execute on function public.search_users(text) to authenticated;
