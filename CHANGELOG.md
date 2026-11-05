# Changelog

## v0.2.0 (2026-11-05): Profiles, Activity feed & mobile app feel 📱

Player profile pages, an activity feed of your friends' games, a phone layout
that feels like a real app, and tighter privacy.

> **Upgrading from v0.1.0?** Run `supabase/migrations/002`, `003` and `004`
> in the Supabase SQL Editor, in that order.

### Security
- **Friend search can no longer list every user.** Typing `%` or `_` used to match
  all usernames. Search now matches usernames that *start with* your text
  (min 3 characters, max 10 results), and runs in the database. (`migrations/002`)
- **Profiles are now private.** You can only see your own profile, your friends,
  people with a pending friend request with you, and players in games you can see.
  Admins still see everyone.

### New
- **Activity feed** (`/feed`): every game and match you or your friends played,
  newest first. Matches show as one card with the games won by each side and every
  game's score. The winning side gets a 🏆 **Won** badge and highlight; the losing
  side is dimmed. Opens from the Games tab (with a switch to "My games") or
  Activity on desktop.
- **Player profile pages** (`/u/username`): photo, name, member since, stat tiles
  (games, win %, record, singles/doubles, average points, top partner), your
  head-to-head with them, and their play calendar. Add, accept, or remove friends
  and jump to "Compare stats" right from the page. Click a friend's name to open it.
  Below the fixed stats and calendar, all the dashboard widgets can be moved,
  removed and re-added; this layout is saved separately from your home page
  (`migrations/004`).

### Changed
- **Mobile layout feels like an app:** bottom tab bar (Home, Games, Log, Friends,
  Profile), no more zooming when tapping inputs, no sideways dragging or bounce,
  charts no longer jump while refreshing, and Save stays visible on long forms.
- **Install to home screen:** opens full-screen with its own icon.
- **Friends page** (`/friends`) for friends and pickle pals on phones.
- **Admin on phones:** admins get a 🛡️ Admin button in the top bar. Sign out and
  Admin tools are also at the bottom of the Profile tab.
- **Games** in the desktop top bar is now **My games**, next to **Activity**.
- **Login and sign-up pages** now include a short description of what Dill Breaker is.
- **Dark mode by default** for first-time visitors and new accounts (`migrations/003`).
  You can still switch to light or system in the top bar or on your Profile.

### Deployment & tooling
- Live at [dill-breaker.netlify.app](https://dill-breaker.netlify.app). Netlify
  config (`netlify.toml`) handles page refreshes on any URL.
- VS Code **Run and Debug** configs: Run app, Run on your network (for phones),
  Debug in Edge / Chrome.

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

# Changelog

## v0.2.0 (2026-11-05): Profiles, Activity feed & mobile app feel 📱

Player profile pages, an activity feed of your friends' games, a phone layout
that feels like a real app, and tighter privacy.

> **Upgrading from v0.1.0?** Run `supabase/migrations/002`, `003` and `004`
> in the Supabase SQL Editor, in that order.

### Security
- **Friend search can no longer list every user.** Typing `%` or `_` used to match
  all usernames. Search now matches usernames that *start with* your text
  (min 3 characters, max 10 results), and runs in the database. (`migrations/002`)
- **Profiles are now private.** You can only see your own profile, your friends,
  people with a pending friend request with you, and players in games you can see.
  Admins still see everyone.

### New
- **Activity feed** (`/feed`): every game and match you or your friends played,
  newest first. Matches show as one card with the games won by each side and every
  game's score. The winning side gets a 🏆 **Won** badge and highlight; the losing
  side is dimmed. Opens from the Games tab (with a switch to "My games") or
  Activity on desktop.
- **Player profile pages** (`/u/username`): photo, name, member since, stat tiles
  (games, win %, record, singles/doubles, average points, top partner), your
  head-to-head with them, and their play calendar. Add, accept, or remove friends
  and jump to "Compare stats" right from the page. Click a friend's name to open it.
  Below the fixed stats and calendar, all the dashboard widgets can be moved,
  removed and re-added; this layout is saved separately from your home page
  (`migrations/004`).

### Changed
- **Mobile layout feels like an app:** bottom tab bar (Home, Games, Log, Friends,
  Profile), no more zooming when tapping inputs, no sideways dragging or bounce,
  charts no longer jump while refreshing, and Save stays visible on long forms.
- **Install to home screen:** opens full-screen with its own icon.
- **Friends page** (`/friends`) for friends and pickle pals on phones.
- **Admin on phones:** admins get a 🛡️ Admin button in the top bar. Sign out and
  Admin tools are also at the bottom of the Profile tab.
- **Games** in the desktop top bar is now **My games**, next to **Activity**.
- **Login and sign-up pages** now include a short description of what Dill Breaker is.
- **Dark mode by default** for first-time visitors and new accounts (`migrations/003`).
  You can still switch to light or system in the top bar or on your Profile.

### Deployment & tooling
- Live at [dill-breaker.netlify.app](https://dill-breaker.netlify.app). Netlify
  config (`netlify.toml`) handles page refreshes on any URL.
- VS Code **Run and Debug** configs: Run app, Run on your network (for phones),
  Debug in Edge / Chrome.

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

