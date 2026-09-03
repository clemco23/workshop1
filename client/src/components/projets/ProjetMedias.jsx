import Icon from '../ui/Icon.jsx'
import { mediaMeta, mediasProjet } from '../../lib/medias.js'

// Medias d'une fiche : video, images, PDF, liens. Chacun porte son icone *et*
// son libelle, le type n'est jamais dit par la seule forme de l'icone.
// Un media sans `url` (fichier uploade, donc `fichier_path`) n'est pas cliquable
// tant que le back ne rend pas de lien signe.
function ProjetMedias({ projet }) {
  const medias = mediasProjet(projet)

  if (medias.length === 0) {
    return <span className="text-xs text-slate-400">Aucun media</span>
  }

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {medias.map((media) => {
        const meta = mediaMeta(media.type)
        const classes =
          'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-xs'

        return (
          <li key={media.id}>
            {media.url ? (
              <a
                href={media.url}
                target="_blank"
                rel="noreferrer"
                title={`${meta.label} : ${media.titre}`}
                className={`${classes} text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700`}
              >
                <Icon name={meta.icon} className="size-3.5" />
                <span className="max-w-[9rem] truncate">{media.titre}</span>
              </a>
            ) : (
              <span
                title="Fichier stocke : pas d'adresse publique"
                className={`${classes} bg-slate-50 text-slate-400`}
              >
                <Icon name={meta.icon} className="size-3.5" />
                <span className="max-w-[9rem] truncate">{media.titre}</span>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ProjetMedias
