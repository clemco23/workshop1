import { Link, Navigate, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import Card from './Card.jsx'
import Button from './Button.jsx'
import EmptyState from './EmptyState.jsx'
import { messageErreur } from '../../lib/erreurs.js'

// Ecran d'erreur des routes : branche comme `ErrorBoundary`, il remplace celui
// de developpement de react-router, que personne, et surtout pas un visiteur
// sans compte, ne doit voir.
//
// Un `loader` echoue de trois facons, et une seule est une vraie erreur :
//   - session expiree (401) : l'intercepteur a deja efface la session, il n'y a
//     qu'a renvoyer vers /login ;
//   - ressource absente (404) : l'utilisateur s'est trompe d'adresse ;
//   - le reste : coupure reseau ou 500, ou une exception de rendu.
function RouteError() {
  const error = useRouteError()

  // Traite avant tout le reste : re-render vers /login, pas un ecran d'erreur.
  if (error?.sessionExpiree) {
    return <Navigate to="/login" replace state={{ info: 'Session expiree, reconnecte-toi.' }} />
  }

  const statut = error?.response?.status ?? (isRouteErrorResponse(error) ? error.status : null)

  if (statut === 404) {
    return (
      <Card>
        <EmptyState
          icon="documents"
          title="Introuvable"
          description="Cette ressource n'existe pas, ou ne t'appartient pas."
        >
          <Button as={Link} to="/" variant="secondary">
            Retour au tableau de bord
          </Button>
        </EmptyState>
      </Card>
    )
  }

  return (
    <Card>
      <EmptyState
        icon="documents"
        title="Le chargement a echoue"
        // messageErreur() distingue deja « serveur injoignable » du message
        // renvoye par l'API : pas de statut brut affiche.
        description={error?.isAxiosError ? messageErreur(error) : 'Erreur inattendue.'}
      >
        <Button onClick={() => window.location.reload()}>Reessayer</Button>
      </EmptyState>
    </Card>
  )
}

export default RouteError
