import { api } from './client.js'

// Contrats cote server (voir ../../server/CLAUDE.md) :
//   POST /api/auth/request-code { email }       -> { success, message, email }
//   POST /api/auth/verify-code  { email, code } -> { success, message, token, user }
//   GET  /api/auth/me                           -> { user }
//
// Ces trois routes portent encore un booleen `success` : c'est l'ancienne
// convention du serveur, conservee parce que le client la lit. Les routes
// metier, elles, renvoient la ressource nue.

// Demande d'un code a usage unique. Le meme appel vaut inscription : le serveur
// cree le compte quand l'email est inconnu, il n'y a donc pas de second
// endpoint pour s'inscrire.
export async function requestCode(email) {
  const { data } = await api.post('/api/auth/request-code', { email })
  return data
}

// Echange du code contre un jeton valable sept jours.
export async function verifyCode(email, code) {
  const { data } = await api.post('/api/auth/verify-code', { email, code })
  return data
}

// Utilisateur du jeton courant. Sert a rehydrater la session au chargement :
// `localStorage` garde une copie de l'utilisateur, mais c'est le serveur qui
// dit si le jeton vaut encore quelque chose. Un 401 ici est traite par
// l'intercepteur de reponse (session effacee).
export async function fetchMe() {
  const { data } = await api.get('/api/auth/me')
  return data.user
}
