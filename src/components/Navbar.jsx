import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span aria-hidden="true">🥒</span> Dill Breaker
      </Link>
      {/* desktop-only: on phones the bottom tab bar replaces these */}
      <nav className="nav-links desktop-only">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/feed">Activity</NavLink>
        <NavLink to="/games" end>My games</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="nav-right">
        {/* phones: the tab bar has no Admin tab, so admins get a button up here */}
        {isAdmin && (
          <NavLink to="/admin" className="btn btn-ghost btn-sm mobile-only admin-link" title="Admin tools">
            🛡️ Admin
          </NavLink>
        )}
        <ThemeToggle />
        <Link to="/profile" title="Your profile" className="nav-profile desktop-only">
          <Avatar name={profile.display_name} url={profile.avatar_url} size={32} />
        </Link>
        <button className="btn btn-ghost btn-sm desktop-only" onClick={signOut}>Sign out</button>
      </div>
    </header>
  )
}
