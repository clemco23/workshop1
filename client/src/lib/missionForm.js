// Formulaire de mission : valeurs par defaut, validation et mise en forme vers
// le contrat de l'API. Fonctions pures — les memes regles devront exister cote
// serveur, ici c'est du retour immediat, pas une garantie.
//
// Les bornes suivent le schema : `heures` est un Decimal(6,2), `montant_ht` un
// Decimal(10,2), `nb_jours` un Decimal(5,2). Les champs nullables restent des
// chaines vides dans le formulaire et deviennent `null` a l'envoi.

export const MISSION_VIDE = {
  clientProduction: '',
  type: 'INTERMITTENCE',
  statut: 'PROPOSED', // defaut du schema
  dateDebut: '',
  dateFin: '',
  heures: '',
  montantHt: '',
  nbJours: '',
  note: '',
}

// Mission de l'API -> valeurs du formulaire (des chaines). Les dates arrivent en
// ISO UTC et les <input type="date"> attendent 'AAAA-MM-JJ' : les dix premiers
// caracteres de l'ISO sont deja la date UTC, donc pas de passage par l'heure
// locale, qui decalerait d'un jour a l'ouest de Greenwich.
export function versFormulaire(mission) {
  // Decimal Prisma : '40.00' -> '40', pour ne pas afficher des zeros inutiles
  // dans un champ que l'utilisateur va reecrire.
  const decimal = (valeur) => (valeur == null ? '' : String(Number(valeur)))

  return {
    clientProduction: mission.clientProduction ?? '',
    type: mission.type,
    statut: mission.statut,
    dateDebut: mission.dateDebut ? mission.dateDebut.slice(0, 10) : '',
    dateFin: mission.dateFin ? mission.dateFin.slice(0, 10) : '',
    heures: decimal(mission.heures),
    montantHt: decimal(mission.montantHt),
    nbJours: decimal(mission.nbJours),
    note: mission.note ?? '',
  }
}

// Y a-t-il quelque chose a enregistrer ? Comparaison champ a champ des chaines
// du formulaire, apres normalisation par versFormulaire.
export function estModifie(formulaire, mission) {
  const initial = versFormulaire(mission)
  return Object.keys(initial).some((cle) => initial[cle] !== formulaire[cle])
}

function nombreOptionnel(valeur, { max, entier = false, label }) {
  if (valeur.trim() === '') return null // champ nullable : vide est valide
  const n = Number(valeur)
  if (!Number.isFinite(n)) return 'Entre un nombre.'
  if (n <= 0) return `${label} doit etre positif.`
  if (n > max) return `Maximum ${max}.`
  if (entier && !Number.isInteger(n)) return 'Nombre entier attendu.'
  return null
}

export function validerMission(formulaire) {
  const erreurs = {
    clientProduction:
      formulaire.clientProduction.trim() === '' ? 'Indique le client ou la production.' : null,
    dateDebut: formulaire.dateDebut === '' ? 'Date de debut obligatoire.' : null,
    // date_fin est nullable (mission ouverte), mais si elle est la elle ne peut
    // pas preceder le debut.
    dateFin:
      formulaire.dateFin !== '' &&
      formulaire.dateDebut !== '' &&
      formulaire.dateFin < formulaire.dateDebut
        ? 'La fin ne peut pas preceder le debut.'
        : null,
    heures: nombreOptionnel(formulaire.heures, { max: 9999.99, label: 'Le nombre d’heures' }),
    montantHt: nombreOptionnel(formulaire.montantHt, { max: 99999999.99, label: 'Le montant' }),
    nbJours: nombreOptionnel(formulaire.nbJours, { max: 999.99, label: 'Le nombre de jours' }),
  }

  return { erreurs, valide: Object.values(erreurs).every((e) => e == null) }
}

// Corps attendu par POST /api/missions : dates ISO, champs vides a null, nombres
// en chaines comme les Decimal que Prisma renvoie.
export function versPayload(formulaire) {
  const optionnel = (valeur) => (valeur.trim() === '' ? null : valeur.trim())

  return {
    clientProduction: formulaire.clientProduction.trim(),
    type: formulaire.type,
    statut: formulaire.statut,
    dateDebut: new Date(`${formulaire.dateDebut}T00:00:00.000Z`).toISOString(),
    dateFin: formulaire.dateFin
      ? new Date(`${formulaire.dateFin}T00:00:00.000Z`).toISOString()
      : null,
    heures: optionnel(formulaire.heures),
    montantHt: optionnel(formulaire.montantHt),
    nbJours: optionnel(formulaire.nbJours),
    note: optionnel(formulaire.note),
  }
}
