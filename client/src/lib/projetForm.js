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
