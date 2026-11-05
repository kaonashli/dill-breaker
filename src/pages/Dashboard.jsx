import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePeople, userPlayer } from '../lib/people'
import ComparePicker from '../components/ComparePicker'
import WidgetBoard from '../components/WidgetBoard'
import FriendsPanel from '../components/FriendsPanel'
import PicklePalsPanel from '../components/PicklePalsPanel'
import { CURRENT_VERSION, hasUnseenRelease, markReleaseSeen } from '../lib/releases'

export default function Dashboard() {
  const { profile } = useAuth()
  const people = usePeople()
  const location = useLocation()
  // Other players being compared. "Compare stats" on a profile page sends one here.
  const [compared, setCompared] = useState(() =>
    location.state?.compare ? [{ ...location.state.compare, slot: 1 }] : []
  )
  const [includeMe, setIncludeMe] = useState(true)
  const [showUpdate, setShowUpdate] = useState(hasUnseenRelease)

  const me = { ...userPlayer(profile), name: 'You', slot: 0 }
  const players = includeMe ? [me, ...compared] : compared

  return (
    <div className="dashboard">
      <div className="dash-main">
        <div className="dash-header">
          <h1>Hi, {profile.display_name}</h1>
          <div className="actions">
            <Link to="/games/new" className="btn btn-primary">+ Log a game</Link>
            <Link to="/matches/new" className="btn">+ Log a match</Link>
          </div>
        </div>

        {/* Small banner after an update, until you open "What's new" or close it */}
        {showUpdate && (
          <div className="update-banner">
            <span>🎉 Dill Breaker {CURRENT_VERSION} is here!</span>
            <Link to="/whats-new" className="btn btn-sm btn-primary">See what's new</Link>
            <button
              className="chip-x"
              aria-label="Dismiss"
              onClick={() => {
                markReleaseSeen()
                setShowUpdate(false)
              }}
            >
              ✕
            </button>
          </div>
        )}

        <ComparePicker
          me={me}
          includeMe={includeMe}
          setIncludeMe={setIncludeMe}
          compared={compared}
          onChange={setCompared}
          people={people}
        />

        <WidgetBoard players={players} />

        {/* subtle link to the release notes */}
        <p className="dash-footer">
          <Link to="/whats-new">What's new in v{CURRENT_VERSION}</Link>
        </p>
      </div>

      {/* On phones this lives in the Friends tab instead */}
      <aside className="dash-side desktop-only">
        <FriendsPanel people={people} />
        <PicklePalsPanel people={people} />
      </aside>
    </div>
  )
}
