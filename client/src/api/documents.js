import { api, USE_MOCKS } from './client.js'
import { documents, missions } from '../mocks/db.js'

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
