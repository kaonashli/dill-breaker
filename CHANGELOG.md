# Changelog

## v0.1.0 (2026-11-03): First release 🥒

The first version of Dill Breaker: accounts, friends, game and match logging,
and a customizable stats dashboard.

### New
- **Accounts:** sign up with email, password, display name, unique username and an
  optional profile photo. Log in with email and password. Change your name,
  username, photo and password on the Profile page.
- **Light & dark mode:** light, dark or follow-the-system, remembered per account.
- **Friends:** search by username, send, accept, decline and cancel friend requests, unfriend.
- **Pickle pals:** up to 5 account-less players per user, for tracking games with
  friends who don't want to sign up.
- **Log a game:** singles or doubles, result, location, sex, partner, opponents,
  scores and a fun rating. Required fields come first. Win/loss is filled in from
  the score when both scores are entered.
- **Log a match:** several games in one go. Settings from game 1 copy to the other
  games until you change them there.
- **Pickleball score rules:** games to 11, 15 or 21, win by 2, extended games
  (12-10, 16-14). Invalid scores are rejected both in the form and in the database.
- **Dashboard widgets:** play-calendar heatmap, wins vs losses, points per game,
  who you play with, partner chemistry, and singles vs doubles. Drag to reorder,
  remove and re-add; your layout is saved.
- **Compare:** show any widget for yourself and up to 4 friends or pickle pals side by side.
- **Games history:** browse, edit and delete your games, 20 per page.
- **Admin tools:** edit users and their roles, manage all pickle pals and games,
  and manage roles and permissions from a grid on the Admin page.
- **Permissions:** role-based permission system that new features can be gated behind.

### Security
- Passwords are managed by Supabase Auth and stored hashed
- Row level security on every table: users only see their own games and their
  friends' games, and can only change what they own
- Profile photo uploads limited to images up to 1 MB, in each user's own folder

### Known limitations
- A game logged by two friends separately is counted twice
- Fully deleting an account is done in the Supabase dashboard
- No password reset email flow yet
