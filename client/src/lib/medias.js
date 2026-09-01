import { PROJET_TYPE, enumMeta } from './enums.js'

// Medias d'une fiche projet : une realisation se montre avec une video, des
// photos, un PDF de dossier de presse ou un lien vers un article.
//
// Le schema ne stocke qu'un media par fiche : `projet.type` (enum ProjectType :
// IMAGE / PDF / VIDEO / LINK) et `projet.link`. Tout le client passe malgre tout
// par `mediasProjet()`, qui rend une *liste* : le jour ou l'API renverra un
// tableau `medias` (table `projet_media` : projet_id, type, url | fichier_path,
// titre, ordre), c'est cette seule fonction qui change — ni les cartes ni les pages.
//
// A ne pas confondre avec `document` : celui-la est le coffre prive des
// justificatifs, ces medias-ci sont publies sur /portfolio/:slug.

// Les libelles viennent de PROJET_TYPE (miroir de l'enum serveur) : un seul
// endroit ou les traduire. Ici on n'ajoute que l'icone du dictionnaire d'Icon.
const ICONES = {
  IMAGE: 'image',
  PDF: 'documents',
  VIDEO: 'video',
  LINK: 'lien',
}

export function mediaMeta(type) {
  const meta = enumMeta(PROJET_TYPE, type)
  return { ...meta, icon: ICONES[type] ?? 'lien' }
}

const EXTENSIONS_IMAGE = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']
const HEBERGEURS_VIDEO = ['youtube.', 'youtu.be', 'vimeo.', 'dailymotion.']

// Repli quand le media n'annonce pas son type (cas du `lien_video` actuel, qui
// n'en porte aucun) : on le devine a l'URL.
export function typeMediaDepuisUrl(url = '') {
  const minuscule = url.toLowerCase()

  if (minuscule.endsWith('.pdf')) return 'PDF'
  if (EXTENSIONS_IMAGE.some((extension) => minuscule.endsWith(extension))) return 'IMAGE'
  if (HEBERGEURS_VIDEO.some((hote) => minuscule.includes(hote))) return 'VIDEO'
  return 'LINK'
}

function normaliser(media, index) {
  const type = media.type ?? typeMediaDepuisUrl(media.url)

  return {
    // Un media uploade n'aura pas d'URL mais un `fichier_path` : comme pour les
    // documents, c'est le back qui rendra le lien signe, jamais le client.
    id: media.id ?? `${index}-${media.url ?? media.fichierPath}`,
    type,
    url: media.url ?? null,
    fichierPath: media.fichierPath ?? null,
    titre: media.titre ?? mediaMeta(type).label,
  }
}

// Liste des medias d'un projet, quelle que soit la forme rendue par l'API :
// le tableau `medias` s'il existe un jour, sinon le couple `type` + `link` du
// schema actuel. `type` a une valeur par defaut cote Prisma, mais on retombe
// quand meme sur la deduction par l'URL s'il manque.
export function mediasProjet(projet) {
  if (Array.isArray(projet.medias)) return projet.medias.map(normaliser)
  if (projet.link) return [normaliser({ type: projet.type, url: projet.link }, 0)]
  return []
}

// Le media mis en avant dans une vignette : le premier de la liste.
export function mediaPrincipal(projet) {
  return mediasProjet(projet)[0] ?? null
}
