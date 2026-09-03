import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { lireJeton } from '../../lib/session.js'

// Garde d'authentification, montee comme route parente de tout ce qui demande
// une session. `/portfolio/:slug` reste volontairement en dehors : c'est la
// seule route publique du site.
//
// La garde ne verifie que la *presence* d'un jeton, jamais sa validite : seul
// le serveur peut en juger, et il le fait a chaque appel. Un jeton perime passe
// donc ici, echoue sur le premier appel, et l'intercepteur de reponse
// (api/client.js) efface la session, `RouteError` renvoie alors vers /login.
// C'est ce qui evite un appel de verification a chaque navigation.
function ProtectedRoute() {
  const { pathname } = useLocation()

  if (!lireJeton()) {
    // `state.depuis` : apres connexion, revenir la ou l'utilisateur allait.
    // `replace` pour que le retour arriere ne reboucle pas sur la garde.
    return <Navigate to="/login" replace state={{ depuis: pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
