import { paddleShades } from '../lib/paddleColors'

// Paddle drawings in a player's chosen color (see lib/paddleColors.js).
// The paddle is drawn flat (seen from above): face on the left (0..62 wide),
// black handle on the right (56..99).

// The paddle outline. solid = draw everything in one color (shadow / thickness layers)
function PaddleShape({ shades, solid }) {
  if (solid) {
    return (
      <>
        <rect x="56" y="15" width="42" height="14" rx="4" fill={solid} />
        <rect x="0" y="0" width="62" height="44" rx="17" fill={solid} />
      </>
    )
  }
  return (
    <>
      {/* handle + grip wrap + end cap */}
      <rect x="56" y="15" width="40" height="14" rx="4" fill="#161616" />
      {[66, 73, 80, 87].map((x) => (
        <path key={x} d={`M${x} 15 l-3 14`} stroke="#3c3c3c" strokeWidth="1.8" />
      ))}
      <rect x="93" y="14" width="6" height="16" rx="2.5" fill="#262626" />
      {/* face */}
      <rect x="0" y="0" width="62" height="44" rx="17" fill={shades.face} />
      {/* edge guard all the way around */}
      <rect x="1.2" y="1.2" width="59.6" height="41.6" rx="16" fill="none" stroke={shades.edge} strokeWidth="2.6" />
      {/* throat where the face meets the handle */}
      <path d="M56 13 Q64 22 56 31" fill={shades.throat} />
      {/* shine across the face */}
      <path d="M12 9 Q26 4 40 8" stroke={shades.shine} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
    </>
  )
}

// Where a paddle lies: center point, which way it's turned, and how squashed it looks.
// (read right-to-left: center the drawing, turn it, squash it, move it into place)
function paddleTransform(cx, cy, angle, squash = 0.72, size = 1) {
  return `translate(${cx} ${cy}) scale(${size} ${squash * size}) rotate(${angle}) translate(-48 -22)`
}

// One lying paddle = shadow + thickness + the paddle itself
function PaddleLayers({ transform, shades }) {
  return (
    <>
      <g transform={`translate(5 6) ${transform}`}>
        <PaddleShape solid="rgba(0,0,0,0.25)" />
      </g>
      <g transform={`translate(0 3) ${transform}`}>
        <PaddleShape solid={shades.side} />
      </g>
      <g transform={transform}>
        <PaddleShape shades={shades} />
      </g>
    </>
  )
}

// A pickleball (with holes) in the paddle color, centered at cx, cy
function Ball({ cx, cy, r = 7.5, shades }) {
  const holes = [[0, -4], [-3.5, -1], [3.5, -1], [-2, 3.5], [2, 3.5]]
  return (
    <>
      <circle cx={cx + 2} cy={cy + 2} r={r} fill="rgba(0,0,0,0.25)" />
      <circle cx={cx} cy={cy} r={r} fill={shades.face} stroke={shades.edge} strokeWidth="1" />
      {holes.map(([dx, dy]) => (
        <circle key={`${dx}-${dy}`} cx={cx + dx} cy={cy + dy} r="1.1" fill={shades.holes} />
      ))}
    </>
  )
}

// Two paddles and a ball lying on the play calendar court
export function LyingPaddles({ colorKey, className }) {
  const shades = paddleShades(colorKey)
  return (
    <svg className={className} viewBox="0 0 140 80" aria-hidden="true">
      {/* second paddle, dropped a little to the right at a different angle,
          slightly smaller and tucked under the first one */}
      <PaddleLayers transform={paddleTransform(101, 42, 106, 0.68, 0.96)} shades={shades} />
      {/* first paddle, face pointing up toward the net */}
      <PaddleLayers transform={paddleTransform(52, 40, 125)} shades={shades} />
      {/* a ball resting between them */}
      <Ball cx={68} cy={71} shades={shades} />
    </svg>
  )
}

// Shape of the upright paddle, in a 60 x 94 box:
//   face   - a wide, slightly squared-off rounded rectangle (y 2..64)
//   throat - curves in from the bottom of the face down to the handle (the flare)
//   handle - short and straight (y 70..90)
const FACE = { x: 4, y: 2, w: 52, h: 62, r: 14 }
const THROAT = 'M18 60 C24 62 26 65 26 73 H34 C34 65 36 62 42 60 Z' // concave sides = the flare
const HANDLE = { x: 26, y: 70, w: 8, h: 20 }
const BOX_HEIGHT = 94

function UprightOutline({ fill }) {
  return (
    <>
      <rect x={HANDLE.x} y={HANDLE.y} width={HANDLE.w} height={HANDLE.h + 2} rx="2.5" fill={fill} />
      <path d={THROAT} fill={fill} />
      <rect x={FACE.x} y={FACE.y} width={FACE.w} height={FACE.h} rx={FACE.r} fill={fill} />
    </>
  )
}

// A paddle lying flat on the floor, seen straight from above: face on top,
// handle pointing down, perfectly straight. A darker copy just to the lower
// right gives it a little thickness / shadow. height in pixels.
export function StraightPaddle({ colorKey, height = 64, title }) {
  const shades = paddleShades(colorKey)
  return (
    <svg
      width={(height * 60) / BOX_HEIGHT}
      height={height}
      viewBox={`0 0 60 ${BOX_HEIGHT}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      className="straight-paddle"
    >
      {title && <title>{title}</title>}
      {/* thickness, peeking out on the right / bottom */}
      <g transform="translate(2.5 1.5)"><UprightOutline fill={shades.side} /></g>

      {/* handle: black with grip-tape wraps and an end cap */}
      <rect x={HANDLE.x} y={HANDLE.y} width={HANDLE.w} height={HANDLE.h} rx="2.5" fill="#161616" />
      {[75, 80, 85].map((y) => (
        <line key={y} x1={HANDLE.x} y1={y} x2={HANDLE.x + HANDLE.w} y2={y - 1.6} stroke="#3a3a3a" strokeWidth="1.2" />
      ))}
      <rect x={HANDLE.x - 1} y={HANDLE.y + HANDLE.h - 3} width={HANDLE.w + 2} height="5" rx="2" fill="#2a2a2a" />

      {/* the flared neck, in the edge-guard color like a real paddle */}
      <path d={THROAT} fill={shades.edge} />

      {/* face + edge guard */}
      <rect x={FACE.x} y={FACE.y} width={FACE.w} height={FACE.h} rx={FACE.r} fill={shades.face} />
      <rect
        x={FACE.x + 1.2} y={FACE.y + 1.2} width={FACE.w - 2.4} height={FACE.h - 2.4} rx={FACE.r - 1}
        fill="none" stroke={shades.edge} strokeWidth="2.4"
      />
      {/* shine near the top-left */}
      <path d="M12 18 Q13 10 22 8.5" stroke={shades.shine} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}
