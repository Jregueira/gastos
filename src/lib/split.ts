import type { SplitType } from '../types'

export interface SplitInput {
  amountCents: number
  splitType: SplitType
  personAId: string
  personBId: string
  /** Used only when splitType === 'custom': personA's share in cents. */
  customShareForA?: number
  /** Used only when splitType === 'full': the person who owes the entire amount. */
  fullOwerPersonId?: string
}

/** Computes per-person shares (in cents) owed for an expense. Always sums to amountCents. */
export function computeSplitDetails(input: SplitInput): Record<string, number> {
  const { amountCents, splitType, personAId, personBId } = input

  if (splitType === 'full') {
    const ower = input.fullOwerPersonId ?? personAId
    const other = ower === personAId ? personBId : personAId
    return { [ower]: amountCents, [other]: 0 }
  }

  if (splitType === 'custom' && input.customShareForA !== undefined) {
    const aShare = Math.max(0, Math.min(amountCents, input.customShareForA))
    return { [personAId]: aShare, [personBId]: amountCents - aShare }
  }

  // 50/50, splitting the odd cent onto person A so totals always reconcile exactly.
  const half = Math.floor(amountCents / 2)
  return { [personAId]: amountCents - half, [personBId]: half }
}
