import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../lib/errors'
import { MAX_PHOTOS, deletePhoto, loadPhotos, uploadPhotos } from '../lib/photos'
import { loadNote, saveNote } from '../lib/notes'
import Avatar from '../components/Avatar'
import CourtIcon from '../components/CourtIcon'
import Icon from '../components/Icon'
import { NotesPhotosFields, StoryFields, emptyExtras } from '../components/ExtrasFields'
import {
  FEED_COLUMNS, MatchGameScores, PlayedLine, TeamRows, groupStory,
} from '../components/GameSummary'

// Full details of one game (/activity/game/:id) or match (/activity/match/:id):
// title, description, all photos, scores, your private notes, and edit tools for the owner.
export default function ActivityDetail({ kind }) {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const isMatch = kind === 'match'
  const target = isMatch ? { matchId: id } : { gameId: id }

  const [group, setGroup] = useState(undefined) // undefined = loading, null = not found
  const [photos, setPhotos] = useState([])
  const [note, setNote] = useState('')
  const [noteStatus, setNoteStatus] = useState('') // '', 'saving', 'saved'
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const query = supabase.from('games').select(FEED_COLUMNS)
    const { data, error: loadError } = isMatch
      ? await query.eq('match_id', id).order('game_number')
      : await query.eq('id', id)
    if (loadError || !data || data.length === 0) {
      setGroup(null)
      return
    }
    setGroup({ matchId: isMatch ? id : null, match: data[0].match, games: data })
    const byTarget = await loadPhotos(isMatch ? { matchIds: [id] } : { gameIds: [id] })
    setPhotos(byTarget[id] || [])
    const myNote = await loadNote(target)
    setNote(myNote?.note || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isMatch])

  useEffect(() => {
    load()
  }, [load])

  if (group === undefined) return <p className="muted">Loading...</p>
  if (group === null) {
    return (
      <div className="narrow card">
        <h1>Not found</h1>
        <p className="muted">This game doesn't exist, or you can't see it.</p>
        <Link to="/feed" className="btn">Back to activity</Link>
      </div>
    )
  }

  const first = group.games[0]
  const ownerId = isMatch ? group.match?.recorded_by : first.recorded_by
  const canEdit = ownerId === user.id || isAdmin
  const { title, description } = groupStory(group)
  const playedOn = new Date(first.played_at).toLocaleString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  const extras = first.sex || '' // (indoor/outdoor is shown on the court icon)

  async function handleSaveNote() {
    setNoteStatus('saving')
    try {
      await saveNote(target, note)
      setNoteStatus('saved')
    } catch (err) {
      setError(friendlyError(err))
      setNoteStatus('')
    }
  }

  async function handleDelete() {
    const what = isMatch ? 'this whole match (all its games)' : 'this game'
    if (!window.confirm(`Delete ${what}? This can't be undone.`)) return
    try {
      for (const p of photos) await deletePhoto(p)
      const { error: e } = isMatch
        ? await supabase.from('matches').delete().eq('id', id)
        : await supabase.from('games').delete().eq('id', id)
      if (e) throw e
      navigate('/feed')
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <div className="narrow stack">
      <Link to="/feed" className="muted small back-link">← Activity</Link>

      <section className="card stack">
        {/* title first (with the court icon top-right), then who played what */}
        <div className="feed-top">
          {!editing && title ? <h1 className="detail-title">{title}</h1> : <span />}
          <CourtIcon type={first.game_type} location={first.location} playedAt={first.played_at} />
        </div>
        <div className="feed-head">
          <Avatar name={first.recorder?.display_name || '?'} url={first.recorder?.avatar_url} size={40} />
          <div className="feed-head-text">
            <PlayedLine group={group} meId={user.id} />
            <span className="muted small">{playedOn}</span>
          </div>
        </div>

        {editing ? (
          <EditStory
            target={target}
            initial={{ title, description }}
            photos={photos}
            userId={user.id}
            onDone={() => {
              setEditing(false)
              load()
            }}
          />
        ) : (
          <>
            {description && <p className="detail-description">{description}</p>}

            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                    <img src={p.url} alt={`Photo ${i + 1}`} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        <TeamRows group={group} meId={user.id} />
        {isMatch && <MatchGameScores games={group.games} />}

        {(extras || (!isMatch && first.fun_rating)) && (
          <div className="feed-meta muted small">
            {extras && <span>{extras}</span>}
            {!isMatch && first.fun_rating ? <span>Fun: {'★'.repeat(first.fun_rating)}</span> : null}
          </div>
        )}

        {canEdit && !editing && (
          <div className="form-actions detail-actions">
            <button className="btn btn-sm" onClick={() => setEditing(true)}><Icon name="pencil" size={15} /> Edit title, description & photos</button>
            {!isMatch && <Link to={`/games/${id}/edit`} className="btn btn-sm">Edit score & players</Link>}
            <button className="btn btn-sm btn-ghost" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </section>

      {error && <p className="form-error">{error}</p>}

      {/* Private notes: anyone viewing can keep their own, only they can see them */}
      <section className="card stack">
        <h2 className="icon-heading"><Icon name="lock" size={18} /> Your private notes</h2>
        <p className="muted small">Only you can see these. Not your friends, not anyone.</p>
        <textarea
          rows={4}
          maxLength={2000}
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setNoteStatus('')
          }}
          placeholder="Things to work on, reminders..."
        />
        <div className="form-actions">
          {noteStatus === 'saved' && <span className="ok small">Saved ✓</span>}
          <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={noteStatus === 'saving'}>
            {noteStatus === 'saving' ? 'Saving...' : 'Save notes'}
          </button>
        </div>
      </section>
    </div>
  )
}

// Owner's editor for title, description and photos
function EditStory({ target, initial, photos, userId, onDone }) {
  const [value, setValue] = useState({ ...emptyExtras(initial.title), description: initial.description })
  const [existing, setExisting] = useState(photos)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function removeExisting(photo) {
    if (!window.confirm('Remove this photo?')) return
    try {
      await deletePhoto(photo)
      setExisting((list) => list.filter((p) => p.id !== photo.id))
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  const change = (field, v) => setValue((old) => ({ ...old, [field]: v }))

  async function save() {
    if (!value.title.trim()) return setError('A title is required.')
    setSaving(true)
    setError('')
    try {
      const table = target.matchId ? 'matches' : 'games'
      const { error: e } = await supabase
        .from(table)
        .update({ title: value.title.trim(), description: value.description.trim() || null })
        .eq('id', target.matchId || target.gameId)
      if (e) throw e
      if (value.files.length) await uploadPhotos(userId, target, value.files, existing.length)
      onDone()
    } catch (err) {
      setError(friendlyError(err))
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <StoryFields value={value} onChange={change} />
      {existing.length > 0 && (
        <div className="photo-picker">
          {existing.map((p, i) => (
            <div className="photo-thumb" key={p.id}>
              <img src={p.url} alt={`Photo ${i + 1}`} />
              <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => removeExisting(p)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <NotesPhotosFields value={value} onChange={change} existingPhotos={existing.length} showNotes={false} />
      {existing.length >= MAX_PHOTOS && <p className="muted small">This already has {MAX_PHOTOS} photos.</p>}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onDone} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  )
}
