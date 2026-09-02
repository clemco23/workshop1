// Formulaire de fiche projet : valeurs par defaut, validation et mise en forme
// vers le contrat de l'API. Fonctions pures, memes conventions que missionForm.js
// — les memes regles devront exister cote serveur.
//
// Champs du schema : `titre`, `description` (nullable), `tag` (ProjectTag),
// `type` (ProjectType, defaut VIDEO), `date`, `link` (requis), `mission_id`
// (nullable : une fiche perso n'a pas de mission).

export const PROJET_VIDE = {
  titre: '',
  description: '',
  tag: 'PRO',
  type: 'VIDEO', // defaut du schema
  date: '',
  link: '',
  missionId: '',
}

// Fiche de l'API -> valeurs du formulaire (des chaines). Comme pour les
// missions, la date arrive en ISO UTC et l'<input type="date"> attend
// 'AAAA-MM-JJ' : les dix premiers caracteres de l'ISO sont deja la date UTC,
// donc pas de passage par l'heure locale, qui decalerait d'un jour a l'ouest de
// Greenwich.
export function versFormulaire(projet) {
  return {
    titre: projet.titre ?? '',
    description: projet.description ?? '',
    tag: projet.tag,
    type: projet.type,
    date: projet.date ? projet.date.slice(0, 10) : '',
    link: projet.link ?? '',
    missionId: projet.missionId ?? '',
  }
}

// Y a-t-il quelque chose a enregistrer ? Comparaison champ a champ, apres
// normalisation par versFormulaire.
export function estModifie(formulaire, projet) {
  const initial = versFormulaire(projet)
  return Object.keys(initial).some((cle) => initial[cle] !== formulaire[cle])
}

// Le lien part sur une page publique : n'accepter que http(s), pour ne pas
// laisser passer un `javascript:` ou un chemin local qui ne mene nulle part.
function lienValide(valeur) {
  try {
    const url = new URL(valeur)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validerProjet(formulaire) {
  const lien = formulaire.link.trim()

  const erreurs = {
    titre: formulaire.titre.trim() === '' ? 'Donne un titre a la fiche.' : null,
    date: formulaire.date === '' ? 'Date obligatoire.' : null,
    link:
      lien === ''
        ? 'Lien obligatoire.'
        : lienValide(lien)
          ? null
          : 'Adresse invalide — elle doit commencer par http:// ou https://.',
  }

  return { erreurs, valide: Object.values(erreurs).every((e) => e == null) }
}

// Corps attendu par POST /api/projets. `mission_id` vide = fiche personnelle.
export function versPayload(formulaire) {
  const description = formulaire.description.trim()

  return {
    titre: formulaire.titre.trim(),
    description: description === '' ? null : description,
    tag: formulaire.tag,
    type: formulaire.type,
    date: new Date(`${formulaire.date}T00:00:00.000Z`).toISOString(),
    link: formulaire.link.trim(),
    missionId: formulaire.missionId === '' ? null : formulaire.missionId,
  }
}
