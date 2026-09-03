import { MISSION_TYPE } from '../../lib/enums.js'
import { couleurType } from '../../lib/viz.js'
import { formatEuros, formatHeures } from '../../lib/format.js'

// Totaux par type sur le jeu filtre. C'est le canal le plus direct pour lire la
// difference intermittence / freelance : les chiffres, pas seulement la couleur.
// Affiche au-dessus des deux vues, il porte donc sur ce que les deux montrent.
function MissionsResume({ totaux }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      {Object.entries(MISSION_TYPE).map(([valeur, meta]) => {
        const ligne = totaux.parType[valeur]

        return (
          <div
            key={valeur}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            style={{ boxShadow: `inset 3px 0 0 ${couleurType(valeur)}` }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: couleurType(valeur) }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-slate-900">{meta.label}</span>
              <span className="text-xs text-slate-500">· {ligne.nb} mission(s)</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-4 text-sm text-slate-600">
              <span className="tabular-nums">{formatHeures(ligne.heures)} h</span>
              <span className="tabular-nums">{formatEuros(ligne.montant)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MissionsResume
