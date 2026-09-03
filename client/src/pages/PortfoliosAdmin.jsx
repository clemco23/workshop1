import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PortfolioFormModal from '../components/portfolios/PortfolioFormModal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { deletePortfolio, fetchPortfolios } from '../api/portfolios.js'
import { formatDate } from '../lib/format.js'

export async function loader() {
  return { portfolios: await fetchPortfolios() }
}

function PortfoliosAdmin() {
  const { portfolios } = useLoaderData()
  const revalidator = useRevalidator()
  const navigate = useNavigate()
  const [creation, setCreation] = useState(false)
  const [aSupprimer, setASupprimer] = useState(null)

  return (
    <>
      <PageHeader
        title="Portfolios"
        subtitle={`${portfolios.length} page(s) publique(s), une selection ordonnee de fiches projet`}
      >
        <Button onClick={() => setCreation(true)}>
          <Icon name="plus" className="size-4" />
          Nouvelle page
        </Button>
      </PageHeader>

      {/* Une page nait vide : on emmene directement sur sa fiche, ou se fait la
          selection des projets : sans ca, la carte ajoutee dirait « 0 projet »
          sans dire ou les ajouter. */}
      <PortfolioFormModal
        ouvert={creation}
        onClose={() => setCreation(false)}
        onCree={(portfolio) => navigate(`/portfolios/${portfolio.id}`)}
      />

      <ConfirmDialog
        ouvert={aSupprimer != null}
        onClose={() => setASupprimer(null)}
        onConfirmer={async () => {
          await deletePortfolio(aSupprimer.id)
          revalidator.revalidate()
        }}
        titre="Supprimer cette page ?"
        description={`« ${aSupprimer?.titrePage ?? aSupprimer?.slug} » sera retiree et son adresse publique cessera de repondre. Tes fiches projet, elles, sont conservees.`}
      />

      {portfolios.length === 0 ? (
        <Card>
          <EmptyState
            icon="portfolios"
            title="Aucune page publique"
            description="Une page publique rassemble les fiches projet que tu veux montrer, dans l'ordre de ton choix, sous une adresse partageable."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {portfolios.map((portfolio) => (
            <article
              key={portfolio.id}
              className="group flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-sm font-semibold text-slate-900">
                  <Link
                    to={`/portfolios/${portfolio.id}`}
                    className="break-words transition-colors group-hover:text-brand-700"
                  >
                    {/* titre_page est nullable : le slug fait alors office de titre. */}
                    {portfolio.titrePage ?? portfolio.slug}
                  </Link>
                </h2>
                {/* `actif` decide si l'adresse publique repond ou renvoie un 404. */}
                <Badge tone={portfolio.actif ? 'success' : 'neutral'} className="shrink-0">
                  {portfolio.actif ? 'En ligne' : 'Hors ligne'}
                </Badge>
              </div>

              <p className="mt-1 truncate text-xs text-slate-500">/portfolio/{portfolio.slug}</p>

              <p className="mt-3 flex-1 text-sm text-slate-600">
                {portfolio.nbProjets} projet(s) selectionne(s)
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">
                  Creee le {formatDate(portfolio.createdAt)}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setASupprimer(portfolio)}
                    title="Supprimer la page"
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Icon name="corbeille" className="size-3.5" />
                    <span className="sr-only">
                      Supprimer {portfolio.titrePage ?? portfolio.slug}
                    </span>
                  </button>
                  {/* Pas de lien quand la page est hors ligne : l'adresse
                      publique repond 404 (cf. fetchPortfolioPublic). */}
                  {portfolio.actif && (
                    <Link
                      to={`/portfolio/${portfolio.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-brand-700"
                    >
                      <Icon name="lien" className="size-3.5" />
                      Voir
                    </Link>
                  )}
                  <Link
                    to={`/portfolios/${portfolio.id}`}
                    className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-600"
                  >
                    Gerer
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

export default PortfoliosAdmin
