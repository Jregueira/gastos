import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { groupFromRow, type GroupRow } from '../data/mappers'
import { supabase } from '../data/supabaseClient'
import type { Group } from '../types'

export default function HouseholdForm({ onSuccess }: { onSuccess: (group: Group) => void }) {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'create' | 'join'>(searchParams.get('code') ? 'join' : 'create')

  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') ?? '')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const canSubmit =
    displayName.trim().length > 0 &&
    (mode === 'create' ? groupName.trim().length > 0 : inviteCode.trim().length > 0) &&
    !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setSaving(true)

    const { data, error: rpcError } =
      mode === 'create'
        ? await supabase.rpc('create_group', {
            p_name: groupName.trim(),
            p_display_name: displayName.trim(),
          })
        : await supabase.rpc('join_group', {
            p_invite_code: inviteCode.trim(),
            p_display_name: displayName.trim(),
          })

    setSaving(false)
    if (rpcError || !data) {
      setError(rpcError?.message ?? 'Something went wrong.')
      return
    }
    onSuccess(groupFromRow(data as GroupRow))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
            mode === 'create'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-300 text-slate-600'
          }`}
        >
          Create a household
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
            mode === 'join'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-300 text-slate-600'
          }`}
        >
          Join a household
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {mode === 'create' ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Household name</span>
            <input
              className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. The Apartment"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Invite code</span>
            <input
              className="rounded-xl border border-slate-300 px-4 py-3 text-base uppercase tracking-widest focus:border-indigo-500 focus:outline-none"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. AB12CD"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Your name</span>
          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Santiago"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          {mode === 'create' ? 'Create household' : 'Join household'}
        </button>
      </form>
    </div>
  )
}
