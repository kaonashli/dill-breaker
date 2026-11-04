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
      <nav className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/games">Games</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="nav-right">
        <ThemeToggle />
        <Link to="/profile" title="Your profile" className="nav-profile">
          <Avatar name={profile.display_name} url={profile.avatar_url} size={32} />
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
      </div>
    </header>
  )
}
