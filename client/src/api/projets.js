import { api, USE_MOCKS, notFound } from './client.js'
import { missions, portfolioProjets, portfolios, projets } from '../mocks/db.js'

// Contrats attendus cote server :
//   GET /api/projets?tag=&missionId=  -> Projet[]
//   GET /api/projets/:id   -> Projet (+ mission liee, + portfolios ou il figure)

export async function fetchProjets(filtres = {}) {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/projets', { params: filtres })
    return data
  }

  const { tag, missionId } = filtres

  return projets
    .filter((p) => !tag || p.tag === tag)
    .filter((p) => !missionId || p.missionId === missionId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    // Confort d'affichage : la mission liee, quand il y en a une (mission_id est
    // nullable — un projet perso n'en a pas). Meme forme que fetchDocuments.
    .map((p) => ({
      ...p,
      mission: p.missionId ? (missions.find((m) => m.id === p.missionId) ?? null) : null,
    }))
}

export async function fetchProjet(id) {
  if (!USE_MOCKS) {
    const { data } = await api.get(`/api/projets/${id}`)
    return data
  }

  const projet = projets.find((p) => p.id === id)
  if (!projet) return notFound('Projet')

  // Les portfolios ou la fiche figure : c'est la finalite d'un projet, et ca dit
  // a l'utilisateur si la fiche est publique ou non.
  const publiee = portfolioProjets
    .filter((lien) => lien.projetId === projet.id)
    .map((lien) => {
      const portfolio = portfolios.find((p) => p.id === lien.portfolioPublicId)
      return portfolio ? { ...portfolio, ordre: lien.ordre } : null
    })
    .filter(Boolean)

  return {
    ...projet,
    mission: projet.missionId ? (missions.find((m) => m.id === projet.missionId) ?? null) : null,
    portfolios: publiee,
  }
}
