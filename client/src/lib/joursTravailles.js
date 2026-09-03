// Masque des jours travailles d'une mission. Une mission reste *une* periode
// continue [date_debut, date_fin] ; ce module dit seulement quels jours en sont
// retires, les week-ends, un jour de la semaine, une date precise.
//
// Fonctions pures sur des cles 'AAAA-MM-JJ', comme le reste des calculs de
// calendrier (cf. `lib/missions.js`) : tout est en UTC, jamais en heure locale,
// sinon une mission bascule d'un jour a l'autre selon le fuseau du navigateur.

const JOUR = 24 * 60 * 60 * 1000

// Convention `getUTCDay()` : 0 = dimanche ... 6 = samedi. C'est celle du
// schema (`jours_off`, `jours_off_defaut`), pour n'avoir aucune traduction a
// faire entre la base, le serveur et l'affichage.
export const DIMANCHE = 0
export const SAMEDI = 6

// Ordre d'affichage francais : la semaine commence le lundi, comme la grille de
// l'agenda.
export const JOURS_SEMAINE = [
  { valeur: 1, lettre: 'L', label: 'lundi' },
  { valeur: 2, lettre: 'M', label: 'mardi' },
  { valeur: 3, lettre: 'M', label: 'mercredi' },
  { valeur: 4, lettre: 'J', label: 'jeudi' },
  { valeur: 5, lettre: 'V', label: 'vendredi' },
  { valeur: 6, lettre: 'S', label: 'samedi' },
  { valeur: 0, lettre: 'D', label: 'dimanche' },
]

export const WEEK_END = [SAMEDI, DIMANCHE]

// Les trois reglages d'un clic du formulaire. `sur-mesure` n'a pas de valeur :
// c'est ce qu'on affiche quand le masque ne correspond a aucun raccourci.
export const PRESETS = [
  { cle: 'tous', label: 'Tous les jours', joursOff: [] },
  { cle: 'semaine', label: 'Lun–Ven', joursOff: WEEK_END },
  { cle: 'sauf-dimanche', label: 'Sauf dimanche', joursOff: [DIMANCHE] },
]

// Comparaison d'ensembles de jours, independante de l'ordre des clics.
export function memesJours(a = [], b = []) {
  if (a.length !== b.length) return false
  const trie = (liste) => [...liste].map(Number).sort((x, y) => x - y)
  return trie(a).every((jour, index) => jour === trie(b)[index])
}

export function presetActif(joursOff = []) {
  return PRESETS.find((preset) => memesJours(preset.joursOff, joursOff))?.cle ?? 'sur-mesure'
}

export function jourDeLaSemaine(cle) {
  return new Date(`${cle}T00:00:00.000Z`).getUTCDay()
}

export function decalerJour(cle, delta) {
  return new Date(Date.parse(`${cle}T00:00:00.000Z`) + delta * JOUR).toISOString().slice(0, 10)
}

// Le masque, reduit a ce dont le calcul a besoin. Accepte aussi bien une mission
// de l'API (dates ISO) que les valeurs du formulaire (deja en 'AAAA-MM-JJ').
function masque(source) {
  const cles = (liste) => new Set((liste ?? []).map((valeur) => String(valeur).slice(0, 10)))

  return {
    joursOff: (source?.joursOff ?? []).map(Number),
    exclues: cles(source?.datesExclues),
    incluses: cles(source?.datesIncluses),
  }
}

// Un jour est travaille sauf si le masque le retire. L'ordre des regles compte :
// une date explicitement incluse gagne sur la recurrence, c'est ce qui permet de
// dire « pas les week-ends, sauf ce samedi-la » sans defaire le reste.
export function estJourTravaille(source, cle) {
  const { joursOff, exclues, incluses } = masque(source)

  if (incluses.has(cle)) return true
  if (exclues.has(cle)) return false
  return !joursOff.includes(jourDeLaSemaine(cle))
}

// Toutes les cles de jour de [debut, fin], bornes incluses. Une periode du 24 au
// 28 fait 5 jours, pas 4.
export function joursDeLaPlage(debut, fin) {
  if (!debut || !fin || fin < debut) return []

  const jours = []
  for (let cle = debut; cle <= fin; cle = decalerJour(cle, 1)) jours.push(cle)
  return jours
}

// Repartition de la plage, telle qu'elle est affichee sous le calendrier :
// c'est le seul endroit qui compte les jours, formulaire et pages compris.
export function compterJours(source, debut, fin) {
  const jours = joursDeLaPlage(debut, fin)
  const travailles = jours.filter((cle) => estJourTravaille(source, cle))

  return {
    total: jours.length,
    travailles: travailles.length,
    exclus: jours.length - travailles.length,
    cles: travailles,
  }
}
