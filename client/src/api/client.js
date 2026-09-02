import axios from 'axios'
import { effacerSession, lireJeton } from '../lib/session.js'

// Instance axios unique : jamais d'URL absolue codee en dur dans les pages.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: { Accept: 'application/json' },
})

// Le jeton est pose ici, une fois pour toutes : aucun module d'api/ ne doit
// avoir a y penser. Il est lu a chaque requete (et pas capture au demarrage)
// pour qu'une connexion ou une deconnexion prenne effet immediatement.
// /api/public/* n'en a pas besoin, mais l'envoyer quand meme est sans effet :
// le serveur ne le regarde pas sur cette route.
api.interceptors.request.use((config) => {
  const jeton = lireJeton()
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})

// Le jeton vaut sept jours cote serveur : il expire donc en cours d'usage, et
// l'utilisateur voit alors un 401 sur une route quelconque. Reponse unique ici
// plutot que dans chaque appelant : on efface la session (elle ne vaut plus
// rien) et on marque l'erreur, que `RouteError` et les formulaires savent lire.
//
// Les deux routes de connexion sont exclues : un code invalide n'est pas une
// session expiree, et il n'y a alors rien a effacer. /api/auth/me, lui, en est
// bien une — c'est meme la ou la reconnexion se detecte au chargement.
const ROUTES_CONNEXION = ['/api/auth/request-code', '/api/auth/verify-code']

api.interceptors.response.use(
  (reponse) => reponse,
  (error) => {
    const connexion = ROUTES_CONNEXION.includes(error.config?.url)

    if (error.response?.status === 401 && !connexion) {
      effacerSession()
      error.sessionExpiree = true
    }

    return Promise.reject(error)
  },
)

export default api
