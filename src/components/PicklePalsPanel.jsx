import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../lib/errors'
import PickleLogo from './PickleLogo'

const MAX_PALS = 5

// Pickle pals = friends without an account. Only the owner can change them.
export default function PicklePalsPanel({ people }) {
  const { user } = useAuth()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const full = people.pals.length >= MAX_PALS

  async function addPal(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const { error: insertError } = await supabase.from('pickle_pals').insert({ owner_id: user.id, name })
    if (insertError) return setError(friendlyError(insertError))
    setNewName('')
    setError('')
    people.reload()
  }

  async function saveRename(id) {
    const name = editName.trim()
    if (!name) return
    const { error: updateError } = await supabase.from('pickle_pals').update({ name }).eq('id', id)
    if (updateError) return setError(friendlyError(updateError))
    setEditingId(null)
    people.reload()
  }

  async function deletePal(pal) {
    const ok = window.confirm(
      `Delete ${pal.name}? They'll be removed from your games (the games themselves stay).`
    )
    if (!ok) return
    await supabase.from('pickle_pals').delete().eq('id', pal.id)
    people.reload()
  }

  return (
    <section className="card panel">
      <h2>
        Pickle pals <span className="muted small">{people.pals.length}/{MAX_PALS}</span>
      </h2>
      <p className="muted small">Friends without an account, so you can still track games with them.</p>

      <ul className="people-list">
        {people.pals.map((pal) => (
          <li key={pal.key}>
            {editingId === pal.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={40}
                  aria-label="New name"
                  autoFocus
                />
                <button className="btn btn-sm btn-primary" onClick={() => saveRename(pal.id)}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="avatar avatar-initials pal-badge" aria-hidden="true"><PickleLogo size={18} animate={false} /></span>
                <span className="person-name">{pal.name}</span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setEditingId(pal.id)
                    setEditName(pal.name)
                  }}
                >
                  Rename
                </button>
                <button className="btn btn-sm btn-ghost" title="Delete" onClick={() => deletePal(pal)}>✕</button>
              </>
            )}
          </li>
        ))}
      </ul>

      {!full && (
        <form onSubmit={addPal} className="inline-form">
          <input
            placeholder="Pal's name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
            aria-label="Pal's name"
          />
          <button className="btn btn-sm">Add</button>
        </form>
      )}
      {error && <p className="field-error">{error}</p>}
    </section>
  )
}
