import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { chartColors } from '../lib/colors'
import { palPlayer, userPlayer } from '../lib/people'

export const MAX_COMPARE = 4

// Chips for the players being shown + a dropdown to add more.
// Each player keeps a fixed color "slot", so removing one doesn't repaint the others.
// Regular users: friends + own pals. Admin ('stats.compare_anyone'): everyone,
// and they can also take themselves out of the comparison.
export default function ComparePicker({ me, includeMe, setIncludeMe, compared, onChange, people }) {
  const { hasPermission } = useAuth()
  const { isDark } = useTheme()
  const colors = chartColors(isDark)
  const canCompareAnyone = hasPermission('stats.compare_anyone')
  const [everyone, setEveryone] = useState(null)

  // Admins: load every user and every pickle pal
  useEffect(() => {
    if (!canCompareAnyone) return
    Promise.all([
      supabase.from('profiles').select('id, username, display_name, avatar_url, paddle_color').order('display_name'),
      supabase.from('pickle_pals').select('id, name, owner:profiles ( display_name )').order('name'),
    ]).then(([usersRes, palsRes]) => {
      const users = (usersRes.data || []).map(userPlayer)
      const pals = (palsRes.data || []).map((p) => ({
        ...palPlayer(p),
        name: `${p.name} (pal of ${p.owner?.display_name ?? '?'})`,
      }))
      setEveryone([...users, ...pals])
    })
  }, [canCompareAnyone])

  const options = canCompareAnyone && everyone ? everyone : [...people.friends, ...people.pals]
  const available = options.filter((o) => o.key !== me.key && !compared.some((c) => c.key === o.key))

  function add(key) {
    const player = options.find((o) => o.key === key)
    if (!player) return
    // lowest color slot not in use (slot 0 is always "me")
    const used = new Set([0, ...compared.map((c) => c.slot)])
    let slot = 1
    while (used.has(slot)) slot++
    onChange([...compared, { ...player, slot }])
  }

  return (
    <div className="compare-bar">
      <span className="muted small">Showing:</span>
      {includeMe && (
        <span className="chip">
          <span className="dot" style={{ background: colors.series[0] }} /> You
          {canCompareAnyone && compared.length > 0 && (
            <button className="chip-x" aria-label="Remove yourself" onClick={() => setIncludeMe(false)}>✕</button>
          )}
        </span>
      )}
      {compared.map((p) => (
        <span className="chip" key={p.key}>
          <span className="dot" style={{ background: colors.series[p.slot] }} /> {p.name}
          <button
            className="chip-x"
            aria-label={`Remove ${p.name}`}
            onClick={() => {
              const next = compared.filter((c) => c.key !== p.key)
              onChange(next)
              if (next.length === 0) setIncludeMe(true)
            }}
          >
            ✕
          </button>
        </span>
      ))}
      {!includeMe && (
        <button className="btn btn-sm btn-ghost" onClick={() => setIncludeMe(true)}>+ You</button>
      )}
      {compared.length < MAX_COMPARE && available.length > 0 && (
        <select value="" onChange={(e) => add(e.target.value)} aria-label="Compare with">
          <option value="">+ Compare with...</option>
          {available.map((o) => (
            <option key={o.key} value={o.key}>
              {o.name}{o.username ? ` (@${o.username})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
