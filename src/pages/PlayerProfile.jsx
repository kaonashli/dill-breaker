import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { chartColors } from '../lib/colors'
import { useStats } from '../lib/useStats'
import { average, byGameType, companions, countedRows, winLoss } from '../lib/stats'
import { userPlayer } from '../lib/people'
import Avatar from '../components/Avatar'
import Segmented from '../components/Segmented'
import { StraightPaddle } from '../components/PaddleArt'
import Icon from '../components/Icon'
import PlayCalendar from '../components/widgets/PlayCalendar'
import { WidgetGrid } from '../components/WidgetBoard'
import { PROFILE_WIDGETS } from '../components/widgets'

// Anyone's profile: /u/:username
// You can see it if it's you, a friend, someone with a pending request, or
// someone in a game you can see (the database decides; see can_view_profile).
// Stats are shown to yourself, friends and admins.
export default function PlayerProfile() {
  const { username } = useParams()
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = not visible
  const [friendship, setFriendship] = useState(null)
  const [message, setMessage] = useState(null)
  // Admins can switch how they see this page:
  //   'me'       - like any user: depends on whether you're actually friends
  //   'friend'   - preview what a friend sees
  //   'stranger' - preview what a stranger sees
  //   'admin'    - everything, regardless of friendship (default for admins)
  const [viewAs, setViewAs] = useState('admin') // admins see everything by default

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, created_at, paddle_color')
      .eq('username', username)
      .maybeSingle()
    setProfile(data ?? null)

    // Is there a friendship between us? (either direction)
    if (data && data.id !== user.id) {
      const { data: f } = await supabase
        .from('friendships')
        .select('id, status, requester_id, addressee_id')
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${data.id}),` +
            `and(requester_id.eq.${data.id},addressee_id.eq.${user.id})`
        )
        .maybeSingle()
      setFriendship(f ?? null)
    }
  }, [username, user.id])

  useEffect(() => {
    load()
  }, [load])

  // The player object the stats code expects (memoized so it doesn't reload every render)
  const player = useMemo(() => (profile ? { ...userPlayer(profile), slot: 0 } : null), [profile])

  if (profile === undefined) return <p className="muted">Loading...</p>
  if (profile === null) {
    return (
      <div className="narrow card">
        <h1>Profile not available</h1>
        <p className="muted">
          This profile doesn't exist, or it's private. You can see the profiles of your friends
          and of people you've played with.
        </p>
        <Link to="/friends" className="btn">Find friends</Link>
      </div>
    )
  }

  // "previewing" = showing someone else's view, so the action buttons are hidden
  const previewing = isAdmin && (viewAs === 'friend' || viewAs === 'stranger')
  const isMe = profile.id === user.id
  const isFriend = friendship?.status === 'accepted'
  const incoming = friendship?.status === 'pending' && friendship.addressee_id === user.id
  const outgoing = friendship?.status === 'pending' && friendship.requester_id === user.id
  // Paddle, "member since", stats, calendar and widgets: only for yourself and friends
  // (or an admin who picked "Admin" / "Friend" in the View as switch)
  const canSeeStats =
    viewAs === 'admin' || viewAs === 'friend' ? true
      : viewAs === 'stranger' ? false
        : isMe || isFriend

  // "View as" switch, only for admins
  const viewAsBar = isAdmin && (
    <div className="view-as-bar">
      <span className="muted small">View as</span>
      <Segmented
        ariaLabel="View this profile as"
        options={[['admin', 'Admin'], ['me', 'Me'], ['friend', 'Friend'], ['stranger', 'Stranger']]}
        value={viewAs}
        onChange={setViewAs}
      />
    </div>
  )

  // A stranger can't open someone's profile at all (unless they've played together)
  if (previewing && viewAs === 'stranger') {
    return (
      <div className="narrow stack">
        {viewAsBar}
        <p className="notice">Previewing as a stranger: this is what someone who isn't friends with {profile.display_name} sees.</p>
        <div className="card">
          <h1>Profile not available</h1>
          <p className="muted">
            This profile doesn't exist, or it's private. You can see the profiles of your friends
            and of people you've played with.
          </p>
          <p className="muted small">
            (Someone who has played a game with {profile.display_name} would see their name and photo,
            with "Become friends to see their stats".)
          </p>
        </div>
      </div>
    )
  }

  async function run(promise, okText) {
    const { error } = await promise
    setMessage(error ? { type: 'error', text: error.message } : okText ? { type: 'ok', text: okText } : null)
    load()
  }

  function removeFriend() {
    if (!window.confirm(`Remove ${profile.display_name} from your friends?`)) return
    run(supabase.from('friendships').delete().eq('id', friendship.id))
  }

  function compareOnDashboard() {
    // Dashboard reads this and adds them to the comparison
    navigate('/', { state: { compare: userPlayer(profile) } })
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="narrow stack">
      {viewAsBar}
      {previewing && (
        <p className="notice">
          Previewing as a friend: buttons are hidden. Stats are close to what a friend sees
          (they only see games played with people they know).
        </p>
      )}
      <section className="card profile-head">
        <Avatar name={profile.display_name} url={profile.avatar_url} size={72} />
        <div className="profile-name">
          <h1>{profile.display_name}</h1>
          <div className="muted">@{profile.username}</div>
          {/* friends (and you) see more; everyone else just sees photo, name and username */}
          {canSeeStats && <div className="muted small">Member since {memberSince}</div>}
        </div>

        {/* their paddle, in the color they picked */}
        {canSeeStats && (
          <div className="profile-paddle">
            <StraightPaddle colorKey={profile.paddle_color} height={70} title={`${profile.display_name}'s paddle`} />
          </div>
        )}

        {!previewing && <div className="profile-actions">
          {isMe && (
            <Link to="/profile" className="btn btn-sm">
              <Icon name="gear" size={15} /> Edit profile & settings
            </Link>
          )}
          {!isMe && isFriend && (
            <>
              <button className="btn btn-sm btn-primary" onClick={compareOnDashboard}>Compare stats</button>
              <button className="btn btn-sm btn-ghost" onClick={removeFriend}>Remove friend</button>
            </>
          )}
          {!isMe && incoming && (
            <>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => run(supabase.rpc('respond_friend_request', { request_id: friendship.id, accept: true }), 'You are now friends!')}
              >
                Accept request
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => run(supabase.rpc('respond_friend_request', { request_id: friendship.id, accept: false }))}
              >
                Decline
              </button>
            </>
          )}
          {!isMe && outgoing && <span className="muted small">Friend request sent</span>}
          {!isMe && !friendship && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => run(supabase.rpc('send_friend_request', { target_username: profile.username }), 'Friend request sent')}
            >
              Add friend
            </button>
          )}
        </div>}
      </section>

      {message && <p className={message.type === 'ok' ? 'notice ok' : 'form-error'}>{message.text}</p>}

      {/* stats, calendar and widgets: only for you, friends and admins */}
      {canSeeStats && (
        // when previewing, hide "You & them" (that's about the admin, not the friend)
        <ProfileStats player={player} meKey={`user:${user.id}`} isMe={isMe || previewing} />
      )}

      {/* your own profile: sign out at the very bottom */}
      {isMe && !previewing && (
        <button className="btn btn-block sign-out-btn" onClick={signOut}>Sign out</button>
      )}
    </div>
  )
}

