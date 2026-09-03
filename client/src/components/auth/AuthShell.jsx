import Icon from '../ui/Icon.jsx'
import { cn } from '../../lib/cn.js'

// Coquille des ecrans d'authentification (/login, /verify-code). Ces pages sont
// hors AppLayout, pas de sidebar avant d'etre connecte, donc elles rendent
// leur propre plein ecran, en deux volets.
//
// Le volet de gauche prend la place que tiendra la sidebar : meme logo, meme
// accent, pour que l'entree dans l'app ne soit pas un formulaire flottant sans
// identite. Il disparait sous `lg`, ou la hauteur doit aller au formulaire.

// Ce que l'app fait, dit en trois lignes. Les icones sont celles de la nav :
// l'utilisateur les retrouvera une fois connecte.
const ARGUMENTS = [
  { icon: 'missions', texte: 'Tes missions intermittence et freelance au meme endroit.' },
  { icon: 'clock', texte: 'Le seuil des 507 h suivi sur une fenetre glissante.' },
  { icon: 'portfolios', texte: 'Un portfolio public, monte a partir de tes projets.' },
]

// Meme lockup que l'en-tete de la Sidebar : c'est le repere de marque du site,
// il ne se redessine pas par ecran.
export function Marque({ sombre = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'grid size-8 place-items-center rounded-lg text-sm font-bold',
          sombre ? 'bg-white text-brand-700' : 'bg-brand-600 text-white',
        )}
      >
        E
      </span>
      <span
        className={cn(
          'text-sm font-semibold tracking-tight',
          sombre ? 'text-white' : 'text-slate-900',
        )}
      >
        Editly
      </span>
    </div>
  )
}

function AuthShell({ titre, description, children, pied }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Volet de presentation : aucun controle dedans, donc rien a atteindre
          en tabulant. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 lg:flex">
        {/* Deux halos brand-500/600 : de la profondeur sans image a charger. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-16 size-96 rounded-full bg-brand-500/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-28 size-96 rounded-full bg-brand-600/50 blur-3xl"
        />

        <div className="relative">
          <Marque sombre />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white">
            Tes missions, tes heures, tes projets.
          </h2>

          <ul className="mt-8 grid gap-4">
            {ARGUMENTS.map((argument) => (
              <li key={argument.icon} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
                  <Icon name={argument.icon} />
                </span>
                <span className="pt-1.5 text-sm text-brand-100">{argument.texte}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">v0.1 · demo</p>
      </aside>

      {/* Volet formulaire. Pas de Card : le volet de gauche structure deja la
          page, une carte de plus ferait une boite dans une boite. */}
      <main className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* La marque n'apparait ici que quand le volet de gauche est masque. */}
          <div className="mb-10 lg:hidden">
            <Marque />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titre}</h1>
          {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}

          {children}

          {pied && (
            <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-500">
              {pied}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AuthShell
