---
description: Load project context for Dill Breaker (pickleball score-keeping app)
---

You are working on **Dill Breaker**, a pickleball score-keeping web app. Read this, then briefly confirm you're ready (don't summarize it all back). Only open files when the task needs them.

## About the user
- Knows JavaScript, **new to React**: keep code simple and readable, add comments where helpful, avoid clever abstractions.
- Windows 10, PowerShell, VS Code. Node.js and Git may need installing. Check once with `Get-Command`; if a tool is missing, tell them to install it. **Don't spend tokens searching.** If something can't be found quickly, ask.
- Wants to see SQL/schema changes before they're applied (they run SQL themselves in the Supabase SQL Editor).

## Stack
- React 18 + Vite (plain JS/JSX, no TypeScript), react-router-dom v6, Recharts (charts), @dnd-kit (drag & drop), @supabase/supabase-js v2.
- Supabase project: `https://scxiorldedcwwlljxzhz.supabase.co`. Keys live in `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (git-ignored; `.env.example` is the template). Never commit `.env`.
- Run: `npm install`, `npm run dev` → http://localhost:5173.

## Key files
- `supabase/schema.sql`: the whole DB (tables, RLS policies, triggers, RPCs, storage bucket). Already applied once. **Schema changes go in new migration SQL for the user to run** (e.g. `supabase/migrations/002_xxx.sql`); don't expect them to re-run the full schema.
- `src/context/AuthContext.jsx`: `useAuth()` → `user, profile, permissions, settings, hasPermission(key), isAdmin, refreshProfile, saveTheme, signOut`.
- `src/context/ThemeContext.jsx`: `useTheme()` → `theme ('light'|'dark'|'system'), setTheme, isDark`.
- `src/lib/score.js`: score rules (mirror of SQL `is_valid_score`). `src/lib/games.js`: game form ↔ DB rows. `src/lib/stats.js`: widget math. `src/lib/useStats.js`: loads dashboard data. `src/lib/people.js`: `usePeople()` (friends + my pals).
- `src/components/widgets/index.js`: widget registry. A widget is a component taking `{ players, stats, colors }`.
- `src/lib/colors.js`: chart palette (fixed, colorblind-checked order; charts need hex, not CSS vars). App colors are CSS variables in `src/index.css` (light default, dark via `prefers-color-scheme` and `[data-theme='dark']`).
- `README.md`, `CHANGELOG.md`: update CHANGELOG with each release.

## Data model & rules
- `profiles` (auto-created by trigger on sign-up from `raw_user_meta_data.username/display_name`), `user_settings` (theme, `widgets` jsonb array of widget ids).
- Permissions: `permissions`, `roles`, `role_permissions`, `user_roles`. Roles `user` (default) and `admin`. Keys: `games.create`, `friends.request`, `pickle_pals.create`, `stats.compare_anyone`, `admin.manage_all`, `admin.manage_permissions`. SQL helper `public.has_permission(key)`; React `hasPermission(key)`. Gate new features with a new permission.
- `friendships`: status `pending|accepted`; declining deletes the row. Create/respond via RPCs `send_friend_request(target_username)`, `respond_friend_request(request_id, accept)`. Also `username_available(name)`.
- `pickle_pals`: account-less players, max 5 per owner (trigger), only the owner edits; visible to the owner's friends.
- `matches` group `games` (`match_id` null = standalone game; `game_number` = order). Date is stored per game.
- `games`: **team 1 = the recorder's team**, `team1_score/team2_score` (nullable, 0-50), `winning_team` 1|2, `fun_rating` 1-5, optional `location`, `sex`.
- `game_participants`: one row per player per game (`user_id` XOR `pickle_pal_id`, `team`). The recorder is auto-added by trigger. Max 1 per team in singles, 2 in doubles.
- View `player_game_results` (security_invoker): one row per player per game from their side: `won, points_for, points_against`. All stats read this.
- Migrations applied after schema.sql live in `supabase/migrations/` (002 = private profiles + `search_users(term)` RPC: starts-with match, min 3 chars, no wildcards). Profiles are visible only via `can_view_profile(id)`: self, admin, any friendship row, co-players in visible games. Don't query `profiles` with ilike for search; use the RPC.
- RLS: you see games you or an accepted friend played in; only the recorder/admin edits; participants you can add = yourself, accepted friends, your own pals. Admin (`admin.manage_all`) can do everything.
- Avatars: public bucket `avatars`, path `<user_id>/avatar`, 1 MB max, resized client-side to 256px. A photo picked at sign-up is parked in localStorage and uploaded on first login.

## App conventions
- Player objects: `{ kind: 'user'|'pal', id, key: 'user:<id>'|'pal:<id>', name }`. Dashboard players also carry a color `slot` (0 = me) that stays fixed per player.
- Score rules: winner ≥ 11, win by 2, normal finishes 11/15/21, above that only exactly-2 margins (12-10). 14-9 is invalid. Either score may be blank; win/loss is auto when both are entered.
- Match form: changes to game 1's `game_type, location, sex, partner, opponents` copy to the other games unless that field was edited by hand there (`edited` array).
- Routes: `/login`, `/signup`, `/` (dashboard), `/games`, `/games/new`, `/games/:id/edit`, `/matches/new`, `/friends`, `/profile` (your settings), `/u/:username` (anyone's profile page: stats shown to self/friends/admin; "Compare stats" navigates to `/` with `state.compare`), `/admin`. Phones use a bottom tab bar (`BottomNav.jsx`); `.desktop-only` hides things below 720px.

## Decisions made (defaults; the user may revisit)
- Doubles allows up to 2 opponents.
- Duplicate logging (two friends logging the same game) counts twice. Not solved yet.
- Chemistry = win % with partner − overall win % (percentage points).
- Account deletion is done in Supabase dashboard → Authentication → Users (cascades).
- No forgot-password flow yet.

## Status
- v0.1.0 released (see CHANGELOG.md). The user has run the schema and set themselves as admin.
- GitHub: https://github.com/kaonashli/dill-breaker (branch `main`, tag + release `v0.1.0`). Commit as `kaonashli` / ashley.boily@hotmail.com (set in the repo's local git config). No `gh` CLI installed; releases are created on the GitHub website.
- Live: https://dill-breaker.netlify.app (Netlify, auto-deploys on push to `main`; config in `netlify.toml`; env vars set in Netlify UI).
