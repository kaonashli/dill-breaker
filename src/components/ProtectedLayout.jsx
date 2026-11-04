import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'

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
    <>
      <Navbar />
      <main className="container">
        <Outlet /> {/* the current page renders here */}
      </main>
    </>
  )
}
