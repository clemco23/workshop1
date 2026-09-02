import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import RouteError from './components/ui/RouteError.jsx'

// `lazy` du data router : le chunk de la route est charge pendant la navigation,
// avant le rendu — pas de Suspense fallback ni de flash d'ecran vide.
// Le module de page peut exporter un `loader` nomme a cote de son composant par
// defaut : il est alors branche sur la route et ses donnees sont pretes avant
// le premier rendu (pas d'etat de chargement a gerer dans la page).
// Une page peut aussi exporter `ErrorBoundary` : il est branche sur sa route et
// remplace l'ecran d'erreur par defaut de react-router.
const page = (importer) => async () => {
  const mod = await importer()
  return { Component: mod.default, loader: mod.loader, ErrorBoundary: mod.ErrorBoundary }
}

export const router = createBrowserRouter([
  { path: '/login', lazy: page(() => import('./pages/Login.jsx')) },
  { path: '/signup', lazy: page(() => import('./pages/Signup.jsx')) },
  { path: '/verify-code', lazy: page(() => import('./pages/VerifyCode.jsx')) },

  // Garde d'authentification, puis coquille de l'app (sidebar + topbar) : route
  // parente non montee/demontee entre deux navigations internes.
  //
  // L'ErrorBoundary est porte par une route sans chemin *sous* la coquille, et
  // non par la coquille elle-meme : un errorElement remplace l'element de sa
  // propre route, le poser sur AppLayout ferait donc disparaitre la navigation
  // en meme temps que le contenu. Ici, l'erreur s'affiche dans l'Outlet, sidebar
  // et topbar intactes. C'est aussi lui qui renvoie vers /login quand le jeton a
  // expire en cours de route (cf. components/ui/RouteError.jsx).
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            ErrorBoundary: RouteError,
            children: [
              { index: true, lazy: page(() => import('./pages/Dashboard.jsx')) },

              {
                path: 'missions',
                children: [
                  { index: true, lazy: page(() => import('./pages/Missions.jsx')) },
                  { path: ':id', lazy: page(() => import('./pages/MissionDetail.jsx')) },
                ],
              },

              { path: 'documents', lazy: page(() => import('./pages/Documents.jsx')) },

              {
                path: 'projets',
                children: [
                  { index: true, lazy: page(() => import('./pages/Projets.jsx')) },
                  { path: ':id', lazy: page(() => import('./pages/ProjetDetail.jsx')) },
                ],
              },

              {
                path: 'portfolios',
                children: [
                  { index: true, lazy: page(() => import('./pages/PortfoliosAdmin.jsx')) },
                  { path: ':id', lazy: page(() => import('./pages/PortfolioAdminDetail.jsx')) },
                ],
              },

              { path: 'parametres', lazy: page(() => import('./pages/ParametresSeuil.jsx')) },
            ],
          },
        ],
      },
    ],
  },

  // Seule route publique : hors de ProtectedRoute, et avec son propre
  // ErrorBoundary — un slug inconnu est vu par un visiteur sans compte.
  { path: '/portfolio/:slug', lazy: page(() => import('./pages/PortfolioPublic.jsx')) },

  { path: '*', lazy: page(() => import('./pages/NotFound.jsx')) },
])

export default router
