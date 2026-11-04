import { dailyCounts, localDateKey } from '../../lib/stats'

const WEEKS = 26 // about 6 months
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
      days.push(day > today ? null : day) // future days in this week stay blank
    }
    weeks.push(days)
  }
  return weeks
}

// 0 games -> empty color, then 1, 2, 3, 4+ get darker
function heatColor(count, colors) {
  return colors.heat[Math.min(count, colors.heat.length - 1)]
}

// GitHub-style "how often did I play" grid, one per player
export default function PlayCalendar({ players, stats, colors }) {
  const weeks = buildWeeks()
  const now = new Date()

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

            {/* month labels */}
            <div className="heat-months" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
              {weeks.map((week, i) => {
                const month = week[0].getMonth()
                const showLabel = i === 0 || month !== weeks[i - 1][0].getMonth()
                return <span key={i}>{showLabel ? MONTHS[month] : ''}</span>
              })}
            </div>

            <div className="heatmap" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
              {weeks.flat().map((day, i) => {
                if (!day) return <span key={i} className="heat-cell blank" />
                const count = counts[localDateKey(day)] || 0
                return (
                  <span
                    key={i}
                    className="heat-cell"
                    style={{ background: heatColor(count, colors) }}
                    title={`${day.toLocaleDateString()}: ${count} game${count === 1 ? '' : 's'}`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="heat-legend muted small">
        Less
        {colors.heat.map((c) => <span key={c} className="heat-cell" style={{ background: c }} />)}
        More
      </div>
    </div>
  )
}
