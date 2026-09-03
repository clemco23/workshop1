import { useMemo } from 'react'
import JoursSemaine from '../ui/JoursSemaine.jsx'
import {
  estJourTravaille,
  joursDeLaPlage,
  jourDeLaSemaine,
} from '../../lib/joursTravailles.js'
import { formatHeures, num } from '../../lib/format.js'
import { cn } from '../../lib/cn.js'

// Les jours travailles d'une mission, en trois etages du plus grossier au plus
// fin : la regle recurrente (« pas les week-ends »), le calendrier de la plage
// pour les exceptions (« sauf le 12 »), et le recapitulatif chiffre qui dit ce
// que les deux premiers ont donne.
//
// Le calendrier n'est pas qu'une saisie : c'est aussi la confirmation. Sans lui,
// « du 1er au 16 sans les week-ends » se lirait comme 16 jours factures.

const lettresSemaine = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const moisAn = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// La plage decoupee en mois, chacun aligne sur une grille de sept colonnes
// commencant le lundi. Seuls les jours de la plage ont une case : le reste du
// mois n'a pas a etre montre, la mission ne s'y etend pas.
function grilleParMois(debut, fin) {
  const mois = []

  for (const cle of joursDeLaPlage(debut, fin)) {
    const moisCle = cle.slice(0, 7)
    if (mois.at(-1)?.cle !== moisCle) {
      mois.push({
        cle: moisCle,
        // getUTCDay : 0 = dimanche. On decale pour que 0 = lundi.
        decalage: (jourDeLaSemaine(cle) + 6) % 7,
        jours: [],
      })
    }
    mois.at(-1).jours.push(cle)
  }

  return mois
}

function JoursTravaillesField({
  dateDebut,
  dateFin,
  joursOff,
  datesExclues,
  datesIncluses,
  onChange,
  compte,
  heuresJourDefaut,
  erreur,
}) {
  const mois = useMemo(() => grilleParMois(dateDebut, dateFin), [dateDebut, dateFin])
  const masque = { joursOff, datesExclues, datesIncluses }

  // Un clic sur une case inverse l'etat du jour. Le champ ou l'exception est
  // rangee depend de la regle recurrente : retirer un jour deja off n'aurait
  // aucun effet, et le remettre demande au contraire une inclusion explicite.
  const basculerJour = (cle) => {
    const exclues = new Set(datesExclues)
    const incluses = new Set(datesIncluses)
    const recurrentOff = joursOff.includes(jourDeLaSemaine(cle))

    if (estJourTravaille(masque, cle)) {
      incluses.delete(cle)
      if (!recurrentOff) exclues.add(cle)
    } else {
      exclues.delete(cle)
      if (recurrentOff) incluses.add(cle)
    }

    onChange({
      datesExclues: [...exclues].sort(),
      datesIncluses: [...incluses].sort(),
    })
  }

  const heures = compte ? compte.travailles * num(heuresJourDefaut) : 0

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3">
      <JoursSemaine
        label="Jours travailles"
        value={joursOff}
        onChange={(valeur) => onChange({ joursOff: valeur })}
        hint={
          dateFin === ''
            ? 'La regle s’appliquera aux jours de la mission, au fil de l’eau.'
            : 'Clique un jour du calendrier pour faire une exception.'
        }
      />

      {mois.length > 0 && (
        <div className="max-h-64 overflow-y-auto">
          <div className="grid gap-3 sm:grid-cols-2">
            {mois.map((bloc) => (
              <div key={bloc.cle} className="min-w-0">
                <p className="mb-1 text-xs font-medium text-slate-500 first-letter:uppercase">
                  {moisAn.format(new Date(`${bloc.cle}-01T00:00:00.000Z`))}
                </p>

                <div className="grid grid-cols-7 gap-0.5">
                  {lettresSemaine.map((lettre, index) => (
                    <span
                      key={`${bloc.cle}-${index}`}
                      aria-hidden="true"
                      className="text-center text-[10px] text-slate-400"
                    >
                      {lettre}
                    </span>
                  ))}

                  {/* Cases vides avant le premier jour de la plage, pour que la
                      colonne d'un jour corresponde bien a son jour de semaine. */}
                  {Array.from({ length: bloc.decalage }, (_, index) => (
                    <span key={`vide-${index}`} aria-hidden="true" />
                  ))}

                  {bloc.jours.map((cle) => {
                    const travaille = estJourTravaille(masque, cle)

                    return (
                      <button
                        key={cle}
                        type="button"
                        onClick={() => basculerJour(cle)}
                        aria-pressed={travaille}
                        title={`${cle} — ${travaille ? 'travaille' : 'non travaille'}`}
                        className={cn(
                          'grid h-7 place-items-center rounded text-xs tabular-nums transition-colors',
                          travaille
                            ? 'bg-brand-600 font-medium text-white hover:bg-brand-700'
                            : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200',
                        )}
                      >
                        {Number(cle.slice(8, 10))}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Le chiffre qui compte, toujours visible : c'est lui qui alimente
          `nbJours`, donc les heures et le seuil. */}
      {compte ? (
        <p className={cn('text-sm', erreur ? 'text-red-600' : 'text-slate-600')}>
          <strong className="font-medium text-slate-900">
            {compte.travailles} jour{compte.travailles > 1 ? 's' : ''} travaille
            {compte.travailles > 1 ? 's' : ''}
          </strong>
          {compte.exclus > 0 && ` · ${compte.exclus} exclu${compte.exclus > 1 ? 's' : ''}`}
          {compte.travailles > 0 && ` · environ ${formatHeures(heures)} h`}
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          Renseigne les deux dates pour voir le decompte des jours.
        </p>
      )}

      {erreur && (
        <p role="alert" className="text-xs text-red-600">
          {erreur}
        </p>
      )}
    </div>
  )
}

export default JoursTravaillesField
