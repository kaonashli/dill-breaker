// Pure functions that turn rows from the player_game_results view into
// numbers for the widgets. A "row" = one player's view of one game:
// { game_id, played_at, game_type, team, won, points_for, points_against, user_id, pickle_pal_id, ... }

export function rowKey(row) {
  return row.user_id ? `user:${row.user_id}` : `pal:${row.pickle_pal_id}`
}

export function winLoss(rows) {
  const wins = rows.filter((r) => r.won).length
  const total = rows.length
  return { wins, losses: total - wins, total, winPct: total ? wins / total : 0 }
}

export function byGameType(rows) {
  return {
    singles: winLoss(rows.filter((r) => r.game_type === 'singles')),
    doubles: winLoss(rows.filter((r) => r.game_type === 'doubles')),
  }
}

// 'YYYY-MM-DD' in local time
export function localDateKey(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// { '2026-11-03': 2, ... }
export function dailyCounts(rows) {
  const counts = {}
  for (const r of rows) {
    const key = localDateKey(new Date(r.played_at))
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

// Only games where this player's points were entered, in order
export function pointsSeries(rows) {
  return rows
    .filter((r) => r.points_for !== null)
    .map((r, i) => ({ n: i + 1, points: r.points_for, against: r.points_against }))
}

export function average(numbers) {
  return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0
}

// Everyone this player shared a court with.
// rowsByGame: { [game_id]: [all participant rows of that game] }
// Returns [{ key, with, against, winsWith, winsAgainst }]
//   winsWith    = games won while on the same team
//   winsAgainst = games this player won while on the other team
export function companions(playerKey, rows, rowsByGame) {
  const map = {}
  for (const r of rows) {
    for (const other of rowsByGame[r.game_id] || []) {
      const otherKey = rowKey(other)
      if (otherKey === playerKey) continue
      if (!map[otherKey]) map[otherKey] = { key: otherKey, with: 0, against: 0, winsWith: 0, winsAgainst: 0 }
      const entry = map[otherKey]
      if (other.team === r.team) {
        entry.with += 1
        if (r.won) entry.winsWith += 1
      } else {
        entry.against += 1
        if (r.won) entry.winsAgainst += 1
      }
    }
  }
  return Object.values(map)
}

// Chemistry = (win % with this partner) - (your overall win %), in points.
// +20 means you win 20% more often with them than usual.
export function chemistry(playerKey, rows, rowsByGame) {
  const overall = winLoss(rows).winPct
  return companions(playerKey, rows, rowsByGame)
    .filter((c) => c.with > 0)
    .map((c) => {
      const winPctWith = c.winsWith / c.with
      return { ...c, winPctWith, score: Math.round((winPctWith - overall) * 100) }
    })
    .sort((a, b) => b.with - a.with)
}
