import { useLocation } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { currentNavTitle } from './navItems.js'

// Barre haute collante : bouton menu (mobile), titre de la section, avatar.
function Topbar({ onOpenMenu }) {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm md:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu"
        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
      >
        <Icon name="menu" />
      </button>

      <span className="text-sm font-semibold text-slate-900">{currentNavTitle(pathname)}</span>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 sm:inline">Theo</span>
        <span className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
          T
        </span>
      </div>
    </header>
  )
}

export default Topbar
