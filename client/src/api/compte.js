import { api, USE_MOCKS } from './client.js'
import { configSeuil, user } from '../mocks/db.js'

// Les deux ressources rattachees au compte : le profil (table users) et les
// seuils (table config_seuil, une ligne par utilisateur — user_id est @unique).
//
// Contrats attendus cote server :
//   GET  /api/profil     -> User
//   PUT  /api/profil     -> User        (a faire)
//   GET  /api/parametres -> ConfigSeuil
//   PUT  /api/parametres -> ConfigSeuil (a faire)
//
// `users` n'a que first_name / last_name / email : pas de bio ni d'avatar en base
// aujourd'hui (voir CLAUDE.md).

export async function fetchProfil() {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/profil')
    return data
  }

  return user
}

export async function fetchConfigSeuil() {
  if (!USE_MOCKS) {
    const { data } = await api.get('/api/parametres')
    return data
  }

  return configSeuil
}
