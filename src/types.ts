export type SplitType = '50-50' | 'custom' | 'full'

export interface Person {
  id: string
  name: string
  colorTag: string
  /** 0 or 1 — stable seat order since IndexedDB key order isn't insertion order. */
  order: number
}

export interface Category {
  id: string
  name: string
  isDefault: boolean
  order: number
  archived: boolean
}

export interface Expense {
  id: string
  /** Amount in integer cents to avoid floating-point rounding errors. */
  amountCents: number
  description: string
  categoryId: string
  /** ISO date string, YYYY-MM-DD. */
  date: string
  paidByPersonId: string
  splitType: SplitType
  /** personId -> share of amountCents owed by that person. Always sums to amountCents. */
  splitDetails: Record<string, number>
  createdAt: number
  updatedAt: number
}

export interface Settlement {
  id: string
  amountCents: number
  fromPersonId: string
  toPersonId: string
  date: string
  note: string
  createdAt: number
}

export interface SettingsRow {
  key: string
  value: unknown
}
