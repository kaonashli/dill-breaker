import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePeople, userPlayer } from '../lib/people'
import ComparePicker from '../components/ComparePicker'
import WidgetBoard from '../components/WidgetBoard'
import FriendsPanel from '../components/FriendsPanel'
import PicklePalsPanel from '../components/PicklePalsPanel'

export default function Dashboard() {
  const { profile } = useAuth()
  const people = usePeople()
  const [compared, setCompared] = useState([]) // other players being compared
  const [includeMe, setIncludeMe] = useState(true)

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

        <ComparePicker
          me={me}
          includeMe={includeMe}
          setIncludeMe={setIncludeMe}
          compared={compared}
          onChange={setCompared}
          people={people}
        />

        <WidgetBoard players={players} />
      </div>

      <aside className="dash-side">
        <FriendsPanel people={people} />
        <PicklePalsPanel people={people} />
      </aside>
    </div>
  )
}
