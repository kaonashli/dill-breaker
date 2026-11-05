-- =====================================================================
--  004 - Separate widget layout for profile pages
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  user_settings.widgets          = your home dashboard layout (unchanged)
--  user_settings.profile_widgets  = the layout you see on profile pages
--  (Top stats + play calendar are always shown on profiles, so they're not in this list.)
--  Existing users get the default list automatically.
-- =====================================================================
alter table public.user_settings
  add column if not exists profile_widgets jsonb not null
  default '["win_loss","points_per_game","play_partners","chemistry","singles_vs_doubles"]'::jsonb;
