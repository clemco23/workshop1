import axios from 'axios'
import { lireJeton } from '../lib/session.js'

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

// Tant que le back n'expose que /api/health, les appels passent par les mocks.
// Mettre VITE_USE_MOCKS=false dans .env pour taper la vraie API.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

// Ressource absente cote mock. Un `throw` de Response est ce que le data router
// attend dans un loader : il rend l'errorElement de la route au lieu de laisser
// la page se demerder avec un `undefined` (l'API, elle, repondra un vrai 404).
export function notFound(quoi = 'Ressource') {
  throw new Response(`${quoi} introuvable`, { status: 404 })
}

export default api
