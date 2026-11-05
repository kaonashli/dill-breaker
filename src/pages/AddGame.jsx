import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { usePeople } from '../lib/people'
import {
  GAME_WITH_PLAYERS, gameToRow, newGame, rowToGame, saveParticipants, validateGame,
} from '../lib/games'
import { friendlyError } from '../lib/errors'
import { saveNotesAndPhotos, storyColumns, useExtras } from '../lib/extras'
import GameFields from '../components/GameFields'
import { NotesPhotosFields, StoryFields } from '../components/ExtrasFields'

// Used for both /games/new and /games/:id/edit
export default function AddGame() {
  const { id } = useParams() // only set when editing
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const people = usePeople()
  const navigate = useNavigate()

  const [game, setGame] = useState(newGame())
  const [original, setOriginal] = useState(null) // DB row when editing
  const [extraPlayers, setExtraPlayers] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // title / description / private notes / photos (new games only; edit those on the game's page)
  const story = useExtras(game.played_at)

  // When editing, load the game
  useEffect(() => {
    if (!isEdit) return
    supabase
      .from('games')
      .select(GAME_WITH_PLAYERS)
      .eq('id', id)
      .single()
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError(friendlyError(loadError))
        } else {
          setOriginal(data)
          setGame(rowToGame(data))
          // Players in this game who might not be in my friends list (e.g. admin editing)
          setExtraPlayers(
            data.game_participants
              .filter((p) => p.user_id !== data.recorded_by)
              .map((p) => ({
                key: p.user_id ? `user:${p.user_id}` : `pal:${p.pickle_pal_id}`,
                name: p.profiles?.display_name || p.pickle_pals?.name || 'Unknown player',
              }))
          )
        }
        setLoading(false)
      })
  }, [id, isEdit])

  function handleChange(field, value) {
    setGame((g) => ({ ...g, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isEdit && !story.extras.title.trim()) return setError('Give your game a title.')
    const problem = validateGame(game)
    if (problem) return setError(problem)

    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        const { error: updateError } = await supabase.from('games').update(gameToRow(game)).eq('id', id)
        if (updateError) throw updateError
        // Replace everyone except the recorder
        const { error: deleteError } = await supabase
          .from('game_participants')
          .delete()
          .eq('game_id', id)
          .or(`user_id.is.null,user_id.neq.${original.recorded_by}`)
        if (deleteError) throw deleteError
        await saveParticipants(id, game)
        navigate('/games')
      } else {
        const { data, error: insertError } = await supabase
          .from('games')
          .insert({ ...gameToRow(game), ...storyColumns(story.extras, game.played_at), recorded_by: user.id })
          .select('id')
          .single()
        if (insertError) throw insertError
        try {
          await saveParticipants(data.id, game)
        } catch (err) {
          await supabase.from('games').delete().eq('id', data.id) // undo half-saved game
          throw err
        }
        const failed = await saveNotesAndPhotos(user.id, { gameId: data.id }, story.extras)
        if (failed.length) window.alert(`Your game was saved, but the ${failed.join(' and ')} couldn't be saved. You can add them from the game's page.`)
        navigate(`/activity/game/${data.id}`) // show the finished game
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="muted">Loading...</p>

  // Only show "other players" that aren't already in my lists
  const knownKeys = new Set([...people.friends, ...people.pals].map((p) => p.key))
  const peopleForSelect = { ...people, extra: extraPlayers.filter((p) => !knownKeys.has(p.key)) }
  const editingSomeoneElses = original && original.recorded_by !== user.id

  return (
    <div className="narrow">
      <h1>{isEdit ? 'Edit game' : 'Log a game'}</h1>
      {!isEdit && (
        <p className="muted small page-switch">
          Played several games? <Link to="/matches/new">Log a whole match</Link>
        </p>
      )}
      {editingSomeoneElses && (
        <p className="notice">Admin edit: "your" team means the team of the person who logged this game.</p>
      )}
      <form className="card" onSubmit={handleSubmit}>
        {/* title + description first (new games only) */}
        {!isEdit && (
          <div className="story-top">
            <StoryFields value={story.extras} onChange={story.change} onRerollTitle={story.reroll} />
          </div>
        )}
        <GameFields game={game} onChange={handleChange} people={peopleForSelect} />
        {isEdit ? (
          <p className="muted small edit-story-hint">
            Title, description, photos and notes are edited on the{' '}
            <Link to={`/activity/game/${id}`}>game's page</Link>.
          </p>
        ) : (
          <div className="extras-spacer">
            <NotesPhotosFields value={story.extras} onChange={story.change} />
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions sticky-actions">
          <Link to={isEdit ? '/games' : '/'} className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Save game'}
          </button>
        </div>
      </form>
    </div>
  )
}
