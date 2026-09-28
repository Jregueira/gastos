import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { addCategory, renameCategory, toggleArchived, useCategories } from '../data/useCategories'
import { useMembers } from '../data/useMembers'
import { supabase } from '../data/supabaseClient'
import { useGroup } from '../group/GroupContext'

export default function Settings() {
  const { session } = useAuth()
  const { groupId, groupName, inviteCode, currentUserId } = useGroup()
  const members = useMembers(groupId)
  const categories = useCategories(groupId, true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  async function renameSelf(name: string) {
    if (!name.trim()) return
    await supabase
      .from('group_members')
      .update({ display_name: name.trim() })
      .eq('group_id', groupId)
      .eq('user_id', currentUserId)
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.orderIndex), -1)
    await addCategory(groupId, name, maxOrder + 1)
    setNewCategoryName('')
  }

  const inviteLink = `${window.location.origin}${import.meta.env.BASE_URL}?code=${inviteCode}`

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyMessage('Copied!')
    } catch {
      setCopyMessage(inviteLink)
    }
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">{groupName}</h2>
        <div className="mt-2 flex flex-col gap-2">
          {members.map((m) =>
            m.userId === currentUserId ? (
              <input
                key={m.userId}
                defaultValue={m.displayName}
                onBlur={(e) => renameSelf(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none"
              />
            ) : (
              <div
                key={m.userId}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-base text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: m.colorTag }}
                />
                {m.displayName}
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Invite people</h2>
        <p className="mt-1 text-xs text-slate-500">
          Share this link or code — anyone who opens it can join your household.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 truncate rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700">
            {inviteCode}
          </div>
          <button
            onClick={copyInvite}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Copy link
          </button>
        </div>
        {copyMessage && <p className="mt-1 text-xs text-emerald-600">{copyMessage}</p>}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Categories</h2>
        <div className="mt-2 flex flex-col gap-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                defaultValue={c.name}
                onBlur={(e) => renameCategory(c.id, e.target.value)}
                className={`flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
                  c.archived ? 'text-slate-400' : ''
                }`}
              />
              <button
                onClick={() => toggleArchived(c.id, c.archived)}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600"
              >
                {c.archived ? 'Unhide' : 'Hide'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Add
          </button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Account</h2>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <p className="truncate text-sm text-slate-600">Signed in as {session?.user.email}</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600"
          >
            Sign out
          </button>
        </div>
        <Link to="/households" className="mt-2 block text-sm font-medium text-indigo-600">
          Manage households →
        </Link>
      </section>
    </div>
  )
}
