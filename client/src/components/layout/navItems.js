// Source unique de la navigation : la sidebar et le titre de la topbar en derivent.
// `end` = correspondance exacte du chemin (sinon '/' serait actif partout).
export const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/missions', label: 'Missions', icon: 'missions' },
  { to: '/documents', label: 'Documents', icon: 'documents' },
  { to: '/projets', label: 'Projets', icon: 'projets' },
  { to: '/portfolios', label: 'Portfolios', icon: 'portfolios' },
]

export const navItemsSecondary = [
  { to: '/parametres', label: 'Parametres', icon: 'parametres' },
]

export const allNavItems = [...navItems, ...navItemsSecondary]

// Titre de la page courante : l'item au chemin le plus long qui matche.
export function currentNavTitle(pathname) {
  const match = allNavItems
    .filter((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0]

  return match?.label ?? ''
}
