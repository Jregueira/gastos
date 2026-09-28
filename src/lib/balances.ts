import type { Expense, Settlement } from '../types'

/**
 * Net position of each member, in cents. Positive = they're owed money,
 * negative = they owe money, 0 = settled.
 *
 * Pure function over plain arrays so it stays unit-testable and reusable
 * regardless of where the arrays come from.
 */
export function calculateNetBalances(
  memberIds: string[],
  expenses: Expense[],
  settlements: Settlement[],
): Record<string, number> {
  const net: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]))

  for (const e of expenses) {
    if (e.paidByUserId in net) net[e.paidByUserId] += e.amountCents
    for (const [userId, share] of Object.entries(e.splitDetails)) {
      if (userId in net) net[userId] -= share
    }
  }

  for (const s of settlements) {
    if (s.fromUserId in net) net[s.fromUserId] += s.amountCents
    if (s.toUserId in net) net[s.toUserId] -= s.amountCents
  }

  return net
}

export interface SuggestedSettlement {
  fromUserId: string
  toUserId: string
  amountCents: number
}

/** Greedy minimal-transaction debt simplification: match largest debtor with largest creditor. */
export function simplifyDebts(netBalances: Record<string, number>): SuggestedSettlement[] {
  const debtors = Object.entries(netBalances)
    .filter(([, v]) => v < 0)
    .map(([userId, v]) => ({ userId, amount: -v }))
    .sort((a, b) => b.amount - a.amount)
  const creditors = Object.entries(netBalances)
    .filter(([, v]) => v > 0)
    .map(([userId, v]) => ({ userId, amount: v }))
    .sort((a, b) => b.amount - a.amount)

  const result: SuggestedSettlement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]
    const c = creditors[j]
    const amount = Math.min(d.amount, c.amount)
    if (amount > 0) {
      result.push({ fromUserId: d.userId, toUserId: c.userId, amountCents: amount })
    }
    d.amount -= amount
    c.amount -= amount
    if (d.amount === 0) i++
    if (c.amount === 0) j++
  }
  return result
}
