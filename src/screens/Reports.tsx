import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '../db/db'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { formatCents, monthLabel } from '../lib/format'
import {
  currentYearMonth,
  expensesInMonth,
  shiftMonth,
  spendByCategory,
  spendByPerson,
  totalCents,
  trailingMonthTotals,
} from '../lib/reports'

const PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6']

export default function Reports() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const people = usePeople()
  const categories = useCategories(true)
  const allExpenses = useLiveQuery(() => db.expenses.toArray(), [], [])

  const monthExpenses = useMemo(() => expensesInMonth(allExpenses, yearMonth), [allExpenses, yearMonth])
  const total = useMemo(() => totalCents(monthExpenses), [monthExpenses])
  const byCategory = useMemo(
    () => spendByCategory(monthExpenses, categories),
    [monthExpenses, categories],
  )
  const byPerson = useMemo(() => spendByPerson(monthExpenses, people), [monthExpenses, people])
  const trailing = useMemo(
    () => trailingMonthTotals(allExpenses, yearMonth, 6),
    [allExpenses, yearMonth],
  )

  return (
    <div className="px-5 py-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setYearMonth((ym) => shiftMonth(ym, -1))}
          className="rounded-full px-3 py-1 text-lg text-slate-500"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold text-slate-900">{monthLabel(yearMonth)}</h1>
        <button
          onClick={() => setYearMonth((ym) => shiftMonth(ym, 1))}
          className="rounded-full px-3 py-1 text-lg text-slate-500"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-4 text-center">
        <p className="text-sm text-indigo-700">Total spent</p>
        <p className="text-2xl font-bold text-indigo-900">{formatCents(total)}</p>
      </div>

      {monthExpenses.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-400">No expenses logged this month.</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="font-semibold text-slate-900">By category</h2>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="amountCents"
                    nameKey="categoryName"
                    innerRadius={45}
                    outerRadius={80}
                    isAnimationActive={false}
                  >
                    {byCategory.map((slice, i) => (
                      <Cell key={slice.categoryId} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCents(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {byCategory.map((slice, i) => (
                <li key={slice.categoryId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    {slice.categoryName}
                  </span>
                  <span className="font-medium text-slate-700">
                    {formatCents(slice.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="font-semibold text-slate-900">By person</h2>
            <div className="mt-2 flex flex-col gap-2">
              {byPerson.map((p) => (
                <div key={p.personId} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{p.personName}</span>
                  <span className="font-medium text-slate-900">{formatCents(p.amountCents)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Last 6 months</h2>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trailing}>
              <XAxis
                dataKey="yearMonth"
                tickFormatter={(ym: string) => ym.slice(5)}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 100}`} />
              <Tooltip
                formatter={(v) => formatCents(Number(v))}
                labelFormatter={(label) => monthLabel(String(label))}
              />
              <Bar
                dataKey="amountCents"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
