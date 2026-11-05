import { useEffect, useRef, useState } from 'react'
import { saveNote } from './notes'
import { uploadPhotos } from './photos'
import { partOfDay, randomTitle } from './titles'
import { emptyExtras } from '../components/ExtrasFields'

// Form state for the "Story & photos" section (title, description, notes, photos),
// with a punny default title based on when the game was played.
// playedAt: the datetime-local string from the form.
export function useExtras(playedAt) {
  const [extras, setExtras] = useState(() => emptyExtras(randomTitle(new Date(playedAt))))
  const [titleEdited, setTitleEdited] = useState(false)
  const lastPart = useRef(partOfDay(new Date(playedAt)))

  // If the date/time moves to a different part of the day (e.g. morning -> evening),
  // pick a fitting new title, unless the user typed their own.
  useEffect(() => {
    const part = partOfDay(new Date(playedAt))
    if (part !== lastPart.current && !titleEdited) {
      setExtras((x) => ({ ...x, title: randomTitle(new Date(playedAt)) }))
    }
    lastPart.current = part
  }, [playedAt, titleEdited])

  function change(field, value) {
    if (field === 'title') setTitleEdited(true)
    setExtras((x) => ({ ...x, [field]: value }))
  }

  function reroll() {
    setExtras((x) => ({ ...x, title: randomTitle(new Date(playedAt), x.title) }))
  }

  return { extras, change, reroll }
}

// The title/description columns to save with the game or match row.
// An empty title falls back to a punny one.
export function storyColumns(extras, playedAt) {
  return {
    title: extras.title.trim() || randomTitle(new Date(playedAt)),
    description: extras.description.trim() || null,
  }
}

// After the game/match is saved: store private notes and upload photos.
// Returns a list of things that failed (the game itself is already saved).
export async function saveNotesAndPhotos(userId, target, extras) {
  const failed = []
  if (extras.notes.trim()) {
    try {
      await saveNote(target, extras.notes)
    } catch {
      failed.push('notes')
    }
  }
  if (extras.files.length) {
    try {
      await uploadPhotos(userId, target, extras.files, 0)
    } catch {
      failed.push('photos')
    }
  }
  return failed
}
