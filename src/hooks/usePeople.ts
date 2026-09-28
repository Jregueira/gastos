import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Person } from '../types'

/** The two household members, in stable seat order. Empty array while loading. */
export function usePeople(): Person[] {
  return useLiveQuery(() => db.people.orderBy('order').toArray(), [], [])
}
