import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { currentNavTitle } from './navItems.js'
import { effacerSession } from '../../lib/session.js'

// Nom affichable d'un utilisateur. `first_name` / `last_name` sont nullables et
// aucun ecran ne permet encore de les saisir : l'email est le seul champ
// toujours present, et sa partie locale fait un repli lisible.
function nomAffiche(user) {
  if (!user) return null

  const nom = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return nom || user.email?.split('@')[0] || null
}

// Barre haute collante : bouton menu (mobile), titre de la section, compte.
function Topbar({ onOpenMenu, user }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuCompte, setMenuCompte] = useState(false)

  const nom = nomAffiche(user)
  const initiale = (nom ?? '?').charAt(0).toUpperCase()

  // Deconnexion locale : il n'y a pas d'endpoint a appeler, le JWT n'est pas
  // revocable cote serveur. Effacer la session suffit, l'intercepteur cesse
  // aussitot de poser l'en-tete, et la garde renvoie a /login.
  function deconnecter() {
    effacerSession()
    navigate('/login', { replace: true })
  }

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

      <div className="relative ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuCompte((ouvert) => !ouvert)}
          aria-expanded={menuCompte}
          aria-haspopup="menu"
          className="flex items-center gap-3 rounded-lg py-1 pl-2 text-sm transition-colors hover:bg-slate-100"
        >
          <span className="hidden max-w-40 truncate text-slate-500 sm:inline">{nom ?? '…'}</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            {initiale}
          </span>
        </button>

        {menuCompte && (
          <>
            {/* Fond transparent plein ecran : un clic ailleurs referme le menu,
                sans ecouteur pose sur le document. */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuCompte(false)}
              aria-hidden="true"
            />
            <div
              role="menu"
              className="absolute top-full right-0 z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            >
              {user?.email && (
                <p className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                  {user.email}
                </p>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={deconnecter}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Icon name="deconnexion" className="size-4" />
                Se deconnecter
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export default Topbar
