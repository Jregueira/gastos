import { NavLink } from 'react-router-dom'

const linkBase =
  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-slate-400'
const linkActive = 'text-indigo-600'

export default function NavBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
        <span className="text-lg">🏠</span>
        Home
      </NavLink>
      <NavLink
        to="/history"
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
      >
        <span className="text-lg">📜</span>
        History
      </NavLink>
      <NavLink to="/add" className="flex flex-1 flex-col items-center justify-center py-1.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-2xl leading-none text-white shadow-md shadow-indigo-200">
          +
        </span>
      </NavLink>
      <NavLink
        to="/reports"
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
      >
        <span className="text-lg">📊</span>
        Reports
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
      >
        <span className="text-lg">⚙️</span>
        Settings
      </NavLink>
    </nav>
  )
}
