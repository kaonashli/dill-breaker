-- =====================================================================
--  006 - Titles & descriptions, private notes, and photos for games/matches
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  - games / matches get a title + description (shown in the activity feed).
--    A single game uses its own; a match uses the match's.
--  - private_notes: your personal notes on a game or match. ONLY YOU can
--    read them (not friends, not admins).
--  - game_photos: up to 5 photos per game or match, stored in a PRIVATE
--    storage bucket. Only people who can see the game can see its photos.
-- =====================================================================


-- 1. Title + description -----------------------------------------------
alter table public.games
  add column if not exists title text check (char_length(title) <= 80),
  add column if not exists description text check (char_length(description) <= 1000);

alter table public.matches
  add column if not exists title text check (char_length(title) <= 80),
  add column if not exists description text check (char_length(description) <= 1000);


-- 2. Helper: can the logged-in user see this match? ----------------------
create or replace function public.can_view_match(mid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.matches m where m.id = mid and m.recorded_by = auth.uid())
      or exists (select 1 from public.games g where g.match_id = mid and public.can_view_game(g.id));
$$;


-- 3. Private notes -------------------------------------------------------
create table if not exists public.private_notes (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_id    uuid references public.games (id) on delete cascade,
  match_id   uuid references public.matches (id) on delete cascade,
  note       text not null check (char_length(note) <= 2000),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(game_id, match_id) = 1)  -- for exactly one game OR one match
);
create unique index if not exists private_notes_game_uniq  on public.private_notes (owner_id, game_id)  where game_id is not null;
create unique index if not exists private_notes_match_uniq on public.private_notes (owner_id, match_id) where match_id is not null;

alter table public.private_notes enable row level security;

drop policy if exists "notes: owner only" on public.private_notes;
create policy "notes: owner only" on public.private_notes
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- 4. Photos (table) ------------------------------------------------------
create table if not exists public.game_photos (
  id          uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_id     uuid references public.games (id) on delete cascade,
  match_id    uuid references public.matches (id) on delete cascade,
  path        text not null unique,          -- file path inside the game-photos bucket
  position    smallint not null default 0,   -- display order
  created_at  timestamptz not null default now(),
  check (num_nonnulls(game_id, match_id) = 1)
);
create index if not exists game_photos_game_idx  on public.game_photos (game_id);
create index if not exists game_photos_match_idx on public.game_photos (match_id);

-- Max 5 photos per game / match
create or replace function public.enforce_photo_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.game_photos
      where (new.game_id is not null and game_id = new.game_id)
         or (new.match_id is not null and match_id = new.match_id)) >= 5 then
    raise exception 'You can add at most 5 photos';
  end if;
  return new;
end;
$$;

drop trigger if exists game_photos_limit on public.game_photos;
create trigger game_photos_limit
  before insert on public.game_photos
  for each row execute function public.enforce_photo_limit();

alter table public.game_photos enable row level security;

-- See photos of games/matches you can see
drop policy if exists "photos: read" on public.game_photos;
create policy "photos: read" on public.game_photos
  for select to authenticated
  using (
    (game_id is not null and (
       public.can_view_game(game_id)
       or exists (select 1 from public.games g where g.id = game_id and g.recorded_by = auth.uid())))
    or (match_id is not null and public.can_view_match(match_id))
  );

-- Only the person who logged the game/match (or an admin) adds photos
drop policy if exists "photos: add" on public.game_photos;
create policy "photos: add" on public.game_photos
  for insert to authenticated
  with check (
    (uploaded_by = auth.uid() and (
       (game_id is not null and exists (select 1 from public.games g where g.id = game_id and g.recorded_by = auth.uid()))
       or (match_id is not null and exists (select 1 from public.matches m where m.id = match_id and m.recorded_by = auth.uid()))))
    or public.has_permission('admin.manage_all')
  );

drop policy if exists "photos: delete" on public.game_photos;
create policy "photos: delete" on public.game_photos
  for delete to authenticated
  using (uploaded_by = auth.uid() or public.has_permission('admin.manage_all'));


-- 5. Photos (storage bucket) ---------------------------------------------
--    PRIVATE bucket: the app gets short-lived links for photos you're allowed to see.
--    Files live at game-photos/<your user id>/<random name>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-photos', 'game-photos', false, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "game photos: upload own" on storage.objects;
create policy "game photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'game-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- You can view a file if you can see its game_photos row (that table's rules apply)
drop policy if exists "game photos: view" on storage.objects;
create policy "game photos: view" on storage.objects
  for select to authenticated
  using (bucket_id = 'game-photos'
         and exists (select 1 from public.game_photos gp where gp.path = storage.objects.name));

drop policy if exists "game photos: delete own" on storage.objects;
create policy "game photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'game-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('admin.manage_all')));
