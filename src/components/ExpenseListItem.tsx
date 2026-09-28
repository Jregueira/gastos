import { useNavigate } from 'react-router-dom'
import { formatCents, formatDate } from '../lib/format'
import type { Category, Expense, Member } from '../types'

export default function ExpenseListItem({
  expense,
  category,
  paidBy,
}: {
  expense: Expense
  category: Category | undefined
  paidBy: Member | undefined
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/edit/${expense.id}`)}
      className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left active:bg-slate-100"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: paidBy?.colorTag ?? '#94a3b8' }}
      >
        {paidBy?.displayName.slice(0, 1).toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{expense.description}</p>
        <p className="truncate text-sm text-slate-500">
          {category?.name ?? 'Uncategorized'} · {formatDate(expense.date)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-slate-900">{formatCents(expense.amountCents)}</p>
        <p className="text-xs text-slate-400">{paidBy?.displayName ?? 'Unknown'} paid</p>
      </div>
    </button>
  )
}
