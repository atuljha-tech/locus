/**
 * Late Fee Engine
 * Calculates compounding late fees based on overdue duration.
 */

export interface FeeConfig {
  dailyRate:    number  // e.g. 0.05 = 5% per day
  gracePeriod:  number  // hours before fees kick in
  maxMultiplier: number // cap at e.g. 3x original
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  dailyRate:    0.05,
  gracePeriod:  24,
  maxMultiplier: 3,
}

export function calculateLateFee(
  originalAmount: number,
  dueDate: Date,
  config: FeeConfig = DEFAULT_FEE_CONFIG
): { fee: number; daysOverdue: number; totalOwed: number } {
  const now = new Date()
  const msOverdue = now.getTime() - dueDate.getTime()
  const hoursOverdue = msOverdue / (1000 * 60 * 60)

  if (hoursOverdue <= config.gracePeriod) {
    return { fee: 0, daysOverdue: 0, totalOwed: originalAmount }
  }

  const daysOverdue = Math.floor((hoursOverdue - config.gracePeriod) / 24)
  const rawFee = originalAmount * config.dailyRate * daysOverdue
  const maxFee = originalAmount * (config.maxMultiplier - 1)
  const fee = Math.min(rawFee, maxFee)

  return {
    fee:        Math.round(fee * 100) / 100,
    daysOverdue,
    totalOwed:  Math.round((originalAmount + fee) * 100) / 100,
  }
}

export function getShameLevel(daysOverdue: number): {
  level: number
  label: string
  color: string
  emoji: string
} {
  if (daysOverdue === 0) return { level: 0, label: 'Fresh',          color: '#22c55e',  emoji: '🟢' }
  if (daysOverdue < 1)  return { level: 1, label: 'Mild',           color: '#eab308',  emoji: '🟡' }
  if (daysOverdue < 3)  return { level: 2, label: 'Snarky',         color: '#f97316',  emoji: '🟠' }
  if (daysOverdue < 7)  return { level: 3, label: 'Passive-Agg',    color: '#ef4444',  emoji: '🔴' }
  return                       { level: 4, label: 'Scorched Earth',  color: '#a855f7',  emoji: '☢️' }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
