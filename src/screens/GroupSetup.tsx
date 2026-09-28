import HouseholdForm from '../components/HouseholdForm'
import type { Group } from '../types'

export default function GroupSetup({ onDone }: { onDone: (group: Group) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-6 bg-slate-50 px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">One more step 👋</h1>
        <p className="mt-1 text-slate-500">Create a new household, or join one with an invite code.</p>
      </div>
      <HouseholdForm onSuccess={onDone} />
    </div>
  )
}
