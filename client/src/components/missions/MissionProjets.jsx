import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { PROJET_TAG, enumMeta } from '../../lib/enums.js'
import { formatDate } from '../../lib/format.js'

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

            <Badge tone={tag.tone}>{tag.label}</Badge>

            {projet.lienVideo && (
              <a
                href={projet.lienVideo}
                target="_blank"
                rel="noreferrer"
                className="rounded p-1 text-slate-400 transition-colors hover:text-brand-700"
                title="Ouvrir la video"
              >
                <Icon name="lien" className="size-4" />
                <span className="sr-only">Ouvrir la video de {projet.titre}</span>
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default MissionProjets
