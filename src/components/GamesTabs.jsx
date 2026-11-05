import { NavLink } from 'react-router-dom'

// Switch between the activity feed and your own game history
export default function GamesTabs() {
  return (
    <nav className="tabs page-tabs" aria-label="Games">
      <NavLink to="/feed">Activity feed</NavLink>
      <NavLink to="/games" end>My games</NavLink>
    </nav>
  )
}
