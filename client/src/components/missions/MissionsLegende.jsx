import { MISSION_TYPE } from '../../lib/enums.js'
import { VIZ, couleurType } from '../../lib/viz.js'

// Legende de la timeline. Presente des qu'il y a deux series : l'identite ne
// repose jamais sur la seule couleur. Le texte garde l'encre de texte, seule la
// pastille porte la teinte.
function MissionsLegende() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
      {Object.entries(MISSION_TYPE).map(([valeur, meta]) => (
        <li key={valeur} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: couleurType(valeur) }}
            aria-hidden="true"
          />
          {meta.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-sm"
          style={{
            backgroundColor: couleurType('INTERMITTENCE'),
            opacity: VIZ.opaciteProvisoire,
          }}
          aria-hidden="true"
        />
        Teinte attenuee : mission proposee
      </li>
    </ul>
  )
}

export default MissionsLegende
