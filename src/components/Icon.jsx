// Small line icons drawn in SVG (used instead of emojis).
// They use the current text color, so they fit light and dark mode.
// Add a new one by adding its drawing to PATHS.
const PATHS = {
  // padlock: shackle + body + keyhole
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      <path d="M12 15v2" />
    </>
  ),
  // shield (admin)
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.3 2.9 7.8 7 9.5 4.1-1.7 7-5.2 7-9.5V6l-7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </>
  ),
  // pencil (edit)
  pencil: (
    <>
      <path d="M4 20l1-4.2L15.8 5a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20z" />
      <path d="M14 7l3 3" />
    </>
  ),
  // speaker with sound waves
  speaker: (
    <>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
    </>
  ),
  // trophy: cup with handles, stem and base
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 4.5M16 6h2.5a2.5 2.5 0 0 1-2.6 4.5" />
      <path d="M12 13v4M8.5 20h7M9.5 17h5" />
    </>
  ),
  // gear (settings): a cog with teeth around a center hole
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      <circle cx="12" cy="12" r="7" />
    </>
  ),
  // dice: rounded square with five pips (filled dots)
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      {[[8.5, 8.5], [15.5, 8.5], [12, 12], [8.5, 15.5], [15.5, 15.5]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.3" fill="currentColor" stroke="none" />
      ))}
    </>
  ),
  // camera: body with a bump on top + lens
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
}

export default function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={`icon ${className}`}
    >
      {PATHS[name]}
    </svg>
  )
}
