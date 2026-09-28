import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../data/useExpenses'
import { useMembers } from '../data/useMembers'
import { addSettlement, useSettlements } from '../data/useSettlements'
import { useGroup } from '../group/GroupContext'
import { calculateNetBalances, simplifyDebts } from '../lib/balances'
import { formatCents, parseDollarsToCents, todayIso } from '../lib/format'

export default function SettleUp() {
  const navigate = useNavigate()
  const { groupId, currentUserId } = useGroup()
  const members = useMembers(groupId)
  const expenses = useExpenses(groupId)
  const settlements = useSettlements(groupId)

  const memberById = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members])
  const netBalances = useMemo(
    () => calculateNetBalances(members.map((m) => m.userId), expenses, settlements),
    [members, expenses, settlements],
  )
  const mySettlements = useMemo(() => {
    if (!members.length) return []
    return simplifyDebts(netBalances).filter(
      (s) => s.fromUserId === currentUserId || s.toUserId === currentUserId,
    )
  }, [netBalances, members, currentUserId])

  const otherMembers = members.filter((m) => m.userId !== currentUserId)
  const [counterpartyId, setCounterpartyId] = useState('')
  const [direction, setDirection] = useState<'i-paid' | 'they-paid'>('i-paid')
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function settleSuggestion(fromUserId: string, toUserId: string, amountCents: number) {
    setSaving(true)
    await addSettlement(groupId, { amountCents, fromUserId, toUserId, date: todayIso(), note: '' })
    setSaving(false)
    navigate('/')
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const counterparty = counterpartyId || otherMembers[0]?.userId
    if (!counterparty) {
      setError('No one to settle with yet.')
      return
    }
    const amountCents = parseDollarsToCents(amountStr)
    if (amountCents === null || amountCents <= 0) {
      setError('Enter a valid amount.')
      return
    }
    const fromUserId = direction === 'i-paid' ? currentUserId : counterparty
    const toUserId = direction === 'i-paid' ? counterparty : currentUserId
    setSaving(true)
    await addSettlement(groupId, { amountCents, fromUserId, toUserId, date: todayIso(), note: note.trim() })
    setSaving(false)
    navigate('/')
  }

  if (members.length > 0 && otherMembers.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-slate-400">
        Invite someone else to your household before you can settle up.
      </div>
    )
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold text-slate-900">Settle up</h1>

      {mySettlements.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {mySettlements.map((s) => {
            const youOwe = s.fromUserId === currentUserId
            const other = memberById.get(youOwe ? s.toUserId : s.fromUserId)
            return (
              <div
                key={`${s.fromUserId}-${s.toUserId}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
              >
                <p className="text-sm text-slate-700">
                  {youOwe ? `You owe ${other?.displayName ?? 'someone'}` : `${other?.displayName ?? 'Someone'} owes you`}{' '}
                  <span className="font-semibold">{formatCents(s.amountCents)}</span>
                </p>
                <button
                  disabled={saving}
                  onClick={() => settleSuggestion(s.fromUserId, s.toUserId, s.amountCents)}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Settle
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">You're all settled up with everyone 🎉</p>
      )}

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-700">Record a payment</p>
        <form className="mt-2 flex flex-col gap-3" onSubmit={handleManualSubmit}>
          <select
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={counterpartyId || otherMembers[0]?.userId || ''}
            onChange={(e) => setCounterpartyId(e.target.value)}
          >
            {otherMembers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('i-paid')}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                direction === 'i-paid'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              You paid them
            </button>
            <button
              type="button"
              onClick={() => setDirection('they-paid')}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                direction === 'they-paid'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              They paid you
            </button>
          </div>

          <input
            inputMode="decimal"
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            placeholder="$0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
          />

          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl border border-indigo-600 py-3 text-base font-semibold text-indigo-700 disabled:opacity-40"
          >
            Record payment
          </button>
        </form>
      </div>
    </div>
  )
}
