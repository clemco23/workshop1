import { num } from './format.js'
import { STATUTS_ACQUIS } from './enums.js'

// Derivations du dashboard, isolees ici : fonctions pures qui prennent les lignes
// brutes de l'API (missions, config_seuil, documents) et rendent les chiffres
// affiches. Le back n'a donc qu'a exposer les lignes, pas des agregats.

// `mission.heures` est nullable dans le schema : a defaut, on retombe sur
// nb_jours x config_seuil.heures_jour_defaut.
export function heuresMission(mission, heuresJourDefaut) {
  const heures = num(mission.heures)
  if (heures > 0) return heures
  return num(mission.nbJours) * num(heuresJourDefaut)
}

// Fenetre glissante de `fenetreMois` mois qui se termine a `reference`.
export function debutFenetre(reference, fenetreMois) {
  const debut = new Date(reference)
  debut.setMonth(debut.getMonth() - fenetreMois)
  return debut
}

function memeMois(date, reference) {
  const d = new Date(date)
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth()
}

function moisPrecedent(reference) {
  const d = new Date(reference)
  d.setMonth(d.getMonth() - 1)
  return d
}

const estAcquise = (mission) => STATUTS_ACQUIS.includes(mission.statut)

export function computeDashboard({ configSeuil, missions = [], documents = [] }, reference = new Date()) {
  const { seuilHeuresAnnuel, heuresJourDefaut, fenetreMois } = configSeuil
  const debut = debutFenetre(reference, fenetreMois)

  // Seuil d'intermittence : seules les missions INTERMITTENCE acquises comptent.
  const heuresFenetre = missions
    .filter((m) => m.type === 'INTERMITTENCE' && estAcquise(m) && new Date(m.dateDebut) >= debut)
    .reduce((acc, m) => acc + heuresMission(m, heuresJourDefaut), 0)

  const caMois = missions
    .filter((m) => estAcquise(m) && memeMois(m.dateDebut, reference))
    .reduce((acc, m) => acc + num(m.montantHt), 0)

  const caMoisPrecedent = missions
    .filter((m) => estAcquise(m) && memeMois(m.dateDebut, moisPrecedent(reference)))
    .reduce((acc, m) => acc + num(m.montantHt), 0)

  const aVenir = missions.filter((m) => new Date(m.dateDebut) > reference)

  // Repartition des heures par client_production (texte libre sur la mission :
  // il n'y a pas de table client dans le schema).
  const parClient = new Map()
  for (const mission of missions) {
    if (!estAcquise(mission) || new Date(mission.dateDebut) < debut) continue
    const heures = heuresMission(mission, heuresJourDefaut)
    parClient.set(mission.clientProduction, (parClient.get(mission.clientProduction) ?? 0) + heures)
  }

  const repartition = [...parClient]
    .map(([client, heures]) => ({ client, heures }))
    .sort((a, b) => b.heures - a.heures)

  return {
    seuil: {
      heures: heuresFenetre,
      objectif: seuilHeuresAnnuel,
      ratio: seuilHeuresAnnuel > 0 ? heuresFenetre / seuilHeuresAnnuel : 0,
      restant: Math.max(seuilHeuresAnnuel - heuresFenetre, 0),
      debut,
      fenetreMois,
    },
    ca: { mois: caMois, moisPrecedent: caMoisPrecedent },
    missions: {
      total: missions.length,
      confirmees: missions.filter((m) => m.statut === 'CONFIRMED').length,
      proposees: missions.filter((m) => m.statut === 'PROPOSED').length,
      aVenir: aVenir.length,
      // Les plus recentes d'abord, pour la liste du dashboard.
      recentes: [...missions]
        .sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut))
        .slice(0, 5),
    },
    repartition,
    documentsRecents: [...documents]
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 4),
  }
}

// Couleur de la jauge : vert loin du seuil, ambre a l'approche, brand une fois atteint.
export function toneSeuil(ratio) {
  if (ratio >= 1) return 'success'
  if (ratio >= 0.8) return 'warning'
  return 'brand'
}
