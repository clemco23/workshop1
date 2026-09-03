import Icon from '../ui/Icon.jsx'
import { estFichierDirect, mediaMeta, mediaPrincipal } from '../../lib/medias.js'

// Le media de la fiche, montre et non seulement liste. C'est la contrepartie de
// l'envoi de fichiers : une image deposee doit s'afficher, un PDF se feuilleter,
// une video se lire — sinon rien ne distingue une fiche alimentee d'une fiche
// qui pointe une adresse morte.
//
// Seuls les fichiers *directs* sont rendus (cf. `estFichierDirect`) : une video
// Vimeo ou YouTube a une URL de page, pas de fichier, et l'embarquer demanderait
// une URL de lecteur par hebergeur. Ces medias-la restent des liens, rendus par
// ProjetMediasListe.
//
// Tout est en *flux bloc* ici, sans grille ni flex : une video HD ou une photo
// pleine resolution est un element remplace, et sa largeur intrinseque (1920 px)
// fait eclater une piste de grille, qui se dimensionne sur le contenu. Une boite
// bloc, elle, tient sa largeur de son conteneur et ne peut pas la depasser — le
// `overflow-hidden` et le `max-w-full` ne sont alors qu'une double securite.
// (cf. CLAUDE.md, Debordement horizontal)

const CADRE = 'w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50'

function ProjetMediaApercu({ projet }) {
  const media = mediaPrincipal(projet)
  if (!media?.url || !estFichierDirect(media.url, media.type)) return null

  const meta = mediaMeta(media.type)

  if (media.type === 'IMAGE') {
    return (
      <div className={CADRE}>
        {/* `max-h` plutot qu'un ratio fixe : une affiche verticale et une
            photo de plateau doivent tenir dans la carte sans etre rognees. */}
        <img
          src={media.url}
          alt={projet.titre}
          loading="lazy"
          className="mx-auto block max-h-[26rem] max-w-full object-contain"
        />
      </div>
    )
  }

  if (media.type === 'VIDEO') {
    return (
      <div className={CADRE}>
        {/* Pas d'`autoPlay` : la lecture est une decision du visiteur.
            `object-contain` (defaut d'une <video>) met le cadrage en boite aux
            lettres quand le ratio ne tombe pas juste. */}
        <video
          src={media.url}
          controls
          preload="metadata"
          className="block max-h-[26rem] w-full max-w-full"
        />
      </div>
    )
  }

  if (media.type === 'PDF') {
    return (
      <div>
        {/* Le lecteur PDF est celui du navigateur, et certains n'en ont pas :
            le lien de secours n'est pas decoratif. */}
        <iframe
          src={media.url}
          title={`${meta.label} — ${projet.titre}`}
          className={`${CADRE} h-[26rem]`}
        />
        <a
          href={media.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-600"
        >
          <Icon name="download" className="size-3.5" />
          Ouvrir le PDF dans un onglet
        </a>
      </div>
    )
  }

  return null
}

export default ProjetMediaApercu
