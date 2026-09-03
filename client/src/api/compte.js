import { api } from './client.js'
import { fetchMe } from './auth.js'

// Les deux ressources rattachees au compte : le profil (table users) et les
// seuils (table config_seuil, une ligne par utilisateur, user_id est @unique).
//
//   GET /api/auth/me     -> { user }        (le profil n'a pas d'endpoint propre)
//   GET /api/parametres  -> ConfigSeuil     (upsert : la ligne est creee a la premiere lecture)
//   PUT /api/parametres  -> ConfigSeuil
//
// `users` n'a que first_name / last_name / email : pas de bio ni d'avatar en
// base, et aucune route serveur ne les ecrit, il n'y a donc pas d'update ici.

export async function fetchProfil() {
  return fetchMe()
}

export async function fetchConfigSeuil() {
  const { data } = await api.get('/api/parametres')
  return data
}

// Mise a jour partielle : le serveur refuse un corps sans aucun champ connu
// (400), et revalide les bornes que `lib/parametres.js` verifie deja a la saisie.
export async function updateConfigSeuil(champs) {
  const { data } = await api.put('/api/parametres', champs)
  return data
}
