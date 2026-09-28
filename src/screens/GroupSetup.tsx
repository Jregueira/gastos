import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../data/supabaseClient'

export default function GroupSetup({ onDone }: { onDone: () => void }) {
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

    const { error: rpcError } =
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
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onDone()
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6 bg-slate-50 px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">One more step 👋</h1>
        <p className="mt-1 text-slate-500">Create a new household, or join one with an invite code.</p>
      </div>

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
              autoFocus
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
              autoFocus
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
