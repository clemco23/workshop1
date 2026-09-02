import { useMemo, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ProjetCard from '../components/projets/ProjetCard.jsx'
import ProjetFormModal from '../components/projets/ProjetFormModal.jsx'
import { fetchProjets } from '../api/projets.js'
import { fetchMissions } from '../api/missions.js'
import { PROJET_TAG } from '../lib/enums.js'

export async function loader() {
  // Les missions ne servent qu'au selecteur « mission liee » du formulaire de
  // creation (projet.mission_id est nullable).
  const [projets, missions] = await Promise.all([fetchProjets(), fetchMissions()])
  return { projets, missions }
}

// Cote API le filtre existe aussi (GET /api/projects?tag=), il n'est pas utilise
// ici : la liste est chargee une fois puis filtree en memoire.
const onglets = [
  { value: '', label: 'Tous' },
  ...Object.entries(PROJET_TAG).map(([value, meta]) => ({ value, label: meta.label })),
]

function Projets() {
  const { projets, missions } = useLoaderData()
  const [tag, setTag] = useState('')
  const [creation, setCreation] = useState(false)

  // Projets charges une fois puis filtres en memoire : le filtrage est instantane
  // et ne redemande rien au serveur (fetchProjets({ tag }) le fera si le volume
  // l'exige un jour).
  const affiches = useMemo(() => projets.filter((p) => !tag || p.tag === tag), [projets, tag])

  return (
    <>
      <PageHeader
        title="Projets"
        subtitle={`${projets.length} fiche(s) projet — la matiere de tes pages publiques`}
      >
        <Button onClick={() => setCreation(true)}>
          <Icon name="plus" className="size-4" />
          Nouvelle fiche
        </Button>
      </PageHeader>

      <ProjetFormModal
        ouvert={creation}
        onClose={() => setCreation(false)}
        missions={missions}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs options={onglets} value={tag} onChange={setTag} ariaLabel="Filtrer par tag" />
        <p className="text-sm text-slate-500">
          {affiches.length} fiche(s) affichee(s)
        </p>
      </div>

      {affiches.length === 0 ? (
        <Card>
          <EmptyState
            icon="projets"
            title={tag ? 'Aucune fiche avec ce tag' : 'Aucune fiche projet'}
            description={
              tag
                ? 'Change de tag pour voir les autres realisations.'
                : 'Une fiche projet decrit une realisation : titre, date, lien video, et la mission dont elle est issue. Ce sont ces fiches que tu selectionnes ensuite dans un portfolio public.'
            }
          >
            {tag && (
              <Button variant="secondary" onClick={() => setTag('')}>
                Voir toutes les fiches
              </Button>
            )}
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {affiches.map((projet) => (
            <ProjetCard key={projet.id} projet={projet} />
          ))}
        </div>
      )}
    </>
  )
}

export default Projets
