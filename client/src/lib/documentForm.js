import { formatTaille } from './format.js'

// Depot d'un justificatif : contraintes du fichier et validation, en fonctions
// pures. Memes conventions que missionForm.js / projetForm.js, le serveur
// devra appliquer les memes bornes, ce qui est ici sert au retour immediat.

export const TAILLE_MAX = 10 * 1024 * 1024 // 10 Mo

// Un justificatif est un contrat, une attestation, un devis ou une facture :
// du PDF, ou une photo quand le document a ete scanne au telephone. Pas de
// bureautique (.docx, .xlsx) : ce coffre garde des pieces figees, pas des
// documents de travail.
export const TYPES_ACCEPTES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
}

const EXTENSIONS = Object.values(TYPES_ACCEPTES).flat()

// Valeur de l'attribut `accept` : les mimetypes **et** les extensions, parce que
// certains navigateurs filtrent sur l'un, d'autres sur l'autre.
export const ACCEPT = [...Object.keys(TYPES_ACCEPTES), ...EXTENSIONS].join(',')

export const LIBELLE_TYPES = 'PDF, PNG, JPG ou WEBP'

function extensionDe(nom) {
  const point = nom.lastIndexOf('.')
  return point === -1 ? '' : nom.slice(point).toLowerCase()
}

export function validerFichier(fichier) {
  if (!fichier) return 'Choisis un fichier.'

  // Le mimetype peut manquer (fichier glisse depuis certaines applis) : on
  // retombe alors sur l'extension plutot que de refuser un fichier valable.
  const typeConnu = Object.hasOwn(TYPES_ACCEPTES, fichier.type)
  if (!typeConnu && !EXTENSIONS.includes(extensionDe(fichier.name))) {
    return `${LIBELLE_TYPES} seulement.`
  }

  if (fichier.size === 0) return 'Ce fichier est vide.'
  if (fichier.size > TAILLE_MAX) return `Fichier trop lourd (${formatTaille(TAILLE_MAX)} maximum).`

  return null
}
