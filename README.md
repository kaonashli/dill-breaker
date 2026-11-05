# Dill Breaker 🥒

A pickleball score-keeping app. Log your games and matches, add friends, track
"pickle pals" who don't have an account, follow your friends' games in an activity
feed, and see your stats on a dashboard you can rearrange, side by side with up
to four other players. Works on desktop and installs like an app on your phone.

**Live app: [dill-breaker.netlify.app](https://dill-breaker.netlify.app)**

Built with **React (Vite)** and **Supabase** (Postgres, Auth, Storage), hosted on **Netlify**.

---

## Features

**Accounts**
- Sign up with email, password, display name, a unique username and an optional profile photo
- Passwords are handled by Supabase Auth and stored hashed (bcrypt); the app never stores them
- Light, dark or system theme, saved to your account (dark by default)

**Friends & pickle pals**
- Search other players by username (matches usernames that start with what you
  type, min 3 characters) and send friend requests
- Accept or decline incoming requests, cancel sent ones, unfriend
- Up to 5 *pickle pals* per account: named players with no login, for friends who'd
  rather not sign up. Only the owner can edit them.

**Logging games**
- **Game:** date, singles/doubles, result, and optionally location (indoor/outdoor),
  sex (female/male/mixed), partner, opponents, both scores and a 1–5 star fun rating
- **Match:** several games at once. Choose how many, add or remove games, and settings
  from game 1 (type, players, location, sex) copy to the other games until you change them there.
- Score validation follows pickleball rules: win by 2, games to 11, 15 or 21,
  extended games like 12-10. Impossible scores such as 14-9 are rejected.
- Win/loss is filled in automatically when both scores are entered
- A game counts toward the stats of every account that played in it

**Dashboard widgets** (drag to reorder, remove, add back; layout is saved per user)
- Play calendar: GitHub-style heatmap of the last 6 months
- Wins vs losses
- Points per game
- Who you play with / against most
- Chemistry with each partner (win % together compared with your overall win %)
- Singles vs doubles record

**Compare** any widget with up to 4 friends or pickle pals at once.

**Player profiles** (`/u/username`)
- Photo, name, member since, and friend actions (add, accept, remove, compare stats)
- Fixed at the top: stat tiles (games, win %, record, singles/doubles, average points,
  top partner), your head-to-head with them, and their play calendar
- Below that, all the dashboard widgets, which you can rearrange, remove and re-add
  (one layout for all profiles, saved separately from your home page)
- Stats are visible to the player, their friends and admins

**Activity feed**
- Every game and match you and your friends played, newest first
- Matches appear as one card with games won and each game's score
- The winning side is marked with a 🏆 Won badge

**Mobile**
- App-style bottom tab bar: Home, Games (Activity / My games), Log, Friends, Profile
- No zooming or sideways sliding; Save buttons stay in view on long forms
- Add to your home screen to open it full-screen like an app
  (Safari: Share → Add to Home Screen; Chrome: ⋮ → Install app)

**Admin**
- Edit any user's name, username and roles
- Manage all pickle pals and all games
- Roles & permissions editor: add permissions and roles, and tick which roles get what
- Admins can compare any players, not just their friends

---

## Getting started

### 1. Prerequisites
- [Node.js](https://nodejs.org) 18 or newer (LTS recommended)
- A free [Supabase](https://supabase.com) project

### 2. Set up the database
1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the tables, security policies, triggers and the `avatars` storage bucket.
3. Then run each file in [`supabase/migrations/`](supabase/migrations/) in number order.
   These are changes made after the first release:

   | File | What it does |
   |---|---|
   | `002_private_profiles.sql` | Private profiles + safe username search (`search_users`) |
   | `003_default_dark_theme.sql` | New accounts start in dark mode |
   | `004_profile_widgets.sql` | Separate widget layout for profile pages |
4. Recommended: under **Authentication → Sign In / Providers → Email**, turn on
   **Confirm email** and set a minimum password length of at least 8.

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in the values from
**Project Settings → API** in Supabase:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

`.env` is git-ignored. The publishable (anon) key is designed to be used in the
browser; your data is protected by the database's row level security policies.

### 4. Install and run
```bash
npm install
npm run dev
```
Open http://localhost:5173. To try it on your phone, run `npm run dev -- --host` and
open the "Network" address it prints (same Wi-Fi).

In VS Code you can also use **Run and Debug** (Ctrl+Shift+D): *Run app*,
*Run app (phone on same Wi-Fi)*, or *Debug in Edge / Chrome* for breakpoints.

### 5. Make yourself an admin
Sign up in the app, then run this in the Supabase SQL Editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where username = 'YOUR_USERNAME';
```

Refresh the app and an **Admin** link appears in the top bar (🛡️ Admin on phones).

---

## Project structure

```
supabase/schema.sql        Database: tables, security policies, triggers, storage
supabase/migrations/       Database changes after v0.1.0 (run in number order)
public/                    App icon + manifest (home screen install)
.vscode/                   Run and Debug configurations
src/
  main.jsx                 App entry; wraps the app in router, theme and auth providers
  App.jsx                  Page routes
  supabaseClient.js        Shared Supabase client (reads .env)
  context/
    AuthContext.jsx        Logged-in user, profile, permissions, settings
    ThemeContext.jsx       Light / dark / system theme
  pages/                   One file per screen
    Login, Signup, Dashboard, Feed, Games, AddGame, AddMatch,
    Friends, PlayerProfile (/u/username), Profile (your settings), Admin
  components/              Reusable UI pieces (game form, friends panel, nav bars...)
    WidgetBoard.jsx        Draggable widget grid (used on the dashboard and profiles)
    widgets/               Widgets; register new ones in widgets/index.js
  lib/                     Plain JavaScript helpers
    score.js               Pickleball score rules
    stats.js               Stats math for widgets
    games.js               Converting between the game form and database rows
    useStats.js            Loads stats data for the dashboard
    people.js              Friends + pickle pals hook
```

## How it works

### Data model
| Table | Purpose |
|---|---|
| `profiles` | One per account: username, display name, avatar |
| `user_settings` | Theme, dashboard widget layout (`widgets`) and profile page layout (`profile_widgets`) |
| `permissions`, `roles`, `role_permissions`, `user_roles` | Permission system |
| `friendships` | Friend requests (pending / accepted) |
| `pickle_pals` | Account-less players, max 5 per owner |
| `matches` | Groups games together (a single game has no match) |
| `games` | One game: date, type, scores, winning team, etc. Team 1 is always the logger's team |
| `game_participants` | Who played in each game and on which team |
| `player_game_results` (view) | One row per player per game from that player's side; all widgets read this |

### Permissions
Users have roles, and roles have permissions. New accounts get the `user` role.

| Permission | user | admin |
|---|:-:|:-:|
| `games.create` | ✓ | ✓ |
| `friends.request` | ✓ | ✓ |
| `pickle_pals.create` | ✓ | ✓ |
| `stats.compare_anyone` | | ✓ |
| `admin.manage_all` | | ✓ |
| `admin.manage_permissions` | | ✓ |

To gate a new feature: add a permission on the Admin page, tick the roles that should
have it, then check it with `hasPermission('your.key')` (from `useAuth()`) in React,
or with `public.has_permission('your.key')` in an SQL policy.

### Who can see what
- You can see profiles of yourself, your friends, people with a pending friend request
  with you, and people in games you can see. Username search only matches usernames
  that start with what you type (min 3 characters).
- You can see games that you or one of your accepted friends played in
- Only the person who logged a game (or an admin) can edit or delete it
- When logging a game you can add yourself, your accepted friends, or your own pickle pals
- Profile photos are public; each user can only upload to their own folder (max 1 MB)

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |

## Deployment
The live site is hosted on Netlify and connected to this GitHub repo: every push to
`main` redeploys automatically. Build settings and the single-page-app redirect live in
[`netlify.toml`](netlify.toml). `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
under Netlify → Project configuration → Environment variables. Don't mark them as secret:
they're public by design and end up in the site's JavaScript.

In Supabase → Authentication → URL Configuration, the Site URL is
`https://dill-breaker.netlify.app`, with `http://localhost:5173` also allowed for local development.

## Known limitations
- If two friends both log the same game, it's counted twice
- Fully deleting an account must be done in Supabase → Authentication → Users
  (this removes the profile, games and pickle pals with it)
- No "forgot password" flow yet

See [CHANGELOG.md](CHANGELOG.md) for release notes.
