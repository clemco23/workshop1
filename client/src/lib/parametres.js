import { num } from './format.js'

// Validation du formulaire des seuils, en fonctions pures. Les memes regles
// devront exister cote serveur : ce qui est ici sert au retour immediat, pas de
// garantie. Les bornes reprennent le schema (`config_seuil`) : `seuil_heures_annuel`
// et `fenetre_mois` sont des `Int`, `heures_jour_defaut` un `Decimal`.

export const DEFAUTS = {
  seuilHeuresAnnuel: 507, // seuil d'intermittence, valeur par defaut du schema
  heuresJourDefaut: 8,
  fenetreMois: 12,
}

// Le formulaire manipule des chaines (valeur d'un <input>), le schema des
// nombres : la conversion est faite une seule fois, ici.
export function versFormulaire(configSeuil) {
  return {
    seuilHeuresAnnuel: String(configSeuil.seuilHeuresAnnuel ?? DEFAUTS.seuilHeuresAnnuel),
    heuresJourDefaut: String(num(configSeuil.heuresJourDefaut) || DEFAUTS.heuresJourDefaut),
    fenetreMois: String(configSeuil.fenetreMois ?? DEFAUTS.fenetreMois),
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
  }

  return {
    erreurs,
    valide: Object.values(erreurs).every((e) => e == null),
  }
}

export function estModifie(formulaire, configSeuil) {
  const initial = versFormulaire(configSeuil)
  return Object.keys(initial).some((cle) => Number(initial[cle]) !== Number(formulaire[cle]))
}
