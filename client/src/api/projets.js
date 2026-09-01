import { api, USE_MOCKS, notFound } from './client.js'
import { missions, projets } from '../mocks/db.js'

// Contrats attendus cote server :
//   GET /api/projets?tag=  -> Projet[]
//   GET /api/projets/:id   -> Projet (+ mission liee)

export async function fetchProjets(filtres = {}) {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/projets', { params: filtres })
    return data
  }

  const { tag } = filtres

  return projets
    .filter((p) => !tag || p.tag === tag)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function fetchProjet(id) {
  if (!USE_MOCKS) {
    const { data } = await api.get(`/api/projets/${id}`)
    return data
  }

  const projet = projets.find((p) => p.id === id)
  if (!projet) return notFound('Projet')

  return {
    ...projet,
    mission: projet.missionId ? (missions.find((m) => m.id === projet.missionId) ?? null) : null,
  }
}
