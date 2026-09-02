import { api } from './client.js'

// Contrats cote server (voir ../../server/CLAUDE.md) :
//   GET    /api/portfolios                     -> PortfolioPublic[] (+ nbProjets, publicUrl)
//   POST   /api/portfolios                     -> 201 portfolio (le slug est genere par le serveur)
//   GET    /api/portfolios/:id                 -> portfolio + projets + projetsDisponibles
//   PATCH  /api/portfolios/:id                 -> titrePage et actif seulement
//   PUT    /api/portfolios/:id/projects        -> remplace toute la selection
//   DELETE /api/portfolios/:id                 -> 204
//   GET    /api/public/portfolio/:slug         -> vue publique, SANS auth
//
// La derniere est la seule route publique du site : elle ne doit jamais exiger
// de session ni renvoyer d'autre champ que ceux affiches.

export async function fetchPortfolios() {
  const { data } = await api.get('/api/portfolios')
  return data
}

export async function fetchPortfolio(id) {
  const { data } = await api.get(`/api/portfolios/${id}`)
  return data
}

// Le slug n'est pas dans le corps : le serveur le derive du titre et y ajoute
// quatre octets aleatoires, puis le fige — un lien deja partage ne doit pas
// casser. Le client se contente de l'afficher.
export async function createPortfolio(payload) {
  const { data } = await api.post('/api/portfolios', payload)
  return data
}

// Seuls `titrePage` et `actif` sont modifiables.
export async function updatePortfolio(id, champs) {
  const { data } = await api.patch(`/api/portfolios/${id}`, champs)
  return data
}

// Remplacement de la selection entiere, pas un delta : l'ordre vaut la position
// dans le tableau. C'est ce qui rend le reordonnancement idempotent — le client
// envoie la liste telle qu'elle doit etre. La reponse a la meme forme que
// fetchPortfolio(), donc la page peut s'en servir directement.
export async function updatePortfolioProjets(id, projectIds) {
  const { data } = await api.put(`/api/portfolios/${id}/projects`, { projectIds })
  return data
}

export async function deletePortfolio(id) {
  await api.delete(`/api/portfolios/${id}`)
}

export async function fetchPortfolioPublic(slug) {
  const { data } = await api.get(`/api/public/portfolio/${slug}`)
  return data
}
