import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ExpenseListItem from '../components/ExpenseListItem'
import { useCategories } from '../data/useCategories'
import { useExpenses } from '../data/useExpenses'
import { useMembers } from '../data/useMembers'
import { useSettlements } from '../data/useSettlements'
import { useGroup } from '../group/GroupContext'
import { calculateNetBalances, simplifyDebts } from '../lib/balances'
import { formatCents, todayIso } from '../lib/format'

const RECENT_COUNT = 5

export default function Home() {
  const { groupId, currentUserId } = useGroup()
  const members = useMembers(groupId)
  const categories = useCategories(groupId, true)
  const expenses = useExpenses(groupId)
  const settlements = useSettlements(groupId)

  const memberById = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const netBalances = useMemo(
    () => calculateNetBalances(members.map((m) => m.userId), expenses, settlements),
    [members, expenses, settlements],
  )
  const myNet = netBalances[currentUserId] ?? 0

  const mySettlements = useMemo(() => {
    if (!members.length) return []
    return simplifyDebts(netBalances).filter(
      (s) => s.fromUserId === currentUserId || s.toUserId === currentUserId,
    )
  }, [netBalances, members, currentUserId])

  const rentReminder = useMemo(() => {
    if (!categories.length) return null
    const today = todayIso()
    const [year, month, day] = today.split('-').map(Number)
    if (day < 5) return null
    const rentCategory = categories.find((c) => c.name === 'Rent/Mortgage')
    if (!rentCategory) return null
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
    const alreadyLogged = expenses.some(
      (e) => e.categoryId === rentCategory.id && e.date.startsWith(monthPrefix),
    )
    return alreadyLogged ? null : "Rent hasn't been logged this month yet."
  }, [categories, expenses])

  return (
    <div className="flex flex-col">
      <div className="bg-indigo-600 px-5 pb-6 pt-8 text-white">
        {myNet === 0 ? (
          <p className="text-lg font-medium">You're all settled up 🎉</p>
        ) : myNet > 0 ? (
          <p className="text-lg font-medium">
            You are owed <span className="font-bold">{formatCents(myNet)}</span> overall
          </p>
        ) : (
          <p className="text-lg font-medium">
            You owe <span className="font-bold">{formatCents(-myNet)}</span> overall
          </p>
        )}

        {mySettlements.length > 0 && (
          <ul className="mt-2 flex flex-col gap-0.5 text-sm text-indigo-100">
            {mySettlements.map((s) => {
              const other = memberById.get(s.fromUserId === currentUserId ? s.toUserId : s.fromUserId)
              const youOwe = s.fromUserId === currentUserId
              return (
                <li key={`${s.fromUserId}-${s.toUserId}`}>
                  {youOwe ? `You owe ${other?.displayName ?? 'someone'}` : `${other?.displayName ?? 'Someone'} owes you`}{' '}
                  {formatCents(s.amountCents)}
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            to="/add"
            className="flex-1 rounded-xl bg-white py-3 text-center font-semibold text-indigo-700 shadow"
          >
            + Add Expense
          </Link>
          <Link
            to="/settle"
            className="flex-1 rounded-xl border border-indigo-300 py-3 text-center font-semibold text-white"
          >
            Settle Up
          </Link>
        </div>
      </div>

      {rentReminder && (
        <div className="mx-4 mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⏰ {rentReminder}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between px-4">
        <h2 className="font-semibold text-slate-900">Recent expenses</h2>
        <Link to="/history" className="text-sm font-medium text-indigo-600">
          See all
        </Link>
      </div>

      <div className="mt-2">
        {expenses.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            No expenses yet — add your first one above.
          </p>
        ) : (
          expenses
            .slice(0, RECENT_COUNT)
            .map((e) => (
              <ExpenseListItem
                key={e.id}
                expense={e}
                category={e.categoryId ? categoryById.get(e.categoryId) : undefined}
                paidBy={memberById.get(e.paidByUserId)}
              />
            ))
        )}
      </div>
    </div>
  )
}
