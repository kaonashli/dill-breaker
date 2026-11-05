import { useEffect, useMemo } from 'react'
import { MAX_PHOTOS } from '../lib/photos'
import { Req } from './GameFields'
import Icon from './Icon'

// Extra fields for a game or match, split in two parts so forms can place them:
//   <StoryFields>        title (required) + description - at the TOP of the form
//   <NotesPhotosFields>  private notes + photos         - at the BOTTOM
//
// Both share the same value object: { title, description, notes, files }
// (files = new photos picked, File objects) and onChange(field, newValue).

export function StoryFields({ value, onChange, onRerollTitle }) {
  return (
    <div className="field-group">
      <label className="field">
        <span className="field-label">Title <Req /></span>
        <div className="inline-form title-row">
          <input
            value={value.title}
            maxLength={80}
            required
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Give it a name"
          />
          {onRerollTitle && (
            <button type="button" className="btn btn-sm" onClick={onRerollTitle} title="Pick another title" aria-label="Pick another title">
              🎲
            </button>
          )}
        </div>
      </label>

      <label className="field">
        <span className="field-label">Description <span className="muted">(shown in the activity feed)</span></span>
        <textarea
          rows={2}
          maxLength={1000}
          value={value.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="How did it go?"
        />
      </label>
    </div>
  )
}

// existingPhotos: how many photos are already saved (when editing), so we know how many more fit
// showNotes: false where notes are managed separately (the details page)
export function NotesPhotosFields({ value, onChange, existingPhotos = 0, showNotes = true }) {
  const spaceLeft = MAX_PHOTOS - existingPhotos - value.files.length

  // Little preview images for picked files (and clean them up afterwards)
  const previews = useMemo(() => value.files.map((f) => URL.createObjectURL(f)), [value.files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  function addFiles(e) {
    const picked = [...(e.target.files || [])].filter((f) => f.type.startsWith('image/'))
    onChange('files', [...value.files, ...picked.slice(0, Math.max(0, spaceLeft))])
    e.target.value = '' // so picking the same file again still triggers onChange
  }

  return (
    <div className="field-group">
      {showNotes && (
        <label className="field">
          <span className="field-label"><Icon name="lock" size={15} /> Private notes <span className="muted">(only you can see these)</span></span>
          <textarea
            rows={3}
            maxLength={2000}
            value={value.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Things to work on, reminders..."
          />
        </label>
      )}

      <div className="field">
        <span className="field-label">
          Photos <span className="muted">(up to {MAX_PHOTOS})</span>
        </span>
        <div className="photo-picker">
          {previews.map((url, i) => (
            <div className="photo-thumb" key={url}>
              <img src={url} alt={`New photo ${i + 1}`} />
              <button
                type="button"
                className="photo-remove"
                aria-label="Remove photo"
                onClick={() => onChange('files', value.files.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          {spaceLeft > 0 && (
            <label className="photo-add">
              <Icon name="camera" size={24} />
              <span className="small">Add</span>
              <input type="file" accept="image/*" multiple onChange={addFiles} hidden />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}

export function emptyExtras(title = '') {
  return { title, description: '', notes: '', files: [] }
}
