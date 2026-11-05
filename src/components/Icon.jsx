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
