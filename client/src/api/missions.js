import { api, USE_MOCKS, notFound } from './client.js'
import { missions } from '../mocks/db.js'

// Contrats attendus cote server :
//   GET /api/missions?type=&statut=&mois=YYYY-MM&client=  -> Mission[]
//   GET /api/missions/:id                                 -> Mission (+ documents, projets)
// Les filtres sont appliques par le back en vrai ; le mock les reimplemente pour
// que l'UI de filtrage soit developpable des maintenant.

function memeMois(dateIso, mois) {
  return dateIso.slice(0, 7) === mois
}

export async function fetchMissions(filtres = {}) {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/missions', { params: filtres })
    return data
  }

  const { type, statut, mois, client } = filtres

  return missions
    .filter((m) => !type || m.type === type)
    .filter((m) => !statut || m.statut === statut)
    .filter((m) => !mois || memeMois(m.dateDebut, mois))
    .filter(
      (m) => !client || m.clientProduction.toLowerCase().includes(client.toLowerCase()),
    )
    .sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut))
}

export async function fetchMission(id) {
  if (!USE_MOCKS) {
    const { data } = await api.get(`/api/missions/${id}`)
    return data
  }

  return missions.find((m) => m.id === id) ?? notFound('Mission')
}
