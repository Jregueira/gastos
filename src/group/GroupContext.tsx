import { createContext, useContext, type ReactNode } from 'react'
import type { Group } from '../types'

interface GroupState {
  groupId: string
  groupName: string
  inviteCode: string
  currentUserId: string
}

const GroupContext = createContext<GroupState | null>(null)

export function GroupProvider({
  group,
  currentUserId,
  children,
}: {
  group: Group
  currentUserId: string
  children: ReactNode
}) {
  const value: GroupState = {
    groupId: group.id,
    groupName: group.name,
    inviteCode: group.inviteCode,
    currentUserId,
  }
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

export function useGroup(): GroupState {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used within a GroupProvider')
  return ctx
}
