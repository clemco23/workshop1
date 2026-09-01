import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'

// `lazy` du data router : le chunk de la route est charge pendant la navigation,
// avant le rendu — pas de Suspense fallback ni de flash d'ecran vide.
// Le module de page peut exporter un `loader` nomme a cote de son composant par
// defaut : il est alors branche sur la route et ses donnees sont pretes avant
// le premier rendu (pas d'etat de chargement a gerer dans la page).
const page = (importer) => async () => {
  const mod = await importer()
  return { Component: mod.default, loader: mod.loader }
}

export const router = createBrowserRouter([
  { path: '/login', lazy: page(() => import('./pages/Login.jsx')) },
  { path: '/signup', lazy: page(() => import('./pages/Signup.jsx')) },
  { path: '/verify-code', lazy: page(() => import('./pages/VerifyCode.jsx')) },

  // Coquille de l'app (sidebar + topbar) : route parente non montee/demontee
  // entre deux navigations internes.
  {
    element: <AppLayout />,
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

      { path: 'profil', lazy: page(() => import('./pages/Profil.jsx')) },
      { path: 'parametres', lazy: page(() => import('./pages/ParametresSeuil.jsx')) },
    ],
  },

  // Seule route publique — restera hors de tout ProtectedRoute.
  { path: '/portfolio/:slug', lazy: page(() => import('./pages/PortfolioPublic.jsx')) },

  { path: '*', lazy: page(() => import('./pages/NotFound.jsx')) },
])

export default router
