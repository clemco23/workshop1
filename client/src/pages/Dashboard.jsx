import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import Icon from '../components/ui/Icon.jsx'

// --- Donnees factices : a remplacer par les appels a VITE_API_URL. -----------
const stats = {
  heures: { faites: 128, seuil: 150 },
  ca: { mois: 4250, trend: 12 },
  missionsEnCours: 3,
}

const missions = [
  { id: '1', titre: 'Refonte site vitrine', client: 'Atelier Nord', heures: 42, statut: 'en_cours' },
  { id: '2', titre: 'App mobile — MVP', client: 'Groupe Vela', heures: 31, statut: 'en_cours' },
  { id: '3', titre: 'Audit accessibilite', client: 'Mairie de Lys', heures: 12, statut: 'en_attente' },
  { id: '4', titre: 'Maintenance API', client: 'Sowen', heures: 43, statut: 'termine' },
]

const repartition = [
  { client: 'Atelier Nord', heures: 42 },
  { client: 'Sowen', heures: 43 },
  { client: 'Groupe Vela', heures: 31 },
  { client: 'Mairie de Lys', heures: 12 },
]
// ---------------------------------------------------------------------------

const statuts = {
  en_cours: { label: 'En cours', tone: 'brand' },
  en_attente: { label: 'En attente', tone: 'warning' },
  termine: { label: 'Termine', tone: 'success' },
}

const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

function Dashboard() {
  const { heures, ca, missionsEnCours } = stats
  const ratio = heures.faites / heures.seuil
  const totalHeures = repartition.reduce((acc, r) => acc + r.heures, 0)

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Vue d'ensemble du mois en cours">
        <Button as={Link} to="/missions" variant="secondary">
          Voir les missions
        </Button>
        <Button as={Link} to="/missions">
          <Icon name="plus" className="size-4" />
          Nouvelle mission
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Heures ce mois"
          value={heures.faites}
          unit={`/ ${heures.seuil} h`}
          icon="clock"
          hint={`${Math.round(ratio * 100)} % du seuil`}
        >
          <ProgressBar
            value={heures.faites}
            max={heures.seuil}
            tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'brand'}
            label="Progression des heures du mois"
          />
        </StatCard>

        <StatCard
          label="CA du mois"
          value={euros.format(ca.mois)}
          icon="euro"
          trend={ca.trend}
          hint="vs mois dernier"
        />

        <StatCard
          label="Missions en cours"
          value={missionsEnCours}
          icon="missions"
          hint="sur 4 missions actives"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Dernieres missions"
          subtitle="Mise a jour il y a quelques minutes"
          action={
            <Button as={Link} to="/missions" variant="ghost" size="sm">
              Tout voir
            </Button>
          }
          padded={false}
        >
          <ul className="divide-y divide-slate-100">
            {missions.map((mission) => {
              const statut = statuts[mission.statut]

              return (
                <li key={mission.id}>
                  <Link
                    to={`/missions/${mission.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{mission.titre}</p>
                      <p className="truncate text-xs text-slate-500">{mission.client}</p>
                    </div>
                    <span className="text-sm text-slate-500 tabular-nums">{mission.heures} h</span>
                    <Badge tone={statut.tone}>{statut.label}</Badge>
                    <Icon name="chevronRight" className="size-4 text-slate-300" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title="Repartition par client" subtitle={`${totalHeures} h au total`}>
          <ul className="flex flex-col gap-4">
            {repartition.map((ligne) => (
              <li key={ligne.client}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700">{ligne.client}</span>
                  <span className="text-slate-500 tabular-nums">{ligne.heures} h</span>
                </div>
                <ProgressBar value={ligne.heures} max={totalHeures} label={ligne.client} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

export default Dashboard
