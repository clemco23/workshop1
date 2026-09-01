import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'
import Icon from '../ui/Icon.jsx'
import { MISSION_STATUT, MISSION_TYPE, enumMeta } from '../../lib/enums.js'
import { formatEuros, formatHeures, formatPeriode, num } from '../../lib/format.js'
import { heuresMission } from '../../lib/dashboard.js'
import { couleurType } from '../../lib/viz.js'

// Vue liste. C'est aussi la table equivalente de la timeline : toute valeur du
// graphe est lisible ici, sans survol.
//
// Le type se lit par trois canaux redondants : le filet colore en bord de ligne,
// la pastille, et le libelle en texte. Jamais la couleur seule.

const th = 'px-4 py-2.5 text-left text-xs font-medium tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 text-sm text-slate-600'

function MissionsTable({ missions, heuresJourDefaut, totaux }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className={th}>
              Client / production
            </th>
            <th scope="col" className={th}>
              Type
            </th>
            <th scope="col" className={th}>
              Periode
            </th>
            <th scope="col" className={`${th} text-right`}>
              Jours
            </th>
            <th scope="col" className={`${th} text-right`}>
              Heures
            </th>
            <th scope="col" className={`${th} text-right`}>
              Montant HT
            </th>
            <th scope="col" className={th}>
              Statut
            </th>
            <th scope="col" className="w-8" />
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {missions.map((mission) => {
            const type = enumMeta(MISSION_TYPE, mission.type)
            const statut = enumMeta(MISSION_STATUT, mission.statut)
            const couleur = couleurType(mission.type)

            return (
              <tr key={mission.id} className="group transition-colors hover:bg-slate-50">
                <td
                  className={`${td} font-medium text-slate-900`}
                  // Filet de bord : la marque coloree, pas une bordure de separation.
                  style={{ boxShadow: `inset 3px 0 0 ${couleur}` }}
                >
                  <Link
                    to={`/missions/${mission.id}`}
                    className="rounded transition-colors group-hover:text-brand-700"
                  >
                    {mission.clientProduction}
                  </Link>
                </td>

                <td className={td}>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: couleur }}
                      aria-hidden="true"
                    />
                    {type.label}
                  </span>
                </td>

                <td className={`${td} whitespace-nowrap tabular-nums`}>
                  {formatPeriode(mission.dateDebut, mission.dateFin)}
                </td>

                <td className={`${td} text-right tabular-nums`}>
                  {mission.nbJours == null ? '—' : formatHeures(mission.nbJours)}
                </td>

                <td className={`${td} text-right tabular-nums`}>
                  {formatHeures(heuresMission(mission, heuresJourDefaut))}
                  {/* Heures deduites de nb_jours quand la colonne heures est vide. */}
                  {mission.heures == null && num(mission.nbJours) > 0 && (
                    <span className="ml-1 text-xs text-slate-400" title="Deduit de nb_jours">
                      est.
                    </span>
                  )}
                </td>

                <td className={`${td} text-right tabular-nums`}>
                  {mission.montantHt == null ? '—' : formatEuros(mission.montantHt)}
                </td>

                <td className={td}>
                  <Badge tone={statut.tone}>{statut.label}</Badge>
                </td>

                <td className={`${td} text-right`}>
                  <Icon name="chevronRight" className="size-4 text-slate-300" />
                </td>
              </tr>
            )
          })}
        </tbody>

        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50/60">
            <td className={`${td} font-medium text-slate-900`} colSpan={4}>
              {totaux.global.nb} mission(s) affichee(s)
            </td>
            <td className={`${td} text-right font-medium text-slate-900 tabular-nums`}>
              {formatHeures(totaux.global.heures)} h
            </td>
            <td className={`${td} text-right font-medium text-slate-900 tabular-nums`}>
              {formatEuros(totaux.global.montant)}
            </td>
            <td className={td} colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default MissionsTable
