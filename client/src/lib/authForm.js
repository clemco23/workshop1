// Formulaire de connexion : validation de l'email et traduction des erreurs de
// l'API en message affichable. Fonctions pures, memes conventions que
// missionForm.js / portfolioForm.js — le serveur reste seul juge, ce qui est ici
// sert au retour immediat.

// Volontairement permissif : le seul vrai test d'une adresse est qu'un mail y
// arrive. On n'ecarte que ce qui ne peut pas etre une adresse, pour ne pas
// bloquer un domaine exotique.
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normaliserEmail(valeur) {
  return valeur.trim().toLowerCase()
}

// Renvoie le message d'erreur, ou null si l'email est acceptable.
export function validerEmail(valeur) {
  const email = normaliserEmail(valeur)

  if (email === '') return 'Adresse email obligatoire.'
  if (!FORME_EMAIL.test(email)) return 'Adresse email invalide.'
  if (email.length > 254) return 'Adresse email trop longue.'

  return null
}

// Erreur axios -> phrase affichable. Le statut vient de `../server` :
// 400 email refuse, 502 envoi echoue, 503 service email non configure.
export function messageErreur(error) {
  if (!error.response) {
    return "Serveur injoignable. Verifie ta connexion, puis reessaie."
  }

  const { status, data } = error.response

  if (status === 400) return data?.message ?? 'Adresse email invalide.'
  if (status === 502) return "L'email n'a pas pu etre envoye. Reessaie dans un instant."
  if (status === 503) return "Le service d'envoi des codes est indisponible."

  // Le serveur renvoie aussi 500 quand Gmail n'est pas configure (le 503 prevu
  // ne part pas, cf. le code d'erreur desynchronise note dans server/CLAUDE.md),
  // donc pas de message plus precis ici : ce serait deviner.
  return 'Erreur serveur. Reessaie dans un instant.'
}
