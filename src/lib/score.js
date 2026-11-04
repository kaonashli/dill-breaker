// Pickleball scoring rules. This mirrors public.is_valid_score() in the
// database, so the form can show errors before saving.
//  - scores are whole numbers 0..50, either can be blank
//  - winner needs at least 11, must win by 2
//  - games normally end at 11, 15 or 21 (11-4, 15-9, 21-17)
//  - above that only "extended" scores, exactly 2 apart (12-10, 16-14)

export const NORMAL_FINISHES = [11, 15, 21]

// '' -> null, '11' -> 11, 'abc' -> NaN
export function parseScore(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isInteger(n) ? n : NaN
}

// true (we won) / false (we lost) / null (can't tell from the scores)
export function winnerFromScores(our, their) {
  if (our === null || their === null || Number.isNaN(our) || Number.isNaN(their)) return null
  if (our === their) return null
  return our > their
}

// Returns an error message, or null if the scores are fine.
export function scoreError(our, their, won) {
  for (const s of [our, their]) {
    if (s === null) continue
    if (Number.isNaN(s) || s < 0 || s > 50) return 'Scores must be whole numbers from 0 to 50.'
  }
  if (our !== null && their !== null && our === their) return "A game can't end in a tie."
  if (won === null || won === undefined) return null

  const w = won ? our : their // winner's score
  const l = won ? their : our // loser's score

  if (w !== null && w < 11) return 'The winning team needs at least 11 points.'
  if (l !== null && l > 48) return 'The losing team can have at most 48 points.'
  if (w === null || l === null) return null

  if (w - l < 2) return 'Pickleball is win by 2.'
  if (NORMAL_FINISHES.includes(w)) return null
  if (w - l === 2) return null
  return `${w}-${l} isn't a possible final score. Games end at 11, 15 or 21, and only go higher when won by exactly 2 (like 12-10).`
}
