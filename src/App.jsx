import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from './components/ProtectedLayout.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AddGame from './pages/AddGame.jsx'
import AddMatch from './pages/AddMatch.jsx'
import Games from './pages/Games.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import Friends from './pages/Friends.jsx'
import PlayerProfile from './pages/PlayerProfile.jsx'
import Feed from './pages/Feed.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Everything inside here requires being logged in */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/new" element={<AddGame />} />
        <Route path="/games/:id/edit" element={<AddGame />} />
        <Route path="/matches/new" element={<AddMatch />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/u/:username" element={<PlayerProfile />} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Unknown URL -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
