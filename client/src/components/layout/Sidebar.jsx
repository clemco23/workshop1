import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { navItems, navItemsSecondary } from './navItems.js'
import { cn } from '../../lib/cn.js'

function SidebarLink({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      <Icon name={item.icon} />
      {item.label}
    </NavLink>
  )
}

// Contenu de la sidebar, partage entre la version fixe (desktop) et le tiroir (mobile).
function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col gap-6 border-r border-slate-200 bg-white px-4 py-5">
      <div className="flex items-center gap-2.5 px-1">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          E
        </span>
        <span className="text-sm font-semibold tracking-tight text-slate-900">Editly</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}

        <hr className="my-3 border-slate-100" />

        {navItemsSecondary.map((item) => (
          <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <p className="px-3 text-xs text-slate-400">v0.1 — demo</p>
    </div>
  )
}

export default Sidebar
