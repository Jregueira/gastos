import type { Category, Expense } from '../types'

export function yearMonthOf(dateIso: string): string {
  return dateIso.slice(0, 7)
}

export function expensesInMonth(expenses: Expense[], yearMonth: string): Expense[] {
  return expenses.filter((e) => yearMonthOf(e.date) === yearMonth)
}

export function totalCents(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountCents, 0)
}

export interface CategorySlice {
  categoryId: string
  categoryName: string
  amountCents: number
}

const UNCATEGORIZED = 'uncategorized'

export function spendByCategory(expenses: Expense[], categories: Category[]): CategorySlice[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<string, number>()
  for (const e of expenses) {
    const key = e.categoryId ?? UNCATEGORIZED
    totals.set(key, (totals.get(key) ?? 0) + e.amountCents)
  }
  return [...totals.entries()]
    .map(([categoryId, amountCents]) => ({
      categoryId,
      categoryName: byId.get(categoryId)?.name ?? 'Uncategorized',
      amountCents,
    }))
    .sort((a, b) => b.amountCents - a.amountCents)
}

export interface PersonSpend {
  personId: string
  personName: string
  amountCents: number
}

export function spendByPerson(
  expenses: Expense[],
  people: { id: string; name: string }[],
): PersonSpend[] {
  return people.map((p) => ({
    personId: p.id,
    personName: p.name,
    amountCents: expenses.reduce((sum, e) => sum + (e.splitDetails[p.id] ?? 0), 0),
  }))
}

export interface MonthTotal {
  yearMonth: string
  amountCents: number
}

/** Last `count` months ending at `yearMonth`, oldest first, zero-filled for months with no spend. */
export function trailingMonthTotals(
  expenses: Expense[],
  yearMonth: string,
  count = 6,
): MonthTotal[] {
  const [y, m] = yearMonth.split('-').map(Number)
  const months: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months.map((ym) => ({ yearMonth: ym, amountCents: totalCents(expensesInMonth(expenses, ym)) }))
}

export function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
