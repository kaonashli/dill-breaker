-- =====================================================================
--  DEV ONLY: fake user who sends you a friend request
--  Run in Supabase SQL Editor. Replace YOUR_USERNAME first.
--  NOT a migration - don't run this on purpose in production long-term;
--  use the DELETE at the bottom to clean up.
-- =====================================================================

-- 1) Create the fake account. Our trigger turns this into a profile
--    (username fake_tester, display name Fake Tester). It has no password,
--    so nobody can log in as it.
insert into auth.users (
  instance_id, id, aud, role, email,
  raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'fake.tester@example.com',
  '{"provider":"email","providers":["email"]}',
  '{"username":"fake_tester","display_name":"Fake Tester"}',
  now(), now(), now()
);

-- 2) Fake Tester sends YOU a friend request
insert into public.friendships (requester_id, addressee_id)
select fake.id, me.id
from public.profiles fake, public.profiles me
where fake.username = 'fake_tester'
  and me.username = 'YOUR_USERNAME';


-- =====================================================================
--  CLEAN UP: run this on its own when you're done.
--  Deleting the auth user also deletes its profile, friendship, games, etc.
-- =====================================================================
-- delete from auth.users where email = 'fake.tester@example.com';
