-- =====================================================================
--  007 - Paddle color per player
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  Everyone picks a paddle color (from the app's palette). It colors the
--  paddles + ball on their play calendar court, and others can see it.
--  Default 'sunset' = the original orange-yellow.
--  (The list must match src/lib/paddleColors.js)
-- =====================================================================
alter table public.profiles
  add column if not exists paddle_color text not null default 'sunset'
  check (paddle_color in ('sunset', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'));
