import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { usePeople } from '../lib/people'
import { friendlyError } from '../lib/errors'
import Avatar from '../components/Avatar'
import GamesTabs from '../components/GamesTabs'

const PAGE_SIZE = 40 // participant rows per "load more"

const FEED_COLUMNS = `
  id, match_id, game_number, played_at, game_type, location, sex,
  team1_score, team2_score, winning_team, fun_rating, recorded_by,
  recorder:profiles!games_recorded_by_fkey ( display_name, username, avatar_url ),
  game_participants ( team, user_id, pickle_pal_id, profiles ( display_name, username ), pickle_pals ( name ) )
`

// Newest first; games in the same match stay together in order
function sortGames(list) {
  return [...list].sort(
    (a, b) =>
      new Date(b.played_at) - new Date(a.played_at) ||
      String(a.match_id).localeCompare(String(b.match_id)) ||
      a.game_number - b.game_number
  )
}

// Turn a flat list of games into feed items: one per single game, one per match
function groupIntoItems(games) {
  const items = []
  for (const game of games) {
    const last = items[items.length - 1]
    if (game.match_id && last && last.matchId === game.match_id) last.games.push(game)
    else items.push({ key: game.match_id || game.id, matchId: game.match_id, games: [game] })
  }
  return items
}

// Everything you and your friends played, newest first
export default function Feed() {
  const { user } = useAuth()
  const people = usePeople()
  const [games, setGames] = useState([])
  const [offset, setOffset] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const loadedIds = useRef(new Set()) // game ids already on screen

  // Me + my friends. (Pickle pal games are logged by their owner, so they're included.)
  const playerIds = useMemo(
    () => [user.id, ...people.friends.map((f) => f.id)],
    [user.id, people.friends]
  )

  const loadPage = useCallback(
    async (from) => {
      setLoading(true)
      setError('')
      try {
        // 1) Newest participant rows for me + friends (a game can appear more than once)
        const { data: rows, error: rowsError } = await supabase
          .from('player_game_results')
          .select('game_id')
          .in('user_id', playerIds)
          .order('played_at', { ascending: false })
          .order('game_id')
          .range(from, from + PAGE_SIZE - 1)
        if (rowsError) throw rowsError

        // 2) Details for games we haven't shown yet
        const newIds = [...new Set(rows.map((r) => r.game_id))].filter((id) => !loadedIds.current.has(id))
        if (newIds.length > 0) {
          const { data: details, error: detailsError } = await supabase
            .from('games')
            .select(FEED_COLUMNS)
            .in('id', newIds)
          if (detailsError) throw detailsError
          details.forEach((g) => loadedIds.current.add(g.id))
          // merge by id so a game can never appear twice
          setGames((prev) => {
            const byId = new Map(prev.map((g) => [g.id, g]))
            details.forEach((g) => byId.set(g.id, g))
            return sortGames([...byId.values()])
          })
        }

        setOffset(from + rows.length)
        if (rows.length < PAGE_SIZE) setDone(true)
      } catch (err) {
        setError(friendlyError(err))
      } finally {
        setLoading(false)
      }
    },
    [playerIds]
  )

  // (Re)load from the top once the friends list is known
  useEffect(() => {
    if (people.loading) return
    loadedIds.current = new Set()
    setGames([])
    setDone(false)
    loadPage(0)
  }, [people.loading, loadPage])

  const items = groupIntoItems(games)

  return (
    <div className="narrow">
      <GamesTabs />
      {error && <p className="form-error">{error}</p>}

      {!loading && items.length === 0 && !error && (
        <div className="card">
          <p className="muted">No games yet.</p>
          <p className="muted small">
            Games you and your friends log show up here. <Link to="/friends">Add friends</Link>
          </p>
        </div>
      )}

      <ul className="feed">
        {items.map((item) => (
          <FeedItem key={item.key} item={item} meId={user.id} />
        ))}
      </ul>

      {loading && <p className="muted">Loading...</p>}
      {!loading && !done && items.length > 0 && (
        <button className="btn btn-block" onClick={() => loadPage(offset)}>Load more</button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------

// "5m ago", "3h ago", "Yesterday", "Nov 3", "Nov 3, 2025"
function timeAgo(dateString) {
  const date = new Date(dateString)
  const minutes = Math.round((Date.now() - date) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h ago`
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

// Names on one team, e.g. "You & Sam". Account holders link to their profile.
function TeamNames({ game, team, meId }) {
  const players = game.game_participants.filter((p) => p.team === team)
  if (players.length === 0) return <span className="muted">Not recorded</span>
  return players.map((p, i) => {
    let name
    if (p.user_id === meId) name = <strong>You</strong>
    else if (p.profiles) name = <Link to={`/u/${p.profiles.username}`} className="person-link">{p.profiles.display_name}</Link>
    else name = p.pickle_pals?.name || 'Unknown'
    return (
      <span key={i}>
        {i > 0 && ' & '}
        {name}
      </span>
    )
  })
}

function Score({ game, team }) {
  const score = team === 1 ? game.team1_score : game.team2_score
  return <span className="feed-score">{score ?? '–'}</span>
}

function FeedItem({ item, meId }) {
  const first = item.games[0]
  const recorder = first.recorder
  const isMatch = Boolean(item.matchId)
  const recorderName = first.recorded_by === meId ? 'You' : recorder?.display_name || 'Someone'

  // For matches: how many games each side won (based on game 1's teams)
  const team1Wins = item.games.filter((g) => g.winning_team === 1).length
  const team2Wins = item.games.length - team1Wins
  const team1Won = isMatch ? team1Wins > team2Wins : first.winning_team === 1
  const team2Won = isMatch ? team2Wins > team1Wins : first.winning_team === 2

  const details = [first.game_type, first.location, first.sex].filter(Boolean).join(' · ')

  return (
    <li className="card feed-item">
      <div className="feed-head">
        <Avatar name={recorder?.display_name || '?'} url={recorder?.avatar_url} size={32} />
        <div className="feed-head-text">
          <span>
            <strong>{recorderName}</strong> logged {isMatch ? `a ${item.games.length}-game match` : `a ${first.game_type} game`}
          </span>
          <span className="muted small">{timeAgo(first.played_at)}</span>
        </div>
      </div>

      {/* Team 1 vs team 2: winner gets a "Won" badge + highlight, loser is dimmed */}
      <div className="feed-teams">
        {[1, 2].map((team) => {
          const won = team === 1 ? team1Won : team2Won
          const lost = team === 1 ? team2Won : team1Won // (a tied match is neither)
          return (
            <div key={team} className={`feed-team ${won ? 'winner' : ''} ${lost ? 'loser' : ''}`}>
              <span className="feed-team-names"><TeamNames game={first} team={team} meId={meId} /></span>
              {won && <span className="won-badge">🏆 Won</span>}
              {isMatch ? (
                <span className="feed-score">{team === 1 ? team1Wins : team2Wins}</span>
              ) : (
                <Score game={first} team={team} />
              )}
            </div>
          )
        })}
      </div>

      {isMatch && (
        <div className="feed-games muted small">
          {item.games.map((g) => (
            <span key={g.id}>
              Game {g.game_number}:{' '}
              {g.team1_score == null && g.team2_score == null
                ? 'no score'
                : `${g.team1_score ?? '?'}–${g.team2_score ?? '?'}`}
            </span>
          ))}
        </div>
      )}

      <div className="muted small">
        {details}
        {!isMatch && first.fun_rating ? ` · ${'★'.repeat(first.fun_rating)}` : ''}
      </div>
    </li>
  )
}
