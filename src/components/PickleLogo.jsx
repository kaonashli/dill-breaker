import { useId } from 'react'

// The Dill Breaker pickle: a curved, bumpy green pickle drawn in SVG
// (same on every device, unlike an emoji). size = height in pixels.
//
// It plays a little "breaking a pickle" animation on a loop, resting a few
// seconds between breaks: a crack appears in the middle, the two halves snap
// apart, pickle juice sprays out, and it springs back whole. (See .pickle-* in index.css.)
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

// The jagged break line across the middle of the pickle (roughly along y = x)
const CRACK = '0,0.5 13,11.5 15,16 18,16.5 20,21.5 32,31.5'
// The bottom-left half is everything below the crack, the top-right half everything above
const BOTTOM_HALF = `${CRACK} 32,32 0,32`
const TOP_HALF = `${CRACK} 32,0 0,0`

function PickleArt() {
  return (
    <>
      <path d={BODY} fill="#6aa531" stroke="#3d6618" strokeWidth="1.2" strokeLinejoin="round" />
      {/* darker belly for some depth */}
      <path d="M27.6 10.5 Q25.6 26 9.5 28.4" stroke="#558a25" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {BUMPS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#8cc63f" />
      ))}
      {/* shine along the hollow side */}
      <path d="M9 21 Q17.8 18.8 20.4 9.6" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  )
}

// animate: false for small decorative uses (pickle pal badge, pop-ups) so they don't keep snapping
export default function PickleLogo({ size = 26, animate = true }) {
  const id = useId()


  const bottomClip = `${id}-bottom`
  const topClip = `${id}-top`

  return (
    <svg
      width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"
      className={`pickle-logo ${animate ? 'pickle-break' : ''}`}
      overflow="visible"
    >
      <defs>
        <clipPath id={bottomClip}><polygon points={BOTTOM_HALF} /></clipPath>
        <clipPath id={topClip}><polygon points={TOP_HALF} /></clipPath>
      </defs>

      {/* the same pickle drawn twice, each showing one half, so the halves can move apart */}
      <g className="pickle-half pickle-half-bottom" clipPath={`url(#${bottomClip})`}>
        <PickleArt />
      </g>
      <g className="pickle-half pickle-half-top" clipPath={`url(#${topClip})`}>
        <PickleArt />
      </g>

      {animate && (
        <>
          {/* the crack line, visible only while it breaks */}
          <polyline className="pickle-crack" points="13,11.5 15,16 18,16.5 20,21.5" />
          {/* drops of pickle juice */}
          <circle className="pickle-drop pickle-drop-1" cx="17" cy="16.5" r="1.1" />
          <circle className="pickle-drop pickle-drop-2" cx="17" cy="16.5" r="0.8" />
          <circle className="pickle-drop pickle-drop-3" cx="17" cy="16.5" r="0.9" />
          <circle className="pickle-drop pickle-drop-4" cx="16" cy="15.5" r="1.3" />
          <circle className="pickle-drop pickle-drop-5" cx="18" cy="17.5" r="0.8" />
          <circle className="pickle-drop pickle-drop-6" cx="17.5" cy="16" r="0.7" />
        </>
      )}
    </svg>
  )
}
