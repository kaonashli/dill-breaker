# Changelog

## Unreleased

> **Upgrading?** Run `supabase/migrations/008` in the Supabase SQL Editor before deploying.

### New
- **Just for fun result:** a third option next to Win / Loss when logging a game.
  Fun games show in the feed, the play calendar and "who you play with", but
  never count toward wins, losses, win %, points or chemistry. Any score from
  0 to 50 is allowed (no win-by-2 rules) (`migrations/008`).
- **Pickle logo animation:** every 5 seconds, the pickle strains, SNAPS in
  two with a spray of pickle juice, hangs broken, then springs back whole and
  rests for a few seconds.
  Skipped for people who turn on "reduce motion".

### Changed
- **What's new:** "Back to home" / "Back to log in" links at the top and bottom.
- **Login page:** a visible "✨ What's new" link inside the card.
- **Non-friend profiles** show only the photo, name, username and Add friend
  (no paddle, member-since or stats). Admins still see everything, and the
  View as switch gains a "Me" option to see a profile as a regular user.
- **Icons instead of emojis** for the private notes lock, the add-photo camera
  the "pick another title" dice, the settings gear, and a filled gold trophy
  (with a dark outline) in the Won badge.
- **Toggle buttons** (Singles / Doubles, Win / Loss / Just for fun, etc.) are
  now equal widths for an even look on desktop.
- **Sign out** moved to the bottom of your own profile page (out of settings).
- **Theme button** (light / dark / system) uses drawn sun, moon and screen
  icons instead of emojis, in the top bar and in settings.

## v0.4.0 (2026-11-05): Photos, stories & your own paddle 🏓

> **Upgrading?** Run `supabase/migrations/006` and `007` in the Supabase SQL
> Editor **before** deploying - the app reads the new columns.

### New
- **Title & description** for games and matches, shown in the activity feed.
  New ones get a random punny default title based on the time of day
  ("Rise and Dink", "Dinks After Dark"...), with a 🎲 button to pick another.
- **Private notes** on games and matches. Only you can read them (not friends,
  not admins). Add them when logging, or any time on the game's page.
- **Photos:** up to 5 per game or match, stored privately (only people who can
  see the game can see them). In the feed they show one at a time - swipe
  sideways for the rest.
- **Game / match details page** (`/activity/game/:id`, `/activity/match/:id`):
  tap any feed card to see everything, all photos, and your notes. The owner can
  edit the title, description and photos there, or delete.
- **Mini court icon** in the top-right of each feed card: a small angled court
  with a net and 1 or 2 players per side, labelled Singles / Doubles. It also
  shows Indoor / Outdoor; outdoor games get a little sun (day) or moon (night).
- **Paddle color:** everyone picks a paddle color in Edit profile & settings
  (Sunset, Tangerine, Coral, Bubblegum, Lavender, Ice, Lime - one per color
  family, all picked to look good on the blue court; default is Sunset, the
  original orange-yellow). It colors the paddles and ball on your play calendar
  court, and a straight paddle in your color sits in your profile header
  (`migrations/007`).
- **Admin "View as":** on any profile page, admins can preview it as a friend
  or as a stranger would see it.
- **What's new is public:** opens without logging in, linked subtly at the
  bottom of the home page and next to the credit on login / sign-up.
- **Clickable players in the feed:** every name with an account in "X played
  ... with Y" (and on the details page) opens that player's profile, where
  you can add them as a friend. Pickle pals stay plain text.

### Changed
- **Log a game / match forms:** the title (required) and description now come
  first; required fields are marked with a red *, and the "Required" /
  "Optional" headings are gone. Private notes and photos are at the bottom.
- **Feed cards** now start with the title, then who played what.
- **Feed wording:** "Alex played a doubles game with Sam, Jo and Pat" instead
  of "Alex logged a doubles game".
- After saving a game or match you land on its details page.
- "What's new" button removed from the settings page.
- **Play calendar:** the court now continues on the far side of the net, seen
  through the see-through net and fading into the distance. Sidelines stay one
  continuous straight line across the net at any screen size.
- **Play calendar:** two paddles (in your paddle color) and a matching ball
  lying on the court.
- **Play calendar court:** bigger, lighter-blue kitchens on both sides with the
  net centered between them; both halves now match so there's no seam at the
  net; grassy green on the sides in light mode; a darker court in light mode;
  and the pickleball holes are truly see-through.

## v0.3.0 (2026-11-05): Notifications & a pickleball makeover 🔔

> **Upgrading?** Run `supabase/migrations/005` in the Supabase SQL Editor.

### New
- **What's new page** (`/whats-new`): friendly in-app release notes with the app
  version. Linked from the Profile tab, and a one-time banner on the dashboard
  after each update. Notes live in `src/lib/releases.js`.
- Small "still in development" note (Profile footer, What's new) and a
  "Developed by kaonashli" credit linking to GitHub (login / sign-up, What's new).
- Profile pages show the play calendar first, above the stats.
- **Friend request notifications:** red count badge on the Friends tab / nav link,
  a pop-up at the top of the screen ("Alex sent you a friend request" + View), a
  pickleball "pock" sound, and the count in the browser tab title. New requests
  arrive instantly (`migrations/005`), with a backup check when you return to the
  tab and every minute.
- **Sound setting** on your Profile (on/off + test button), saved per device.
- **Friends** link in the desktop top bar.

### Changed
- **Play calendar looks like a pickleball net:** white tape across the top, posts
  on each side, and a see-through court (sidelines, kitchen line, center line)
  in perspective underneath that fades out. Days you played show a pickleball,
  darker for more games; empty days are plain squares. The legend uses pickleballs too.
- **New notification sound:** a single paddle hit instead of two beeps.
- **New logo:** a drawn, curved pickle next to "Dill Breaker" in the top bar and
  on the login / sign-up pages (replaces the 🥒 emoji).
- **Games tab icon** on phones is now a pickleball paddle.

### Fixed
- **Friend request notifications on phones** no longer need a page refresh: the
  app re-checks when it comes back on screen (switching apps, unlocking), when
  the connection returns, and every 20 seconds while open, and reconnects the
  live connection if the phone drops it.

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
  game's score. The winning side gets a **Won** badge (with a trophy icon) and highlight; the losing
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
