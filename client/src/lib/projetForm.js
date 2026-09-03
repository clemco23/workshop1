import { formatTaille } from './format.js'
import { estMediaEnvoye } from './medias.js'

// Formulaire de fiche projet : valeurs par defaut, validation et mise en forme
// vers le contrat de l'API. Fonctions pures, memes conventions que missionForm.js
//, les memes regles devront exister cote serveur.
//
// Champs du schema : `titre`, `description` (nullable), `tag` (ProjectTag),
// `type` (ProjectType, defaut VIDEO), `date`, `link` (requis), `mission_id`
// (nullable : une fiche perso n'a pas de mission).
//
// Le media d'une fiche arrive de deux facons, jamais des deux a la fois :
//   - `source: 'lien'`    une adresse http(s) saisie a la main (Vimeo, article) ;
//   - `source: 'fichier'` un fichier envoye en multipart, que le serveur pousse
//                         dans Storage avant d'en ranger l'URL publique dans
//                         `link`. Le schema ne connait que `link` : la source
//                         n'existe que le temps de la saisie.

// Limite de multer sur POST/PATCH /api/projects (`projectRoutes.js`).
export const TAILLE_MAX = 50 * 1024 * 1024 // 50 Mo

// Miroir de `validateFile()` cote serveur : il accepte le mimetype *ou*
// l'extension, un fichier glisse depuis certaines applis arrive sans mimetype,
// et le refuser sur ce seul motif serait incomprehensible.
export const FICHIERS = {
  IMAGE: {
    prefixe: 'image/',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    libelle: 'JPG, PNG, GIF ou WEBP',
  },
  PDF: {
    prefixe: 'application/pdf',
    extensions: ['.pdf'],
    libelle: 'PDF',
  },
  VIDEO: {
    prefixe: 'video/',
    extensions: ['.mp4', '.webm', '.mov'],
    libelle: 'MP4, WEBM ou MOV',
  },
}

// Les types qui acceptent un fichier. LINK n'en fait pas partie : le serveur
// refuse explicitement un fichier sur une fiche de ce type.
export const TYPES_FICHIER = Object.keys(FICHIERS)

function extensionDe(nom = '') {
  const point = nom.lastIndexOf('.')
  return point === -1 ? '' : nom.slice(point).toLowerCase()
}

// Valeur de l'attribut `accept` : le motif de mimetype **et** les extensions,
// parce que certains navigateurs filtrent sur l'un, d'autres sur l'autre.
export function accept(type) {
  const regle = FICHIERS[type]
  if (!regle) return undefined

  const mime = regle.prefixe.endsWith('/') ? `${regle.prefixe}*` : regle.prefixe
  return [mime, ...regle.extensions].join(',')
}

function correspond(fichier, type) {
  const regle = FICHIERS[type]
  if (!regle) return false

  const parMime = regle.prefixe.endsWith('/')
    ? fichier.type.startsWith(regle.prefixe)
    : fichier.type === regle.prefixe

  return parMime || regle.extensions.includes(extensionDe(fichier.name))
}

// Type devine a partir du fichier choisi, pour aligner le selecteur sur ce que
// l'utilisateur vient de prendre plutot que de lui faire corriger une erreur
// qu'on savait deja.
export function typeDepuisFichier(fichier) {
  if (!fichier) return null
  return TYPES_FICHIER.find((type) => correspond(fichier, type)) ?? null
}

export function validerFichier(fichier, type) {
  if (!fichier) return 'Choisis un fichier.'
  if (!FICHIERS[type]) return 'Ce type de fiche ne recoit pas de fichier.'
  if (!correspond(fichier, type)) return `${FICHIERS[type].libelle} seulement.`
  if (fichier.size === 0) return 'Ce fichier est vide.'
  if (fichier.size > TAILLE_MAX) return `Fichier trop lourd (${formatTaille(TAILLE_MAX)} maximum).`

  return null
}

export const PROJET_VIDE = {
  titre: '',
  description: '',
  tag: 'PRO',
  type: 'VIDEO', // defaut du schema
  date: '',
  // Le fichier est le chemin normal depuis qu'on sait en recevoir ; le lien
  // reste a un clic, pour une video hebergee ou un article de presse.
  source: 'fichier',
  fichier: null,
  link: '',
  missionId: '',
}