// Stat tiles, head-to-head with you, and the play calendar
function ProfileStats({ player, meKey, isMe }) {
  const { isDark } = useTheme()
  const colors = chartColors(isDark)
  const players = useMemo(() => [player], [player])
  const { stats, error } = useStats(players)

  if (error) return <p className="form-error">Couldn't load stats: {error}</p>
  if (!stats) return <section className="card"><p className="muted">Loading stats...</p></section>

  const rows = stats.byPlayer[player.key] || []
  if (rows.length === 0) {
    return <section className="card"><p className="muted">No games recorded yet.</p></section>
  }

  const wl = winLoss(rows)
  const types = byGameType(rows)
  const points = rows.filter((r) => r.points_for !== null).map((r) => r.points_for)
  const people = companions(player.key, rows, stats.rowsByGame) // everyone they played with (incl. just-for-fun)
  const counted = companions(player.key, countedRows(rows), stats.rowsByGame) // only games that count
  const topPartner = people.filter((c) => c.with > 0).sort((a, b) => b.with - a.with)[0]
  const vsMe = isMe ? null : counted.find((c) => c.key === meKey)
  const now = new Date()
  const thisMonth = rows.filter((r) => {
    const d = new Date(r.played_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const tiles = [
    ['Games', rows.length], // every game played, including just for fun
    ['Win %', `${Math.round(wl.winPct * 100)}%`],
    ['Record', `${wl.wins}–${wl.losses}`],
    ['This month', thisMonth],
    ['Singles', `${types.singles.wins}–${types.singles.losses}`],
    ['Doubles', `${types.doubles.wins}–${types.doubles.losses}`],
    ['Avg points', points.length ? average(points).toFixed(1) : '–'],
    ['Top partner', topPartner ? stats.names[topPartner.key] || 'Unknown' : '–'],
  ]

  return (
    <>
      <section className="card">
        <h2>Play calendar</h2>
        <PlayCalendar players={players} stats={stats} colors={colors} />
      </section>

      <section className="card">
        <h2>Stats</h2>
        <StatTiles tiles={tiles} />
      </section>

      {vsMe && (
        <section className="card">
          <h2>You & {player.name}</h2>
          <StatTiles
            tiles={[
              ['Games together', vsMe.with],
              ['Wins together', vsMe.with ? `${vsMe.winsWith} (${Math.round((vsMe.winsWith / vsMe.with) * 100)}%)` : '–'],
              ['Games against', vsMe.against],
              // winsAgainst is from THEIR side, so your wins are the rest
              ['Head to head', vsMe.against ? `You ${vsMe.against - vsMe.winsAgainst} – ${vsMe.winsAgainst}` : '–'],
            ]}
          />
        </section>
      )}

      {/* Your own layout for profile pages: drag, remove and re-add like the dashboard */}
      <WidgetGrid
        players={players}
        stats={stats}
        settingsKey="profile_widgets"
        allowed={PROFILE_WIDGETS}
      />
    </>
  )
}

function StatTiles({ tiles }) {
  return (
    <div className="stat-tiles">
      {tiles.map(([label, value]) => (
        <div className="stat-tile" key={label}>
          <div className="stat-value" title={String(value)}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  )
}
