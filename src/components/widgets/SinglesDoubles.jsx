import { byGameType } from '../../lib/stats'
import StackedWinLossChart from './StackedWinLossChart'

export default function SinglesDoubles({ players, stats, colors }) {
  const data = players.flatMap((p) => {
    const t = byGameType(stats.byPlayer[p.key] || [])
    const prefix = players.length > 1 ? `${p.name} · ` : ''
    return [
      { name: `${prefix}Singles`, Wins: t.singles.wins, Losses: t.singles.losses },
      { name: `${prefix}Doubles`, Wins: t.doubles.wins, Losses: t.doubles.losses },
    ]
  })
  if (data.every((d) => d.Wins + d.Losses === 0)) return <p className="muted">No games yet.</p>
  return <StackedWinLossChart data={data} colors={colors} />
}
