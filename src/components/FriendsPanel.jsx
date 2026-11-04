import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const PROFILE_COLS = 'id, username, display_name, avatar_url'

// Search by username, send / accept / decline requests, list friends.
// people: result of usePeople() so the friends list refreshes everywhere
export default function FriendsPanel({ people }) {
  const { user } = useAuth()
  const [term, setTerm] = useState('')
  const [results, setResults] = useState(null) // null = haven't searched
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }

  const loadRequests = useCallback(async () => {
    const { data } = await supabase
      .from('friendships')
      .select(
        `id, requester_id, addressee_id,
         requester:profiles!friendships_requester_id_fkey ( ${PROFILE_COLS} ),
         addressee:profiles!friendships_addressee_id_fkey ( ${PROFILE_COLS} )`
      )
      .eq('status', 'pending')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    const rows = data || []
    setIncoming(rows.filter((r) => r.addressee_id === user.id))
    setOutgoing(rows.filter((r) => r.requester_id === user.id))
  }, [user.id])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  async function refreshAll() {
    await Promise.all([loadRequests(), people.reload()])
  }

  async function search(e) {
    e.preventDefault()
    const q = term.trim()
    if (q.length < 3) return setMessage({ type: 'error', text: 'Type at least 3 characters of their username.' })
    setMessage(null)
    // search_users (in the database) matches usernames that START WITH the text.
    // It treats % and _ as normal characters, so it can't be used to list everyone.
    const { data, error } = await supabase.rpc('search_users', { term: q })
    if (error) return setMessage({ type: 'error', text: error.message })
    setResults(data || [])
  }

  async function sendRequest(username) {
    const { error } = await supabase.rpc('send_friend_request', { target_username: username })
    setMessage(error ? { type: 'error', text: error.message } : { type: 'ok', text: `Request sent to @${username}` })
    await refreshAll()
  }

  async function respond(requestId, accept) {
    const { error } = await supabase.rpc('respond_friend_request', { request_id: requestId, accept })
    if (error) setMessage({ type: 'error', text: error.message })
    await refreshAll()
  }

  // Cancel a sent request, or unfriend
  async function removeFriendship(friendshipId, question) {
    if (!window.confirm(question)) return
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await refreshAll()
  }

  // What button to show next to a search result
  function relationTo(profileId) {
    if (people.friends.some((f) => f.id === profileId)) return 'friends'
    if (outgoing.some((r) => r.addressee_id === profileId)) return 'sent'
    if (incoming.some((r) => r.requester_id === profileId)) return 'incoming'
    return null
  }

  return (
    <section className="card panel">
      <h2>Friends</h2>

      <form onSubmit={search} className="inline-form">
        <input
          placeholder="Search by username"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-label="Search by username"
        />
        <button className="btn btn-sm">Search</button>
      </form>
      {message && <p className={message.type === 'ok' ? 'ok small' : 'field-error'}>{message.text}</p>}

      {results && (
        <ul className="people-list">
          {results.length === 0 && <li className="muted small">No users found.</li>}
          {results.map((p) => {
            const relation = relationTo(p.id)
            return (
              <li key={p.id}>
                <Avatar name={p.display_name} url={p.avatar_url} size={28} />
                <span className="person-name">
                  {p.display_name} <span className="muted">@{p.username}</span>
                </span>
                {relation === 'friends' && <span className="muted small">Friends</span>}
                {relation === 'sent' && <span className="muted small">Requested</span>}
                {relation === 'incoming' && <span className="muted small">Wants to be friends ↓</span>}
                {!relation && (
                  <button className="btn btn-sm btn-primary" onClick={() => sendRequest(p.username)}>Add</button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {incoming.length > 0 && (
        <>
          <h3>Friend requests</h3>
          <ul className="people-list">
            {incoming.map((r) => (
              <li key={r.id}>
                <Avatar name={r.requester.display_name} url={r.requester.avatar_url} size={28} />
                <span className="person-name">
                  {r.requester.display_name} <span className="muted">@{r.requester.username}</span>
                </span>
                <button className="btn btn-sm btn-primary" onClick={() => respond(r.id, true)}>Accept</button>
                <button className="btn btn-sm btn-ghost" onClick={() => respond(r.id, false)}>Decline</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <h3>Sent requests</h3>
          <ul className="people-list">
            {outgoing.map((r) => (
              <li key={r.id}>
                <Avatar name={r.addressee.display_name} url={r.addressee.avatar_url} size={28} />
                <span className="person-name">
                  {r.addressee.display_name} <span className="muted">@{r.addressee.username}</span>
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => removeFriendship(r.id, `Cancel your request to ${r.addressee.display_name}?`)}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Your friends ({people.friends.length})</h3>
      <ul className="people-list">
        {people.friends.length === 0 && <li className="muted small">No friends yet. Search above to add some.</li>}
        {people.friends.map((f) => (
          <li key={f.key}>
            <Avatar name={f.name} url={f.avatar_url} size={28} />
            <span className="person-name">
              {f.name} <span className="muted">@{f.username}</span>
            </span>
            <button
              className="btn btn-sm btn-ghost"
              title="Remove friend"
              onClick={() => removeFriendship(f.friendshipId, `Remove ${f.name} from your friends?`)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
