import { useState } from 'react'
import { supabase } from '../data/supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [saving, setSaving] = useState(false)

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setInfo('')
    setSaving(true)

    const { error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password })

    setSaving(false)
    if (authError) {
      setError(authError.message)
      return
    }
    if (mode === 'sign-up') {
      setInfo('Check your email to confirm your account, then sign in.')
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6 bg-slate-50 px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === 'sign-in' ? 'Welcome back 👋' : 'Create an account'}
        </h1>
        <p className="mt-1 text-slate-500">
          {mode === 'sign-in'
            ? 'Sign in to see your household expenses.'
            : "You'll create or join a household next."}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
            setError('')
            setInfo('')
          }}
          className="text-sm font-medium text-indigo-600"
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
