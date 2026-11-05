-- =====================================================================
--  008 - "Just for fun" games
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  A game can be marked "just for fun": it has no winner, any score
--  (0-50) is allowed, and it doesn't count toward wins/losses or points.
--  It still counts as a game played (play calendar, who you play with).
-- =====================================================================

alter table public.games
  add column if not exists for_fun boolean not null default false;

-- A fun game has no winner; every other game still needs one
alter table public.games alter column winning_team drop not null;
alter table public.games drop constraint if exists games_winner_required;
alter table public.games add constraint games_winner_required
  check (for_fun or winning_team is not null);

-- Pickleball score rules only apply to real (non-fun) games
alter table public.games drop constraint if exists games_valid_score;
alter table public.games add constraint games_valid_score
  check (for_fun or public.is_valid_score(team1_score, team2_score, winning_team));

-- Stats view: fun games have won / points = null so they aren't counted.
-- (New column for_fun is added at the end.)
create or replace view public.player_game_results
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
  case when g.for_fun then null else (g.winning_team = gp.team) end as won,
  case when g.for_fun then null when gp.team = 1 then g.team1_score else g.team2_score end as points_for,
  case when g.for_fun then null when gp.team = 1 then g.team2_score else g.team1_score end as points_against,
  case when gp.user_id = g.recorded_by then g.fun_rating end as fun_rating,
  g.for_fun
from public.game_participants gp
join public.games g on g.id = gp.game_id;
