import type { SplitType } from '../types'

export interface SplitInput {
  amountCents: number
  splitType: SplitType
  /** Members splitting the expense. Used for 'equal'; ignored for 'full'. */
  participantIds: string[]
  /** Used only when splitType === 'custom': exact per-member shares, must sum to amountCents. */
  customShares?: Record<string, number>
  /** Used only when splitType === 'full': the single member who owes the entire amount. */
  fullOwerUserId?: string
}

/** Computes per-member shares (in cents) owed for an expense. Always sums to amountCents. */
export function computeSplitDetails(input: SplitInput): Record<string, number> {
  const { amountCents, splitType, participantIds } = input

  if (splitType === 'full') {
    const ower = input.fullOwerUserId
    if (!ower) throw new Error('fullOwerUserId is required for a full split.')
    return { [ower]: amountCents }
  }

  if (splitType === 'custom') {
    if (!input.customShares) throw new Error('customShares is required for a custom split.')
    const sum = Object.values(input.customShares).reduce((a, b) => a + b, 0)
    if (sum !== amountCents) throw new Error('Custom shares must sum to the expense amount.')
    return { ...input.customShares }
  }

  // 'equal': base cents each, remainder cents distributed one-per-participant in a
  // deterministic (sorted-id) order so results are stable regardless of iteration order.
  const sorted = [...participantIds].sort()
  const n = sorted.length
  if (n === 0) throw new Error('At least one participant is required.')
  const base = Math.floor(amountCents / n)
  const remainder = amountCents - base * n
  return Object.fromEntries(sorted.map((id, i) => [id, base + (i < remainder ? 1 : 0)]))
}
