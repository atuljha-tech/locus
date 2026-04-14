/**
 * Group Debt Optimizer — Minimum Transaction Algorithm
 * Reduces N*(N-1) payments to at most N-1 optimal transfers.
 */

export interface Balance {
  userId: string
  name: string
  net: number // positive = owed money, negative = owes money
}

export interface OptimalTransfer {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export function computeBalances(
  expenses: { paidById: string; amount: number; splits: { userId: string; share: number }[] }[]
): Map<string, number> {
  const balances = new Map<string, number>()

  for (const expense of expenses) {
    // Payer gets credited
    balances.set(expense.paidById, (balances.get(expense.paidById) ?? 0) + expense.amount)
    // Each participant gets debited their share
    for (const split of expense.splits) {
      balances.set(split.userId, (balances.get(split.userId) ?? 0) - split.share)
    }
  }

  return balances
}

export function minimizeTransactions(balances: Balance[]): OptimalTransfer[] {
  const transfers: OptimalTransfer[] = []

  // Separate creditors (positive) and debtors (negative)
  const creditors = balances.filter(b => b.net > 0.01).map(b => ({ ...b }))
  const debtors   = balances.filter(b => b.net < -0.01).map(b => ({ ...b }))

  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor   = debtors[j]

    const amount = Math.min(creditor.net, Math.abs(debtor.net))
    amount > 0.01 && transfers.push({
      from:     debtor.userId,
      fromName: debtor.name,
      to:       creditor.userId,
      toName:   creditor.name,
      amount:   Math.round(amount * 100) / 100,
    })

    creditor.net -= amount
    debtor.net   += amount

    if (Math.abs(creditor.net) < 0.01) i++
    if (Math.abs(debtor.net)   < 0.01) j++
  }

  return transfers
}

export function splitEqually(amount: number, memberIds: string[]): Record<string, number> {
  const share = Math.round((amount / memberIds.length) * 100) / 100
  const result: Record<string, number> = {}
  let remaining = amount

  memberIds.forEach((id, idx) => {
    if (idx === memberIds.length - 1) {
      result[id] = Math.round(remaining * 100) / 100
    } else {
      result[id] = share
      remaining -= share
    }
  })

  return result
}

export function splitByPercentage(
  amount: number,
  splits: { userId: string; pct: number }[]
): Record<string, number> {
  const result: Record<string, number> = {}
  splits.forEach(s => {
    result[s.userId] = Math.round((amount * s.pct) / 100 * 100) / 100
  })
  return result
}
