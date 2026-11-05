import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { usePeople } from '../lib/people'
import { friendlyError } from '../lib/errors'
import { loadPhotos } from '../lib/photos'
import Avatar from '../components/Avatar'
import GamesTabs from '../components/GamesTabs'
import CourtIcon from '../components/CourtIcon'
import PhotoCarousel from '../components/PhotoCarousel'
import {
  FEED_COLUMNS, MatchGameScores, TeamRows, groupStory, playedSentence, timeAgo,
} from '../components/GameSummary'

const PAGE_SIZE = 40 // participant rows per "load more"

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
    else items.push({ key: game.match_id || game.id, matchId: game.match_id, match: game.match, games: [game] })
  }
  return items
}

// Everything you and your friends played, newest first
export default function Feed() {
  const { user } = useAuth()
  const people = usePeople()
  const [games, setGames] = useState([])
  const [photos, setPhotos] = useState({}) // { [gameId or matchId]: [photo, ...] }
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

        // 2) Details (and photos) for games we haven't shown yet
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

          const newPhotos = await loadPhotos({
            gameIds: details.filter((g) => !g.match_id).map((g) => g.id),
            matchIds: [...new Set(details.map((g) => g.match_id).filter(Boolean))],
          })
          setPhotos((prev) => ({ ...prev, ...newPhotos }))
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
    setPhotos({})
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
          <FeedItem key={item.key} item={item} photos={photos[item.key]} meId={user.id} />
        ))}
      </ul>

      {loading && <p className="muted">Loading...</p>}
      {!loading && !done && items.length > 0 && (
        <button className="btn btn-block" onClick={() => loadPage(offset)}>Load more</button>
      )}
    </div>
  )
}

// One card in the feed. Tapping it (anywhere that isn't a link) opens the details page.
function FeedItem({ item, photos, meId }) {
  const navigate = useNavigate()
  const first = item.games[0]
  const isMatch = Boolean(item.matchId)
  const { recorder, rest } = playedSentence(item, meId)
  const { title, description } = groupStory(item)
  const detailsUrl = isMatch ? `/activity/match/${item.matchId}` : `/activity/game/${first.id}`
  const extras = first.sex || '' // (indoor/outdoor is shown on the court icon)

  function open(e) {
    if (e.target.closest('a, button')) return // let links (like names) work normally
    navigate(detailsUrl)
  }

  return (
    <li
      className="card feed-item clickable"
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && navigate(detailsUrl)}
      role="link"
      tabIndex={0}
      aria-label={`${title || 'Game'} - view details`}
    >
      {/* title first, with the court icon (singles/doubles, indoor/outdoor) top-right */}
      <div className="feed-top">
        {title ? <h3 className="feed-title">{title}</h3> : <span />}
        <CourtIcon type={first.game_type} location={first.location} playedAt={first.played_at} />
      </div>

      {/* then who played what */}
      <div className="feed-head">
        <Avatar name={first.recorder?.display_name || '?'} url={first.recorder?.avatar_url} size={32} />
        <div className="feed-head-text">
          <span><strong>{recorder}</strong> {rest}</span>
          <span className="muted small">{timeAgo(first.played_at)}</span>
        </div>
      </div>

      {description && <p className="feed-description">{description}</p>}

      <PhotoCarousel photos={photos} />

      <TeamRows group={item} meId={meId} />
      {isMatch && <MatchGameScores games={item.games} />}

      {(extras || (!isMatch && first.fun_rating)) && (
        <div className="feed-meta muted small">
          {extras && <span>{extras}</span>}
          {!isMatch && first.fun_rating ? <span>{'★'.repeat(first.fun_rating)}</span> : null}
        </div>
      )}
    </li>
  )
}
