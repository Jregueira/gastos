import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCategories } from '../data/useCategories'
import { addExpense, deleteExpense, getExpense, updateExpense } from '../data/useExpenses'
import { useMembers } from '../data/useMembers'
import { useGroup } from '../group/GroupContext'
import { formatCents, parseDollarsToCents, todayIso } from '../lib/format'
import { computeSplitDetails } from '../lib/split'
import type { SplitType } from '../types'

export default function AddExpense() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { groupId, currentUserId } = useGroup()
  const members = useMembers(groupId)
  const categories = useCategories(groupId)

  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [paidByUserId, setPaidByUserId] = useState('')
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [customShareStrs, setCustomShareStrs] = useState<Record<string, string>>({})
  const [fullOwerUserId, setFullOwerUserId] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(!isEditing)

  // Sensible defaults once members/categories arrive.
  useEffect(() => {
    if (!isEditing && currentUserId && !paidByUserId) setPaidByUserId(currentUserId)
  }, [isEditing, currentUserId, paidByUserId])
  useEffect(() => {
    if (!isEditing && categories[0] && !categoryId) setCategoryId(categories[0].id)
  }, [isEditing, categories, categoryId])
  useEffect(() => {
    if (!isEditing && members.length && participantIds.length === 0) {
      setParticipantIds(members.map((m) => m.userId))
    }
  }, [isEditing, members, participantIds])
  useEffect(() => {
    if (members.length && !fullOwerUserId) setFullOwerUserId(members[0].userId)
  }, [members, fullOwerUserId])

  useEffect(() => {
    if (!isEditing || !id) return
    getExpense(id).then((e) => {
      if (!e) return
      setAmountStr((e.amountCents / 100).toString())
      setDescription(e.description)
      setCategoryId(e.categoryId ?? '')
      setDate(e.date)
      setPaidByUserId(e.paidByUserId)
      setSplitType(e.splitType)
      const shareEntries = Object.entries(e.splitDetails)
      setParticipantIds(shareEntries.map(([userId]) => userId))
      setCustomShareStrs(
        Object.fromEntries(shareEntries.map(([userId, cents]) => [userId, (cents / 100).toString()])),
      )
      if (e.splitType === 'full') {
        const owerEntry = shareEntries.find(([, v]) => v > 0)
        if (owerEntry) setFullOwerUserId(owerEntry[0])
      }
      setLoaded(true)
    })
  }, [isEditing, id])

  function toggleParticipant(userId: string) {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const customAllocatedCents = useMemo(
    () =>
      participantIds.reduce((sum, userId) => sum + (parseDollarsToCents(customShareStrs[userId] ?? '') ?? 0), 0),
    [participantIds, customShareStrs],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amountCents = parseDollarsToCents(amountStr)
    if (amountCents === null || amountCents === 0) {
      setError('Enter a valid amount.')
      return
    }
    if (!description.trim()) {
      setError('Add a short description.')
      return
    }
    if (splitType !== 'full' && participantIds.length === 0) {
      setError('Select at least one person to split between.')
      return
    }

    let splitDetails: Record<string, number>
    try {
      if (splitType === 'custom') {
        const customShares = Object.fromEntries(
          participantIds.map((userId) => [userId, parseDollarsToCents(customShareStrs[userId] ?? '') ?? 0]),
        )
        splitDetails = computeSplitDetails({ amountCents, splitType, participantIds, customShares })
      } else {
        splitDetails = computeSplitDetails({
          amountCents,
          splitType,
          participantIds,
          fullOwerUserId,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid split.')
      return
    }

    const input = {
      amountCents,
      description: description.trim(),
      categoryId: categoryId || null,
      date,
      paidByUserId,
      splitType,
      splitDetails,
    }

    if (isEditing && id) {
      await updateExpense(id, input)
    } else {
      await addExpense(groupId, input)
    }
    navigate('/')
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    navigate('/')
  }

  if (isEditing && !loaded) return null

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold text-slate-900">
        {isEditing ? 'Edit expense' : 'Add expense'}
      </h1>
      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Amount</span>
          <input
            inputMode="decimal"
            className="rounded-xl border border-slate-300 px-4 py-3 text-2xl font-semibold focus:border-indigo-500 focus:outline-none"
            placeholder="$0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. Costco run"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            type="date"
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Paid by</span>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                type="button"
                key={m.userId}
                onClick={() => setPaidByUserId(m.userId)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                  paidByUserId === m.userId
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {m.userId === currentUserId ? 'You' : m.displayName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Split</span>
          <div className="flex gap-2">
            {(
              [
                ['equal', 'Equal'],
                ['custom', 'Custom'],
                ['full', 'One owes it all'],
              ] as [SplitType, string][]
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setSplitType(value)}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
                  splitType === value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {splitType !== 'full' && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Split between</span>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.userId}
                  onClick={() => toggleParticipant(m.userId)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                    participantIds.includes(m.userId)
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {m.userId === currentUserId ? 'You' : m.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {splitType === 'custom' && (
          <div className="flex flex-col gap-2">
            {participantIds.map((userId) => {
              const member = members.find((m) => m.userId === userId)
              return (
                <label key={userId} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700">
                    {userId === currentUserId ? 'You' : member?.displayName ?? 'Unknown'}
                  </span>
                  <input
                    inputMode="decimal"
                    className="w-28 rounded-xl border border-slate-300 px-3 py-2 text-right text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="$0.00"
                    value={customShareStrs[userId] ?? ''}
                    onChange={(e) =>
                      setCustomShareStrs((prev) => ({ ...prev, [userId]: e.target.value }))
                    }
                  />
                </label>
              )
            })}
            {amountStr && (
              <p className="text-right text-xs text-slate-400">
                {formatCents((parseDollarsToCents(amountStr) ?? 0) - customAllocatedCents)} left to
                allocate
              </p>
            )}
          </div>
        )}

        {splitType === 'full' && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Who owes it all?</span>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.userId}
                  onClick={() => setFullOwerUserId(m.userId)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                    fullOwerUserId === m.userId
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {m.userId === currentUserId ? 'You' : m.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white"
        >
          {isEditing ? 'Save changes' : 'Add expense'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-300 py-3 text-base font-semibold text-red-600"
          >
            Delete expense
          </button>
        )}
      </form>
    </div>
  )
}
