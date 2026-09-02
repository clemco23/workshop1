import { Link, useLoaderData } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import Input from '../components/ui/Input.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PortfolioSelection from '../components/portfolios/PortfolioSelection.jsx'
import { fetchPortfolio } from '../api/portfolios.js'
import { PROJET_TAG, enumMeta } from '../lib/enums.js'
import { formatDate } from '../lib/format.js'

// Portfolio inconnu -> fetchPortfolio jette une Response 404 (cf. api/client.js).
export async function loader({ params }) {
  return { portfolio: await fetchPortfolio(params.id) }
}

function PortfolioAdminDetail() {
  const { portfolio } = useLoaderData()
  const { projets, projetsDisponibles } = portfolio

  return (
    <>
      <PageHeader
        title={portfolio.titrePage ?? portfolio.slug}
        subtitle={`/portfolio/${portfolio.slug} · ${projets.length} projet(s) publie(s)`}
      >
        <Button as={Link} to="/portfolios" variant="secondary">
          <Icon name="arrowLeft" className="size-4" />
          Portfolios
        </Button>
        {/* Hors ligne, l'adresse publique repond 404 : proposer le lien serait
            envoyer l'utilisateur sur une page introuvable. */}
        {portfolio.actif ? (
          <Button as={Link} to={`/portfolio/${portfolio.slug}`} target="_blank" rel="noreferrer">
            <Icon name="lien" className="size-4" />
            Voir la page
          </Button>
        ) : (
          <Button disabled title="Page hors ligne : l'adresse publique renvoie un 404">
            <Icon name="lien" className="size-4" />
            Voir la page
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Badge tone={portfolio.actif ? 'success' : 'neutral'}>
          {portfolio.actif ? 'En ligne' : 'Hors ligne'}
        </Badge>
        <span className="min-w-0 truncate text-sm text-slate-600">
          Creee le {formatDate(portfolio.createdAt)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-4 lg:col-span-2">
          <Card
            title="Projets publies"
            subtitle="L'ordre de cette liste est celui de la page publique"
            action={
              <Button size="sm" disabled title="Enregistrement a venir">
                Enregistrer l'ordre
              </Button>
            }
          >
            <PortfolioSelection projets={projets} />

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-amber-700">
              Reordonnancement et retrait indisponibles : PUT /api/portfolios/:id/projets n'est
              pas encore en ligne.
            </p>
          </Card>

          <Card
            title="Projets disponibles"
            subtitle="Fiches qui ne figurent pas encore sur cette page"
          >
            {projetsDisponibles.length === 0 ? (
              <EmptyState
                icon="projets"
                title="Toutes tes fiches sont deja publiees"
                description="Cree une nouvelle fiche projet pour l'ajouter a cette page."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {projetsDisponibles.map((projet) => {
                  const tag = enumMeta(PROJET_TAG, projet.tag)

                  return (
                    <li
                      key={projet.id}
                      className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/projets/${projet.id}`}
                          className="block truncate text-sm font-medium text-slate-900 transition-colors hover:text-brand-700"
                        >
                          {projet.titre}
                        </Link>
                        <p className="truncate text-xs text-slate-500">{formatDate(projet.date)}</p>
                      </div>

                      <Badge tone={tag.tone} className="shrink-0">
                        {tag.label}
                      </Badge>

                      <Button size="sm" variant="secondary" disabled title="Ajout a venir">
                        <Icon name="plus" className="size-3.5" />
                        Ajouter
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <Card title="Reglages de la page">
            <div className="grid gap-4">
              <Input
                label="Adresse publique"
                value={portfolio.slug}
                onChange={() => {}}
                disabled
                hint="Le slug est unique sur tout le site."
              />
              <Input
                label="Titre de la page"
                value={portfolio.titrePage ?? ''}
                onChange={() => {}}
                disabled
                placeholder={portfolio.slug}
                hint="Vide : le slug sert de titre."
              />
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-amber-700">
              Edition indisponible : PUT /api/portfolios/:id reste a ecrire.
            </p>
          </Card>

          <Card title="Visibilite">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {portfolio.actif ? 'Page en ligne' : 'Page hors ligne'}
                </p>
                <p className="text-xs text-slate-500">
                  {portfolio.actif
                    ? 'Toute personne ayant le lien peut la consulter, sans compte.'
                    : 'Le lien public renvoie une page introuvable.'}
                </p>
              </div>
              <Button size="sm" variant="secondary" disabled title="Bascule a venir" className="shrink-0">
                {portfolio.actif ? 'Depublier' : 'Publier'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export default PortfolioAdminDetail
