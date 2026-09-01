import axios from 'axios'

// Instance axios unique : jamais d'URL absolue codee en dur dans les pages.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
})

// Tant que le back n'expose que /api/health, les appels passent par les mocks.
// Mettre VITE_USE_MOCKS=false dans .env pour taper la vraie API.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

export default api
