export const RANKS = [
  { name: '青铜', emoji: '🥉', minExp: 0, minDates: 0, minSpend: 0, color: '#cd7f32' },
  { name: '白银', emoji: '🥈', minExp: 100, minDates: 3, minSpend: 500, color: '#c0c0c0' },
  { name: '黄金', emoji: '🥇', minExp: 500, minDates: 10, minSpend: 3000, color: '#ffd700' },
  { name: '铂金', emoji: '💿', minExp: 2000, minDates: 30, minSpend: 10000, color: '#e5e4e2' },
  { name: '钻石', emoji: '💎', minExp: 5000, minDates: 50, minSpend: 30000, color: '#b9f2ff' },
  { name: '黑金', emoji: '🖤', minExp: 10000, minDates: 100, minSpend: 100000, color: '#1a1a1a' },
]

export function getRankInfo(rankName: string) {
  return RANKS.find(r => r.name === rankName) || RANKS[0]
}

export function calculateRank(exp: number, totalDates: number, totalSpend: number): string {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const r = RANKS[i]
    if (exp >= r.minExp && totalDates >= r.minDates && totalSpend >= r.minSpend) {
      return r.name
    }
  }
  return '青铜'
}

export function calculateExp(amount: number, femaleRating: number, isNewRestaurant: boolean, isPremium: boolean): number {
  let exp = amount
  if (femaleRating) exp *= (1 + femaleRating * 0.2)
  if (isNewRestaurant) exp += 50
  if (isPremium) exp += 100
  return Math.floor(exp)
}

export function getNextRank(currentRank: string) {
  const idx = RANKS.findIndex(r => r.name === currentRank)
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}

export function getRankProgress(exp: number, currentRank: string): number {
  const current = RANKS.find(r => r.name === currentRank)
  const next = getNextRank(currentRank)
  if (!current || !next) return 100
  const progress = (exp - current.minExp) / (next.minExp - current.minExp) * 100
  return Math.min(Math.floor(progress), 100)
}
