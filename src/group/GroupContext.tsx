import { createContext, useContext, type ReactNode } from 'react'
import type { Group } from '../types'

interface GroupState {
  groupId: string
  groupName: string
  inviteCode: string
  currentUserId: string
  groups: Group[]
  switchGroup: (id: string) => void
  refetchGroups: () => void
}

const GroupContext = createContext<GroupState | null>(null)

export function GroupProvider({
  group,
  groups,
  currentUserId,
  switchGroup,
  refetchGroups,
  children,
}: {
  group: Group
  groups: Group[]
  currentUserId: string
  switchGroup: (id: string) => void
  refetchGroups: () => void
  children: ReactNode
}) {
  const value: GroupState = {
    groupId: group.id,
    groupName: group.name,
    inviteCode: group.inviteCode,
    currentUserId,
    groups,
    switchGroup,
    refetchGroups,
  }
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

export function useGroup(): GroupState {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used within a GroupProvider')
  return ctx
}
