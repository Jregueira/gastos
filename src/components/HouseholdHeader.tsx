import { Link } from 'react-router-dom'
import { useGroup } from '../group/GroupContext'

export default function HouseholdHeader() {
  const { groupName } = useGroup()

  return (
    <Link
      to="/households"
      className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2 text-sm font-medium text-slate-700"
    >
      <span className="truncate">🏠 {groupName}</span>
      <span className="shrink-0 text-slate-400">⌄</span>
    </Link>
  )
}
