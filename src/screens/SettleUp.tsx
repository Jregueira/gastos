import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { usePeople } from '../hooks/usePeople'
import { summarizeBalance } from '../lib/balances'
import { formatCents, parseDollarsToCents, todayIso } from '../lib/format'

export default function SettleUp() {
  const navigate = useNavigate()
  const people = usePeople()
  const [personA, personB] = people
  const expenses = useLiveQuery(() => db.expenses.toArray(), [], [])
  const settlements = useLiveQuery(() => db.settlements.toArray(), [], [])

  const balance = useMemo(() => {
    if (!personA || !personB) return null
    return summarizeBalance(expenses, settlements, personA.id, personB.id)
  }, [expenses, settlements, personA, personB])

  const [amountStr, setAmountStr] = useState('')
  const [error, setError] = useState('')

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  if (balance?.isSettled) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-lg font-medium text-slate-900">You're all settled up 🎉</p>
        <button
          className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
          onClick={() => navigate('/')}
        >
          Back home
        </button>
      </div>
    )
  }

  if (!balance) return null

  async function handleSettle(full: boolean) {
    setError('')
    const amountCents = full ? balance!.amountCents : parseDollarsToCents(amountStr)
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount.')
      return
    }
    if (amountCents > balance!.amountCents) {
      setError(`Can't settle more than what's owed (${formatCents(balance!.amountCents)}).`)
      return
    }
    await db.settlements.add({
      id: crypto.randomUUID(),
      amountCents,
      fromPersonId: balance!.owesPersonId!,
      toPersonId: balance!.owedPersonId!,
      date: todayIso(),
      note: '',
      createdAt: Date.now(),
    })
    navigate('/')
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold text-slate-900">Settle up</h1>
      <p className="mt-2 text-slate-600">
        {peopleById.get(balance.owesPersonId!)?.name} owes{' '}
        {peopleById.get(balance.owedPersonId!)?.name}{' '}
        <span className="font-semibold">{formatCents(balance.amountCents)}</span>
      </p>

      <button
        onClick={() => handleSettle(true)}
        className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white"
      >
        Settle full amount ({formatCents(balance.amountCents)})
      </button>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-700">Or record a partial payment</p>
        <div className="mt-2 flex gap-2">
          <input
            inputMode="decimal"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            placeholder="$0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
          />
          <button
            onClick={() => handleSettle(false)}
            className="rounded-xl border border-indigo-600 px-4 py-3 font-semibold text-indigo-700"
          >
            Record
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
