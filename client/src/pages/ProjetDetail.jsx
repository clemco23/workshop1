import { Link, useLoaderData } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import ProjetMediasListe from '../components/projets/ProjetMediasListe.jsx'
import { fetchProjet } from '../api/projets.js'
import { MISSION_STATUT, MISSION_TYPE, PROJET_TAG, enumMeta } from '../lib/enums.js'
import { formatDate, formatDateLongue, formatPeriode } from '../lib/format.js'
import { mediasProjet } from '../lib/medias.js'
import { couleurType } from '../lib/viz.js'

// Fiche inconnue -> fetchProjet jette une Response 404 (cf. api/client.js), que
// le data router transforme en ecran d'erreur.
export async function loader({ params }) {
  return { projet: await fetchProjet(params.id) }
}

function Ligne({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium break-words text-slate-900">
        {children}
      </dd>
    </div>
  )
}

function ProjetDetail() {
  const { projet } = useLoaderData()

  const tag = enumMeta(PROJET_TAG, projet.tag)
  const medias = mediasProjet(projet)
  const portfolios = projet.portfolios ?? []
  const mission = projet.mission

  return (
    <>
      <PageHeader title={projet.titre} subtitle={`${tag.label} · ${formatDateLongue(projet.date)}`}>
        <Button as={Link} to="/projets" variant="secondary">
          <Icon name="arrowLeft" className="size-4" />
          Projets
        </Button>
        {/* PUT /api/projets/:id n'est ecrit ni ici ni cote serveur. */}
        <Button disabled title="Edition a venir">
          Modifier
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Badge tone={tag.tone}>{tag.label}</Badge>
        <span className="text-sm text-slate-600">
          {medias.length} media(s) — {formatDateLongue(projet.date)}
        </span>
        {/* Une fiche n'est publique que si elle figure dans un portfolio actif. */}
        {portfolios.length > 0 ? (
          <Badge tone="success">Publiee</Badge>
        ) : (
          <Badge tone="neutral">Non publiee</Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-4 lg:col-span-2">
          <Card title="Description">
            {projet.description ? (
              <p className="text-sm break-words whitespace-pre-line text-slate-600">
                {projet.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Pas encore de description.</p>
            )}
          </Card>

          <Card
            title="Medias"
            subtitle="Video, images, PDF ou liens qui donnent a voir la realisation"
          >
            <ProjetMediasListe projet={projet} />
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <Card title="Fiche">
            <dl className="divide-y divide-slate-100">
              <Ligne label="Tag">
                <Badge tone={tag.tone}>{tag.label}</Badge>
              </Ligne>
              <Ligne label="Date">{formatDateLongue(projet.date)}</Ligne>
              <Ligne label="Medias">{medias.length}</Ligne>
              <Ligne label="Creee le">{formatDate(projet.createdAt)}</Ligne>
            </dl>
          </Card>

          <Card title="Mission liee">
            {/* mission_id est nullable : un projet perso n'en a pas. */}
            {mission ? (
              <div
                className="rounded-lg border border-slate-200 px-3 py-2.5"
                style={{ boxShadow: `inset 3px 0 0 ${couleurType(mission.type)}` }}
              >
                <Link
                  to={`/missions/${mission.id}`}
                  className="text-sm font-medium text-slate-900 transition-colors hover:text-brand-700"
                >
                  {mission.clientProduction}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {enumMeta(MISSION_TYPE, mission.type).label} ·{' '}
                  {formatPeriode(mission.dateDebut, mission.dateFin)}
                </p>
                <div className="mt-2">
                  <Badge tone={enumMeta(MISSION_STATUT, mission.statut).tone}>
                    {enumMeta(MISSION_STATUT, mission.statut).label}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Projet personnel : aucune mission rattachee.
              </p>
            )}
          </Card>

          <Card title="Publication" subtitle="Pages publiques ou figure cette fiche">
            {portfolios.length === 0 ? (
              <p className="text-sm text-slate-400">
                Cette fiche n'est sur aucune page publique.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {portfolios.map((portfolio) => (
                  <li
                    key={portfolio.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/portfolios/${portfolio.id}`}
                        className="block truncate text-sm font-medium text-slate-900 transition-colors hover:text-brand-700"
                      >
                        {portfolio.titrePage ?? portfolio.slug}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        /portfolio/{portfolio.slug} · position {portfolio.ordre}
                      </p>
                    </div>
                    <Badge tone={portfolio.actif ? 'success' : 'neutral'} className="shrink-0">
                      {portfolio.actif ? 'En ligne' : 'Hors ligne'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

export default ProjetDetail
