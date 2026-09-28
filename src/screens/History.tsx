import { useMemo, useState } from 'react'
import ExpenseListItem from '../components/ExpenseListItem'
import { useCategories } from '../data/useCategories'
import { useExpenses } from '../data/useExpenses'
import { useMembers } from '../data/useMembers'
import { useGroup } from '../group/GroupContext'

export default function History() {
  const { groupId, currentUserId } = useGroup()
  const members = useMembers(groupId)
  const categories = useCategories(groupId, true)
  const expenses = useExpenses(groupId)

  const [categoryId, setCategoryId] = useState('all')
  const [paidBy, setPaidBy] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const memberById = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members])

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryId !== 'all' && e.categoryId !== categoryId) return false
      if (paidBy !== 'all' && e.paidByUserId !== paidBy) return false
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo && e.date > dateTo) return false
      return true
    })
  }, [expenses, categoryId, paidBy, dateFrom, dateTo])

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">History</h1>
        <div className="flex gap-2 overflow-x-auto">
          <select
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            <option value="all">Anyone paid</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.userId === currentUserId ? 'You' : m.displayName} paid
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-400">
          No expenses match these filters.
        </p>
      ) : (
        filtered.map((e) => (
          <ExpenseListItem
            key={e.id}
            expense={e}
            category={e.categoryId ? categoryById.get(e.categoryId) : undefined}
            paidBy={memberById.get(e.paidByUserId)}
          />
        ))
      )}
    </div>
  )
}
