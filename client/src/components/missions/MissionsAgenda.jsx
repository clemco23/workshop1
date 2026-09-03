import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { construireMois, decalerMois } from '../../lib/missions.js'
import { couleurType, opaciteStatut } from '../../lib/viz.js'
import { MISSION_STATUT, MISSION_TYPE, enumMeta } from '../../lib/enums.js'
import { cn } from '../../lib/cn.js'

// Agenda mensuel : une case par jour, defilement de mois en mois.
// Une mission de plusieurs jours occupe toutes ses cases ; son nom n'est ecrit
// que le premier jour et en debut de semaine, les autres cases portent une barre
// de continuation, comme un agenda classique.

const MAX_COULOIRS = 3 // au-dela, les cases deviennent trop hautes

const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const moisAn = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// Tous les couloirs ont la meme hauteur, pastille nommee comme continuation :
// sinon les couloirs ne s'alignent plus d'un jour a l'autre et la bande d'une
// mission de plusieurs jours part en escalier.
const HAUTEUR_COULOIR = 'h-5'

function Pastille({ entree, ecrireNom }) {
  const { mission, debute, termine } = entree
  const type = enumMeta(MISSION_TYPE, mission.type)
  const statut = enumMeta(MISSION_STATUT, mission.statut)

  return (
    <Link
      to={`/missions/${mission.id}`}
      title={[
        mission.clientProduction,
        ` · ${type.label}, ${statut.label}`,
        // La bande d'une mission ouverte s'arrete a aujourd'hui : sans cette
        // mention, son bout arrondi se lirait comme une vraie date de fin.
        mission.dateFin == null ? ' (sans date de fin)' : '',
      ].join('')}
      className={cn(
        HAUTEUR_COULOIR,
        'flex items-center truncate px-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-80',
        // Bouts arrondis aux seules extremites reelles : au milieu, la bande se
        // prolonge d'une case a l'autre.
        debute ? 'rounded-l' : 'rounded-l-none',
        termine ? 'rounded-r' : 'rounded-r-none',
      )}
      style={{
        backgroundColor: couleurType(mission.type),
        opacity: opaciteStatut(mission.statut),
      }}
    >
      {ecrireNom ? mission.clientProduction : ''}
    </Link>
  )
}

function MissionsAgenda({ missions }) {
  const [ancre, setAncre] = useState(() => {
    const maintenant = new Date()
    return Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1)
  })

  const { semaines } = useMemo(() => construireMois(missions, ancre), [missions, ancre])

  const auMois = (delta) => () => setAncre((valeur) => decalerMois(valeur, delta))
  const aujourdhui = () => {
    const maintenant = new Date()
    setAncre(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1))
  }

  const boutonNav =
    'grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50'

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900 first-letter:uppercase">
          {moisAn.format(new Date(ancre))}
        </p>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={aujourdhui} className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Aujourd&apos;hui
          </button>
          <button type="button" onClick={auMois(-1)} aria-label="Mois precedent" className={boutonNav}>
            <Icon name="chevronLeft" className="size-4" />
          </button>
          <button type="button" onClick={auMois(1)} aria-label="Mois suivant" className={boutonNav}>
            <Icon name="chevronRight" className="size-4" />
          </button>
        </div>
      </div>

      {/* 7 colonnes serrees sur mobile : la grille defile horizontalement
          plutot que d'ecraser les cases. */}
      <div className="overflow-x-auto">
        <div className="min-w-[42rem]">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {joursSemaine.map((jour) => (
              <div key={jour} className="px-2 pb-2 text-xs font-medium text-slate-500">
                {jour}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {semaines.map((semaine) =>
              semaine.map((jour, indexJour) => {
                // On decoupe par *couloir*, pas par mission, pour garder les
                // lignes alignees d'un jour a l'autre.
                const visibles = jour.lanes.slice(0, MAX_COULOIRS)
                const reste = jour.lanes.slice(MAX_COULOIRS).filter(Boolean).length

                return (
                  <div
                    key={jour.cle}
                    className={cn(
                      'min-h-[7.5rem] border-r border-b border-slate-100 p-1.5',
                      indexJour === 6 && 'border-r-0',
                      jour.weekend && 'bg-slate-50/60',
                      !jour.dansLeMois && 'bg-slate-50/40',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          'grid size-5 place-items-center rounded-full text-xs tabular-nums',
                          jour.aujourdhui && 'bg-brand-600 font-semibold text-white',
                          !jour.aujourdhui && jour.dansLeMois && 'text-slate-700',
                          !jour.aujourdhui && !jour.dansLeMois && 'text-slate-400',
                        )}
                      >
                        {jour.numero}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      {visibles.map((entree, indexCouloir) =>
                        entree ? (
                          <Pastille
                            key={entree.mission.id}
                            entree={entree}
                            // Nom ecrit au premier jour de la mission, et rappele
                            // en debut de semaine quand elle se poursuit.
                            ecrireNom={entree.debute || indexJour === 0}
                          />
                        ) : (
                          // Couloir vide : reserve la place pour que la mission du
                          // couloir suivant ne remonte pas d'une ligne.
                          <span
                            key={`vide-${indexCouloir}`}
                            className={HAUTEUR_COULOIR}
                            aria-hidden="true"
                          />
                        ),
                      )}
                      {reste > 0 && (
                        <span className="px-1.5 text-[11px] leading-4 text-slate-500">
                          +{reste} autre{reste > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MissionsAgenda
