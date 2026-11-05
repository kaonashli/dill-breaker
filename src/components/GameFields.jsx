import Segmented from './Segmented'
import StarRating from './StarRating'
import PlayerSelect from './PlayerSelect'
import { parseScore, scoreError, winnerFromScores } from '../lib/score'
import { FUN, funScoreError } from '../lib/games'

// The little red * next to required fields
export function Req() {
  return <span className="req" title="Required" aria-label="required">*</span>
}

// All the inputs for ONE game. Used by "Add game" and by each game in "Add match".
// game:     the form object (see lib/games.js)
// onChange: (fieldName, newValue) => void
// showDate: matches set the date once for the whole match, so they hide it here
export default function GameFields({ game, onChange, people, showDate = true }) {
  const our = parseScore(game.our_score)
  const their = parseScore(game.their_score)
  const autoWon = winnerFromScores(our, their) // null unless both scores entered
  const isDoubles = game.game_type === 'doubles'
  const opponentSlots = isDoubles ? 2 : 1

  // Players already chosen in this game (so they can't be picked twice)
  const chosen = [isDoubles ? game.partner : '', ...game.opponents.slice(0, opponentSlots)].filter(Boolean)
  const isFun = game.won === FUN // "Just for fun": not counted, any score is fine
  const scoreProblem = isFun ? funScoreError(game) : scoreError(our, their, autoWon !== null ? autoWon : game.won)
  // What the Result buttons show: "Just for fun" if picked, otherwise the score decides (if both entered)
  const shownResult = isFun ? FUN : autoWon !== null ? autoWon : game.won

  function setOpponent(index, key) {
    const next = [...game.opponents]
    next[index] = key
    onChange('opponents', next)
  }

  return (
    <div className="game-fields">
      {/* ---------- Required (marked with *) ---------- */}
      <div className="field-group">
        {showDate && (
          <label className="field">
            <span className="field-label">Date <Req /></span>
            <input
              type="datetime-local"
              value={game.played_at}
              onChange={(e) => onChange('played_at', e.target.value)}
              required
            />
          </label>
        )}

        <div className="field">
          <span className="field-label">Type of game <Req /></span>
          <Segmented
            ariaLabel="Type of game"
            options={[['singles', 'Singles'], ['doubles', 'Doubles']]}
            value={game.game_type}
            onChange={(v) => onChange('game_type', v)}
          />
        </div>

        <div className="field">
          <span className="field-label">Result <Req /></span>
          <Segmented
            ariaLabel="Result"
            options={[[true, 'Win'], [false, 'Loss'], [FUN, 'Just for fun']]}
            value={shownResult}
            onChange={(v) => onChange('won', v)}
          />
          {isFun ? (
            <p className="muted small result-hint fun-note">
              This game won't count toward your wins, losses or points. It will still appear
              on your play calendar and in the activity feed.
            </p>
          ) : autoWon !== null ? (
            <p className={`small result-hint auto-result ${autoWon ? 'win' : 'loss'}`}>
              {autoWon ? 'Win' : 'Loss'} <span className="muted">(from the score)</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* ---------- Optional ---------- */}
      <div className="field-group">

        <div className="field-row">
          <label className="field">
            <span className="field-label">Your points</span>
            <input
              type="number" min="0" max="50" inputMode="numeric"
              value={game.our_score}
              onChange={(e) => onChange('our_score', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Opponent points</span>
            <input
              type="number" min="0" max="50" inputMode="numeric"
              value={game.their_score}
              onChange={(e) => onChange('their_score', e.target.value)}
            />
          </label>
        </div>
        {scoreProblem && <p className="field-error">{scoreProblem}</p>}

        {isDoubles && (
          <label className="field">
            <span className="field-label">Played with</span>
            <PlayerSelect
              label="Partner"
              value={game.partner}
              onChange={(v) => onChange('partner', v)}
              people={people}
              exclude={chosen}
            />
          </label>
        )}

        <div className="field">
          <span className="field-label">Played against</span>
          <div className="field-row">
            {Array.from({ length: opponentSlots }, (_, i) => (
              <PlayerSelect
                key={i}
                label={`Opponent ${i + 1}`}
                value={game.opponents[i]}
                onChange={(v) => setOpponent(i, v)}
                people={people}
                exclude={chosen}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Location</span>
          <Segmented
            ariaLabel="Location"
            allowClear
            options={[['indoor', 'Indoor'], ['outdoor', 'Outdoor']]}
            value={game.location}
            onChange={(v) => onChange('location', v)}
          />
        </div>

        <div className="field">
          <span className="field-label">Sex</span>
          <Segmented
            ariaLabel="Sex"
            allowClear
            options={[['female', 'Female'], ['male', 'Male'], ['mixed', 'Mixed']]}
            value={game.sex}
            onChange={(v) => onChange('sex', v)}
          />
        </div>

        <div className="field">
          <span className="field-label">Fun rating</span>
          <StarRating value={game.fun_rating} onChange={(v) => onChange('fun_rating', v)} />
        </div>
      </div>
    </div>
  )
}
