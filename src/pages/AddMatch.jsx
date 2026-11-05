import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { usePeople } from '../lib/people'
import { gameToRow, newGame, saveParticipants, toLocalInput, validateGame } from '../lib/games'
import { friendlyError } from '../lib/errors'
import { saveNotesAndPhotos, storyColumns, useExtras } from '../lib/extras'
import GameFields from '../components/GameFields'
import { NotesPhotosFields, StoryFields } from '../components/ExtrasFields'
import { Req } from '../components/GameFields'

// Fields that copy from game 1 to the other games until you change them there
const COPY_FIELDS = ['game_type', 'location', 'sex', 'partner', 'opponents']
const MAX_GAMES = 15

// A new game pre-filled with game 1's shared fields
function copyOf(first) {
  return newGame({
    game_type: first.game_type,
    location: first.location,
    sex: first.sex,
    partner: first.partner,
    opponents: [...first.opponents],
  })
}

export default function AddMatch() {
  const { user } = useAuth()
  const people = usePeople()
  const navigate = useNavigate()

  const [playedAt, setPlayedAt] = useState(toLocalInput(new Date()))
  const [games, setGames] = useState([newGame(), newGame(), newGame()]) // best of 3 by default
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // title / description / private notes / photos for the whole match
  const story = useExtras(playedAt)

  function setGameCount(count) {
    const n = Math.max(1, Math.min(MAX_GAMES, Number(count) || 1))
    setGames((prev) => {
      if (n <= prev.length) return prev.slice(0, n)
      const added = Array.from({ length: n - prev.length }, () => copyOf(prev[0]))
      return [...prev, ...added]
    })
  }

  function updateGame(index, field, value) {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i === index) {
          // remember this field was set by hand (so game 1 won't overwrite it)
          const edited = index > 0 && !g.edited.includes(field) ? [...g.edited, field] : g.edited
          return { ...g, [field]: value, edited }
        }
        // Changing game 1 copies shared fields to games not edited by hand
        if (index === 0 && COPY_FIELDS.includes(field) && !g.edited.includes(field)) {
          return { ...g, [field]: Array.isArray(value) ? [...value] : value }
        }
        return g
      })
    )
  }

  function removeGame(index) {
    setGames((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!story.extras.title.trim()) return setError('Give your match a title.')
    if (!playedAt) return setError('Pick a date.')
    for (let i = 0; i < games.length; i++) {
      const problem = validateGame(games[i], { checkDate: false })
      if (problem) return setError(`Game ${i + 1}: ${problem}`)
    }

    setSaving(true)
    setError('')
    let matchId = null
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({ recorded_by: user.id, ...storyColumns(story.extras, playedAt) })
        .select('id')
        .single()
      if (matchError) throw matchError
      matchId = match.id

      // Same date for every game in the match
      const rows = games.map((g, i) => ({
        ...gameToRow({ ...g, played_at: playedAt }),
        recorded_by: user.id,
        match_id: matchId,
        game_number: i + 1,
      }))
      const { data: inserted, error: gamesError } = await supabase
        .from('games')
        .insert(rows)
        .select('id, game_number')
      if (gamesError) throw gamesError

      for (const row of inserted) {
        await saveParticipants(row.id, games[row.game_number - 1])
      }
      const savedMatchId = matchId
      matchId = null // fully saved: don't undo it below if notes/photos have trouble
      const failed = await saveNotesAndPhotos(user.id, { matchId: savedMatchId }, story.extras)
      if (failed.length) window.alert(`Your match was saved, but the ${failed.join(' and ')} couldn't be saved. You can add them from the match's page.`)
      navigate(`/activity/match/${savedMatchId}`) // show the finished match
    } catch (err) {
      // Undo the half-saved match (deleting it deletes its games too)
      if (matchId) await supabase.from('matches').delete().eq('id', matchId)
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="narrow">
      <h1>Log a match</h1>
      <p className="muted small page-switch">
        Just one game? <Link to="/games/new">Log a single game</Link>
      </p>
      <form onSubmit={handleSubmit}>
        <div className="card match-header">
          {/* title + description for the whole match come first */}
          <StoryFields value={story.extras} onChange={story.change} onRerollTitle={story.reroll} />
          <label className="field">
            <span className="field-label">Date <Req /></span>
            <input type="datetime-local" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} required />
          </label>
          <label className="field">
            <span className="field-label">How many games? <Req /></span>
            <input
              type="number" min="1" max={MAX_GAMES}
              value={games.length}
              onChange={(e) => setGameCount(e.target.value)}
            />
          </label>
          <p className="muted small">
            Changes to game 1 (type, players, location, sex) copy to the other games until you change them there.
          </p>
        </div>

        {games.map((game, i) => (
          <div className="card game-card" key={i}>
            <div className="game-card-head">
              <h3>Game {i + 1}</h3>
              {games.length > 1 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeGame(i)}>
                  Remove
                </button>
              )}
            </div>
            <GameFields
              game={game}
              onChange={(field, value) => updateGame(i, field, value)}
              people={people}
              showDate={false}
            />
          </div>
        ))}

        {games.length < MAX_GAMES && (
          <button type="button" className="btn btn-block" onClick={() => setGameCount(games.length + 1)}>
            + Add another game
          </button>
        )}

        {/* private notes + photos for the whole match */}
        <div className="card match-header extras-spacer">
          <NotesPhotosFields value={story.extras} onChange={story.change} />
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions sticky-actions">
          <Link to="/" className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save match'}
          </button>
        </div>
      </form>
    </div>
  )
}
