import { winLoss } from '../../lib/stats'
import StackedWinLossChart from './StackedWinLossChart'

export default function WinLoss({ players, stats, colors }) {
  const data = players.map((p) => {
    const wl = winLoss(stats.byPlayer[p.key] || [])
    return { name: p.name, Wins: wl.wins, Losses: wl.losses }
  })
  if (data.every((d) => d.Wins + d.Losses === 0)) return <p className="muted">No games yet.</p>
  return <StackedWinLossChart data={data} colors={colors} />
}
