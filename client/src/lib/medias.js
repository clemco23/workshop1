// Medias d'une fiche projet : une realisation se montre avec une video, des
// photos, un PDF de dossier de presse ou un lien vers un article.
//
// ATTENTION — ce n'est pas (encore) un enum du schema. `projet.lien_video` est
// aujourd'hui un `String` requis et unique cote Prisma : une seule URL, sans
// type ni ordre. Tout le client passe donc par `mediasProjet()`, qui rend deja
// une *liste* de medias typees. Le jour ou l'API renverra un tableau `medias`
// (table `projet_media` : projet_id, type, url | fichier_path, titre, ordre),
// c'est cette seule fonction qui change — ni les cartes ni les pages.
//
// A ne pas confondre avec `document` : celui-la est le coffre prive des
// justificatifs, ces medias-ci sont publies sur /portfolio/:slug.

export const MEDIA_TYPE = {
  VIDEO: { label: 'Video', icon: 'video' },
  IMAGE: { label: 'Image', icon: 'image' },
  PDF: { label: 'PDF', icon: 'documents' },
  LIEN: { label: 'Lien', icon: 'lien' },
}

export function mediaMeta(type) {
  return MEDIA_TYPE[type] ?? MEDIA_TYPE.LIEN
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
  return 'LIEN'
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

// Liste des medias d'un projet, quelle que soit la forme rendue par l'API.
export function mediasProjet(projet) {
  if (Array.isArray(projet.medias)) return projet.medias.map(normaliser)
  if (projet.lienVideo) return [normaliser({ type: 'VIDEO', url: projet.lienVideo }, 0)]
  return []
}

// Le media mis en avant dans une vignette : le premier de la liste.
export function mediaPrincipal(projet) {
  return mediasProjet(projet)[0] ?? null
}
