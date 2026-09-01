import { api, USE_MOCKS, notFound } from './client.js'
import { portfolioProjets, portfolios, projets, user } from '../mocks/db.js'

// Contrats attendus cote server :
//   GET /api/portfolios                    -> PortfolioPublic[]
//   GET /api/portfolios/:id                -> PortfolioPublic + projets ordonnes
//   PUT /api/portfolios/:id/projets        -> reordonnancement (a faire)
//   GET /api/public/portfolio/:slug        -> vue publique, SANS auth
//
// La derniere est la seule route publique du site (cf. CLAUDE.md) : elle ne doit
// jamais exiger de session ni fuiter d'autre champ que ceux affiches.

// Projets d'un portfolio, dans l'ordre de la table de jonction.
function projetsDuPortfolio(portfolioId) {
  return portfolioProjets
    .filter((lien) => lien.portfolioPublicId === portfolioId)
    .sort((a, b) => a.ordre - b.ordre)
    .map((lien) => ({
      ordre: lien.ordre,
      ...projets.find((p) => p.id === lien.projetId),
    }))
}

export async function fetchPortfolios() {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/portfolios')
    return data
  }

  return portfolios.map((p) => ({ ...p, nbProjets: projetsDuPortfolio(p.id).length }))
}

export async function fetchPortfolio(id) {
  if (!USE_MOCKS) {
    const { data } = await api.get(`/api/portfolios/${id}`)
    return data
  }

  const portfolio = portfolios.find((p) => p.id === id)
  if (!portfolio) return notFound('Portfolio')

  // `projetsDisponibles` : ceux que l'utilisateur peut encore ajouter a la page.
  const selectionnes = projetsDuPortfolio(portfolio.id)
  const idsSelectionnes = new Set(selectionnes.map((p) => p.id))

  return {
    ...portfolio,
    projets: selectionnes,
    projetsDisponibles: projets.filter((p) => !idsSelectionnes.has(p.id)),
  }
}

export async function fetchPortfolioPublic(slug) {
  if (!USE_MOCKS) {
    const { data } = await api.get(`/api/public/portfolio/${slug}`)
    return data
  }

  const portfolio = portfolios.find((p) => p.slug === slug && p.actif)
  if (!portfolio) return notFound('Portfolio')

  return {
    slug: portfolio.slug,
    titrePage: portfolio.titrePage,
    auteur: `${user.firstName} ${user.lastName}`, // pas d'email en public
    projets: projetsDuPortfolio(portfolio.id).map(({ titre, description, date, link, tag }) => ({
      titre,
      description,
      date,
      link,
      tag,
    })),
  }
}
