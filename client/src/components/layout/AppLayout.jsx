import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import Icon from '../ui/Icon.jsx'
import { cn } from '../../lib/cn.js'

// Coquille de l'application : sidebar fixe a partir de md, tiroir en dessous.
// Montee comme route parente dans router.jsx — chaque page rend juste son contenu.
function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      {/* Desktop */}
      <aside className="hidden md:sticky md:top-0 md:block md:h-dvh">
        <Sidebar />
      </aside>

      {/* Mobile : overlay + tiroir */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-900/40 transition-opacity md:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 md:hidden',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Fermer le menu"
          className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <Icon name="close" className="size-4" />
        </button>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
