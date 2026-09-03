// Formulaire de page publique : valeurs par defaut et validation.
// Fonctions pures, memes conventions que missionForm.js / projetForm.js.
//
// Champs du schema : `slug` (unique sur tout le site), `titre_page`, `actif`
// (defaut true). Le **slug n'est pas saisi** : le serveur le derive du titre
// (`slugify(titrePage)` + 4 octets aleatoires) puis le fige, un lien deja
// partage ne doit pas casser. Il n'y a donc rien a valider ni a envoyer pour
// lui, et pas de collision a anticiper cote client.
//
// La selection des projets se fait ensuite sur la fiche de la page, via la
// table de jonction, pas ici : une page se cree vide.

export const PORTFOLIO_VIDE = {
  titrePage: '',
  actif: true,
}

// Le titre est obligatoire cote serveur (`Titre du portfolio requis`) : c'est
// lui qui fabrique l'adresse.
export function validerPortfolio(formulaire) {
  const titre = formulaire.titrePage.trim()

  const erreurs = {
    titrePage:
      titre === ''
        ? 'Titre obligatoire : il sert a fabriquer l’adresse publique.'
        : titre.length > 120
          ? 'Cent-vingt caracteres maximum.'
          : null,
  }

  return { erreurs, valide: Object.values(erreurs).every((e) => e == null) }
}

// Apercu de l'adresse que le serveur produira, a titre indicatif : il y ajoute
// un suffixe aleatoire, l'adresse finale n'est donc connue qu'apres la creation.
export function slugifier(valeur) {
  return (
    valeur
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'portfolio'
  )
}

// Corps attendu par POST /api/portfolios. `projectIds` est envoye vide : la page
// se remplit ensuite depuis sa fiche.
export function versPayload(formulaire) {
  return {
    titrePage: formulaire.titrePage.trim(),
    actif: formulaire.actif,
    projectIds: [],
  }
}
