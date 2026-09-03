import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Icon from '../components/ui/Icon.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import MissionDocuments from '../components/missions/MissionDocuments.jsx'
import MissionProjets from '../components/missions/MissionProjets.jsx'
import MissionFormModal from '../components/missions/MissionFormModal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { deleteMission, fetchMission } from '../api/missions.js'
import { fetchDocuments } from '../api/documents.js'
import { fetchProjets } from '../api/projets.js'
import { fetchConfigSeuil } from '../api/compte.js'
import { MISSION_STATUT, MISSION_TYPE, STATUTS_ACQUIS, enumMeta } from '../lib/enums.js'
import { heuresMission } from '../lib/dashboard.js'
import { nbJoursTravailles } from '../lib/missions.js'
import {
  formatDate,
  formatDateLongue,
  formatEuros,
  formatHeures,
  formatPeriode,
  num,
} from '../lib/format.js'
import { couleurType } from '../lib/viz.js'

// La mission n'existe pas -> l'API repond 404 et le loader rejette : `RouteError`
// (branche sur la coquille, cf. router.jsx) rend l'ecran adequat. Pas de garde a
// ecrire ici.
export async function loader({ params }) {
  const mission = await fetchMission(params.id)

  const [configSeuil, documents, projets] = await Promise.all([
    fetchConfigSeuil(),
    fetchDocuments({ missionId: mission.id }),
    fetchProjets({ missionId: mission.id }),
  ])

  return { mission, configSeuil, documents, projets }
}

// Ligne de la fiche : libelle a gauche, valeur a droite. Beaucoup de champs sont
// nullables dans le schema (heures, date_fin, montant_ht, nb_jours), d'ou les
// replis explicites plutot qu'une ligne absente.
function Ligne({ label, hint, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium break-words text-slate-900">
        {children}
        {hint && <span className="ml-1.5 text-xs font-normal text-slate-400">{hint}</span>}
      </dd>
    </div>
  )
}

