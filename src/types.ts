export type SplitType = 'equal' | 'custom' | 'full'

export interface Group {
  id: string
  name: string
  inviteCode: string
  createdBy: string
  createdAt: string
}

export interface Member {
  userId: string
  displayName: string
  colorTag: string
  joinedAt: string
}

export interface Category {
  id: string
  name: string
  isDefault: boolean
  orderIndex: number
  archived: boolean
}

export interface Expense {
  id: string
  /** Amount in integer cents to avoid floating-point rounding errors. */
  amountCents: number
  description: string
  categoryId: string | null
  /** ISO date string, YYYY-MM-DD. */
  date: string
  paidByUserId: string
  splitType: SplitType
  /** userId -> share of amountCents owed by that member. Always sums to amountCents. */
  splitDetails: Record<string, number>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  id: string
  amountCents: number
  fromUserId: string
  toUserId: string
  date: string
  note: string
  createdBy: string
  createdAt: string
}
