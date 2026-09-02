import { api } from './client.js'

// Contrats cote server (voir ../../server/CLAUDE.md) :
//   GET    /api/documents?categorie=&missionId=  -> Document[] (+ mission liee)
//   POST   /api/documents                        -> 201 Document  (multipart)
//   GET    /api/documents/:id                    -> Document
//   GET    /api/documents/:id/url                -> { url }       (lien signe, 1 h)
//   PATCH  /api/documents/:id                    -> Document      (multipart si `file`)
//   DELETE /api/documents/:id                    -> 204 (supprime aussi le fichier)
//
// `missionId=aucune` liste les documents non rattaches.
//
// `fichierPath` est un chemin de stockage, pas une URL : le coffre est prive, le
// client ne fabrique jamais l'adresse d'un justificatif — il demande un lien
// signe a `documentUrl()`.

export async function fetchDocuments(filtres = {}) {
  const { data } = await api.get('/api/documents', { params: filtres })
  return data
}

// Depot d'un justificatif, en `multipart/form-data` :
//   file       le fichier (le serveur en tire nomOriginal, taille, mimeType)
//   categorie  valeur de DocumentCategory
//   missionId  facultatif — mission_id est nullable
export async function createDocument({ fichier, categorie, missionId }) {
  const corps = new FormData()
  corps.append('file', fichier)
  corps.append('categorie', categorie)
  if (missionId) corps.append('missionId', missionId)

  // Pas de Content-Type pose a la main : axios doit ecrire lui-meme la
  // frontiere du multipart.
  const { data } = await api.post('/api/documents', corps)
  return data
}

// Lien de telechargement, signe et valable une heure. Redemande a chaque clic
// plutot que garde en memoire : un lien perime ne doit jamais etre presente.
export async function documentUrl(id) {
  const { data } = await api.get(`/api/documents/${id}/url`)
  return data.url
}

export async function deleteDocument(id) {
  await api.delete(`/api/documents/${id}`)
}
