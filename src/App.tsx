import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import { db } from './db/db'
import AddExpense from './screens/AddExpense'
import History from './screens/History'
import Home from './screens/Home'
import Onboarding from './screens/Onboarding'
import Reports from './screens/Reports'
import SettleUp from './screens/SettleUp'
import Settings from './screens/Settings'

function App() {
  // Resolves to a real boolean once loaded, so `undefined` unambiguously means
  // "still loading from IndexedDB" (a fresh DB has no 'onboarded' row, which would
  // otherwise be indistinguishable from the loading state).
  const onboarded = useLiveQuery(() =>
    db.settings.get('onboarded').then((row) => row?.value === true),
  )

  if (onboarded === undefined) return null
  if (!onboarded) return <Onboarding />

  return (
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
  )
}

export default App
