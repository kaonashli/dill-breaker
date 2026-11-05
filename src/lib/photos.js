import { supabase } from '../supabaseClient'
import { resizeToMax } from './image'

// Photos for games and matches (up to 5 each).
// Files go in the PRIVATE "game-photos" bucket at <my user id>/<random name>,
// and a row in public.game_photos says which game or match they belong to.
// To show them we ask Supabase for short-lived links (signed URLs).

export const MAX_PHOTOS = 5
const BUCKET = 'game-photos'

// target = { gameId } or { matchId }
function targetColumns(target) {
  return target.matchId ? { match_id: target.matchId } : { game_id: target.gameId }
}

// Upload new photos (File objects). startPosition = how many photos it already has.
export async function uploadPhotos(userId, target, files, startPosition = 0) {
  for (let i = 0; i < files.length; i++) {
    const blob = await resizeToMax(files[i], 1600) // keep uploads small and quick
    const path = `${userId}/${crypto.randomUUID()}.webp`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || 'image/webp' })
    if (uploadError) throw uploadError

    const { error: rowError } = await supabase
      .from('game_photos')
      .insert({ ...targetColumns(target), path, position: startPosition + i })
    if (rowError) {
      await supabase.storage.from(BUCKET).remove([path]) // don't leave an orphan file
      throw rowError
    }
  }
}

// Photos for many games/matches at once, with viewable links.
// Returns { [gameId or matchId]: [{ id, path, url, uploaded_by }] } in display order.
export async function loadPhotos({ gameIds = [], matchIds = [] }) {
  if (gameIds.length === 0 && matchIds.length === 0) return {}
  const filters = []
  if (gameIds.length) filters.push(`game_id.in.(${gameIds.join(',')})`)
  if (matchIds.length) filters.push(`match_id.in.(${matchIds.join(',')})`)

  const { data, error } = await supabase
    .from('game_photos')
    .select('id, game_id, match_id, path, position, uploaded_by')
    .or(filters.join(','))
    .order('position')
  if (error || !data || data.length === 0) return {}

  // One request for all the links (valid for 1 hour)
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(data.map((p) => p.path), 3600)
  const urlByPath = Object.fromEntries((signed || []).map((s) => [s.path, s.signedUrl]))

  const byTarget = {}
  for (const p of data) {
    const key = p.match_id || p.game_id
    if (!byTarget[key]) byTarget[key] = []
    byTarget[key].push({ ...p, url: urlByPath[p.path] })
  }
  return byTarget
}

export async function deletePhoto(photo) {
  await supabase.storage.from(BUCKET).remove([photo.path])
  const { error } = await supabase.from('game_photos').delete().eq('id', photo.id)
  if (error) throw error
}
