import { useEffect, useState } from 'react'
import type { Settlement } from '../types'
import { settlementFromRow, type SettlementRow } from './mappers'
import { supabase } from './supabaseClient'

export interface NewSettlementInput {
  amountCents: number
  fromUserId: string
  toUserId: string
  date: string
  note: string
}

export function useSettlements(groupId: string): Settlement[] {
  const [settlements, setSettlements] = useState<Settlement[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false })
      if (!cancelled && data) setSettlements((data as SettlementRow[]).map(settlementFromRow))
    }
    load()

    const channel = supabase
      .channel(`settlements:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [groupId])

  return settlements
}

export async function addSettlement(groupId: string, input: NewSettlementInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const { error } = await supabase.from('settlements').insert({
    group_id: groupId,
    amount_cents: input.amountCents,
    from_user_id: input.fromUserId,
    to_user_id: input.toUserId,
    date: input.date,
    note: input.note,
    created_by: user.id,
  })
  if (error) throw error
}
