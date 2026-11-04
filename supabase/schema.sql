-- =====================================================================
--  DILL BREAKER - database schema
--  Run this whole file once in: Supabase Dashboard > SQL Editor > New query
--
--  Passwords are NOT stored here. Supabase Auth keeps them in auth.users
--  (bcrypt-hashed). Our tables only reference auth.users by id.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ENUM TYPES (fixed lists of allowed values)
-- ---------------------------------------------------------------------
create type public.game_type         as enum ('singles', 'doubles');
create type public.game_location     as enum ('indoor', 'outdoor');
create type public.game_sex          as enum ('female', 'male', 'mixed');
create type public.friendship_status as enum ('pending', 'accepted');
-- (a declined request is simply deleted, so the person can be re-asked later)


-- ---------------------------------------------------------------------
-- 2. USERS: profiles + settings
-- ---------------------------------------------------------------------

-- One row per account. Created automatically on sign-up (see trigger below).
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  avatar_url   text,
  created_at   timestamptz not null default now()
);
-- Usernames are unique ignoring case ("Bob" and "bob" can't both exist).
create unique index profiles_username_lower_uniq on public.profiles (lower(username));

-- Per-user preferences: theme + which dashboard widgets, in what order.
create table public.user_settings (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  theme      text not null default 'system' check (theme in ('light', 'dark', 'system')),
  widgets    jsonb not null default
               '["play_calendar","win_loss","points_per_game","play_partners","chemistry","singles_vs_doubles"]'::jsonb,
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. PERMISSIONS (generic: roles have permissions, users have roles)
--    To gate a new feature later: insert a permission, attach it to
--    roles, and check it with public.has_permission('your.key').
-- ---------------------------------------------------------------------
create table public.permissions (
  key         text primary key,          -- e.g. 'games.create'
  description text not null
);

create table public.roles (
  name        text primary key,          -- e.g. 'user', 'admin'
  description text
);

create table public.role_permissions (
  role       text not null references public.roles (name) on delete cascade on update cascade,
  permission text not null references public.permissions (key) on delete cascade on update cascade,
  primary key (role, permission)
);

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role    text not null references public.roles (name) on delete cascade on update cascade,
  primary key (user_id, role)
);

-- Seed data
insert into public.permissions (key, description) values
  ('games.create',             'Log games and matches'),
  ('friends.request',          'Send friend requests'),
  ('pickle_pals.create',       'Create pickle pals'),
  ('stats.compare_anyone',     'View and compare stats of any player'),
  ('admin.manage_all',         'Full create/read/update/delete on all data'),
  ('admin.manage_permissions', 'Manage roles, permissions and user roles');

insert into public.roles (name, description) values
  ('user',  'Default role for every new account'),
  ('admin', 'Full access');

insert into public.role_permissions (role, permission) values
  ('user',  'games.create'),
  ('user',  'friends.request'),
  ('user',  'pickle_pals.create');

insert into public.role_permissions (role, permission)
  select 'admin', key from public.permissions;   -- admin gets everything


-- ---------------------------------------------------------------------
-- 4. FRIENDS + PICKLE PALS
-- ---------------------------------------------------------------------
create table public.friendships (
  id           bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status       public.friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- Only one friendship row per pair of people, whichever direction.
create unique index friendships_pair_uniq
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- "Fake" friends with no account. Max 5 per owner (trigger below).
create table public.pickle_pals (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);
create index pickle_pals_owner_idx on public.pickle_pals (owner_id);


-- ---------------------------------------------------------------------
-- 5. MATCHES, GAMES, PARTICIPANTS
--    - A match just groups games. A standalone game has match_id = null.
--    - Team 1 is ALWAYS the recorder's team ("your team"); team 2 = opponents.
--    - Who played is stored in game_participants (incl. the recorder),
--      so a game shows up in the stats of every account that played in it.
-- ---------------------------------------------------------------------
create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  recorded_by uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Pickleball score rules (same logic will exist in the React form):
--  * scores are 0..50, either one may be left blank
--  * the winner needs at least 11
--  * win by 2
--  * normal finishes are 11, 15 or 21 (e.g. 11-4, 15-9, 21-17)
--  * above that only "extended" scores are valid: exactly 2 apart (12-10, 16-14)
--  So 14-9 or 13-9 are rejected.
create or replace function public.is_valid_score(s1 smallint, s2 smallint, winner smallint)
returns boolean
language plpgsql immutable
as $$
declare
  w smallint;  -- winner's score
  l smallint;  -- loser's score
begin
  if winner = 1 then w := s1; l := s2; else w := s2; l := s1; end if;

  if w is not null and w < 11 then return false; end if;  -- winner must reach 11
  if l is not null and l > 48 then return false; end if;  -- loser can't exceed 50-2
  if w is null or l is null then return true; end if;     -- only one score entered: ok

  if w - l < 2 then return false; end if;                 -- win by 2 (also catches wrong winner)
  if w in (11, 15, 21) then return true; end if;          -- normal finish
  return w - l = 2;                                       -- extended game
end;
$$;

create table public.games (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid references public.matches (id) on delete cascade,
  game_number  smallint not null default 1 check (game_number >= 1),  -- order within a match
  recorded_by  uuid not null references public.profiles (id) on delete cascade,
  played_at    timestamptz not null default now(),
  game_type    public.game_type not null,
  location     public.game_location,
  sex          public.game_sex,
  team1_score  smallint check (team1_score between 0 and 50),  -- your team
  team2_score  smallint check (team2_score between 0 and 50),  -- opponents
  winning_team smallint not null check (winning_team in (1, 2)),
  fun_rating   smallint check (fun_rating between 1 and 5),    -- recorder's rating
  created_at   timestamptz not null default now(),
  constraint games_valid_score check (public.is_valid_score(team1_score, team2_score, winning_team))
);
create index games_recorded_by_idx on public.games (recorded_by);
create index games_match_idx       on public.games (match_id);
create index games_played_at_idx   on public.games (played_at);

-- Each row = one player in one game. Exactly one of user_id / pickle_pal_id is set.
create table public.game_participants (
  id            bigint generated always as identity primary key,
  game_id       uuid not null references public.games (id) on delete cascade,
  team          smallint not null check (team in (1, 2)),
  user_id       uuid references public.profiles (id) on delete cascade,
  pickle_pal_id uuid references public.pickle_pals (id) on delete cascade,
  check (num_nonnulls(user_id, pickle_pal_id) = 1)
);
create unique index gp_game_user_uniq on public.game_participants (game_id, user_id)       where user_id is not null;
create unique index gp_game_pal_uniq  on public.game_participants (game_id, pickle_pal_id) where pickle_pal_id is not null;
create index gp_user_idx on public.game_participants (user_id);
create index gp_pal_idx  on public.game_participants (pickle_pal_id);


-- ---------------------------------------------------------------------
-- 6. HELPER FUNCTIONS (used by security policies)
--    "security definer" = runs with owner rights, so it can look things up
--    without being blocked by the policies themselves (avoids loops).
-- ---------------------------------------------------------------------

-- Does the logged-in user have this permission (through any role)?
create or replace function public.has_permission(perm text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = auth.uid() and rp.permission = perm
  );
$$;

-- Are these two users accepted friends?
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- Can the logged-in user see this game?
-- Yes if: admin / compare-anyone, OR they played in it, OR a friend played in it.
create or replace function public.can_view_game(gid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_permission('admin.manage_all')
      or public.has_permission('stats.compare_anyone')
      or exists (
        select 1 from public.game_participants gp
        where gp.game_id = gid
          and gp.user_id is not null
          and (gp.user_id = auth.uid() or public.are_friends(gp.user_id, auth.uid()))
      );
$$;


-- ---------------------------------------------------------------------
-- 7. TRIGGERS (automatic rules)
-- ---------------------------------------------------------------------

-- On sign-up: create profile + settings + default 'user' role.
-- username / display_name come from the sign-up form (supabase.auth.signUp options.data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id,
          new.raw_user_meta_data ->> 'username',
          new.raw_user_meta_data ->> 'display_name');
  insert into public.user_settings (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Max 5 pickle pals per owner.
create or replace function public.enforce_pickle_pal_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.pickle_pals where owner_id = new.owner_id) >= 5 then
    raise exception 'You can have at most 5 pickle pals';
  end if;
  return new;
end;
$$;

create trigger pickle_pal_limit
  before insert on public.pickle_pals
  for each row execute function public.enforce_pickle_pal_limit();

-- The recorder is automatically added as a team-1 player of every game they log.
create or replace function public.add_recorder_as_participant()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.game_participants (game_id, team, user_id)
  values (new.id, 1, new.recorded_by);
  return new;
end;
$$;

create trigger games_add_recorder
  after insert on public.games
  for each row execute function public.add_recorder_as_participant();

-- Singles: max 1 player per team. Doubles: max 2 per team.
create or replace function public.enforce_team_size()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  max_per_team int;
  current_count int;
begin
  select case when g.game_type = 'singles' then 1 else 2 end
    into max_per_team
    from public.games g where g.id = new.game_id;

  select count(*) into current_count
    from public.game_participants
   where game_id = new.game_id and team = new.team and id <> new.id;

  if current_count >= max_per_team then
    raise exception 'Too many players on team % for this game type', new.team;
  end if;
  return new;
end;
$$;

create trigger game_participants_team_size
  before insert or update on public.game_participants
  for each row execute function public.enforce_team_size();


-- ---------------------------------------------------------------------
-- 8. RPC FUNCTIONS (called from the app with supabase.rpc(...))
-- ---------------------------------------------------------------------

-- Used on the sign-up page before submitting.
create or replace function public.username_available(name text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

-- Send a friend request by username.
-- If that person already sent YOU a request, this just accepts it.
create or replace function public.send_friend_request(target_username text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me       uuid := auth.uid();
  target   uuid;
  existing public.friendships;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if not public.has_permission('friends.request') then
    raise exception 'You do not have permission to send friend requests';
  end if;

  select id into target from public.profiles where lower(username) = lower(target_username);
  if target is null then raise exception 'No user found with that username'; end if;
  if target = me     then raise exception 'You cannot add yourself'; end if;

  select * into existing from public.friendships
   where (requester_id = me and addressee_id = target)
      or (requester_id = target and addressee_id = me);

  if found then
    if existing.status = 'accepted' then
      raise exception 'You are already friends';
    elsif existing.requester_id = me then
      raise exception 'Friend request already sent';
    else
      update public.friendships
         set status = 'accepted', responded_at = now()
       where id = existing.id;
      return;
    end if;
  end if;

  insert into public.friendships (requester_id, addressee_id) values (me, target);
end;
$$;

-- Accept (true) or decline (false) a request sent TO you.
create or replace function public.respond_friend_request(request_id bigint, accept boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if accept then
    update public.friendships
       set status = 'accepted', responded_at = now()
     where id = request_id and addressee_id = auth.uid() and status = 'pending';
  else
    delete from public.friendships
     where id = request_id and addressee_id = auth.uid() and status = 'pending';
  end if;

  if not found then raise exception 'Friend request not found'; end if;
end;
$$;

-- Who may call what. (Postgres lets everyone execute functions by default.)
revoke execute on function public.send_friend_request(text)             from public, anon;
revoke execute on function public.respond_friend_request(bigint, boolean) from public, anon;
grant  execute on function public.send_friend_request(text)             to authenticated;
grant  execute on function public.respond_friend_request(bigint, boolean) to authenticated;
grant  execute on function public.username_available(text)             to anon, authenticated;


-- ---------------------------------------------------------------------
-- 9. STATS VIEW
--    One row per (player, game) from that player's point of view.
--    All dashboard widgets read from this. "security_invoker" means the
--    viewer's own security policies apply, so nobody sees extra data.
-- ---------------------------------------------------------------------
create view public.player_game_results
with (security_invoker = true) as
select
  gp.game_id,
  g.match_id,
  g.game_number,
  g.recorded_by,
  g.played_at,
  g.game_type,
  g.location,
  g.sex,
  gp.user_id,
  gp.pickle_pal_id,
  gp.team,
  (g.winning_team = gp.team)                                   as won,
  case when gp.team = 1 then g.team1_score else g.team2_score end as points_for,
  case when gp.team = 1 then g.team2_score else g.team1_score end as points_against,
  case when gp.user_id = g.recorded_by then g.fun_rating end   as fun_rating
from public.game_participants gp
join public.games g on g.id = gp.game_id;


-- ---------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (who can read/write which rows)
--     With RLS on, a table returns NOTHING unless a policy allows it.
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.user_settings     enable row level security;
alter table public.permissions       enable row level security;
alter table public.roles             enable row level security;
alter table public.role_permissions  enable row level security;
alter table public.user_roles        enable row level security;
alter table public.friendships       enable row level security;
alter table public.pickle_pals       enable row level security;
alter table public.matches           enable row level security;
alter table public.games             enable row level security;
alter table public.game_participants enable row level security;

-- profiles: any logged-in user can read (needed for username search);
-- you edit your own; admin edits/deletes anyone. Inserts happen via trigger.
create policy "profiles: read" on public.profiles
  for select to authenticated using (true);
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using      (id = auth.uid() or public.has_permission('admin.manage_all'))
  with check (id = auth.uid() or public.has_permission('admin.manage_all'));
create policy "profiles: admin delete" on public.profiles
  for delete to authenticated using (public.has_permission('admin.manage_all'));

-- user_settings: your own only (admin can do all)
create policy "settings: own or admin" on public.user_settings
  for all to authenticated
  using      (user_id = auth.uid() or public.has_permission('admin.manage_all'))
  with check (user_id = auth.uid() or public.has_permission('admin.manage_all'));

-- permission tables: everyone can read; only permission managers can change
create policy "permissions: read" on public.permissions
  for select to authenticated using (true);
create policy "permissions: manage" on public.permissions
  for all to authenticated
  using (public.has_permission('admin.manage_permissions'))
  with check (public.has_permission('admin.manage_permissions'));

create policy "roles: read" on public.roles
  for select to authenticated using (true);
create policy "roles: manage" on public.roles
  for all to authenticated
  using (public.has_permission('admin.manage_permissions'))
  with check (public.has_permission('admin.manage_permissions'));

create policy "role_permissions: read" on public.role_permissions
  for select to authenticated using (true);
create policy "role_permissions: manage" on public.role_permissions
  for all to authenticated
  using (public.has_permission('admin.manage_permissions'))
  with check (public.has_permission('admin.manage_permissions'));

create policy "user_roles: read own or manager" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_permission('admin.manage_permissions'));
create policy "user_roles: manage" on public.user_roles
  for all to authenticated
  using (public.has_permission('admin.manage_permissions'))
  with check (public.has_permission('admin.manage_permissions'));

-- friendships: both people can see/delete (unfriend / cancel).
-- Creating & accepting go through the RPC functions above.
create policy "friendships: read own" on public.friendships
  for select to authenticated
  using (auth.uid() in (requester_id, addressee_id) or public.has_permission('admin.manage_all'));
create policy "friendships: delete own" on public.friendships
  for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id) or public.has_permission('admin.manage_all'));
create policy "friendships: admin write" on public.friendships
  for all to authenticated
  using (public.has_permission('admin.manage_all'))
  with check (public.has_permission('admin.manage_all'));

-- pickle_pals: owner + owner's friends can see them; only owner (or admin) can change.
create policy "pals: read" on public.pickle_pals
  for select to authenticated
  using (owner_id = auth.uid()
         or public.are_friends(owner_id, auth.uid())
         or public.has_permission('admin.manage_all')
         or public.has_permission('stats.compare_anyone'));
create policy "pals: create" on public.pickle_pals
  for insert to authenticated
  with check ((owner_id = auth.uid() and public.has_permission('pickle_pals.create'))
              or public.has_permission('admin.manage_all'));
create policy "pals: update" on public.pickle_pals
  for update to authenticated
  using      (owner_id = auth.uid() or public.has_permission('admin.manage_all'))
  with check (owner_id = auth.uid() or public.has_permission('admin.manage_all'));
create policy "pals: delete" on public.pickle_pals
  for delete to authenticated
  using (owner_id = auth.uid() or public.has_permission('admin.manage_all'));

-- games: visible if you/a friend played (or admin). Only the recorder (or admin) edits.
create policy "games: read" on public.games
  for select to authenticated
  using (recorded_by = auth.uid() or public.can_view_game(id));
create policy "games: create" on public.games
  for insert to authenticated
  with check (
    (recorded_by = auth.uid()
     and public.has_permission('games.create')
     and (match_id is null
          or exists (select 1 from public.matches m
                     where m.id = match_id and m.recorded_by = auth.uid())))
    or public.has_permission('admin.manage_all'));
create policy "games: update" on public.games
  for update to authenticated
  using      (recorded_by = auth.uid() or public.has_permission('admin.manage_all'))
  with check (recorded_by = auth.uid() or public.has_permission('admin.manage_all'));
create policy "games: delete" on public.games
  for delete to authenticated
  using (recorded_by = auth.uid() or public.has_permission('admin.manage_all'));

-- matches: visible if you recorded it or can see any of its games.
create policy "matches: read" on public.matches
  for select to authenticated
  using (recorded_by = auth.uid()
         or public.has_permission('admin.manage_all')
         or exists (select 1 from public.games g where g.match_id = matches.id));
create policy "matches: create" on public.matches
  for insert to authenticated
  with check ((recorded_by = auth.uid() and public.has_permission('games.create'))
              or public.has_permission('admin.manage_all'));
create policy "matches: update" on public.matches
  for update to authenticated
  using      (recorded_by = auth.uid() or public.has_permission('admin.manage_all'))
  with check (recorded_by = auth.uid() or public.has_permission('admin.manage_all'));
create policy "matches: delete" on public.matches
  for delete to authenticated
  using (recorded_by = auth.uid() or public.has_permission('admin.manage_all'));

-- game_participants: same visibility as the game.
-- The recorder may add: themselves, their accepted friends, or their own pickle pals.
create policy "participants: read" on public.game_participants
  for select to authenticated
  using (public.can_view_game(game_id)
         or exists (select 1 from public.games g
                    where g.id = game_id and g.recorded_by = auth.uid()));
create policy "participants: create" on public.game_participants
  for insert to authenticated
  with check (
    (exists (select 1 from public.games g where g.id = game_id and g.recorded_by = auth.uid())
     and (user_id = auth.uid()
          or public.are_friends(user_id, auth.uid())
          or exists (select 1 from public.pickle_pals p
                     where p.id = pickle_pal_id and p.owner_id = auth.uid())))
    or public.has_permission('admin.manage_all'));
create policy "participants: update" on public.game_participants
  for update to authenticated
  using (exists (select 1 from public.games g where g.id = game_id and g.recorded_by = auth.uid())
         or public.has_permission('admin.manage_all'))
  with check (
    (exists (select 1 from public.games g where g.id = game_id and g.recorded_by = auth.uid())
     and (user_id = auth.uid()
          or public.are_friends(user_id, auth.uid())
          or exists (select 1 from public.pickle_pals p
                     where p.id = pickle_pal_id and p.owner_id = auth.uid())))
    or public.has_permission('admin.manage_all'));
create policy "participants: delete" on public.game_participants
  for delete to authenticated
  using (exists (select 1 from public.games g where g.id = game_id and g.recorded_by = auth.uid())
         or public.has_permission('admin.manage_all'));


-- ---------------------------------------------------------------------
-- 11. AVATAR STORAGE
--     Public bucket, max 1 MB, images only.
--     Each user may only write inside a folder named with their user id:
--       avatars/<user-id>/avatar.png
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- =====================================================================
--  AFTER you sign up with your own account, run this ONCE to make
--  yourself admin (replace the username):
--
--  insert into public.user_roles (user_id, role)
--  select id, 'admin' from public.profiles where username = 'YOUR_USERNAME';
-- =====================================================================
