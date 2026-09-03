// Session du navigateur : le jeton renvoye par POST /api/auth/verify-code, et
// l'utilisateur qui va avec.
//
// `localStorage` et pas `sessionStorage` : le jeton vaut sept jours cote
// serveur, fermer l'onglet ne doit pas deconnecter. Un JWT lisible par tout
// script de la page est le compromis assume ici, l'API et le client ne
// partagent pas de domaine, il n'y a donc pas de cookie httpOnly possible sans
// proxy. Ne jamais y ecrire autre chose que ce que /api/auth/me renverrait.
//
// Chaque acces est protege : en navigation privee ou avec les cookies tiers
// bloques, `localStorage` peut lever au lieu de repondre.

const CLE_JETON = 'wks1.token'
const CLE_UTILISATEUR = 'wks1.user'

export function enregistrerSession({ token, user }) {
  try {
    localStorage.setItem(CLE_JETON, token)
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(user))
  } catch {
    // Stockage indisponible : la session ne survivra pas au rechargement, mais
    // la navigation en cours reste valable.
  }
}

export function lireJeton() {
  try {
    return localStorage.getItem(CLE_JETON)
  } catch {
    return null
  }
}

export function lireUtilisateur() {
  try {
    const brut = localStorage.getItem(CLE_UTILISATEUR)
    return brut ? JSON.parse(brut) : null
  } catch {
    return null
  }
}

export function effacerSession() {
  try {
    localStorage.removeItem(CLE_JETON)
    localStorage.removeItem(CLE_UTILISATEUR)
  } catch {
    // Rien a faire : sans stockage, il n'y avait rien a effacer.
  }
}

// Rafraichissement du seul utilisateur, sans toucher au jeton : sert a la
// rehydratation au chargement, ou /api/auth/me fait foi sur ce que la copie
// locale contient.
export function enregistrerUtilisateur(user) {
  try {
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(user))
  } catch {
    // Stockage indisponible : la copie locale ne sera pas mise a jour, la
    // session en cours reste valable.
  }
}
