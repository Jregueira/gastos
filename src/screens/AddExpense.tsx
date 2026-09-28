import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'
import { formatCents, parseDollarsToCents, todayIso } from '../lib/format'
import { computeSplitDetails } from '../lib/split'
import type { SplitType } from '../types'

export default function AddExpense() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const people = usePeople()
  const categories = useCategories()
  const [personA, personB] = people

  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [paidByPersonId, setPaidByPersonId] = useState('')
  const [splitType, setSplitType] = useState<SplitType>('50-50')
  const [customShareAStr, setCustomShareAStr] = useState('')
  const [fullOwerPersonId, setFullOwerPersonId] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(!isEditing)

  // Sensible defaults once people/categories arrive.
  useEffect(() => {
    if (!isEditing && personA && !paidByPersonId) setPaidByPersonId(personA.id)
  }, [isEditing, personA, paidByPersonId])
  useEffect(() => {
    if (!isEditing && categories[0] && !categoryId) setCategoryId(categories[0].id)
  }, [isEditing, categories, categoryId])
  useEffect(() => {
    if (personB && !fullOwerPersonId) setFullOwerPersonId(personB.id)
  }, [personB, fullOwerPersonId])

  useEffect(() => {
    if (!isEditing || !id) return
    db.expenses.get(id).then((e) => {
      if (!e) return
      setAmountStr((e.amountCents / 100).toString())
      setDescription(e.description)
      setCategoryId(e.categoryId)
      setDate(e.date)
      setPaidByPersonId(e.paidByPersonId)
      setSplitType(e.splitType)
      if (personA) setCustomShareAStr((e.splitDetails[personA.id] / 100).toString())
      const owerEntry = Object.entries(e.splitDetails).find(([, v]) => v > 0)
      if (owerEntry) setFullOwerPersonId(owerEntry[0])
      setLoaded(true)
    })
    // personA is only needed to seed customShareAStr; re-running when it arrives is fine.
  }, [isEditing, id, personA])

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
    if (!personA || !personB) return

    let customShareForA: number | undefined
    if (splitType === 'custom') {
      const parsed = parseDollarsToCents(customShareAStr)
      if (parsed === null || parsed > amountCents) {
        setError(`Custom share must be between $0 and ${formatCents(amountCents)}.`)
        return
      }
      customShareForA = parsed
    }

    const splitDetails = computeSplitDetails({
      amountCents,
      splitType,
      personAId: personA.id,
      personBId: personB.id,
      customShareForA,
      fullOwerPersonId,
    })

    const now = Date.now()
    if (isEditing && id) {
      await db.expenses.update(id, {
        amountCents,
        description: description.trim(),
        categoryId,
        date,
        paidByPersonId,
        splitType,
        splitDetails,
        updatedAt: now,
      })
    } else {
      await db.expenses.add({
        id: crypto.randomUUID(),
        amountCents,
        description: description.trim(),
        categoryId,
        date,
        paidByPersonId,
        splitType,
        splitDetails,
        createdAt: now,
        updatedAt: now,
      })
    }
    navigate('/')
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Delete this expense?')) return
    await db.expenses.delete(id)
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
          <div className="flex gap-2">
            {people.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPaidByPersonId(p.id)}
                className={`flex-1 rounded-xl border py-3 text-sm font-medium ${
                  paidByPersonId === p.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Split</span>
          <div className="flex gap-2">
            {(
              [
                ['50-50', '50 / 50'],
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

        {splitType === 'custom' && personA && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">{personA.name}'s share</span>
            <input
              inputMode="decimal"
              className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
              placeholder="$0.00"
              value={customShareAStr}
              onChange={(e) => setCustomShareAStr(e.target.value)}
            />
          </label>
        )}

        {splitType === 'full' && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Who owes it all?</span>
            <div className="flex gap-2">
              {people.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setFullOwerPersonId(p.id)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium ${
                    fullOwerPersonId === p.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {p.name}
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
