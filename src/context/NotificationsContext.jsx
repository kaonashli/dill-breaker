import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthContext'
import { playHit, unlockAudio } from '../lib/sound'
import Avatar from '../components/Avatar'

// Keeps track of incoming friend requests for the logged-in user and shows:
//   - a count (used for badges)
//   - a pop-up "toast" + sound when a NEW request arrives
// Updates instantly via Supabase Realtime (migration 005), and also re-checks
// when you come back to the tab and once a minute, just in case.
const NotificationsContext = createContext(null)

const TOAST_MS = 6000

// Request ids we've already announced, so you're only told once (per browser)
function seenKey(userId) {
  return `seenFriendRequests:${userId}`
}
function readSeen(userId) {
  try {
    return JSON.parse(localStorage.getItem(seenKey(userId)) || '[]')
  } catch {
    return []
  }
}
function writeSeen(userId, ids) {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify(ids.slice(-200)))
  } catch {
    /* ignore */
  }
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [incoming, setIncoming] = useState([]) // pending requests sent TO me
  const [version, setVersion] = useState(0) // bumps whenever the list is reloaded
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const showToast = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((all) => [...all, { id, ...toast }])
      setTimeout(() => dismissToast(id), TOAST_MS)
    },
    [dismissToast]
  )

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, created_at, requester:profiles!friendships_requester_id_fkey ( display_name, username, avatar_url )')
      .eq('status', 'pending')
      .eq('addressee_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return
    setIncoming(data)
    setVersion((v) => v + 1)

    // Announce requests we haven't told you about yet
    const seen = readSeen(user.id)
    const fresh = data.filter((r) => !seen.includes(r.id))
    if (fresh.length > 0) {
      writeSeen(user.id, [...seen, ...fresh.map((r) => r.id)])
      const single = fresh.length === 1 ? fresh[0].requester : null
      showToast({
        text: single
          ? `${single.display_name} sent you a friend request`
          : `You have ${fresh.length} new friend requests`,
        person: single,
        link: '/friends',
        linkText: 'View',
      })
      playHit()
    }
  }, [user.id, showToast])

  useEffect(() => {
    let channel = null
    let stopped = false
    let retryTimer = null

    // --- 1) Live updates (Supabase Realtime) -------------------------
    // Phones pause the connection when the app is in the background, so if
    // it errors or closes we reconnect, and every (re)connect does a catch-up check.
    function connect() {
      if (stopped) return
      const old = channel
      const current = supabase.channel(`friend-requests-${user.id}-${Date.now()}`)
      channel = current
      if (old) supabase.removeChannel(old) // its 'CLOSED' is ignored below (not current anymore)
      current
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${user.id}` },
          () => refresh()
        )
        .subscribe((status) => {
          if (stopped || current !== channel) return // an old connection we replaced on purpose
          if (status === 'SUBSCRIBED') refresh() // catch up on anything missed while disconnected
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(retryTimer)
            retryTimer = setTimeout(connect, 5000) // try again in 5s
          }
        })
    }
    connect()

    // --- 2) Re-check when the app comes back on screen ----------------
    // 'visibilitychange' is the one phones reliably fire (switching apps,
    // unlocking the screen); 'focus' covers desktop; 'online' = Wi-Fi/data back.
    function onVisible() {
      if (document.visibilityState === 'visible') {
        refresh()
        if (!channel || channel.state !== 'joined') connect()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    window.addEventListener('online', onVisible)
    window.addEventListener('pageshow', onVisible) // back/forward cache on iPhone

    // --- 3) Safety net: check every 20s while the page is visible ------
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 20000)

    // Browsers block sound until the first tap/click
    window.addEventListener('pointerdown', unlockAudio, { once: true })

    return () => {
      stopped = true
      clearTimeout(retryTimer)
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('online', onVisible)
      window.removeEventListener('pageshow', onVisible)
      window.removeEventListener('pointerdown', unlockAudio)
      clearInterval(timer)
    }
  }, [refresh, user.id])

  // "(2) Dill Breaker" in the browser tab when requests are waiting
  useEffect(() => {
    document.title = incoming.length > 0 ? `(${incoming.length}) Dill Breaker` : 'Dill Breaker'
  }, [incoming.length])

  return (
    <NotificationsContext.Provider value={{ incomingCount: incoming.length, version, refresh, showToast }}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}

// Pop-ups at the top of the screen
function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          {t.person ? (
            <Avatar name={t.person.display_name} url={t.person.avatar_url} size={36} />
          ) : (
            <span className="toast-icon" aria-hidden="true">🥒</span>
          )}
          <span className="toast-text">{t.text}</span>
          {t.link && (
            <Link to={t.link} className="btn btn-sm btn-primary" onClick={() => onDismiss(t.id)}>
              {t.linkText}
            </Link>
          )}
          <button className="chip-x" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// Little red number bubble. Renders nothing when count is 0.
export function CountBadge({ count, label = 'new' }) {
  if (!count) return null
  return (
    <span className="count-badge" aria-label={`${count} ${label}`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}
