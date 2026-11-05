import { supabase } from '../supabaseClient'
import { parseScore, scoreError, winnerFromScores } from './score'

// ---------------------------------------------------------------------
// The game *form* uses this shape (all strings so inputs are happy):
// {
//   played_at:  '2026-11-03T18:30'   (datetime-local input format)
//   game_type:  'singles' | 'doubles' | ''
//   won:        true | false | null
//   location:   'indoor' | 'outdoor' | ''
//   sex:        'female' | 'male' | 'mixed' | ''
//   partner:    'user:<id>' | 'pal:<id>' | ''
//   opponents:  [key, key]  (second slot only used in doubles)
//   our_score / their_score: '' or number-like string
//   fun_rating: 0..5  (0 = not rated)
//   edited:     [] field names the user changed by hand (used by matches)
// }
// ---------------------------------------------------------------------

// Date -> 'YYYY-MM-DDTHH:mm' in local time (what <input type="datetime-local"> wants)
export function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export function newGame(overrides = {}) {
  return {
    played_at: toLocalInput(new Date()),
    game_type: '',
    won: null,
    location: '',
    sex: '',
    partner: '',
    opponents: ['', ''],
    our_score: '',
    their_score: '',
    fun_rating: 0,
    edited: [],
    ...overrides,
  }
}

// The result field (game.won) is one of:
//   true = win, false = loss, 'fun' = just for fun (not counted), null = not picked
export const FUN = 'fun'

// Win/loss: from the scores if both are entered, otherwise what the user picked.
// "Just for fun" always wins over the scores.
export function resolvedWon(game) {
  if (game.won === FUN) return FUN
  const auto = winnerFromScores(parseScore(game.our_score), parseScore(game.their_score))
  return auto !== null ? auto : game.won
}

// For fun games any score from 0 to 50 is fine (no win-by-2 etc.)
function funScoreError(game) {
  for (const s of [parseScore(game.our_score), parseScore(game.their_score)]) {
    if (s !== null && (Number.isNaN(s) || s < 0 || s > 50)) return 'Scores must be whole numbers from 0 to 50.'
  }
  return null
}

// Returns an error message or null
export function validateGame(game, { checkDate = true } = {}) {
  if (checkDate && !game.played_at) return 'Pick a date.'
  if (!game.game_type) return 'Choose singles or doubles.'
  const won = resolvedWon(game)
  if (won === null) return 'Did you win or lose? (Or pick "Just for fun".)'
  if (won === FUN) return funScoreError(game)
  return scoreError(parseScore(game.our_score), parseScore(game.their_score), won)
}

export { funScoreError }

// Form -> database row for public.games (team 1 = recorder's team)
export function gameToRow(game) {
  return {
    played_at: new Date(game.played_at).toISOString(),
    game_type: game.game_type,
    location: game.location || null,
    sex: game.sex || null,
    team1_score: parseScore(game.our_score),
    team2_score: parseScore(game.their_score),
    for_fun: resolvedWon(game) === FUN,
    winning_team: resolvedWon(game) === FUN ? null : resolvedWon(game) ? 1 : 2,
    fun_rating: game.fun_rating || null,
  }
}

// 'user:abc' -> { user_id: 'abc', pickle_pal_id: null }
function keyToParticipant(gameId, team, key) {
  const [kind, id] = key.split(':')
  return {
    game_id: gameId,
    team,
    user_id: kind === 'user' ? id : null,
    pickle_pal_id: kind === 'pal' ? id : null,
  }
}

// Insert partner + opponents. (The recorder is added automatically by a DB trigger.)
export async function saveParticipants(gameId, game) {
  const rows = []
  const isDoubles = game.game_type === 'doubles'
  if (isDoubles && game.partner) rows.push(keyToParticipant(gameId, 1, game.partner))
  const opponents = isDoubles ? game.opponents : game.opponents.slice(0, 1)
  for (const key of opponents) {
    if (key) rows.push(keyToParticipant(gameId, 2, key))
  }
  if (rows.length === 0) return
  const { error } = await supabase.from('game_participants').insert(rows)
  if (error) throw error
}

// Database row (with game_participants embedded) -> form shape. Used when editing.
export function rowToGame(row) {
  const keyOf = (p) => (p.user_id ? `user:${p.user_id}` : `pal:${p.pickle_pal_id}`)
  const others = row.game_participants.filter(
    (p) => !(p.team === 1 && p.user_id === row.recorded_by)
  )
  const partner = others.find((p) => p.team === 1)
  const opponents = others.filter((p) => p.team === 2).map(keyOf)
  return newGame({
    played_at: toLocalInput(new Date(row.played_at)),
    game_type: row.game_type,
    won: row.for_fun ? FUN : row.winning_team === 1,
    location: row.location || '',
    sex: row.sex || '',
    partner: partner ? keyOf(partner) : '',
    opponents: [opponents[0] || '', opponents[1] || ''],
    our_score: row.team1_score ?? '',
    their_score: row.team2_score ?? '',
    fun_rating: row.fun_rating || 0,
  })
}

// Columns to select when we want a game plus who played in it
export const GAME_WITH_PLAYERS = `
  id, match_id, game_number, played_at, game_type, location, sex,
  team1_score, team2_score, winning_team, for_fun, fun_rating, recorded_by,
  game_participants ( team, user_id, pickle_pal_id, profiles ( display_name ), pickle_pals ( name ) )
`
