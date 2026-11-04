import { supabase } from '../supabaseClient'
import { blobToDataUrl, dataUrlToBlob } from './image'

// Files live at avatars/<user id>/avatar  (the storage policy only lets
// a user write inside their own folder).
function avatarPath(userId) {
  return `${userId}/avatar`
}

export async function uploadAvatar(userId, blob) {
  const path = avatarPath(userId)
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: blob.type || 'image/webp' })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // ?v=... makes the browser fetch the new picture instead of a cached old one
  const url = `${data.publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)
  if (updateError) throw updateError
  return url
}

export async function removeAvatar(userId) {
  await supabase.storage.from('avatars').remove([avatarPath(userId)])
  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId)
  if (error) throw error
}

// --- Sign-up photo ---------------------------------------------------
// When email confirmation is on, the user isn't logged in right after
// signing up, so they can't upload yet. We park the (small, resized)
// image in localStorage and upload it on their first login.
const PENDING_KEY = 'pendingAvatar'

export async function savePendingAvatar(email, blob) {
  try {
    const dataUrl = await blobToDataUrl(blob)
    localStorage.setItem(PENDING_KEY, JSON.stringify({ email: email.toLowerCase(), dataUrl }))
  } catch {
    /* storage unavailable - they can add a photo on the Profile page */
  }
}

export function clearPendingAvatar() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

// Returns the parked image (as a Blob) if it belongs to this email, else null
export async function takePendingAvatar(email) {
  try {
    const saved = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null')
    if (!saved || !email || saved.email !== email.toLowerCase()) return null
    localStorage.removeItem(PENDING_KEY)
    return await dataUrlToBlob(saved.dataUrl)
  } catch {
    return null
  }
}
