import { useEffect, useState } from 'react'
import type { Category } from '../types'
import { categoryFromRow, type CategoryRow } from './mappers'
import { supabase } from './supabaseClient'

export function useCategories(groupId: string, includeArchived = false): Category[] {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('group_id', groupId)
        .order('order_index')
      if (!cancelled && data) setCategories((data as CategoryRow[]).map(categoryFromRow))
    }
    load()

    const channel = supabase
      .channel(`categories:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [groupId])

  return includeArchived ? categories : categories.filter((c) => !c.archived)
}

export async function addCategory(groupId: string, name: string, orderIndex: number): Promise<void> {
  await supabase
    .from('categories')
    .insert({ group_id: groupId, name, is_default: false, order_index: orderIndex, archived: false })
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await supabase.from('categories').update({ name }).eq('id', id)
}

export async function toggleArchived(id: string, archived: boolean): Promise<void> {
  await supabase.from('categories').update({ archived: !archived }).eq('id', id)
}
