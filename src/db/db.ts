import Dexie, { type EntityTable } from 'dexie'
import type { Category, Expense, Person, Settlement, SettingsRow } from '../types'

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Groceries', isDefault: true, order: 0, archived: false },
  { name: 'Utilities', isDefault: true, order: 1, archived: false },
  { name: 'Rent/Mortgage', isDefault: true, order: 2, archived: false },
  { name: 'Household Supplies', isDefault: true, order: 3, archived: false },
  { name: 'Internet/Cable', isDefault: true, order: 4, archived: false },
  { name: 'Maintenance/Repairs', isDefault: true, order: 5, archived: false },
  { name: 'Other', isDefault: true, order: 6, archived: false },
]

class GastosDB extends Dexie {
  people!: EntityTable<Person, 'id'>
  categories!: EntityTable<Category, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  settlements!: EntityTable<Settlement, 'id'>
  settings!: EntityTable<SettingsRow, 'key'>

  constructor() {
    super('gastos')
    this.version(1).stores({
      people: 'id, order',
      categories: 'id, order, archived',
      expenses: 'id, date, categoryId, paidByPersonId',
      settlements: 'id, date',
      settings: 'key',
    })
  }
}

export const db = new GastosDB()

export async function isOnboarded(): Promise<boolean> {
  const row = await db.settings.get('onboarded')
  return row?.value === true
}

export async function seedCategoriesIfEmpty(): Promise<void> {
  const count = await db.categories.count()
  if (count > 0) return
  await db.categories.bulkAdd(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, id: crypto.randomUUID() })),
  )
}

export async function completeOnboarding(nameA: string, nameB: string): Promise<void> {
  await db.people.bulkAdd([
    { id: crypto.randomUUID(), name: nameA, colorTag: '#6366f1', order: 0 },
    { id: crypto.randomUUID(), name: nameB, colorTag: '#f59e0b', order: 1 },
  ])
  await seedCategoriesIfEmpty()
  await db.settings.put({ key: 'onboarded', value: true })
}
