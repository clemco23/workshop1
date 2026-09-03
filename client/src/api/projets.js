import { api } from './client.js'

// Contrats cote server (voir ../../server/CLAUDE.md) :
//   GET    /api/projects?tag=&type=&missionId=  -> Project[] (+ mission liee)
//   POST   /api/projects                        -> 201 Project
//   GET    /api/projects/:id                    -> Project (+ mission, + portfolios)
//   PATCH  /api/projects/:id                    -> Project
//   DELETE /api/projects/:id                    -> 204 (supprime aussi le media)
//
// `missionId=aucune` liste les fiches sans mission. La route est cote serveur en
// `/projects` (anglais), pas `/projets` : seule l'URL du client est en francais.
//
// Ecriture : le serveur monte multer sur POST et PATCH pour accepter un fichier
// (champ `file`, multipart, 50 Mo). `createProjet` et `updateProjet` prennent
// donc indifferemment un objet, envoye en JSON, multer laisse passer les
// requetes non-multipart, ou le FormData de `versFormData()` quand la fiche est
// alimentee par un fichier. Axios pose lui-meme la frontiere du multipart : ne
// jamais fixer Content-Type a la main.
//
// Le media d'un projet part dans un bucket *public* (`uploadProjectMedia` en
// renvoie l'URL publique, rangee dans `link`) : contrairement aux justificatifs
// de `document`, il n'y a pas de lien signe a demander.

export async function fetchProjets(filtres = {}) {
  const { data } = await api.get('/api/projects', { params: filtres })
  return data
}

export async function fetchProjet(id) {
  const { data } = await api.get(`/api/projects/${id}`)
  return data
}

export async function createProjet(payload) {
  const { data } = await api.post('/api/projects', payload)
  return data
}

export async function updateProjet(id, payload) {
  const { data } = await api.patch(`/api/projects/${id}`, payload)
  return data
}

export async function deleteProjet(id) {
  await api.delete(`/api/projects/${id}`)
}
