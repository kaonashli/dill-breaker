import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tooltipProps } from '../../lib/colors'

const truncate = (s, n = 18) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

// Horizontal bars: wins + losses stacked, one bar per row.
// data: [{ name, Wins, Losses }]
export default function StackedWinLossChart({ data, colors }) {
  const height = 60 + data.length * 40

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={colors.grid} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: colors.muted, fontSize: 12 }} stroke={colors.axis} />
          <YAxis
            type="category" dataKey="name" width={120}
            tick={{ fill: colors.text2, fontSize: 12 }} stroke={colors.axis}
            tickFormatter={(v) => truncate(v)}
          />
          <Tooltip {...tooltipProps(colors)} />
          <Legend formatter={(value) => <span style={{ color: colors.text2 }}>{value}</span>} />
          <Bar dataKey="Wins" stackId="a" fill={colors.series[0]} stroke={colors.surface} strokeWidth={2} barSize={20} />
          <Bar dataKey="Losses" stackId="a" fill={colors.series[1]} stroke={colors.surface} strokeWidth={2} barSize={20} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* the same numbers as a table */}
      <table className="mini-table">
        <thead>
          <tr><th></th><th>W</th><th>L</th><th>Win %</th></tr>
        </thead>
        <tbody>
          {data.map((d) => {
            const total = d.Wins + d.Losses
            return (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.Wins}</td>
                <td>{d.Losses}</td>
                <td>{total ? Math.round((d.Wins / total) * 100) + '%' : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
