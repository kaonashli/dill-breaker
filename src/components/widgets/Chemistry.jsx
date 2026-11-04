import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chemistry, winLoss } from '../../lib/stats'
import { tooltipProps } from '../../lib/colors'

const TOP = 8

// Chemistry = win % with a partner minus your usual win %.
// Blue bar to the right = you play better together, red to the left = worse.
export default function Chemistry({ players, stats, colors }) {
  return (
    <div className="stack">
      <p className="muted small">
        Your win % with each partner compared with your overall win %. +20 means you win 20% more often together.
      </p>
      {players.map((p) => {
        const rows = stats.byPlayer[p.key] || []
        const overall = Math.round(winLoss(rows).winPct * 100)
        const data = chemistry(p.key, rows, stats.rowsByGame)
          .slice(0, TOP)
          .map((c) => ({
            name: stats.names[c.key] || 'Unknown',
            score: c.score,
            together: c.with,
            winPct: Math.round(c.winPctWith * 100),
          }))
        const extent = Math.max(10, ...data.map((d) => Math.abs(d.score)))

        return (
          <div key={p.key}>
            <div className="widget-subhead">
              {players.length > 1 && <span className="dot" style={{ background: colors.series[p.slot] }} />}
              <strong>{p.name}</strong>
              <span className="muted small">overall {overall}% wins</span>
            </div>
            {data.length === 0 ? (
              <p className="muted small">No doubles partners recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={40 + data.length * 32}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke={colors.grid} />
                  <XAxis
                    type="number" domain={[-extent, extent]} allowDecimals={false}
                    tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis}
                  />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: colors.text2, fontSize: 12 }} stroke={colors.axis} />
                  <ReferenceLine x={0} stroke={colors.axis} />
                  <Tooltip
                    {...tooltipProps(colors)}
                    formatter={(value, _name, item) => [
                      `${value > 0 ? '+' : ''}${value} (${item.payload.together} games, ${item.payload.winPct}% wins)`,
                      'Chemistry',
                    ]}
                  />
                  <Bar dataKey="score" barSize={16} radius={4}>
                    {data.map((d) => (
                      <Cell key={d.name} fill={d.score >= 0 ? colors.positive : colors.negative} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )
      })}
    </div>
  )
}
