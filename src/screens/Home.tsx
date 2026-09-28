import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ExpenseListItem from '../components/ExpenseListItem'
import { db } from '../db/db'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { summarizeBalance } from '../lib/balances'
import { formatCents, todayIso } from '../lib/format'

const RECENT_COUNT = 5

export default function Home() {
  const people = usePeople()
  const categories = useCategories(true)
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), [], [])
  const settlements = useLiveQuery(() => db.settlements.toArray(), [], [])

  const [personA, personB] = people
  const balance = useMemo(() => {
    if (!personA || !personB) return null
    return summarizeBalance(expenses, settlements, personA.id, personB.id)
  }, [expenses, settlements, personA, personB])

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

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  return (
    <div className="flex flex-col">
      <div className="bg-indigo-600 px-5 pb-6 pt-8 text-white">
        {balance?.isSettled ? (
          <p className="text-lg font-medium">You're all settled up 🎉</p>
        ) : balance ? (
          <p className="text-lg font-medium">
            {peopleById.get(balance.owesPersonId!)?.name} owes{' '}
            {peopleById.get(balance.owedPersonId!)?.name}{' '}
            <span className="font-bold">{formatCents(balance.amountCents)}</span>
          </p>
        ) : (
          <p className="text-lg font-medium">Loading…</p>
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
                category={categoryById.get(e.categoryId)}
                paidBy={peopleById.get(e.paidByPersonId)}
              />
            ))
        )}
      </div>
    </div>
  )
}
