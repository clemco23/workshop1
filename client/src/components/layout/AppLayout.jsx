import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import Icon from '../ui/Icon.jsx'
import { fetchMe } from '../../api/auth.js'
import { enregistrerUtilisateur, lireUtilisateur } from '../../lib/session.js'
import { cn } from '../../lib/cn.js'

// Coquille de l'application : sidebar fixe a partir de md, tiroir en dessous.
// Montee comme route parente dans router.jsx — chaque page rend juste son contenu.
function AppLayout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  // Rehydratation de la session : la copie dans localStorage sert a afficher
  // tout de suite, /api/auth/me la corrige ensuite. C'est le layout qui s'en
  // charge — monte une seule fois pour toute la partie authentifiee, l'appel ne
  // se rejoue donc pas a chaque navigation.
  const [user, setUser] = useState(lireUtilisateur)

  useEffect(() => {
    let vivant = true

    fetchMe()
      .then((profil) => {
        if (!vivant) return
        setUser(profil)
        enregistrerUtilisateur(profil)
      })
      // Jeton perime : l'intercepteur a deja efface la session, mais la page
      // affichee resterait a l'ecran jusqu'a la prochaine navigation. On renvoie
      // donc a /login tout de suite, avec la raison. Une simple panne reseau,
      // elle, ne deconnecte pas : seul un vrai 401 porte `sessionExpiree`.
      .catch((error) => {
        if (!vivant || !error.sessionExpiree) return
        navigate('/login', {
          replace: true,
          state: { info: 'Session expiree, reconnecte-toi.' },
        })
      })

    return () => {
      vivant = false
    }
  }, [navigate])

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
        <Topbar onOpenMenu={() => setMenuOpen(true)} user={user} />
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
