import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MISSION_STATUT, MISSION_TYPE, enumMeta } from '../../lib/enums.js'
import { formatEuros, formatHeures, formatPeriode } from '../../lib/format.js'
import { heuresMission } from '../../lib/dashboard.js'
import { VIZ, couleurType, opaciteStatut } from '../../lib/viz.js'

// Gantt : une barre flottante par mission sur un axe temporel commun.
// Teinte = type de mission (identite) ; remplissage attenue = statut provisoire.
// La vue Liste de la page est la table equivalente : aucune valeur n'est
// accessible uniquement par survol.

const HAUTEUR_LIGNE = 30
const BANDE_AXE = 44 // reserve pour les libelles de mois, sinon la carte scrolle

const moisCourt = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
const moisAn = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })

function TimelineTooltip({ active, payload, heuresJourDefaut }) {
  if (!active || !payload?.length) return null

  const ligne = payload[payload.length - 1]?.payload
  if (!ligne) return null

  const { mission } = ligne
  const type = enumMeta(MISSION_TYPE, mission.type)
  const statut = enumMeta(MISSION_STATUT, mission.statut)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <p className="text-sm font-semibold text-slate-900">{mission.clientProduction}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-slate-500">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: couleurType(mission.type) }}
        />
        {type.label} — {statut.label}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-slate-500">
        <dt>Periode</dt>
        <dd className="text-slate-900 tabular-nums">
          {formatPeriode(mission.dateDebut, mission.dateFin)}
          {ligne.ouverte && ' (sans date de fin)'}
        </dd>
        <dt>Heures</dt>
        <dd className="text-slate-900 tabular-nums">
          {formatHeures(heuresMission(mission, heuresJourDefaut))} h
        </dd>
        <dt>Montant HT</dt>
        <dd className="text-slate-900 tabular-nums">
          {mission.montantHt == null ? 'non renseigne' : formatEuros(mission.montantHt)}
        </dd>
      </dl>
    </div>
  )
}

function MissionsTimeline({ timeline, heuresJourDefaut }) {
  const { lignes, domaine, ticks, origine } = timeline

  // La hauteur suit le nombre de lignes et inclut la bande d'axe : pas de
  // scroll vertical imbrique dans la carte.
  const hauteur = lignes.length * HAUTEUR_LIGNE + BANDE_AXE

  // Un tick tous les N mois : au-dela d'une douzaine, les libelles se chevauchent.
  const pas = Math.ceil(ticks.length / 10)
  const ticksAffiches = ticks.filter((_, index) => index % pas === 0)

  // L'annee est rappelee sur le premier tick et a chaque changement d'annee
  // *parmi les ticks affiches* — l'eclaircissage peut avoir retire janvier.
  const avecAnnee = new Set()
  let anneePrecedente = null
  for (const tick of ticksAffiches) {
    const annee = new Date(tick + origine).getUTCFullYear()
    if (annee !== anneePrecedente) avecAnnee.add(tick)
    anneePrecedente = annee
  }

  const formatTick = (valeur) => {
    const date = new Date(valeur + origine)
    return avecAnnee.has(valeur) ? moisAn.format(date) : moisCourt.format(date)
  }

  return (
    <div style={{ height: hauteur }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={lignes}
          layout="vertical"
          barSize={VIZ.epaisseurBarre}
          barCategoryGap="30%"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <XAxis
            type="number"
            domain={domaine}
            ticks={ticksAffiches}
            tickFormatter={formatTick}
            orientation="bottom"
            tickLine={false}
            axisLine={{ stroke: VIZ.axe }}
            tick={{ fill: VIZ.encre, fontSize: 11 }}
            interval={0}
          />
          <YAxis
            type="category"
            dataKey="id"
            width={130}
            tickFormatter={(id) => lignes.find((l) => l.id === id)?.client ?? ''}
            tickLine={false}
            axisLine={false}
            tick={{ fill: VIZ.encre, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            content={<TimelineTooltip heuresJourDefaut={heuresJourDefaut} />}
          />

          {/* Segment transparent : positionne la barre sur l'axe temporel. */}
          <Bar dataKey="offset" stackId="periode" fill="transparent" isAnimationActive={false} />

          <Bar dataKey="duree" stackId="periode" radius={VIZ.rayonBarre} isAnimationActive={false}>
            {lignes.map((ligne) => (
              <Cell
                key={ligne.id}
                fill={couleurType(ligne.mission.type)}
                fillOpacity={opaciteStatut(ligne.mission.statut)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MissionsTimeline
