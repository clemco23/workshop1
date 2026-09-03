// Erreur axios -> phrase affichable, commune a tous les formulaires.
//
// Ordre de preference : un cas que l'appelant a voulu formuler lui-meme, puis le
// `message` renvoye par l'API (nos routes en mettent toujours un, et il est deja
// redige en francais pour l'utilisateur), puis un repli generique. Le statut
// brut n'est jamais montre.
//
// `cas` = { [statut]: 'phrase' } pour les codes qui demandent mieux que le
// message serveur, typiquement quand la cause est cote client et que l'action
// a proposer n'est pas la meme.

const INJOIGNABLE = 'Serveur injoignable. Verifie ta connexion, puis reessaie.'
const GENERIQUE = 'Erreur serveur. Reessaie dans un instant.'

export function messageErreur(error, cas = {}) {
  // Pas de reponse du tout : coupure reseau, timeout axios, serveur eteint.
  if (!error.response) return INJOIGNABLE

  const { status, data } = error.response

  return cas[status] ?? data?.message ?? GENERIQUE
}
