import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Category } from '../types'

export function useCategories(includeArchived = false): Category[] {
  return useLiveQuery(
    async () => {
      const all = await db.categories.orderBy('order').toArray()
      return includeArchived ? all : all.filter((c) => !c.archived)
    },
    [includeArchived],
    [],
  )
}
