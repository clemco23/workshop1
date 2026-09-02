// Formulaire de page publique : valeurs par defaut, slug et validation.
// Fonctions pures, memes conventions que missionForm.js / projetForm.js.
//
// Champs du schema : `slug` (unique sur tout le site), `titre_page` (nullable),
// `actif` (defaut true). La selection des projets se fait ensuite sur la fiche
// de la page, via la table de jonction — pas ici.

export const PORTFOLIO_VIDE = {
  titrePage: '',
  slug: '',
  actif: true,
}

// Le slug est dans l'URL publique : minuscules, chiffres et tirets seulement.
// Les accents sont deposes (NFD puis retrait des diacritiques) plutot que
// remplaces par des tirets, pour que « Théâtre » donne « theatre » et pas « th-tre ».
export function slugifier(valeur) {
  return valeur
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const FORME_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validerPortfolio(formulaire, slugsExistants = []) {
  const slug = formulaire.slug.trim()

  const erreurs = {
    slug:
      slug === ''
        ? 'Adresse obligatoire.'
        : !FORME_SLUG.test(slug)
          ? 'Minuscules, chiffres et tirets seulement.'
          : slug.length < 3
            ? 'Trois caracteres minimum.'
            : slug.length > 60
              ? 'Soixante caracteres maximum.'
              : // Le serveur reste seul juge (contrainte @unique), mais autant le
                // dire tout de suite quand la collision est visible cote client.
                slugsExistants.includes(slug)
                ? 'Cette adresse est deja prise.'
                : null,
    titrePage: formulaire.titrePage.length > 120 ? 'Cent-vingt caracteres maximum.' : null,
  }

  return { erreurs, valide: Object.values(erreurs).every((e) => e == null) }
}

// Corps attendu par POST /api/portfolios. `titre_page` vide = null : la page
// publique retombe alors sur le slug.
export function versPayload(formulaire) {
  const titre = formulaire.titrePage.trim()

  return {
    slug: formulaire.slug.trim(),
    titrePage: titre === '' ? null : titre,
    actif: formulaire.actif,
  }
}
