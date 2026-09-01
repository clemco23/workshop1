import { useMemo, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Select from '../components/ui/Select.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import MissionsTable from '../components/missions/MissionsTable.jsx'
import MissionsTimeline from '../components/missions/MissionsTimeline.jsx'
import MissionsAgenda from '../components/missions/MissionsAgenda.jsx'
import MissionsResume from '../components/missions/MissionsResume.jsx'
import MissionsLegende from '../components/missions/MissionsLegende.jsx'
import { fetchMissions } from '../api/missions.js'
import { fetchConfigSeuil } from '../api/compte.js'
import { construireTimeline, filtrerMissions, totauxMissions } from '../lib/missions.js'
import { MISSION_STATUT, MISSION_TYPE } from '../lib/enums.js'

export async function loader() {
  const [missions, configSeuil] = await Promise.all([fetchMissions(), fetchConfigSeuil()])
  return { missions, configSeuil }
}

const optionsType = [
  { value: '', label: 'Tous les types' },
  ...Object.entries(MISSION_TYPE).map(([value, meta]) => ({ value, label: meta.label })),
]

const optionsStatut = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(MISSION_STATUT).map(([value, meta]) => ({ value, label: meta.label })),
]

const vues = [
  { value: 'liste', label: 'Liste', icon: <Icon name="documents" className="size-4" /> },
  { value: 'agenda', label: 'Agenda', icon: <Icon name="agenda" className="size-4" /> },
  { value: 'timeline', label: 'Timeline', icon: <Icon name="timeline" className="size-4" /> },
]

function Missions() {
  const { missions, configSeuil } = useLoaderData()
  const [vue, setVue] = useState('liste')
  const [filtres, setFiltres] = useState({ type: '', statut: '', client: '' })

  // Les missions sont chargees une fois puis filtrees en memoire : le filtrage
  // est instantane et ne redemande rien au serveur. Passer aux filtres cote API
  // (fetchMissions(filtres)) le jour ou le volume l'exige.
  const filtrees = useMemo(() => filtrerMissions(missions, filtres), [missions, filtres])

  const totaux = useMemo(
    () => totauxMissions(filtrees, configSeuil.heuresJourDefaut),
    [filtrees, configSeuil.heuresJourDefaut],
  )

  const parDateDesc = useMemo(
    () => [...filtrees].sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut)),
    [filtrees],
  )

  const timeline = useMemo(() => construireTimeline(filtrees), [filtrees])

  const setFiltre = (cle) => (valeur) => setFiltres((etat) => ({ ...etat, [cle]: valeur }))
  const vide = filtrees.length === 0

  return (
    <>
      <PageHeader title="Missions" subtitle={`${missions.length} missions enregistrees`}>
        <Button as={Link} to="/missions">
          <Icon name="plus" className="size-4" />
          Nouvelle mission
        </Button>
      </PageHeader>

      {/* Une seule rangee de filtres, au-dessus de tout ce qu'elle cadre : les
          deux vues rendent toujours la meme selection. */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Type"
            value={filtres.type}
            onChange={setFiltre('type')}
            options={optionsType}
          />
          <Select
            label="Statut"
            value={filtres.statut}
            onChange={setFiltre('statut')}
            options={optionsStatut}
          />
          <label className="inline-flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Client
            </span>
            <input
              type="search"
              value={filtres.client}
              onChange={(event) => setFiltre('client')(event.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-48 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </label>
        </div>

        <Tabs options={vues} value={vue} onChange={setVue} ariaLabel="Vue des missions" />
      </div>

      <MissionsResume totaux={totaux} />

      {vide ? (
        <Card>
          <EmptyState
            icon="missions"
            title="Aucune mission ne correspond"
            description="Elargis les filtres pour retrouver des missions."
          >
            <Button variant="secondary" onClick={() => setFiltres({ type: '', statut: '', client: '' })}>
              Reinitialiser les filtres
            </Button>
          </EmptyState>
        </Card>
      ) : vue === 'liste' ? (
        <Card padded={false}>
          <MissionsTable
            missions={parDateDesc}
            heuresJourDefaut={configSeuil.heuresJourDefaut}
            totaux={totaux}
          />
        </Card>
      ) : vue === 'agenda' ? (
        <Card>
          <MissionsAgenda missions={filtrees} />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <MissionsLegende />
          </div>
        </Card>
      ) : (
        <Card
          title="Timeline"
          subtitle="Une barre par mission, du debut a la fin — ordre chronologique"
        >
          <MissionsTimeline timeline={timeline} heuresJourDefaut={configSeuil.heuresJourDefaut} />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <MissionsLegende />
          </div>
        </Card>
      )}
    </>
  )
}

export default Missions
