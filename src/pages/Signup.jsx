import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../lib/errors'
import { resizeImage } from '../lib/image'
import { clearPendingAvatar, savePendingAvatar } from '../lib/avatar'
import AuthCard from '../components/AuthCard'
import Avatar from '../components/Avatar'
import { MIN_PASSWORD, USERNAME_RE } from '../lib/validation'

export default function Signup() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '', confirm: '' })
  const [avatarBlob, setAvatarBlob] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [usernameStatus, setUsernameStatus] = useState(null) // 'checking' | 'available' | 'taken' | 'invalid'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  // Check the username a moment after the user stops typing
  useEffect(() => {
    const name = form.username.trim()
    if (!name) return setUsernameStatus(null)
    if (!USERNAME_RE.test(name)) return setUsernameStatus('invalid')
    setUsernameStatus('checking')
    let cancelled = false
    const timer = setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc('username_available', { name })
      if (!cancelled) setUsernameStatus(rpcError ? null : data ? 'available' : 'taken')
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [form.username])

  if (session && !submitting) return <Navigate to="/" replace />

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > 10 * 1024 * 1024) return setError('That image is too big (max 10 MB).')
    try {
      const blob = await resizeImage(file) // shrink to 256x256
      setAvatarBlob(blob)
      setAvatarPreview(URL.createObjectURL(blob))
      setError('')
    } catch {
      setError('Could not read that image.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const username = form.username.trim()
    const displayName = form.displayName.trim()

    if (!displayName) return setError('Please enter a display name.')
    if (!USERNAME_RE.test(username)) return setError('Usernames are 3-20 letters, numbers or underscores.')
    if (usernameStatus === 'taken') return setError('That username is taken.')
    if (form.password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`)
    if (form.password !== form.confirm) return setError("Passwords don't match.")

    setSubmitting(true)
    setError('')

    // Park the photo first; it's uploaded automatically on first login
    if (avatarBlob) await savePendingAvatar(form.email, avatarBlob)

    // username + display_name ride along as metadata; a database trigger
    // copies them into public.profiles.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username, display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    })

    setSubmitting(false)
    if (signUpError) {
      clearPendingAvatar()
      return setError(friendlyError(signUpError))
    }
    if (data.session) navigate('/') // email confirmation is off
    else setCheckEmail(true) // email confirmation is on
  }

  if (checkEmail) {
    return (
      <AuthCard title="Check your email">
        <p>
          We sent a confirmation link to <strong>{form.email}</strong>. Click it, then log in.
        </p>
        <Link to="/login" className="btn btn-primary btn-block">Go to log in</Link>
      </AuthCard>
    )
  }

  const usernameHint = {
    checking: <span className="muted">Checking...</span>,
    available: <span className="ok">✓ Available</span>,
    taken: <span className="field-error">✗ Taken</span>,
    invalid: <span className="field-error">3-20 letters, numbers or _</span>,
  }[usernameStatus]

  return (
    <AuthCard title="Create an account">
      <form onSubmit={handleSubmit} className="stack">
        <div className="avatar-picker">
          <Avatar name={form.displayName || '?'} url={avatarPreview} size={64} />
          <label className="btn btn-sm">
            {avatarPreview ? 'Change photo' : 'Add photo (optional)'}
            <input type="file" accept="image/*" onChange={handlePhoto} hidden />
          </label>
        </div>

        <label className="field">
          <span className="field-label">Display name</span>
          <input value={form.displayName} onChange={update('displayName')} maxLength={40} required />
        </label>

        <label className="field">
          <span className="field-label">Username {usernameHint}</span>
          <input
            value={form.username} onChange={update('username')}
            maxLength={20} autoComplete="username" autoCapitalize="none" required
          />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
        </label>

        <label className="field">
          <span className="field-label">Password <span className="muted">(at least {MIN_PASSWORD} characters)</span></span>
          <input
            type="password" value={form.password} onChange={update('password')}
            autoComplete="new-password" minLength={MIN_PASSWORD} required
          />
        </label>

        <label className="field">
          <span className="field-label">Confirm password</span>
          <input
            type="password" value={form.confirm} onChange={update('confirm')}
            autoComplete="new-password" required
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  )
}
