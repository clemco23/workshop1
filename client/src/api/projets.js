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
// (champ `file`, multipart). Le formulaire du client ne fournit qu'un `link`, on
// envoie donc du JSON — multer laisse passer les requetes non-multipart.

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
