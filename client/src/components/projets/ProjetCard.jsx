import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import ProjetMedias from './ProjetMedias.jsx'
import { PROJET_TAG, enumMeta } from '../../lib/enums.js'
import { formatDate } from '../../lib/format.js'

// Fiche projet en carte : c'est la matiere du portfolio public, donc la vignette
// prime sur la ligne de tableau. `description` est nullable, `mission_id` aussi
// (projet perso). Les medias passent par ProjetMedias : une realisation se montre
// avec une video, des images, un PDF ou un lien, jamais une seule URL en dur.
function ProjetCard({ projet }) {
  const tag = enumMeta(PROJET_TAG, projet.tag)

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          <Link
            to={`/projets/${projet.id}`}
            className="transition-colors group-hover:text-brand-700"
          >
            {projet.titre}
          </Link>
        </h3>
        <Badge tone={tag.tone}>{tag.label}</Badge>
      </div>

      <p className="mt-1 text-xs text-slate-500 tabular-nums">{formatDate(projet.date)}</p>

      <p className="mt-3 flex-1 text-sm text-slate-600">
        {projet.description ?? (
          <span className="text-slate-400">Pas encore de description.</span>
        )}
      </p>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <ProjetMedias projet={projet} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {projet.mission ? (
          <Link
            to={`/missions/${projet.mission.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-brand-700"
          >
            <Icon name="missions" className="size-3.5" />
            {projet.mission.clientProduction}
          </Link>
        ) : (
          <span className="text-xs text-slate-400">Sans mission liee</span>
        )}

        <Link
          to={`/projets/${projet.id}`}
          className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-600"
        >
          Ouvrir la fiche
        </Link>
      </div>
    </article>
  )
}

export default ProjetCard
