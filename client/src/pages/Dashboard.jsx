import { Link, useLoaderData } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import DashboardCharts from '../components/dashboard/DashboardCharts.jsx'
import { fetchDashboard } from '../api/dashboard.js'
import { computeDashboard, heuresMission, toneSeuil } from '../lib/dashboard.js'
import { DOCUMENT_CATEGORIE, MISSION_STATUT, MISSION_TYPE, enumMeta } from '../lib/enums.js'
import {
  formatEuros,
  formatHeures,
  formatMois,
  formatPeriode,
  formatTaille,
} from '../lib/format.js'

// Charge par le data router avant le rendu (voir le helper `page` de router.jsx).
export async function loader() {
  return fetchDashboard()
}

function Dashboard() {
  const data = useLoaderData()
  const { configSeuil } = data
  const { seuil, ca, missions, repartition, graphiques, documentsRecents } = computeDashboard(data)
  const totalRepartition = repartition.reduce((acc, ligne) => acc + ligne.heures, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Fenetre glissante de ${seuil.fenetreMois} mois, depuis ${formatMois(seuil.debut)}`}
      >
        <Button as={Link} to="/parametres" variant="secondary">
          Seuils
        </Button>
        <Button as={Link} to="/missions">
          <Icon name="plus" className="size-4" />
          Nouvelle mission
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Heures d'intermittence"
          value={formatHeures(seuil.heures)}
          unit={`/ ${seuil.objectif} h`}
          icon="clock"
          hint={
            seuil.restant > 0 ? `${formatHeures(seuil.restant)} h avant le seuil` : 'Seuil atteint'
          }
        >
          <ProgressBar
            value={seuil.heures}
            max={seuil.objectif}
            tone={toneSeuil(seuil.ratio)}
            label="Progression vers le seuil d'intermittence"
          />
        </StatCard>

        <StatCard
          label="CA du mois"
          value={formatEuros(ca.mois)}
          icon="euro"
          hint={`${formatEuros(ca.moisPrecedent)} le mois dernier`}
        />

        <StatCard
          label="Missions confirmees"
          value={missions.confirmees}
          icon="missions"
          hint={`${missions.proposees} proposee(s) · ${missions.aVenir} a venir`}
        />
      </div>

      <DashboardCharts data={graphiques} />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Dernieres missions"
          subtitle={`${missions.total} missions au total`}
          action={
            <Button as={Link} to="/missions" variant="ghost" size="sm">
              Tout voir
            </Button>
          }
          padded={false}
        >
          {missions.recentes.length === 0 ? (
            <EmptyState
              icon="missions"
              title="Aucune mission"
              description="Les missions ajoutees apparaitront ici."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {missions.recentes.map((mission) => {
                const statut = enumMeta(MISSION_STATUT, mission.statut)
                const type = enumMeta(MISSION_TYPE, mission.type)

                return (
                  <li key={mission.id}>
                    <Link
                      to={`/missions/${mission.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {mission.clientProduction}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {type.label} · {formatPeriode(mission.dateDebut, mission.dateFin)}
                        </p>
                      </div>
                      <span className="hidden text-sm text-slate-500 tabular-nums sm:inline">
                        {formatHeures(heuresMission(mission, configSeuil.heuresJourDefaut))} h
                      </span>
                      <span className="hidden text-sm text-slate-500 tabular-nums md:inline">
                        {formatEuros(mission.montantHt)}
                      </span>
                      <Badge tone={statut.tone}>{statut.label}</Badge>
                      <Icon name="chevronRight" className="size-4 text-slate-300" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Repartition par client"
          subtitle={`${formatHeures(totalRepartition)} h sur la fenetre`}
        >
          <ul className="flex flex-col gap-4">
            {repartition.slice(0, 5).map((ligne) => (
              <li key={ligne.client}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700">{ligne.client}</span>
                  <span className="text-slate-500 tabular-nums">
                    {formatHeures(ligne.heures)} h
                  </span>
                </div>
                <ProgressBar value={ligne.heures} max={totalRepartition} label={ligne.client} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Documents recents"
        action={
          <Button as={Link} to="/documents" variant="ghost" size="sm">
            Tout voir
          </Button>
        }
        padded={false}
      >
        <ul className="divide-y divide-slate-100">
          {documentsRecents.map((document) => {
            const categorie = enumMeta(DOCUMENT_CATEGORIE, document.categorie)

            return (
              <li
                key={document.id}
                className="flex items-center gap-4 px-5 py-3 text-sm text-slate-500"
              >
                <Icon name="documents" className="size-4 text-slate-400" />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900">
                  {document.nomOriginal}
                </span>
                <span className="hidden tabular-nums sm:inline">
                  {formatTaille(document.taille)}
                </span>
                <Badge tone={categorie.tone}>{categorie.label}</Badge>
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}

export default Dashboard
