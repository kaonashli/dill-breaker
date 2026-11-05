import { Link } from 'react-router-dom'

// Pieces shared by the activity feed and the game/match details page.
// A "group" = { matchId, match, games: [game, ...] } (a single game has matchId null).

// "5m ago", "3h ago", "Yesterday", "Nov 3", "Nov 3, 2025"
export function timeAgo(dateString) {
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

// A participant's name, or "You"
function nameOf(p, meId) {
  if (p.user_id === meId) return 'You'
  return p.profiles?.display_name || p.pickle_pals?.name || 'Unknown'
}

// "Sam", "Sam and Jo", "Sam, Jo and Pat"
function joinNames(names) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// A player's name that links to their profile if they have an account
// (pickle pals and "You" are plain text). stopPropagation: so clicking the
// name opens the profile instead of the feed card.
function PlayerName({ userId, profile, palName, meId, bold = false }) {
  if (userId && userId === meId) return <strong>You</strong>
  if (profile?.username) {
    const name = bold ? <strong>{profile.display_name}</strong> : profile.display_name
    return (
      <Link to={`/u/${profile.username}`} className="person-link player-link" onClick={(e) => e.stopPropagation()}>
        {name}
      </Link>
    )
  }
  const text = profile?.display_name || palName || 'Someone'
  return bold ? <strong>{text}</strong> : text
}

// "Alex played a doubles game with Sam, Jo and Pat", where every name with an
// account is clickable (opens their profile, where you can add them as a friend)
export function PlayedLine({ group, meId }) {
  const first = group.games[0]
  const what = group.matchId ? `a ${group.games.length}-game match` : `a ${first.game_type} game`
  const others = first.game_participants.filter((p) => p.user_id !== first.recorded_by)

  return (
    <span>
      <PlayerName userId={first.recorded_by} profile={first.recorder} meId={meId} bold /> played {what}
      {others.length > 0 && ' with '}
      {others.map((p, i) => (
        <span key={i}>
          {i > 0 && (i === others.length - 1 ? ' and ' : ', ')}
          <PlayerName userId={p.user_id} profile={p.profiles} palName={p.pickle_pals?.name} meId={meId} />
        </span>
      ))}
    </span>
  )
}

// Plain-text version (e.g. for labels): "Alex played a doubles game with Sam, Jo and Pat"
export function playedSentence(group, meId) {
  const first = group.games[0]
  const recorderIsMe = first.recorded_by === meId
  const recorder = recorderIsMe ? 'You' : first.recorder?.display_name || 'Someone'
  const what = group.matchId ? `a ${group.games.length}-game match` : `a ${first.game_type} game`
  const others = first.game_participants
    .filter((p) => p.user_id !== first.recorded_by)
    .map((p) => nameOf(p, meId))
  return { recorder, rest: `played ${what}${others.length ? ` with ${joinNames(others)}` : ''}` }
}

// Title + description: a match uses the match's, a single game its own
export function groupStory(group) {
  const source = group.matchId ? group.match : group.games[0]
  return { title: source?.title || '', description: source?.description || '' }
}

// Names on one team, e.g. "You & Sam". Account holders link to their profile.
function TeamNames({ game, team, meId }) {
  const players = game.game_participants.filter((p) => p.team === team)
  if (players.length === 0) return <span className="muted">Not recorded</span>
  return players.map((p, i) => (
    <span key={i}>
      {i > 0 && ' & '}
      {p.user_id === meId ? (
        <strong>You</strong>
      ) : p.profiles ? (
        <Link to={`/u/${p.profiles.username}`} className="person-link" onClick={(e) => e.stopPropagation()}>
          {p.profiles.display_name}
        </Link>
      ) : (
        nameOf(p, meId)
      )}
    </span>
  ))
}

// Both teams with the score (single game) or games won (match); winner gets the badge
export function TeamRows({ group, meId }) {
  const first = group.games[0]
  const isMatch = Boolean(group.matchId)
  const team1Wins = group.games.filter((g) => g.winning_team === 1).length
  const team2Wins = group.games.length - team1Wins
  const team1Won = isMatch ? team1Wins > team2Wins : first.winning_team === 1
  const team2Won = isMatch ? team2Wins > team1Wins : first.winning_team === 2

  return (
    <div className="feed-teams">
      {[1, 2].map((team) => {
        const won = team === 1 ? team1Won : team2Won
        const lost = team === 1 ? team2Won : team1Won // a tied match is neither
        const score = isMatch
          ? team === 1 ? team1Wins : team2Wins
          : team === 1 ? first.team1_score : first.team2_score
        return (
          <div key={team} className={`feed-team ${won ? 'winner' : ''} ${lost ? 'loser' : ''}`}>
            <span className="feed-team-names"><TeamNames game={first} team={team} meId={meId} /></span>
            {won && <span className="won-badge">🏆 Won</span>}
            <span className="feed-score">{score ?? '–'}</span>
          </div>
        )
      })}
    </div>
  )
}

// "Game 1: 11–7 · Game 2: 9–11 ..."
export function MatchGameScores({ games }) {
  return (
    <div className="feed-games muted small">
      {games.map((g) => (
        <span key={g.id}>
          Game {g.game_number}:{' '}
          {g.team1_score == null && g.team2_score == null ? 'no score' : `${g.team1_score ?? '?'}–${g.team2_score ?? '?'}`}
        </span>
      ))}
    </div>
  )
}

// Columns to load for feed / details
export const FEED_COLUMNS = `
  id, match_id, game_number, played_at, game_type, location, sex,
  team1_score, team2_score, winning_team, fun_rating, recorded_by, title, description,
  match:matches ( id, title, description, recorded_by ),
  recorder:profiles!games_recorded_by_fkey ( display_name, username, avatar_url ),
  game_participants ( team, user_id, pickle_pal_id, profiles ( display_name, username ), pickle_pals ( name ) )
`
