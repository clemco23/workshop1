import { useState } from 'react'
import { JOURS_SEMAINE, PRESETS, presetActif } from '../../lib/joursTravailles.js'
import { cn } from '../../lib/cn.js'

// Choix des jours de la semaine *non* travailles, en deux etages : trois
// raccourcis qui couvrent la quasi-totalite des cas en un clic, et les sept
// jours un a un pour le reste. Le second etage ne s'affiche que si on le
// demande, c'est ce qui garde le champ a une ligne dans le cas courant.
//
// `value` est une liste de jours au format getUTCDay() (0 = dimanche), la meme
// convention que le schema : rien a traduire entre la base et l'ecran.

function Chip({ actif, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={actif}
      className={cn(
        'h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors',
        actif
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

function JoursSemaine({ label, value = [], onChange, hint, erreur }) {
  const preset = presetActif(value)
  // Le detail reste ouvert tant qu'on ne repasse pas par un raccourci : sinon il
  // se refermerait sous les doigts au premier jour decoche.
  const [detail, setDetail] = useState(false)
  const ouvert = detail || preset === 'sur-mesure'

  const choisirPreset = (joursOff) => {
    setDetail(false)
    onChange(joursOff)
  }

  const basculerJour = (jour) => {
    const suivant = value.includes(jour) ? value.filter((j) => j !== jour) : [...value, jour]
    // Les sept jours off videraient toute mission de sa substance : le dernier
    // jour travaille ne se decoche pas.
    if (suivant.length === 7) return
    onChange(suivant.sort((a, b) => a - b))
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {label && (
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((option) => (
          <Chip
            key={option.cle}
            actif={!detail && preset === option.cle}
            onClick={() => choisirPreset(option.joursOff)}
          >
            {option.label}
          </Chip>
        ))}
        <Chip actif={ouvert} onClick={() => setDetail((etat) => !etat)}>
          Sur mesure
        </Chip>
      </div>

      {ouvert && (
        <div className="flex flex-wrap items-center gap-1.5">
          {JOURS_SEMAINE.map((jour) => {
            const travaille = !value.includes(jour.valeur)

            return (
              <button
                key={jour.valeur}
                type="button"
                onClick={() => basculerJour(jour.valeur)}
                aria-pressed={travaille}
                aria-label={jour.label}
                title={travaille ? `${jour.label} : travaille` : `${jour.label} : non travaille`}
                className={cn(
                  'size-8 rounded-lg border text-xs font-semibold transition-colors',
                  travaille
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-300 line-through',
                )}
              >
                {jour.lettre}
              </button>
            )
          })}
        </div>
      )}

      {(erreur || hint) && (
        <p className={cn('text-xs', erreur ? 'text-red-600' : 'text-slate-500')}>
          {erreur ?? hint}
        </p>
      )}
    </div>
  )
}

export default JoursSemaine
