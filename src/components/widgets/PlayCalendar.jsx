import { dailyCounts, localDateKey } from '../../lib/stats'

const WEEKS = 26 // about 6 months
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Ball size (fraction of a net hole) for 0, 1, 2, 3, 4+ games that day
// (not used right now - kept for the "balls in the net" version)
const BALL_SIZES = [0, 0.5, 0.66, 0.82, 1]

// Square color for 0, 1, 2, 3, 4+ games that day (light -> dark, from lib/colors.js)
function squareColor(count, colors) {
  return colors.heat[Math.min(count, colors.heat.length - 1)]
}

// Build WEEKS columns of 7 days (Sun..Sat), ending with the current week
function buildWeeks() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7) // a Sunday
  const weeks = []
  for (let w = 0; w < WEEKS; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(start)
      day.setDate(start.getDate() + w * 7 + d)
      days.push(day > today ? null : day) // future days in this week stay empty
    }
    weeks.push(days)
  }
  return weeks
}

// A pickleball stuck in the net. size = 0..1 of the hole. (Unused for now.)
// eslint-disable-next-line no-unused-vars
function Ball({ size }) {
  if (!size) return null
  return <span className="ball" style={{ width: `${size * 100}%`, height: `${size * 100}%` }} />
}

// Small pickleball drawing (circle + its holes) for the legend, in a given color
const HOLES = [
  [12, 5.5], [6.5, 9], [17.5, 9], [12, 12], [6.5, 15], [17.5, 15], [12, 18.5],
]
// size: pixels (legend), or leave it out to fill the calendar cell
function Pickleball({ color, size }) {
  const sizeProps = size ? { width: size, height: size } : { className: 'day-ball' }
  return (
    <svg {...sizeProps} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      {HOLES.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="rgba(0,0,0,0.28)" />
      ))}
    </svg>
  )
}

// The court on the ground in front of the net, drawn in perspective:
// narrow where it meets the net, wider toward you, fading out (see .net-court CSS).
// viewBox is 100 wide x 50 deep; "non-scaling-stroke" keeps the lines thin when stretched.
const KITCHEN_Y = 11 // the non-volley zone ("kitchen") line, close to the net
function Court() {
  const lineProps = { className: 'court-line', vectorEffect: 'non-scaling-stroke' }
  // x of the left sideline at a given depth (it slants from x=6 at the net to x=0)
  const leftAt = (y) => 6 - (6 * y) / 50
  return (
    <svg className="net-court" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
      <polygon className="court-surface" points="6,0 94,0 100,50 0,50" />
      <line {...lineProps} x1="6" y1="0" x2="0" y2="50" /> {/* left sideline */}
      <line {...lineProps} x1="94" y1="0" x2="100" y2="50" /> {/* right sideline */}
      <line {...lineProps} x1={leftAt(KITCHEN_Y)} y1={KITCHEN_Y} x2={100 - leftAt(KITCHEN_Y)} y2={KITCHEN_Y} /> {/* kitchen line */}
      <line {...lineProps} x1="50" y1={KITCHEN_Y} x2="50" y2="50" /> {/* center line */}
    </svg>
  )
}

// "How often did I play": a grid of days (columns = weeks) framed like a
// pickleball net - posts on each side and the white tape on top.
// Darker square = more games that day.
export default function PlayCalendar({ players, stats, colors }) {
  const weeks = buildWeeks()
  const now = new Date()
  const columns = { gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }

  return (
    <div className="stack">
      {players.map((p) => {
        const rows = stats.byPlayer[p.key] || []
        const counts = dailyCounts(rows)
        const thisMonth = rows.filter((r) => {
          const d = new Date(r.played_at)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
        const firstDay = weeks[0][0]
        const inRange = rows.filter((r) => new Date(r.played_at) >= firstDay).length

        return (
          <div key={p.key}>
            <div className="widget-subhead">
              {players.length > 1 && <span className="dot" style={{ background: colors.series[p.slot] }} />}
              <strong>{p.name}</strong>
              <span className="muted small">
                {thisMonth} this month · {inRange} in 6 months
              </span>
            </div>

            {/* month labels, lined up with the week columns */}
            <div className="net-months" style={columns}>
              {weeks.map((week, i) => {
                const month = week[0].getMonth()
                const showLabel = i === 0 || month !== weeks[i - 1][0].getMonth()
                return <span key={i}>{showLabel ? MONTHS[month] : ''}</span>
              })}
            </div>

            <div className="net">
              <span className="net-post" aria-hidden="true" />
              <div className="net-body">
                <div className="net-tape" aria-hidden="true" />
                <div className="net-mesh squares" style={columns}>
                  {weeks.flat().map((day, i) => {
                    if (!day) return <span key={i} className="day-square blank" />
                    const count = counts[localDateKey(day)] || 0
                    const title = `${day.toLocaleDateString()}: ${count} game${count === 1 ? '' : 's'}`
                    // no games: plain square (just net). Played: a pickleball, darker = more games
                    return count === 0 ? (
                      <span key={i} className="day-square" style={{ background: squareColor(0, colors) }} title={title} />
                    ) : (
                      <span key={i} className="day-square" title={title}>
                        <Pickleball color={squareColor(count, colors)} />
                      </span>
                    )
                  })}
                </div>
              </div>
              <span className="net-post" aria-hidden="true" />
            </div>

            <Court />
          </div>
        )
      })}

      <div className="net-legend muted small">
        Less
        {/* first = no games (plain square), then balls for 1, 2, 3, 4+ games */}
        <span className="day-square legend-square" style={{ background: colors.heat[0] }} />
        {colors.heat.slice(1).map((c) => (
          <Pickleball key={c} color={c} size={16} />
        ))}
        More
      </div>
    </div>
  )
}
