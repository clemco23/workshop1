import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { PROJET_TAG, enumMeta } from '../../lib/enums.js'
import { formatDate } from '../../lib/format.js'
import { mediasProjet } from '../../lib/medias.js'

// Fiches projet issues de cette mission (projet.mission_id, nullable : un projet
// perso n'en a pas).
function MissionProjets({ projets }) {
  if (projets.length === 0) {
    return (
      <EmptyState
        icon="projets"
        title="Aucune fiche projet"
        description="Les realisations issues de cette mission se rattachent ici, et peuvent ensuite figurer dans un portfolio."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {projets.map((projet) => {
        const tag = enumMeta(PROJET_TAG, projet.tag)

        return (
          <li key={projet.id} className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <Link
                to={`/projets/${projet.id}`}
                className="text-sm font-medium text-slate-900 transition-colors group-hover:text-brand-700"
              >
                {projet.titre}
              </Link>
              <p className="truncate text-xs text-slate-500">
                {formatDate(projet.date)}
                {projet.description ? ` · ${projet.description}` : ''}
              </p>
            </div>

            <span className="text-xs whitespace-nowrap text-slate-400">
              {mediasProjet(projet).length} media(s)
            </span>

            <Badge tone={tag.tone}>{tag.label}</Badge>
          </li>
        )
      })}
    </ul>
  )
}

export default MissionProjets
