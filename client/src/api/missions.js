import { api } from './client.js'

// Contrats cote server (voir ../../server/CLAUDE.md) :
//   GET    /api/missions?type=&statut=&mois=YYYY-MM&client=  -> Mission[]
//   POST   /api/missions                                     -> 201 Mission
//   GET    /api/missions/:id                                 -> Mission (+ documents, projects)
//   PATCH  /api/missions/:id                                 -> Mission (mise a jour partielle)
//   DELETE /api/missions/:id                                 -> 204
//
// Le filtre `mois` porte sur `dateDebut` : une mission commencee le mois d'avant
// et toujours en cours n'y apparait pas.

export async function fetchMissions(filtres = {}) {
  const { data } = await api.get('/api/missions', { params: filtres })
  return data
}

export async function fetchMission(id) {
  const { data } = await api.get(`/api/missions/${id}`)
  return data
}

export async function createMission(payload) {
  const { data } = await api.post('/api/missions', payload)
  return data
}

// PATCH et non PUT : seuls les champs presents dans le corps sont valides et
// ecrits. Envoyer le payload entier reste valable, c'est ce que fait le
// formulaire, qui tient tous les champs.
export async function updateMission(id, payload) {
  const { data } = await api.patch(`/api/missions/${id}`, payload)
  return data
}

// 204 sans corps : rien a renvoyer.
export async function deleteMission(id) {
  await api.delete(`/api/missions/${id}`)
}
