import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import HouseholdHeader from './components/HouseholdHeader'
import NavBar from './components/NavBar'
import { useUserGroups } from './data/useUserGroups'
import { getStoredActiveGroupId, setStoredActiveGroupId } from './group/activeGroup'
import { GroupProvider } from './group/GroupContext'
import AddExpense from './screens/AddExpense'
import Auth from './screens/Auth'
import GroupSetup from './screens/GroupSetup'
import History from './screens/History'
import Home from './screens/Home'
import Households from './screens/Households'
import Reports from './screens/Reports'
import SettleUp from './screens/SettleUp'
import Settings from './screens/Settings'

function App() {
  const { session, loading: authLoading } = useAuth()
  const { groups, loading: groupsLoading, refetch } = useUserGroups(session?.user.id)
  const [activeGroupId, setActiveGroupId] = useState(() => getStoredActiveGroupId())
  const location = useLocation()
  const navigate = useNavigate()

  // An invite link opened by someone who already has households should still
  // reach the join form instead of being silently ignored.
  useEffect(() => {
    if (!session || groupsLoading || groups.length === 0) return
    const code = new URLSearchParams(location.search).get('code')
    if (code && location.pathname !== '/households') {
      navigate(`/households?code=${encodeURIComponent(code)}`, { replace: true })
    }
  }, [session, groupsLoading, groups.length, location, navigate])

  if (authLoading) return null
  if (!session) return <Auth />
  if (groupsLoading) return null

  function switchGroup(id: string) {
    setActiveGroupId(id)
    setStoredActiveGroupId(id)
  }

  if (groups.length === 0) {
    return (
      <GroupSetup
        onDone={(group) => {
          switchGroup(group.id)
          refetch()
        }}
      />
    )
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0]

  return (
    <GroupProvider
      group={activeGroup}
      groups={groups}
      currentUserId={session.user.id}
      switchGroup={switchGroup}
      refetchGroups={refetch}
    >
      <div className="mx-auto flex h-full max-w-md flex-col bg-slate-50">
        <HouseholdHeader />
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/edit/:id" element={<AddExpense />} />
            <Route path="/history" element={<History />} />
            <Route path="/settle" element={<SettleUp />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/households" element={<Households />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </GroupProvider>
  )
}

export default App
