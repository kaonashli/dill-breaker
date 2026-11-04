import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { companions } from '../../lib/stats'
import { tooltipProps } from '../../lib/colors'

const TOP = 8

// Who you play with / against the most
export default function PlayPartners({ players, stats, colors }) {
  return (
    <div className="stack">
      {players.map((p) => {
        const data = companions(p.key, stats.byPlayer[p.key] || [], stats.rowsByGame)
          .map((c) => ({ name: stats.names[c.key] || 'Unknown', With: c.with, Against: c.against }))
          .sort((a, b) => b.With + b.Against - (a.With + a.Against))
          .slice(0, TOP)

        return (
          <div key={p.key}>
            {players.length > 1 && (
              <div className="widget-subhead">
                <span className="dot" style={{ background: colors.series[p.slot] }} />
                <strong>{p.name}</strong>
              </div>
            )}
            {data.length === 0 ? (
              <p className="muted small">No games with other players recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height={60 + data.length * 32}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid horizontal={false} stroke={colors.grid} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: colors.text2, fontSize: 12 }} stroke={colors.axis} />
                  <Tooltip {...tooltipProps(colors)} />
                  <Legend formatter={(value) => <span style={{ color: colors.text2 }}>{value}</span>} />
                  <Bar dataKey="With" stackId="a" fill={colors.series[2]} stroke={colors.surface} strokeWidth={2} barSize={16} />
                  <Bar dataKey="Against" stackId="a" fill={colors.series[6]} stroke={colors.surface} strokeWidth={2} barSize={16} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )
      })}
    </div>
  )
}
