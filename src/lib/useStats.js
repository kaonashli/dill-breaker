import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { rowKey } from './stats'

// Supabase returns at most 1000 rows per request, so page through.
async function fetchAll(buildQuery) {
  const PAGE = 1000
  const all = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...data)
    if (data.length < PAGE) return all
  }
}

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

async function loadStats(players) {
  // 1. Each player's own games
  const byPlayer = {}
  await Promise.all(
    players.map(async (p) => {
      const column = p.kind === 'user' ? 'user_id' : 'pickle_pal_id'
      byPlayer[p.key] = await fetchAll(() =>
        supabase
          .from('player_game_results')
          .select('*')
          .eq(column, p.id)
          .order('played_at')
          .order('game_number')
      )
    })
  )

  // 2. Everyone else in those games (for partners / chemistry)
  const gameIds = [...new Set(Object.values(byPlayer).flat().map((r) => r.game_id))]
  const rowsByGame = {}
  for (const ids of chunk(gameIds, 100)) {
    const { data, error } = await supabase
      .from('player_game_results')
      .select('game_id, team, user_id, pickle_pal_id')
      .in('game_id', ids)
    if (error) throw error
    for (const r of data) {
      if (!rowsByGame[r.game_id]) rowsByGame[r.game_id] = []
      rowsByGame[r.game_id].push(r)
    }
  }

  // 3. Names for everybody we saw
  const all = Object.values(rowsByGame).flat()
  const userIds = [...new Set(all.map((r) => r.user_id).filter(Boolean))]
  const palIds = [...new Set(all.map((r) => r.pickle_pal_id).filter(Boolean))]
  const names = {}
  for (const ids of chunk(userIds, 100)) {
    const { data } = await supabase.from('profiles').select('id, display_name').in('id', ids)
    for (const p of data || []) names[`user:${p.id}`] = p.display_name
  }
  for (const ids of chunk(palIds, 100)) {
    const { data } = await supabase.from('pickle_pals').select('id, name').in('id', ids)
    for (const p of data || []) names[`pal:${p.id}`] = p.name
  }
  for (const p of players) names[p.key] = p.name

  return { byPlayer, rowsByGame, names, rowKey }
}

// Hook used by the dashboard. players = [{ kind, id, key, name }]
export function useStats(players, refreshToken = 0) {
  const [state, setState] = useState({ loading: true, error: '', stats: null })
  const keys = players.map((p) => p.key).join(',')

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: '' }))
    loadStats(players)
      .then((stats) => !cancelled && setState({ loading: false, error: '', stats }))
      .catch((err) => !cancelled && setState({ loading: false, error: err.message, stats: null }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, refreshToken])

  return state
}
