import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { PROJET_TAG, enumMeta } from '../../lib/enums.js'
import { formatDate } from '../../lib/format.js'
import { mediasProjet } from '../../lib/medias.js'

// Projets retenus sur la page, dans l'ordre de la table de jonction
// (`portfolio_public_projet.ordre`). Monter / descendre / retirer sont dessines
// mais inactifs : PUT /api/portfolios/:id/projets n'est pas ecrit, et un
// reordonnancement qui ne survit pas au rechargement serait un piege.
function PortfolioSelection({ projets }) {
  if (projets.length === 0) {
    return (
      <EmptyState
        icon="portfolios"
        title="Aucun projet sur cette page"
        description="Ajoute des fiches depuis la liste des projets disponibles : elles s'afficheront dans cet ordre sur la page publique."
      />
    )
  }

  return (
    <ol className="divide-y divide-slate-100">
      {projets.map((projet, index) => {
        const tag = enumMeta(PROJET_TAG, projet.tag)

        return (
          <li key={projet.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
            {/* La position affichee est celle du contrat, pas l'index de rendu. */}
            <span className="w-6 shrink-0 text-center text-xs font-medium text-slate-400 tabular-nums">
              {projet.ordre}
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
                disabled
                title="Reordonnancement a venir"
                className="rounded p-1 text-slate-300 disabled:pointer-events-none"
              >
                <Icon name="chevronUp" className="size-4" />
                <span className="sr-only">Monter {projet.titre}</span>
              </button>
              <button
                type="button"
                disabled
                title="Reordonnancement a venir"
                className="rounded p-1 text-slate-300 disabled:pointer-events-none"
              >
                <Icon name="chevronDown" className="size-4" />
                <span className="sr-only">Descendre {projet.titre}</span>
              </button>
              <button
                type="button"
                disabled
                title="Retrait a venir"
                className="rounded p-1 text-slate-300 disabled:pointer-events-none"
              >
                <Icon name="close" className="size-4" />
                <span className="sr-only">Retirer {projet.titre} de la page</span>
              </button>
            </div>

            {/* index sert uniquement au marquage du premier/dernier, pas a l'ordre. */}
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
