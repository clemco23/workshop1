import Icon from '../ui/Icon.jsx'
import Badge from '../ui/Badge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { mediaMeta, mediasProjet } from '../../lib/medias.js'

// Version detaillee de ProjetMedias : une ligne par media, avec son type ecrit.
// Pas de vignette : un media uploade n'a qu'un `fichier_path`, et c'est le back
// qui rendra le lien signe — le client ne fabrique jamais l'URL.
function ProjetMediasListe({ projet }) {
  const medias = mediasProjet(projet)

  if (medias.length === 0) {
    return (
      <EmptyState
        icon="projets"
        title="Aucun media"
        description="Video, images, PDF ou lien : c'est ce qui donne a voir la realisation."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {medias.map((media) => {
        const meta = mediaMeta(media.type)

        return (
          <li
            key={media.id}
            className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="shrink-0 rounded-lg bg-slate-100 p-1.5 text-slate-500">
              <Icon name={meta.icon} className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{media.titre}</p>
              <p className="truncate text-xs text-slate-500">
                {media.url ?? 'Fichier stocke — lien signe a venir du serveur'}
              </p>
            </div>

            <Badge tone="neutral" className="shrink-0">
              {meta.label}
            </Badge>

            {media.url && (
              <a
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:text-brand-700"
                title={`Ouvrir : ${media.titre}`}
              >
                <Icon name="lien" className="size-4" />
                <span className="sr-only">Ouvrir {media.titre}</span>
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ProjetMediasListe
