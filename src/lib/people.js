import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

// A "player" anywhere in the app looks like:
//   { kind: 'user' | 'pal', id, key: 'user:<id>' | 'pal:<id>', name }
export function userPlayer(profile) {
  return {
    kind: 'user',
    id: profile.id,
    key: `user:${profile.id}`,
    name: profile.display_name,
    username: profile.username,
    avatar_url: profile.avatar_url,
  }
}

export function palPlayer(pal) {
  return { kind: 'pal', id: pal.id, key: `pal:${pal.id}`, name: pal.name }
}

const byName = (a, b) => a.name.localeCompare(b.name)

// Hook: my accepted friends + my pickle pals. Call reload() after changes.
export function usePeople() {
  const { user } = useAuth()
  const userId = user?.id
  const [friends, setFriends] = useState([])
  const [pals, setPals] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) return
    const [friendsRes, palsRes] = await Promise.all([
      supabase
        .from('friendships')
        .select(
          `id, requester_id, addressee_id,
           requester:profiles!friendships_requester_id_fkey ( id, username, display_name, avatar_url ),
           addressee:profiles!friendships_addressee_id_fkey ( id, username, display_name, avatar_url )`
        )
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabase.from('pickle_pals').select('id, name, created_at').eq('owner_id', userId).order('created_at'),
    ])

    const friendList = (friendsRes.data || []).map((f) => {
      const other = f.requester_id === userId ? f.addressee : f.requester
      return { ...userPlayer(other), friendshipId: f.id }
    })
    setFriends(friendList.sort(byName))
    setPals((palsRes.data || []).map(palPlayer))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  return { friends, pals, loading, reload }
}
