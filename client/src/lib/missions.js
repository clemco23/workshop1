import { num } from './format.js'
import { heuresMission } from './dashboard.js'
import { compterJours, decalerJour, estJourTravaille } from './joursTravailles.js'

// Logique de la page Missions : filtrage, totaux, grille d'agenda et mise en
// forme pour la timeline. Fonctions pures, donc verifiables sans navigateur.

const JOUR = 24 * 60 * 60 * 1000

// Tous les calculs de calendrier se font en UTC, et les jours se comparent par
// leur cle 'AAAA-MM-JJ'. Les dates de l'API sont en UTC : passer par l'heure
// locale ferait basculer une mission d'un jour a l'autre selon le fuseau du
// navigateur (a l'ouest de Greenwich, minuit UTC est la veille au soir).
export function cleJour(valeur) {
  return new Date(valeur).toISOString().slice(0, 10)
}

export function filtrerMissions(missions, { type = '', statut = '', client = '' } = {}) {
  const recherche = client.trim().toLowerCase()

  return missions
    .filter((m) => !type || m.type === type)
    .filter((m) => !statut || m.statut === statut)
    .filter((m) => !recherche || m.clientProduction.toLowerCase().includes(recherche))
}

// Totaux du jeu affiche, et le detail par type, c'est ce qui rend la difference
// intermittence / freelance lisible autrement que par la couleur.
export function totauxMissions(missions, heuresJourDefaut) {
  const vide = () => ({ nb: 0, heures: 0, montant: 0 })
  const parType = { INTERMITTENCE: vide(), FREELANCE: vide() }
  const global = vide()

  for (const mission of missions) {
    const heures = heuresMission(mission, heuresJourDefaut)
    const montant = num(mission.montantHt)
    const cible = parType[mission.type] ?? vide()

    cible.nb += 1
    cible.heures += heures
    cible.montant += montant

    global.nb += 1
    global.heures += heures
    global.montant += montant
  }

  return { global, parType }
}

function debutDeMois(ms) {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}

function moisSuivant(ms) {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
}

// Barres flottantes pour la timeline : chaque mission devient un segment
// [offset, duree] sur un axe temporel commun. `offset` est rendu transparent,
// c'est la technique des barres empilees pour obtenir un Gantt.
export function construireTimeline(missions, maintenant = Date.now()) {
  if (missions.length === 0) return { lignes: [], domaine: [0, 1], ticks: [], origine: 0 }

  const lignes = missions
    .map((mission) => {
      const debut = new Date(mission.dateDebut).getTime()
      // date_fin est nullable : la mission est ouverte, on la trace jusqu'a
      // aujourd'hui plutot que de la reduire a un point.
      const ouverte = mission.dateFin == null
      const fin = ouverte ? Math.max(maintenant, debut + JOUR) : new Date(mission.dateFin).getTime()

      return {
        mission,
        id: mission.id,
        client: mission.clientProduction,
        debut,
        fin,
        ouverte,
        // +1 jour : une periode du 24 au 28 couvre 5 jours, pas 4.
        duree: Math.max(fin - debut + JOUR, JOUR),
      }
    })
    .sort((a, b) => a.debut - b.debut)

  const min = debutDeMois(Math.min(...lignes.map((l) => l.debut)))
  const max = moisSuivant(Math.max(...lignes.map((l) => l.fin)))

  // Les barres empilees partent de zero : l'axe est donc en temps *relatif* a
  // `origine`, pas en timestamps absolus. Le formateur de ticks refait l'addition.
  const ticks = []
  for (let t = min; t <= max; t = moisSuivant(t)) ticks.push(t - min)

  return {
    origine: min,
    domaine: [0, max - min],
    ticks,
    lignes: lignes.map((ligne) => ({ ...ligne, offset: ligne.debut - min })),
  }
}

// --- Agenda mensuel -------------------------------------------------------

// Bornes d'une mission en cles de jour. date_fin nullable = mission ouverte :
// elle court jusqu'a aujourd'hui.
export function bornesMission(mission, maintenant = Date.now()) {
  const debut = cleJour(mission.dateDebut)
  if (mission.dateFin) return [debut, cleJour(mission.dateFin)]

  const jour = cleJour(maintenant)
  return [debut, jour > debut ? jour : debut]
}

