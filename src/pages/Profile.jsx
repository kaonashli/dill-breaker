import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { friendlyError } from '../lib/errors'
import { resizeImage } from '../lib/image'
import { removeAvatar, uploadAvatar } from '../lib/avatar'
import { MIN_PASSWORD, USERNAME_RE } from '../lib/validation'
import { playHit, setSoundEnabled, soundEnabled } from '../lib/sound'
import { CURRENT_VERSION, hasUnseenRelease } from '../lib/releases'
import Avatar from '../components/Avatar'
import Segmented from '../components/Segmented'

export default function Profile() {
  const { user, profile, refreshProfile, saveTheme, isAdmin, signOut } = useAuth()
  const { theme } = useTheme()
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [username, setUsername] = useState(profile.username)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(null) // { type, text }
  const [sound, setSound] = useState(soundEnabled)

  const ok = (text) => setMessage({ type: 'ok', text })
  const fail = (err) => setMessage({ type: 'error', text: typeof err === 'string' ? err : friendlyError(err) })

  async function saveProfile(e) {
    e.preventDefault()
    const name = displayName.trim()
    const uname = username.trim()
    if (!name) return fail('Display name is required.')
    if (!USERNAME_RE.test(uname)) return fail('Usernames are 3-20 letters, numbers or underscores.')
    if (uname.toLowerCase() !== profile.username.toLowerCase()) {
      const { data: available } = await supabase.rpc('username_available', { name: uname })
      if (!available) return fail('That username is taken.')
    }
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name, username: uname })
      .eq('id', user.id)
    if (error) return fail(error)
    await refreshProfile()
    ok('Profile saved.')
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return fail('Please choose an image file.')
    try {
      const blob = await resizeImage(file)
      await uploadAvatar(user.id, blob)
      await refreshProfile()
      ok('Photo updated.')
    } catch (err) {
      fail(err)
    }
  }

  async function handleRemovePhoto() {
    try {
      await removeAvatar(user.id)
      await refreshProfile()
      ok('Photo removed.')
    } catch (err) {
      fail(err)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`)
    if (password !== confirm) return fail("Passwords don't match.")
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return fail(error)
    setPassword('')
    setConfirm('')
    ok('Password changed.')
  }

  return (
    <div className="narrow stack">
      <div className="dash-header">
        <h1>Edit profile & settings</h1>
        <Link to={`/u/${profile.username}`} className="btn btn-sm">← Back to my profile</Link>
      </div>
      {message && <p className={message.type === 'ok' ? 'notice ok' : 'form-error'}>{message.text}</p>}

      <section className="card stack">
        <div className="avatar-picker">
          <Avatar name={profile.display_name} url={profile.avatar_url} size={72} />
          <label className="btn btn-sm">
            {profile.avatar_url ? 'Change photo' : 'Add photo'}
            <input type="file" accept="image/*" onChange={handlePhoto} hidden />
          </label>
          {profile.avatar_url && (
            <button className="btn btn-ghost btn-sm" onClick={handleRemovePhoto}>Remove</button>
          )}
        </div>

        <form onSubmit={saveProfile} className="stack">
          <label className="field">
            <span className="field-label">Display name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
          </label>
          <label className="field">
            <span className="field-label">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
          </label>
          <p className="muted small">Email: {user.email}</p>
          <div className="form-actions">
            <button className="btn btn-primary">Save profile</button>
          </div>
        </form>
      </section>

      <section className="card stack">
        <h2>Appearance</h2>
        <Segmented
          ariaLabel="Theme"
          options={[['light', '☀️ Light'], ['dark', '🌙 Dark'], ['system', '🖥️ System']]}
          value={theme}
          onChange={saveTheme}
        />
      </section>

      <section className="card stack">
        <h2>Notifications</h2>
        <div className="sound-row">
          <label className="toggle">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => {
                setSound(e.target.checked)
                setSoundEnabled(e.target.checked)
              }}
            />
            Play a paddle-hit sound for new friend requests
          </label>
          <button className="btn btn-sm" onClick={() => playHit({ force: true })}>🔊 Test sound</button>
        </div>
        <p className="muted small">Saved on this device. Phones on silent mode won't play it.</p>
      </section>

      <section className="card">
        <h2>Change password</h2>
        <form onSubmit={changePassword} className="stack">
          <label className="field">
            <span className="field-label">New password</span>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Confirm new password</span>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <div className="form-actions">
            <button className="btn">Change password</button>
          </div>
        </form>
      </section>

      {/* Mainly for phones, where the top bar doesn't show these */}
      <section className="card profile-links">
        <Link to="/whats-new" className="btn btn-block">
          What's new {hasUnseenRelease() && <span className="release-latest">New</span>}
        </Link>
        {isAdmin && <Link to="/admin" className="btn btn-block">Admin tools</Link>}
        <button className="btn btn-block" onClick={signOut}>Sign out</button>
      </section>
      <p className="muted small app-version">
        Dill Breaker version {CURRENT_VERSION} · <span className="dev-note">still in development</span>
      </p>
    </div>
  )
}
