import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import HouseholdForm from '../components/HouseholdForm'
import { useGroup } from '../group/GroupContext'
import type { Group } from '../types'

export default function Households() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { groupId, groups, switchGroup, refetchGroups } = useGroup()
  const [adding, setAdding] = useState(() => Boolean(searchParams.get('code')))

  function selectGroup(id: string) {
    if (id !== groupId) switchGroup(id)
    navigate('/')
  }

  function handleAdded(group: Group) {
    switchGroup(group.id)
    refetchGroups()
    navigate('/')
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold text-slate-900">Households</h1>

      <div className="mt-4 flex flex-col gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => selectGroup(g.id)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium ${
              g.id === groupId
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-700'
            }`}
          >
            {g.name}
            {g.id === groupId && <span className="text-xs">Active</span>}
          </button>
        ))}
      </div>

      {adding ? (
        <div className="mt-6">
          <HouseholdForm onSuccess={handleAdded} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-6 w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600"
        >
          + Add another household
        </button>
      )}
    </div>
  )
}
