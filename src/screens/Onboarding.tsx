import { useState } from 'react'
import { completeOnboarding } from '../db/db'

export default function Onboarding() {
  const [nameA, setNameA] = useState('')
  const [nameB, setNameB] = useState('')
  const [saving, setSaving] = useState(false)

  const canSubmit = nameA.trim().length > 0 && nameB.trim().length > 0 && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    await completeOnboarding(nameA.trim(), nameB.trim())
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6 bg-slate-50 px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome 👋</h1>
        <p className="mt-1 text-slate-500">
          Let's set up your household. Who's splitting expenses?
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Your name</span>
          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={nameA}
            onChange={(e) => setNameA(e.target.value)}
            placeholder="e.g. Santiago"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Their name</span>
          <input
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={nameB}
            onChange={(e) => setNameB(e.target.value)}
            placeholder="e.g. sibling's name"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          Get started
        </button>
      </form>
    </div>
  )
}
