import { useCallback, useEffect, useState } from 'react'
import type { Group } from '../types'
import { groupFromRow, type GroupRow } from './mappers'
import { supabase } from './supabaseClient'

interface CurrentGroupState {
  group: Group | null
  loading: boolean
  refetch: () => void
}

/** Resolves the signed-in user's one group (a user belongs to exactly one group). */
export function useCurrentGroup(userId: string | undefined): CurrentGroupState {
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [refetchToken, setRefetchToken] = useState(0)

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), [])

  useEffect(() => {
    if (!userId) {
      setGroup(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('group_members')
      .select('groups(*)')
      .eq('user_id', userId)
      .maybeSingle<{ groups: GroupRow | null }>()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data?.groups) {
          setGroup(null)
        } else {
          setGroup(groupFromRow(data.groups))
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refetchToken])

  return { group, loading, refetch }
}
