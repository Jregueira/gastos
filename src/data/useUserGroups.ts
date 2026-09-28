import { useCallback, useEffect, useState } from 'react'
import type { Group } from '../types'
import { groupFromRow, type GroupRow } from './mappers'
import { supabase } from './supabaseClient'

interface UserGroupsState {
  groups: Group[]
  loading: boolean
  refetch: () => void
}

/** All households the signed-in user belongs to, ordered by when they joined. */
export function useUserGroups(userId: string | undefined): UserGroupsState {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [refetchToken, setRefetchToken] = useState(0)

  const refetch = useCallback(() => setRefetchToken((t) => t + 1), [])

  useEffect(() => {
    if (!userId) {
      setGroups([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('group_members')
      .select('joined_at, groups(*)')
      .eq('user_id', userId)
      .order('joined_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setGroups([])
        } else {
          setGroups(
            (data as unknown as { groups: GroupRow | null }[])
              .map((row) => row.groups)
              .filter((g): g is GroupRow => g !== null)
              .map(groupFromRow),
          )
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refetchToken])

  return { groups, loading, refetch }
}
