-- =====================================================================
--  003 - New accounts start in dark mode
--  Run once in: Supabase Dashboard > SQL Editor > New query
--
--  Only changes the default for accounts created from now on.
--  Existing users keep whatever theme they already have.
-- =====================================================================
alter table public.user_settings alter column theme set default 'dark';