function MissionDetail() {
  const { mission, configSeuil, documents, projets } = useLoaderData()
  const revalidator = useRevalidator()
  const navigate = useNavigate()
  const [edition, setEdition] = useState(false)
  const [suppression, setSuppression] = useState(false)

  const type = enumMeta(MISSION_TYPE, mission.type)
  const statut = enumMeta(MISSION_STATUT, mission.statut)
  const couleur = couleurType(mission.type)

  const heures = heuresMission(mission, configSeuil.heuresJourDefaut)
  const heuresEstimees = mission.heures == null
  const montant = num(mission.montantHt)
  const joursEstimes = mission.nbJours == null
  const jours = joursEstimes ? nbJoursTravailles(mission) : num(mission.nbJours)

  // Regle metier : seules les missions INTERMITTENCE *acquises* alimentent le
  // seuil annuel (cf. STATUTS_ACQUIS). Une mission proposee ne compte pas encore.
  const estIntermittence = mission.type === 'INTERMITTENCE'
  const compte = estIntermittence && STATUTS_ACQUIS.includes(mission.statut)
  const partSeuil = compte ? (heures / num(configSeuil.seuilHeuresAnnuel)) * 100 : 0

  const tjm = jours > 0 && montant > 0 ? montant / jours : null

  return (
    <>
      <PageHeader
        title={mission.clientProduction}
        subtitle={`${type.label} · ${formatPeriode(mission.dateDebut, mission.dateFin)}`}
      >
        <Button as={Link} to="/missions" variant="secondary">
          <Icon name="arrowLeft" className="size-4" />
          Missions
        </Button>
        <Button onClick={() => setEdition(true)}>
          Modifier
        </Button>
        <Button variant="secondary" onClick={() => setSuppression(true)}>
          <Icon name="corbeille" className="size-4" />
          Supprimer
        </Button>
      </PageHeader>

      {/* Meme formulaire qu'a la creation, prerempli : les regles de saisie ne
          doivent pas diverger entre les deux. */}
      <MissionFormModal
        ouvert={edition}
        onClose={() => setEdition(false)}
        configSeuil={configSeuil}
        mission={mission}
        onEnregistre={() => revalidator.revalidate()}
      />

      {/* La fiche disparait avec la mission : on retourne a la liste plutot que
          de rester sur une route qui repondrait desormais 404. `replace` pour
          que le retour arriere n'y ramene pas. */}
      <ConfirmDialog
        ouvert={suppression}
        onClose={() => setSuppression(false)}
        onConfirmer={async () => {
          await deleteMission(mission.id)
          navigate('/missions', { replace: true })
        }}
        titre="Supprimer cette mission ?"
        description={`« ${mission.clientProduction} » sera retiree. Ses documents et fiches projet sont conserves, mais ne seront plus rattaches a aucune mission.`}
      />

      {/* Le type se lit par trois canaux redondants : filet colore, pastille,
          libelle, jamais par la couleur seule. */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
        style={{ boxShadow: `inset 3px 0 0 ${couleur}` }}
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: couleur }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-900">{type.label}</span>
        <Badge tone={statut.tone}>{statut.label}</Badge>
        {mission.dateFin == null && <Badge tone="neutral">Sans date de fin, en cours</Badge>}
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Heures"
          value={formatHeures(heures)}
          unit="h"
          icon="clock"
          hint={
            heuresEstimees
              ? `${formatHeures(jours)} j x ${formatHeures(configSeuil.heuresJourDefaut)} h`
              : 'Saisies sur la mission'
          }
        />
        <StatCard
          label="Montant HT"
          value={mission.montantHt == null ? '-' : formatEuros(montant)}
          icon="euro"
          hint={tjm ? `${formatEuros(tjm)} / jour` : 'Montant non renseigne'}
        />
        <StatCard
          label="Jours"
          value={formatHeures(jours)}
          unit="j"
          icon="agenda"
          hint={joursEstimes ? 'Deduits des dates' : 'Saisis sur la mission'}
        />
        <StatCard
          label="Part du seuil"
          value={compte ? `${formatHeures(partSeuil)} %` : '-'}
          icon="missions"
          hint={
            compte
              ? `du seuil de ${formatHeures(configSeuil.seuilHeuresAnnuel)} h`
              : estIntermittence
                ? 'Mission proposee : pas encore acquise'
                : 'Le freelance ne compte pas'
          }
        >
          {compte && (
            <ProgressBar
              value={heures}
              max={num(configSeuil.seuilHeuresAnnuel)}
              label="Part de cette mission dans le seuil annuel"
            />
          )}
        </StatCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Detail">
          <dl className="divide-y divide-slate-100">
            <Ligne label="Client / production">{mission.clientProduction}</Ligne>
            <Ligne label="Type">{type.label}</Ligne>
            <Ligne label="Statut">
              <Badge tone={statut.tone}>{statut.label}</Badge>
            </Ligne>
            <Ligne label="Debut">{formatDateLongue(mission.dateDebut)}</Ligne>
            <Ligne label="Fin">
              {mission.dateFin ? formatDateLongue(mission.dateFin) : 'Non definie'}
            </Ligne>
            <Ligne label="Jours" hint={joursEstimes ? 'deduits' : null}>
              <span className="tabular-nums">{formatHeures(jours)} j</span>
            </Ligne>
            <Ligne label="Heures" hint={heuresEstimees ? 'est.' : null}>
              <span className="tabular-nums">{formatHeures(heures)} h</span>
            </Ligne>
            <Ligne label="Montant HT">
              <span className="tabular-nums">
                {mission.montantHt == null ? '-' : formatEuros(montant)}
              </span>
            </Ligne>
            <Ligne label="Creee le">{formatDate(mission.createdAt)}</Ligne>
            <Ligne label="Mise a jour">{formatDate(mission.updatedAt)}</Ligne>
          </dl>
        </Card>

        <div className="grid min-w-0 gap-4 lg:col-span-2">
          <Card title="Note" subtitle="Champ libre de la mission">
            {mission.note ? (
              <p className="text-sm break-words whitespace-pre-line text-slate-600">
                {mission.note}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Aucune note sur cette mission.</p>
            )}
          </Card>

          <Card
            title="Documents lies"
            subtitle={`${documents.length} document(s) rattache(s) a cette mission`}
          >
            <MissionDocuments documents={documents} />
          </Card>

          <Card
            title="Fiches projet"
            subtitle={`${projets.length} realisation(s) issue(s) de cette mission`}
          >
            <MissionProjets projets={projets} />
          </Card>
        </div>
      </div>
    </>
  )
}

export default MissionDetail