// Fiche de l'API -> valeurs du formulaire (des chaines). Comme pour les
// missions, la date arrive en ISO UTC et l'<input type="date"> attend
// 'AAAA-MM-JJ' : les dix premiers caracteres de l'ISO sont deja la date UTC,
// donc pas de passage par l'heure locale, qui decalerait d'un jour a l'ouest de
// Greenwich.
export function versFormulaire(projet) {
  const link = projet.link ?? ''

  return {
    titre: projet.titre ?? '',
    description: projet.description ?? '',
    tag: projet.tag,
    type: projet.type,
    date: projet.date ? projet.date.slice(0, 10) : '',
    source: estMediaEnvoye(link) ? 'fichier' : 'lien',
    // Un fichier deja envoye ne redescend pas dans le formulaire : `null` veut
    // dire « garde celui qui est en place », et le serveur ne remplace le media
    // que si un nouveau fichier arrive.
    fichier: null,
    link,
    missionId: projet.missionId ?? '',
  }
}

// Y a-t-il quelque chose a enregistrer ? Comparaison champ a champ, apres
// normalisation par versFormulaire. Un fichier fraichement choisi est a lui seul
// une modification, meme si tout le reste est identique.
export function estModifie(formulaire, projet) {
  if (formulaire.fichier) return true

  const initial = versFormulaire(projet)
  return Object.keys(initial).some(
    (cle) => cle !== 'fichier' && initial[cle] !== formulaire[cle],
  )
}

// Le lien part sur une page publique : n'accepter que http(s), pour ne pas
// laisser passer un `javascript:` ou un chemin local qui ne mene nulle part.
function lienValide(valeur) {
  try {
    const url = new URL(valeur)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// `edition` : une fiche qui a deja son media n'a pas a en refournir un. A la
// creation, en revanche, il faut bien l'un ou l'autre, le serveur refuse une
// fiche sans `link`.
export function validerProjet(formulaire, { edition = false } = {}) {
  const lien = formulaire.link.trim()
  const parFichier = formulaire.source === 'fichier'

  const erreurs = {
    titre: formulaire.titre.trim() === '' ? 'Donne un titre a la fiche.' : null,
    date: formulaire.date === '' ? 'Date obligatoire.' : null,
    fichier:
      !parFichier || (edition && formulaire.fichier == null)
        ? null
        : validerFichier(formulaire.fichier, formulaire.type),
    link: parFichier
      ? null
      : lien === ''
        ? 'Lien obligatoire.'
        : lienValide(lien)
          ? null
          : 'Adresse invalide : elle doit commencer par http:// ou https://.',
  }

  return { erreurs, valide: Object.values(erreurs).every((e) => e == null) }
}

// Champs communs aux deux formes d'envoi. `mission_id` vide = fiche personnelle.
function champs(formulaire) {
  const description = formulaire.description.trim()

  return {
    titre: formulaire.titre.trim(),
    description,
    tag: formulaire.tag,
    type: formulaire.type,
    date: new Date(`${formulaire.date}T00:00:00.000Z`).toISOString(),
    missionId: formulaire.missionId,
  }
}

// Corps attendu par POST/PATCH /api/projects quand la fiche pointe une adresse :
// du JSON, multer laisse passer les requetes non-multipart.
export function versPayload(formulaire) {
  const { description, missionId, ...reste } = champs(formulaire)

  return {
    ...reste,
    description: description === '' ? null : description,
    link: formulaire.link.trim(),
    missionId: missionId === '' ? null : missionId,
  }
}

// Corps attendu quand un fichier est joint : `multipart/form-data`, champ `file`,
// le serveur se charge du depot dans Storage et ecrit `link` lui-meme.
//
// FormData ne transporte pas de `null` : les champs vides partent en chaines
// vides, que le serveur ramene a `null` (`body.description?.trim() || null`,
// `validateMissionId(...)` sur une chaine vide).
export function versFormData(formulaire) {
  const corps = new FormData()

  for (const [cle, valeur] of Object.entries(champs(formulaire))) {
    corps.append(cle, valeur)
  }
  if (formulaire.fichier) corps.append('file', formulaire.fichier)

  return corps
}
