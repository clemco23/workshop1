import { useMemo, useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import Select from '../components/ui/Select.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import DocumentsTable from '../components/documents/DocumentsTable.jsx'
import DocumentsUpload from '../components/documents/DocumentsUpload.jsx'
import { fetchDocuments } from '../api/documents.js'
import { fetchMissions } from '../api/missions.js'
import { DOCUMENT_CATEGORIE, enumMeta } from '../lib/enums.js'
import { compterParCategorie, filtrerDocuments, totalTaille } from '../lib/documents.js'
import { formatPeriode, formatTaille } from '../lib/format.js'

export async function loader() {
  // Les missions servent a peupler le filtre « mission liee ».
  const [documents, missions] = await Promise.all([fetchDocuments(), fetchMissions()])
  return { documents, missions }
}

const optionsCategorie = [
  { value: '', label: 'Toutes les categories' },
  ...Object.entries(DOCUMENT_CATEGORIE).map(([value, meta]) => ({ value, label: meta.label })),
]

const filtresVides = { categorie: '', missionId: '', recherche: '' }

function Documents() {
  const { documents, missions } = useLoaderData()
  const revalidator = useRevalidator()
  const [filtres, setFiltres] = useState(filtresVides)

  // Documents charges une fois puis filtres en memoire : instantane, et rien a
  // redemander au serveur. Passer aux filtres cote API le jour ou le volume l'exige.
  const affiches = useMemo(() => filtrerDocuments(documents, filtres), [documents, filtres])

  const compte = useMemo(() => compterParCategorie(documents), [documents])

  const optionsMission = useMemo(
    () => [
      { value: '', label: 'Toutes les missions' },
      { value: 'aucune', label: 'Sans mission liee' },
      ...missions.map((mission) => ({
        value: mission.id,
        label: `${mission.clientProduction} — ${formatPeriode(mission.dateDebut, mission.dateFin)}`,
      })),
    ],
    [missions],
  )

  const setFiltre = (cle) => (valeur) => setFiltres((etat) => ({ ...etat, [cle]: valeur }))
  const filtreActif = filtres.categorie || filtres.missionId || filtres.recherche

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} document(s) · ${formatTaille(totalTaille(documents))}`}
      >
        {/* Le formulaire vit dans la colonne de droite, sous la liste en dessous
            de `lg` : l'ancre y emmene au lieu de dupliquer le controle. */}
        <Button as="a" href="#ajouter-document">
          <Icon name="upload" className="size-4" />
          Ajouter un document
        </Button>
      </PageHeader>

      {/* Repartition par categorie : elle sert aussi de raccourci de filtrage,
          et chaque compteur est ecrit en toutes lettres. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(DOCUMENT_CATEGORIE).map(([valeur, meta]) => {
          const actif = filtres.categorie === valeur

          return (
            <button
              key={valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => setFiltre('categorie')(actif ? '' : valeur)}
              className={
                actif
                  ? 'inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700 transition-colors'
                  : 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50'
              }
            >
              <span className="font-medium">{meta.label}</span>
              <Badge tone={actif ? 'brand' : 'neutral'}>{compte[valeur] ?? 0}</Badge>
            </button>
          )
        })}
      </div>

      {/* Une seule rangee de filtres, au-dessus de ce qu'elle cadre. */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          label="Categorie"
          value={filtres.categorie}
          onChange={setFiltre('categorie')}
          options={optionsCategorie}
        />
        <Select
          label="Mission"
          value={filtres.missionId}
          onChange={setFiltre('missionId')}
          options={optionsMission}
          className="max-w-xs"
        />
        <label className="inline-flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Nom du fichier
          </span>
          <input
            type="search"
            value={filtres.recherche}
            onChange={(event) => setFiltre('recherche')(event.target.value)}
            placeholder="Rechercher…"
            className="h-9 w-48 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </label>

        {filtreActif && (
          <Button variant="ghost" onClick={() => setFiltres(filtresVides)}>
            Reinitialiser
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {affiches.length === 0 ? (
            <Card>
              <EmptyState
                icon="documents"
                title={filtreActif ? 'Aucun document ne correspond' : 'Aucun document'}
                description={
                  filtreActif
                    ? 'Elargis les filtres pour retrouver un fichier.'
                    : 'Ajoute tes contrats, attestations employeur et factures pour garder tes justificatifs au meme endroit.'
                }
              >
                {filtreActif && (
                  <Button variant="secondary" onClick={() => setFiltres(filtresVides)}>
                    Reinitialiser les filtres
                  </Button>
                )}
              </EmptyState>
            </Card>
          ) : (
            <Card
              padded={false}
              title={`${affiches.length} document(s)`}
              subtitle={
                filtres.categorie
                  ? enumMeta(DOCUMENT_CATEGORIE, filtres.categorie).label
                  : 'Tous les justificatifs, du plus recent au plus ancien'
              }
            >
              <DocumentsTable documents={affiches} onSupprime={() => revalidator.revalidate()} />
            </Card>
          )}
        </div>

        {/* Apres un depot, on relance le loader de la route plutot que de
            bricoler la liste en memoire : une seule source de verite. */}
        {/* `scroll-mt` : la topbar est collante, sans marge de defilement l'ancre
            deposerait la carte dessous. */}
        <div id="ajouter-document" className="min-w-0 scroll-mt-20">
          <DocumentsUpload missions={missions} onAjoute={() => revalidator.revalidate()} />
        </div>
      </div>
    </>
  )
}

export default Documents
