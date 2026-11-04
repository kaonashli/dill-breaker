import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { GAME_WITH_PLAYERS } from '../lib/games'
import { friendlyError } from '../lib/errors'

const PAGE_SIZE = 20

// List of games. Normal view: games you played in (from your side).
// Admins can switch to "All games" to edit/delete anything.
export default function Games() {
  const { user, isAdmin } = useAuth()
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(0)
  const [games, setGames] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    try {
      if (showAll) {
        const { data, count: total, error: e } = await supabase
          .from('games')
          .select(GAME_WITH_PLAYERS, { count: 'exact' })
          .order('played_at', { ascending: false })
          .order('game_number')
          .range(from, to)
        if (e) throw e
        setGames(data.map((g) => ({ ...g, myTeam: 1 })))
        setCount(total || 0)
      } else {
        // 1) which games did I play in, and on which team?
        const { data: mine, count: total, error: e } = await supabase
          .from('player_game_results')
          .select('game_id, team', { count: 'exact' })
          .eq('user_id', user.id)
          .order('played_at', { ascending: false })
          .order('game_number')
          .range(from, to)
        if (e) throw e
        // 2) full details for those games
        let details = []
        if (mine.length > 0) {
          const res = await supabase.from('games').select(GAME_WITH_PLAYERS).in('id', mine.map((r) => r.game_id))
          if (res.error) throw res.error
          details = res.data
        }
        const byId = Object.fromEntries(details.map((g) => [g.id, g]))
        setGames(mine.filter((r) => byId[r.game_id]).map((r) => ({ ...byId[r.game_id], myTeam: r.team })))
        setCount(total || 0)
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [page, showAll, user.id])

  useEffect(() => {
    load()
  }, [load])

  async function deleteGame(game) {
    const msg = game.match_id
      ? 'Delete this game? (Other games in the match stay.)'
      : 'Delete this game?'
    if (!window.confirm(msg)) return
    const { error: e } = await supabase.from('games').delete().eq('id', game.id)
    if (e) setError(friendlyError(e))
    else load()
  }

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="narrow">
      <div className="dash-header">
        <h1>Games</h1>
        <div className="actions">
          {isAdmin && (
            <label className="toggle">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => {
                  setShowAll(e.target.checked)
                  setPage(0)
                }}
              />
              All games (admin)
            </label>
          )}
          <Link to="/games/new" className="btn btn-primary btn-sm">+ Game</Link>
          <Link to="/matches/new" className="btn btn-sm">+ Match</Link>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="muted">Loading...</p>
      ) : games.length === 0 ? (
        <p className="muted">No games yet.</p>
      ) : (
        <ul className="game-list">
          {games.map((g) => (
            <GameRow
              key={g.id}
              game={g}
              meId={user.id}
              canEdit={isAdmin || g.recorded_by === user.id}
              onDelete={() => deleteGame(g)}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>← Newer</button>
          <span className="muted small">Page {page + 1} of {pages}</span>
          <button className="btn btn-sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Older →</button>
        </div>
      )}
    </div>
  )
}

function GameRow({ game, meId, canEdit, onDelete }) {
  const ourTeam = game.myTeam
  const theirTeam = ourTeam === 1 ? 2 : 1
  const won = game.winning_team === ourTeam
  const ourScore = ourTeam === 1 ? game.team1_score : game.team2_score
  const theirScore = ourTeam === 1 ? game.team2_score : game.team1_score

  const namesOn = (team) =>
    game.game_participants
      .filter((p) => p.team === team)
      .map((p) => (p.user_id === meId ? 'You' : p.profiles?.display_name || p.pickle_pals?.name || 'Unknown'))
      .join(' & ') || 'Not recorded'

  const details = [
    game.game_type,
    game.location,
    game.sex,
    game.match_id ? `match · game ${game.game_number}` : null,
  ].filter(Boolean)

  return (
    <li className="card game-row">
      <span className={`badge ${won ? 'win' : 'loss'}`}>{won ? 'W' : 'L'}</span>
      <div className="game-row-main">
        <div>
          <strong>{namesOn(ourTeam)}</strong> <span className="muted">vs</span> {namesOn(theirTeam)}
        </div>
        <div className="muted small">
          {new Date(game.played_at).toLocaleDateString()} · {details.join(' · ')}
          {game.fun_rating ? ` · ${'★'.repeat(game.fun_rating)}` : ''}
        </div>
      </div>
      <div className="game-row-score">
        {ourScore ?? '?'}–{theirScore ?? '?'}
      </div>
      {canEdit && (
        <div className="game-row-actions">
          <Link to={`/games/${game.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
          <button className="btn btn-ghost btn-sm" onClick={onDelete}>Delete</button>
        </div>
      )}
    </li>
  )
}
