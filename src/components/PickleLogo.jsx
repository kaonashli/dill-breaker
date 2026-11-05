// The Dill Breaker pickle: a curved, bumpy green pickle drawn in SVG
// (same on every device, unlike an emoji). size = height in pixels.
//
// How the shape is built (viewBox 32x32):
//   the pickle bends from bottom-left to top-right, bowing toward the bottom-right.
//   "inner" edge = the hollow side, "outer" edge = the round belly,
//   joined by round ends (the two arcs).
const BODY =
  'M6.4 20.5' + //            inner edge, bottom end
  ' Q17.9 18.9 20.6 6.2' + // inner (hollow) curve up to the top end
  ' A4.5 4.5 0 0 1 29.4 7.8' + // round top end
  ' Q26.1 27.1 7.6 29.5' + // outer (belly) curve back down
  ' A4.5 4.5 0 0 1 6.4 20.5 Z' // round bottom end

// little bumps along the pickle, as [x, y, radius]
const BUMPS = [
  [11.6, 22.6, 1.0], [15.6, 25.2, 0.9], [17.4, 19.6, 1.1], [21.6, 21.2, 1.0],
  [21.4, 14.6, 1.0], [24.9, 15.4, 0.9], [23.8, 9.6, 0.9],
]

export default function PickleLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="pickle-logo">
      {/* body */}
      <path d={BODY} fill="#6aa531" stroke="#3d6618" strokeWidth="1.2" strokeLinejoin="round" />
      {/* darker belly for some depth */}
      <path d="M27.6 10.5 Q25.6 26 9.5 28.4" stroke="#558a25" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* bumps */}
      {BUMPS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#8cc63f" />
      ))}
      {/* shine along the hollow side */}
      <path d="M9 21 Q17.8 18.8 20.4 9.6" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
