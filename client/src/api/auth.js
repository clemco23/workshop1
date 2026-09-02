import { api, USE_MOCKS } from './client.js'
import { CODE_MOCK, user } from '../mocks/db.js'

// Contrats cote server (voir ../../server/CLAUDE.md) :
//   POST /api/auth/request-code { email }       -> { success, message, email }
//   POST /api/auth/verify-code  { email, code } -> { success, message, token, user }
//
// Comme les autres modules, celui-ci sert le mock ou tape l'API selon
// `USE_MOCKS` : la page de connexion ne sait pas lequel des deux repond.
// En mock, aucun mail ne part — le code a saisir est `CODE_MOCK`
// (src/mocks/db.js), et n'importe quelle adresse est acceptee, puisque le vrai
// serveur cree lui aussi le compte quand l'email est inconnu.

// Demande d'un code a usage unique. Le meme appel vaut inscription : pas de
// formulaire d'inscription distinct a appeler.
export async function requestCode(email) {
  if (USE_MOCKS) {
    return { success: true, message: `Code simule : ${CODE_MOCK}`, email }
  }

  const { data } = await api.post('/api/auth/request-code', { email })
  return data
}

// Echange du code contre un jeton. En mock, seul `CODE_MOCK` passe, et le jeton
// est une chaine sans valeur : rien ne le verifie tant que le back n'est pas
// branche.
export async function verifyCode(email, code) {
  if (USE_MOCKS) {
    if (code !== CODE_MOCK) {
      const erreur = new Error('Code invalide')
      // Meme forme qu'une erreur axios, pour que messageErreur() n'ait pas a
      // distinguer le mock du reseau.
      erreur.response = { status: 400, data: { message: 'Code invalide ou expire' } }
      throw erreur
    }

    return { success: true, message: 'Connexion simulee', token: 'mock-token', user }
  }

  const { data } = await api.post('/api/auth/verify-code', { email, code })
  return data
}
