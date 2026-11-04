import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../lib/errors'
import Avatar from '../components/Avatar'

// Admin tools. Games are managed on the Games page ("All games" toggle).
export default function Admin() {
  const { isAdmin, hasPermission } = useAuth()
  const [tab, setTab] = useState('users')

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="stack">
      <h1>Admin</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')}>Users</button>
        <button role="tab" aria-selected={tab === 'pals'} onClick={() => setTab('pals')}>Pickle pals</button>
        {hasPermission('admin.manage_permissions') && (
          <button role="tab" aria-selected={tab === 'perms'} onClick={() => setTab('perms')}>Roles & permissions</button>
        )}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'pals' && <PalsTab />}
      {tab === 'perms' && <PermissionsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------
function UsersTab() {
  const { user, refreshProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [edits, setEdits] = useState({}) // { [userId]: { display_name, username } }
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [usersRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, avatar_url, created_at, user_roles ( role )').order('created_at'),
      supabase.from('roles').select('name').order('name'),
    ])
    if (usersRes.error) setError(friendlyError(usersRes.error))
    setUsers(usersRes.data || [])
    setRoles((rolesRes.data || []).map((r) => r.name))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function editValue(u, field) {
    return edits[u.id]?.[field] ?? u[field]
  }
  function setEdit(u, field, value) {
    setEdits((e) => ({ ...e, [u.id]: { ...e[u.id], [field]: value } }))
  }

  async function saveUser(u) {
    const changes = edits[u.id]
    if (!changes) return
    const { error: e } = await supabase.from('profiles').update(changes).eq('id', u.id)
    if (e) return setError(friendlyError(e))
    setEdits((all) => ({ ...all, [u.id]: undefined }))
    setError('')
    if (u.id === user.id) refreshProfile()
    load()
  }

  async function toggleRole(u, role, hasIt) {
    if (hasIt && u.id === user.id && role === 'admin') {
      if (!window.confirm('Remove your OWN admin role? You will lose access to this page.')) return
    }
    const { error: e } = hasIt
      ? await supabase.from('user_roles').delete().eq('user_id', u.id).eq('role', role)
      : await supabase.from('user_roles').insert({ user_id: u.id, role })
    if (e) setError(friendlyError(e))
    load()
  }

  return (
    <section className="card">
      <p className="muted small">
        To fully delete an account, delete the user in Supabase Dashboard → Authentication → Users.
        That removes their profile, games and pals too.
      </p>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th></th><th>Display name</th><th>Username</th><th>Roles</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userRoles = u.user_roles.map((r) => r.role)
              return (
                <tr key={u.id}>
                  <td><Avatar name={u.display_name} url={u.avatar_url} size={28} /></td>
                  <td>
                    <input value={editValue(u, 'display_name')} onChange={(e) => setEdit(u, 'display_name', e.target.value)} aria-label="Display name" />
                  </td>
                  <td>
                    <input value={editValue(u, 'username')} onChange={(e) => setEdit(u, 'username', e.target.value)} aria-label="Username" />
                  </td>
                  <td>
                    {roles.map((role) => {
                      const hasIt = userRoles.includes(role)
                      return (
                        <label key={role} className="toggle small">
                          <input type="checkbox" checked={hasIt} onChange={() => toggleRole(u, role, hasIt)} />
                          {role}
                        </label>
                      )
                    })}
                  </td>
                  <td>
                    <button className="btn btn-sm" disabled={!edits[u.id]} onClick={() => saveUser(u)}>Save</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
function PalsTab() {
  const [pals, setPals] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data, error: e } = await supabase
      .from('pickle_pals')
      .select('id, name, created_at, owner:profiles ( display_name, username )')
      .order('created_at')
    if (e) setError(friendlyError(e))
    setPals(data || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function rename(pal) {
    const name = window.prompt('New name', pal.name)
    if (!name || !name.trim()) return
    const { error: e } = await supabase.from('pickle_pals').update({ name: name.trim() }).eq('id', pal.id)
    if (e) setError(friendlyError(e))
    load()
  }

  async function remove(pal) {
    if (!window.confirm(`Delete pickle pal "${pal.name}"?`)) return
    const { error: e } = await supabase.from('pickle_pals').delete().eq('id', pal.id)
    if (e) setError(friendlyError(e))
    load()
  }

  return (
    <section className="card">
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Owner</th><th></th></tr></thead>
          <tbody>
            {pals.length === 0 && <tr><td colSpan={3} className="muted">No pickle pals.</td></tr>}
            {pals.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.owner?.display_name} <span className="muted">@{p.owner?.username}</span></td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => rename(p)}>Rename</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Matrix of roles x permissions. Tick a box to give a role a permission.
function PermissionsTab() {
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [links, setLinks] = useState([]) // [{ role, permission }]
  const [newPerm, setNewPerm] = useState({ key: '', description: '' })
  const [newRole, setNewRole] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [p, r, rp] = await Promise.all([
      supabase.from('permissions').select('*').order('key'),
      supabase.from('roles').select('*').order('name'),
      supabase.from('role_permissions').select('*'),
    ])
    setPermissions(p.data || [])
    setRoles(r.data || [])
    setLinks(rp.data || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const has = (role, permission) => links.some((l) => l.role === role && l.permission === permission)

  // Run a query, show its error if any, then reload
  async function run(query) {
    const { error: e } = await query
    setError(e ? friendlyError(e) : '')
    load()
  }

  function toggle(role, permission) {
    run(
      has(role, permission)
        ? supabase.from('role_permissions').delete().eq('role', role).eq('permission', permission)
        : supabase.from('role_permissions').insert({ role, permission })
    )
  }

  function addPermission(e) {
    e.preventDefault()
    if (!newPerm.key.trim() || !newPerm.description.trim()) return
    run(supabase.from('permissions').insert({ key: newPerm.key.trim(), description: newPerm.description.trim() }))
    setNewPerm({ key: '', description: '' })
  }

  function addRole(e) {
    e.preventDefault()
    if (!newRole.trim()) return
    run(supabase.from('roles').insert({ name: newRole.trim() }))
    setNewRole('')
  }

  function deletePermission(key) {
    if (window.confirm(`Delete permission "${key}"? Code that checks it will treat everyone as not having it.`)) {
      run(supabase.from('permissions').delete().eq('key', key))
    }
  }

  function deleteRole(name) {
    if (window.confirm(`Delete role "${name}"? Users lose it.`)) run(supabase.from('roles').delete().eq('name', name))
  }

  return (
    <section className="card stack">
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Permission</th>
              {roles.map((r) => (
                <th key={r.name}>
                  {r.name}
                  {!['user', 'admin'].includes(r.name) && (
                    <button className="chip-x" aria-label={`Delete role ${r.name}`} onClick={() => deleteRole(r.name)}>✕</button>
                  )}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p.key}>
                <td>
                  <code>{p.key}</code>
                  <div className="muted small">{p.description}</div>
                </td>
                {roles.map((r) => (
                  <td key={r.name}>
                    <input
                      type="checkbox"
                      checked={has(r.name, p.key)}
                      onChange={() => toggle(r.name, p.key)}
                      aria-label={`${r.name} has ${p.key}`}
                    />
                  </td>
                ))}
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => deletePermission(p.key)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addPermission} className="inline-form">
        <input placeholder="new.permission_key" value={newPerm.key} onChange={(e) => setNewPerm({ ...newPerm, key: e.target.value })} aria-label="Permission key" />
        <input placeholder="Description" value={newPerm.description} onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })} aria-label="Description" />
        <button className="btn btn-sm">Add permission</button>
      </form>
      <form onSubmit={addRole} className="inline-form">
        <input placeholder="New role name" value={newRole} onChange={(e) => setNewRole(e.target.value)} aria-label="Role name" />
        <button className="btn btn-sm">Add role</button>
      </form>
    </section>
  )
}
