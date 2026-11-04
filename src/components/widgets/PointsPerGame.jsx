import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { average, pointsSeries } from '../../lib/stats'
import { tooltipProps } from '../../lib/colors'

// Points scored in each game (only games where a score was entered).
// x = 1st, 2nd, 3rd... game for each player, so players line up.
export default function PointsPerGame({ players, stats, colors }) {
  const series = players.map((p) => ({ player: p, points: pointsSeries(stats.byPlayer[p.key] || []) }))
  const longest = Math.max(0, ...series.map((s) => s.points.length))
  if (longest === 0) return <p className="muted">No scores entered yet.</p>

  // Recharts wants one object per x value: { n: 1, 'user:abc': 11, 'pal:xyz': 7 }
  const data = Array.from({ length: longest }, (_, i) => {
    const row = { n: i + 1 }
    for (const s of series) if (s.points[i]) row[s.player.key] = s.points[i].points
    return row
  })

  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis dataKey="n" tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} />
          <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} />
          <Tooltip
            {...tooltipProps(colors)}
            cursor={{ stroke: colors.axis }}
            labelFormatter={(n) => `Game #${n}`}
          />
          {players.length > 1 && (
            <Legend formatter={(value) => <span style={{ color: colors.text2 }}>{value}</span>} />
          )}
          {series.map(({ player }) => (
            <Line
              key={player.key}
              dataKey={player.key}
              name={player.name}
              stroke={colors.series[player.slot]}
              strokeWidth={2}
              dot={longest <= 30 ? { r: 3 } : false}
              activeDot={{ r: 5, stroke: colors.surface, strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="muted small">
        Average:{' '}
        {series
          .map((s) => `${s.player.name} ${average(s.points.map((x) => x.points)).toFixed(1)}`)
          .join(' · ')}
      </p>
    </>
  )
}
