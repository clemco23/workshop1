import { api, USE_MOCKS } from './client.js'
import { ajouterDocument, documents, missions } from '../mocks/db.js'

// Contrats attendus cote server :
//   GET /api/documents?categorie=&missionId=  -> Document[]
//   POST /api/documents (multipart)           -> Document      (upload, a faire)
//   GET /api/documents/:id/url                -> { url }       (lien signe de telechargement)
//
// `fichier_path` est un chemin de stockage, pas une URL : le back devra rendre
// un lien signe, le client ne construit jamais l'URL lui-meme.

export async function fetchDocuments(filtres = {}) {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/documents', { params: filtres })
    return data
  }

  const { categorie, missionId } = filtres

  return documents
    .filter((d) => !categorie || d.categorie === categorie)
    .filter((d) => !missionId || d.missionId === missionId)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    // Confort d'affichage : le nom du client de la mission liee, quand il y en a.
    .map((d) => ({
      ...d,
      mission: d.missionId ? (missions.find((m) => m.id === d.missionId) ?? null) : null,
    }))
}

// Depot d'un justificatif.
//
// Contrat attendu de POST /api/documents, en `multipart/form-data` :
//   file       le fichier (le serveur en tire nom_original, taille, mime_type)
//   categorie  valeur de DocumentCategory
//   missionId  facultatif — mission_id est nullable
// Reponse : le Document cree.
//
// C'est au serveur de decider `fichier_path` et de deposer le fichier dans un
// bucket **prive** : contrairement aux medias de projet, un justificatif ne doit
// jamais avoir d'URL publique.
export async function createDocument({ fichier, categorie, missionId }) {
  if (!USE_MOCKS) {
    const corps = new FormData()
    corps.append('file', fichier)
    corps.append('categorie', categorie)
    if (missionId) corps.append('missionId', missionId)

    // Pas de Content-Type pose a la main : axios doit ecrire lui-meme la
    // frontiere du multipart.
    const { data } = await api.post('/api/documents', corps)
    return data
  }

  return ajouterDocument({
    categorie,
    missionId,
    nomOriginal: fichier.name,
    taille: fichier.size,
    mimeType: fichier.type,
  })
}
