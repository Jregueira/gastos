import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import NavBar from './components/NavBar'
import { useCurrentGroup } from './data/useCurrentGroup'
import { GroupProvider } from './group/GroupContext'
import AddExpense from './screens/AddExpense'
import Auth from './screens/Auth'
import GroupSetup from './screens/GroupSetup'
import History from './screens/History'
import Home from './screens/Home'
import Reports from './screens/Reports'
import SettleUp from './screens/SettleUp'
import Settings from './screens/Settings'

function App() {
  const { session, loading: authLoading } = useAuth()
  const { group, loading: groupLoading, refetch } = useCurrentGroup(session?.user.id)

  if (authLoading) return null
  if (!session) return <Auth />
  if (groupLoading) return null
  if (!group) return <GroupSetup onDone={refetch} />

  return (
    <GroupProvider group={group} currentUserId={session.user.id}>
      <div className="mx-auto flex h-full max-w-md flex-col bg-slate-50">
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/edit/:id" element={<AddExpense />} />
            <Route path="/history" element={<History />} />
            <Route path="/settle" element={<SettleUp />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </GroupProvider>
  )
}

export default App
