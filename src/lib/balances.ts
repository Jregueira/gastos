import type { Expense, Settlement } from '../types'

/**
 * Net position of `personAId` relative to `personBId`, in cents.
 * Positive: B owes A. Negative: A owes B. Zero: settled up.
 *
 * Pure function over plain arrays so it can be unit-tested and, later,
 * reused unchanged once the arrays come from Supabase instead of Dexie.
 */
export function calculateNetCents(
  expenses: Expense[],
  settlements: Settlement[],
  personAId: string,
  personBId: string,
): number {
  let net = 0

  for (const e of expenses) {
    const aShare = e.splitDetails[personAId] ?? 0
    const aPaid = e.paidByPersonId === personAId ? e.amountCents : 0
    net += aPaid - aShare
  }

  for (const s of settlements) {
    if (s.fromPersonId === personAId && s.toPersonId === personBId) net += s.amountCents
    else if (s.fromPersonId === personBId && s.toPersonId === personAId) net -= s.amountCents
  }

  return net
}

export interface BalanceSummary {
  amountCents: number
  owesPersonId: string | null
  owedPersonId: string | null
  isSettled: boolean
}

export function summarizeBalance(
  expenses: Expense[],
  settlements: Settlement[],
  personAId: string,
  personBId: string,
): BalanceSummary {
  const net = calculateNetCents(expenses, settlements, personAId, personBId)
  if (net === 0) return { amountCents: 0, owesPersonId: null, owedPersonId: null, isSettled: true }
  if (net > 0) {
    return { amountCents: net, owesPersonId: personBId, owedPersonId: personAId, isSettled: false }
  }
  return { amountCents: -net, owesPersonId: personAId, owedPersonId: personBId, isSettled: false }
}
