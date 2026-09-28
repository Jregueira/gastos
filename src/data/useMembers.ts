import { useEffect, useState } from 'react'
import type { Member } from '../types'
import { memberFromRow, type GroupMemberRow } from './mappers'
import { supabase } from './supabaseClient'

export function useMembers(groupId: string): Member[] {
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at')
      if (!cancelled && data) setMembers((data as GroupMemberRow[]).map(memberFromRow))
    }
    load()

    const channel = supabase
      .channel(`group_members:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [groupId])

  return members
}
