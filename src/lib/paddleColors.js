// Paddle colors players can choose (Edit profile & settings).
// One per color family (primary: red, yellow, blue; secondary: orange,
// green, purple, plus pink), each picked to look good on the BLUE court:
// warm, light or soft shades that stand out instead of blending in.
// Sunset covers the yellow family (bright yellow looked bad on the court).
//
// The keys are stored in the database (supabase/migrations/007_paddle_color.sql);
// only the names / shades shown here changed, so no new migration is needed.
// hidden: still drawn correctly if someone already picked it, but not offered.
export const PADDLE_COLORS = [
  { key: 'sunset', name: 'Sunset', face: '#f6a928' }, // yellow family - the default
  { key: 'orange', name: 'Tangerine', face: '#ff8a3d' }, // orange family
  { key: 'red', name: 'Coral', face: '#ff5f57' }, // red family
  { key: 'pink', name: 'Bubblegum', face: '#ff8cc6' }, // pink
  { key: 'purple', name: 'Lavender', face: '#c4a8ff' }, // purple family
  { key: 'blue', name: 'Ice', face: '#a6e3ff' }, // blue family - light so it shows on blue
  { key: 'green', name: 'Lime', face: '#a3e05a' }, // green family
  { key: 'yellow', name: 'Yellow', face: '#f6a928', hidden: true }, // old choice -> looks like Sunset
]

// The colors offered in the picker
export const PICKABLE_PADDLE_COLORS = PADDLE_COLORS.filter((c) => !c.hidden)

export const DEFAULT_PADDLE = 'sunset'

// Mix a hex color with black (amount 0..1) - for edges, holes and shadows
function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * (1 - amount))
  const g = Math.round(((n >> 8) & 255) * (1 - amount))
  const b = Math.round((n & 255) * (1 - amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// Mix with white (for the shine)
function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// All the shades needed to draw a paddle + ball in this color
export function paddleShades(key) {
  const color = PADDLE_COLORS.find((c) => c.key === key) || PADDLE_COLORS[0]
  const face = color.face
  return {
    name: color.name,
    face,
    edge: darken(face, 0.25), // edge guard
    throat: darken(face, 0.12), // where the face meets the handle
    side: darken(face, 0.45), // thickness under the face
    holes: darken(face, 0.3), // ball holes
    shine: lighten(face, 0.55),
  }
}
