// Is this time "day" (6am - 7pm) for the sun / moon?
function isDaytime(playedAt) {
  const hour = new Date(playedAt).getHours()
  return hour >= 6 && hour < 19
}

// Tiny court seen from the side, slightly from above (like standing behind the
// baseline): the far half is narrower, the net runs across the middle, and the
// players stand on each side. 1 player per side = singles, 2 = doubles.
// location: 'outdoor' adds a sun (day) or moon (night) in the corner;
//           'indoor' just adds the word. Not set = plain icon.
export default function CourtIcon({ type, location, playedAt }) {
  const doubles = type === 'doubles'
  const outdoor = location === 'outdoor'
  const day = outdoor && isDaytime(playedAt)
  const label = [doubles ? 'Doubles' : 'Singles', location === 'outdoor' ? 'Outdoor' : location === 'indoor' ? 'Indoor' : null]
    .filter(Boolean)
    .join(' · ')

  // [x, y] where each player's feet are: far side (smaller, higher) and near side
  const far = doubles ? [[18, 10.5], [30, 10.5]] : [[24, 10.5]]
  const near = doubles ? [[14, 21], [34, 21]] : [[24, 21]]

  // A little person: head + body, scaled down on the far side for depth
  function Player([x, y], scale, key) {
    return (
      <g key={key} transform={`translate(${x} ${y}) scale(${scale})`} className="court-icon-player">
        <circle cx="0" cy="-6.2" r="1.6" />
        <path d="M0 -4.4 V-0.6" strokeWidth="1.7" strokeLinecap="round" />
      </g>
    )
  }

  return (
    <span className="court-icon" title={label}>
      <svg viewBox="0 0 48 26" width="48" height="26" aria-hidden="true" overflow="visible">
        {/* court floor: narrower far edge (top), wider near edge (bottom) */}
        <polygon points="11,6 37,6 46,24 2,24" className="court-icon-surface" />
        {/* far kitchen line, near kitchen line */}
        <line x1="8.6" y1="11" x2="39.4" y2="11" className="court-icon-line" />
        <line x1="5.2" y1="18.2" x2="42.8" y2="18.2" className="court-icon-line" />
        {/* far players stand behind the net, so draw them first */}
        {far.map((p, i) => Player(p, 0.75, `f${i}`))}
        {/* the net: posts + mesh band across the middle */}
        <line x1="6.8" y1="9.2" x2="6.8" y2="14.6" className="court-icon-post" />
        <line x1="41.2" y1="9.2" x2="41.2" y2="14.6" className="court-icon-post" />
        <rect x="6.8" y="10.2" width="34.4" height="4.4" className="court-icon-net" />
        <line x1="6.8" y1="10.2" x2="41.2" y2="10.2" className="court-icon-tape" />
        {near.map((p, i) => Player(p, 1, `n${i}`))}

        {/* outdoors: sun by day, moon by night, in the top-right corner */}
        {outdoor && day && (
          <g className="court-icon-sun" transform="translate(44 3)">
            <circle r="2.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="0" y1="-4" x2="0" y2="-5.4" transform={`rotate(${a})`} />
            ))}
          </g>
        )}
        {outdoor && !day && (
          // crescent: a circle with a smaller "bite" circle cut out of it
          <path
            className="court-icon-moon"
            transform="translate(44 3)"
            d="M1.6 -3.6 A4 4 0 1 0 1.6 3.6 A3 3 0 1 1 1.6 -3.6 Z"
          />
        )}
      </svg>
      <span className="court-icon-label">{label}</span>
    </span>
  )
}
