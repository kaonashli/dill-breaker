import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import ThemeToggle from './ThemeToggle'
import PickleLogo from './PickleLogo'
import { NotificationsProvider } from '../context/NotificationsContext'

// The logged-in app frame: top bar, page, bottom tab bar (phones),
// plus friend request badges / pop-ups / sound.
export function AppShell({ children }) {
  return (
    <NotificationsProvider>
      <Navbar />
      <main className="container">{children}</main>
      <BottomNav /> {/* phones only */}
    </NotificationsProvider>
  )
}

// Wraps every page that needs a login. Not logged in -> go to /login.
export default function ProtectedLayout() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) return <div className="page-center muted">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) {
    return (
      <div className="page-center">
        <p>Couldn't load your profile.</p>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <AppShell>
      <Outlet /> {/* the current page renders here */}
    </AppShell>
  )
}

// For pages anyone can open (like "What's new"): the full app frame when
// logged in, or a simple header with a "Log in" button when not.
export function PublicLayout({ children }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="page-center muted">Loading...</div>
  if (session && profile) return <AppShell>{children}</AppShell>

  return (
    <>
      <header className="navbar">
        <Link to="/login" className="brand">
          <PickleLogo /> Dill Breaker
        </Link>
        <div className="nav-right">
          <ThemeToggle />
          <Link to="/login" className="btn btn-sm btn-primary">Log in</Link>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  )
}
