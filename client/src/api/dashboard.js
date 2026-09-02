import { api } from './client.js'

// GET /api/dashboard -> { user, configSeuil, missions: Mission[], documents: Document[] }
// Ce sont les *lignes brutes* : les agregats sont calcules par le client
// (src/lib/dashboard.js), le serveur n'agrege rien.
export async function fetchDashboard() {
  const { data } = await api.get('/api/dashboard')
  return data
}
