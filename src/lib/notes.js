import { supabase } from '../supabaseClient'

// Private notes: only the person who wrote them can ever read them
// (the database enforces this). One note per person per game or match.
// target = { gameId } or { matchId }

function column(target) {
  return target.matchId ? ['match_id', target.matchId] : ['game_id', target.gameId]
}

export async function loadNote(target) {
  const [col, id] = column(target)
  const { data } = await supabase.from('private_notes').select('id, note').eq(col, id).maybeSingle()
  return data // null if there's no note
}

// Save (or clear) my note. Empty text deletes it.
export async function saveNote(target, text) {
  const [col, id] = column(target)
  const note = text.trim()
  const existing = await loadNote(target)

  if (!note) {
    if (existing) await supabase.from('private_notes').delete().eq('id', existing.id)
    return
  }
  const { error } = existing
    ? await supabase.from('private_notes').update({ note, updated_at: new Date().toISOString() }).eq('id', existing.id)
    : await supabase.from('private_notes').insert({ [col]: id, note })
  if (error) throw error
}
