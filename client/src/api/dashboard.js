import { api, USE_MOCKS } from './client.js'
import { dashboardMock } from '../mocks/dashboard.js'

// Contrat attendu de GET /api/dashboard (a implementer cote server) :
//   { user, configSeuil, missions: Mission[], documents: Document[] }
// Ce sont les *lignes brutes* : les agregats sont calcules par le client
// (src/lib/dashboard.js), le back n'a donc rien a agreger.
export async function fetchDashboard() {
  if (USE_MOCKS) return dashboardMock

  const { data } = await api.get('/api/dashboard')
  return data
}