// Jours reellement travailles, bornes incluses et masque applique : du 24 au 28
// sans les week-ends fait 3 jours. Sert de repli quand nb_jours est null (il est
// nullable dans le schema).
export function nbJoursTravailles(mission, maintenant = Date.now()) {
  const [debut, fin] = bornesMission(mission, maintenant)
  return compterJours(mission, debut, fin).travailles
}

// Comparaison lexicographique : valide sur des dates ISO 'AAAA-MM-JJ'. Un jour
// retire par le masque n'est pas couvert, l'agenda et la repartition en
// couloirs s'en deduisent, sans avoir a connaitre la regle.
export function couvreJour(mission, cle, maintenant = Date.now()) {
  const [debut, fin] = bornesMission(mission, maintenant)
  if (cle < debut || cle > fin) return false
  return estJourTravaille(mission, cle)
}

// Grille du mois contenant `ancre`, semaines commencant le lundi.
// Le nombre de semaines s'adapte (4 a 6) pour ne jamais afficher une rangee
// entierement hors du mois.
//
// Chaque semaine attribue un *couloir* stable a ses missions (placement au
// premier couloir libre, dans l'ordre des dates de debut). Sans ca, une mission
// qui se poursuit remonte d'une ligne des qu'une autre se termine : la barre
// d'une mission de plusieurs jours sauterait d'une case a l'autre.
export function construireMois(missions, ancre, maintenant = Date.now()) {
  const date = new Date(ancre)
  const annee = date.getUTCFullYear()
  const mois = date.getUTCMonth()

  const premier = Date.UTC(annee, mois, 1)
  const nbJours = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate()

  // getUTCDay : 0 = dimanche. On decale pour que 0 = lundi.
  const decalage = (new Date(premier).getUTCDay() + 6) % 7
  const debutGrille = premier - decalage * JOUR
  const nbSemaines = Math.ceil((decalage + nbJours) / 7)

  const cleAujourdhui = cleJour(maintenant)

  const semaines = []
  for (let s = 0; s < nbSemaines; s += 1) {
    const jours = []
    for (let j = 0; j < 7; j += 1) {
      const ms = debutGrille + (s * 7 + j) * JOUR
      const jourUtc = new Date(ms)

      jours.push({
        cle: cleJour(ms),
        ms,
        numero: jourUtc.getUTCDate(),
        dansLeMois: jourUtc.getUTCMonth() === mois,
        aujourdhui: cleJour(ms) === cleAujourdhui,
        weekend: j >= 5,
        lanes: [],
      })
    }

    // Missions presentes dans la semaine, par date de debut (ordre stable).
    const presentes = missions
      .filter((mission) => jours.some((jour) => couvreJour(mission, jour.cle, maintenant)))
      .sort(
        (a, b) =>
          new Date(a.dateDebut) - new Date(b.dateDebut) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
      )

    // Placement au premier couloir ou aucune mission deja placee ne chevauche.
    const couloirs = []
    for (const mission of presentes) {
      const joursCouverts = jours.filter((jour) => couvreJour(mission, jour.cle, maintenant))

      let index = couloirs.findIndex(
        (couloir) =>
          !couloir.some((placee) =>
            joursCouverts.some((jour) => couvreJour(placee, jour.cle, maintenant)),
          ),
      )
      if (index === -1) {
        couloirs.push([])
        index = couloirs.length - 1
      }
      couloirs[index].push(mission)

      for (const jour of joursCouverts) {
        jour.lanes[index] = {
          mission,
          // Debut d'un *segment* : la veille n'est pas couverte, soit parce que
          // la mission commence, soit parce que le masque a perce un trou. C'est
          // la case ou l'on ecrit le nom, et celle qui porte un bout arrondi.
          debute: !couvreJour(mission, decalerJour(jour.cle, -1), maintenant),
          // Idem a droite : chaque morceau de bande se referme proprement au
          // lieu de se couper net sur un jour retire.
          termine: !couvreJour(mission, decalerJour(jour.cle, 1), maintenant),
        }
      }
    }

    // Normalise : des trous eventuels deviennent des couloirs vides explicites.
    for (const jour of jours) {
      for (let i = 0; i < couloirs.length; i += 1) {
        if (jour.lanes[i] === undefined) jour.lanes[i] = null
      }
      jour.missions = jour.lanes.filter(Boolean)
    }

    semaines.push(jours)
  }

  return { mois: premier, semaines }
}

// Mois precedent / suivant, en UTC (evite les surprises au changement d'heure).
export function decalerMois(ancre, delta) {
  const date = new Date(ancre)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1)
}
