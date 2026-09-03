import { num } from './format.js'
import { memesJours } from './joursTravailles.js'

// Validation du formulaire des seuils, en fonctions pures. Les memes regles
// devront exister cote serveur : ce qui est ici sert au retour immediat, pas de
// garantie. Les bornes reprennent le schema (`config_seuil`) : `seuil_heures_annuel`
// et `fenetre_mois` sont des `Int`, `heures_jour_defaut` un `Decimal`.

export const DEFAUTS = {
  seuilHeuresAnnuel: 507, // seuil d'intermittence, valeur par defaut du schema
  heuresJourDefaut: 8,
  fenetreMois: 12,
  // Aucun jour off par defaut : c'est a l'utilisateur de dire qu'il ne travaille
  // pas le week-end, l'application ne le suppose pas d'un metier ou les tournages
  // du samedi sont courants.
  joursOffDefaut: [],
}

// Le formulaire manipule des chaines (valeur d'un <input>), le schema des
// nombres : la conversion est faite une seule fois, ici.
export function versFormulaire(configSeuil) {
  return {
    seuilHeuresAnnuel: String(configSeuil.seuilHeuresAnnuel ?? DEFAUTS.seuilHeuresAnnuel),
    heuresJourDefaut: String(num(configSeuil.heuresJourDefaut) || DEFAUTS.heuresJourDefaut),
    fenetreMois: String(configSeuil.fenetreMois ?? DEFAUTS.fenetreMois),
    // Seule valeur du formulaire qui n'est pas une chaine : une liste de jours
    // au format getUTCDay(), telle qu'elle est stockee.
    joursOffDefaut: (configSeuil.joursOffDefaut ?? DEFAUTS.joursOffDefaut).map(Number),
  }
}

function entier(valeur, { min, max }) {
  if (valeur.trim() === '') return 'Valeur obligatoire.'
  const n = Number(valeur)
  if (!Number.isFinite(n)) return 'Entre un nombre.'
  if (!Number.isInteger(n)) return 'Nombre entier attendu.'
  if (n < min || n > max) return `Entre ${min} et ${max}.`
  return null
}

function decimal(valeur, { min, max }) {
  if (valeur.trim() === '') return 'Valeur obligatoire.'
  const n = Number(valeur)
  if (!Number.isFinite(n)) return 'Entre un nombre.'
  if (n < min || n > max) return `Entre ${min} et ${max}.`
  return null
}

export function validerParametres(formulaire) {
  const erreurs = {
    seuilHeuresAnnuel: entier(formulaire.seuilHeuresAnnuel, { min: 1, max: 5000 }),
    // Une journee ne fait pas plus de 24 h, et un seuil calcule sur 0 h/jour
    // rendrait toute mission sans `heures` invisible.
    heuresJourDefaut: decimal(formulaire.heuresJourDefaut, { min: 0.5, max: 24 }),
    fenetreMois: entier(formulaire.fenetreMois, { min: 1, max: 36 }),
    // Sept jours off ne laisseraient aucun jour travaille aux nouvelles missions.
    joursOffDefaut:
      formulaire.joursOffDefaut.length === 7 ? 'Garde au moins un jour travaille.' : null,
  }

  return {
    erreurs,
    valide: Object.values(erreurs).every((e) => e == null),
  }
}

// Corps attendu par PUT /api/parametres : des nombres, la ou le formulaire tient
// des chaines. Le serveur revalide (entier strictement positif pour le seuil et
// la fenetre, nombre positif pour les heures) et refuse un corps vide.
export function versPayload(formulaire) {
  return {
    seuilHeuresAnnuel: Number(formulaire.seuilHeuresAnnuel),
    heuresJourDefaut: Number(formulaire.heuresJourDefaut),
    fenetreMois: Number(formulaire.fenetreMois),
    joursOffDefaut: formulaire.joursOffDefaut.map(Number),
  }
}

export function estModifie(formulaire, configSeuil) {
  const initial = versFormulaire(configSeuil)

  return Object.keys(initial).some((cle) =>
    Array.isArray(initial[cle])
      ? !memesJours(initial[cle], formulaire[cle])
      : Number(initial[cle]) !== Number(formulaire[cle]),
  )
}
