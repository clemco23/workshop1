import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { PROJET_TAG, enumMeta } from '../../lib/enums.js'
import { formatDate } from '../../lib/format.js'
import { mediasProjet } from '../../lib/medias.js'

// Projets retenus sur la page, dans l'ordre ou ils y paraitront.
//
// Composant controle : il ne tient aucun etat, la page detient la liste et
// applique monter / descendre / retirer. C'est ce qui permet d'enchainer
// plusieurs reordonnancements avant un seul `PUT /:id/projects` — l'endpoint
// remplace la selection entiere, envoyer un appel par fleche serait a la fois
// bavard et faux si l'un d'eux echouait.
//
// La position affichee est l'index de la liste, pas le champ `ordre` renvoye par
// le serveur : tant que la selection n'est pas enregistree, c'est l'ordre a
// l'ecran qui fait foi.
function PortfolioSelection({ projets, onMonter, onDescendre, onRetirer }) {
  if (projets.length === 0) {
    return (
      <EmptyState
        icon="portfolios"
        title="Aucun projet sur cette page"
        description="Ajoute des fiches depuis la liste des projets disponibles : elles s'afficheront dans cet ordre sur la page publique."
      />
    )
  }

  const bouton =
    'rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30'

  return (
    <ol className="divide-y divide-slate-100">
      {projets.map((projet, index) => {
        const tag = enumMeta(PROJET_TAG, projet.tag)

        return (
          <li key={projet.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="w-6 shrink-0 text-center text-xs font-medium text-slate-400 tabular-nums">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{projet.titre}</p>
              <p className="truncate text-xs text-slate-500">
                {formatDate(projet.date)} · {mediasProjet(projet).length} media(s)
              </p>
            </div>

            <Badge tone={tag.tone} className="shrink-0">
              {tag.label}
            </Badge>

            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onMonter(index)}
                disabled={index === 0}
                title="Monter"
                className={bouton}
              >
                <Icon name="chevronUp" className="size-4" />
                <span className="sr-only">Monter {projet.titre}</span>
              </button>
              <button
                type="button"
                onClick={() => onDescendre(index)}
                disabled={index === projets.length - 1}
                title="Descendre"
                className={bouton}
              >
                <Icon name="chevronDown" className="size-4" />
                <span className="sr-only">Descendre {projet.titre}</span>
              </button>
              <button
                type="button"
                onClick={() => onRetirer(projet.id)}
                title="Retirer de la page"
                className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Icon name="close" className="size-4" />
                <span className="sr-only">Retirer {projet.titre} de la page</span>
              </button>
            </div>

            <span className="sr-only">
              Position {index + 1} sur {projets.length}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default PortfolioSelection
