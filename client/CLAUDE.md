# CLAUDE.md — client

Frontend React 19 + Vite 8 du monorepo `wks1`. Le backend Express vit dans `../server`
(voir `../server/CLAUDE.md`).

## Commandes

Toujours lancer depuis `client/` :

```bash
npm install
npm run dev      # serveur de dev Vite (HMR)
npm run build    # build de production dans dist/
npm run preview  # sert le build de dist/
npm run lint     # oxlint
```

Il n'y a pas de suite de tests dans ce dossier : après un changement, vérifier avec
`npm run lint` puis `npm run build`.

## Stack

- **React 19** avec `StrictMode` (`src/main.jsx` monte `<App />` sur `#root`).
- **Vite 8**, config dans `vite.config.js` : plugins `@vitejs/plugin-react` et
  `@tailwindcss/vite`. (Le `package.json` déclare encore `vite: ^5.4.10` alors que la
  version installée est une 8 — la plage sera à corriger au prochain `npm install`
  propre.)
- **Tailwind CSS 4** — pas de `tailwind.config.js` : la config passe par le plugin Vite
  et les directives CSS dans `src/index.css`. Ne pas recréer un fichier de config v3.
- **react-router-dom 7** en data router (voir la section Routing).
- **axios** pour les appels API (`src/api/client.js`) et **recharts** pour les graphes
  (`MissionsTimeline`).
- **oxlint** (`.oxlintrc.json`) comme linter — pas ESLint.

Le React Compiler est volontairement désactivé (voir `README.md`).

## Structure

```
client/
  index.html          # point d'entrée HTML, charge src/main.jsx
  public/             # actifs servis tels quels (dont icons.svg, référencé via /icons.svg)
  src/
    main.jsx          # bootstrap React
    App.jsx           # composant racine : rend <RouterProvider router={router} />
    router.jsx        # définition de toutes les routes (createBrowserRouter)
    index.css         # Tailwind + tokens du design system (@theme)
    api/              # instance axios + un module par ressource
    lib/              # cn, format, enums, validation de formulaires, dérivations métier
    mocks/            # données simulées, à la forme du JSON de l'API
    components/
      ui/             # primitives réutilisables (Card, Button, Badge, Icon, Modal, …)
      layout/         # AppLayout, Sidebar, Topbar, navItems.js
      missions/       # agenda, timeline, table, résumé, légende, modale de formulaire
      documents/      # table et bloc d'upload
      projets/        # carte, médias, modale de formulaire
      portfolios/     # sélection des projets, modale de formulaire
    pages/            # un composant par route
    assets/           # images importées par le code (hero.png, logos)
```

Les composants d'une page vivent dans `components/<domaine>/`, pas dans `pages/` : une
page assemble et tient l'état, les composants de domaine affichent. Les primitives sans
métier restent dans `ui/`.

## Design system

Tout l'habillage passe par trois choses, à réutiliser au lieu de recréer du style :

- **Tokens** dans `src/index.css`, bloc `@theme` : la palette d'accent est exposée
  comme `brand-50 … brand-700` (indigo par défaut). Utiliser `bg-brand-600`,
  `text-brand-700`, etc. — **jamais** `indigo-*` en dur, pour qu'un changement
  d'accent reste un changement d'une seule couleur dans ce fichier. Le reste de la
  palette est `slate-*` (fond `slate-50`, surfaces blanches, bordures `slate-200`,
  texte `slate-900` / `slate-500`).
- **Primitives** dans `src/components/ui/` : `Card`, `StatCard`, `Button`, `Badge`,
  `ProgressBar`, `PageHeader`, `EmptyState`, `Icon`, `Tabs`, `Select`, `Input`, `Modal`.
  `Modal` s'appuie sur le `<dialog>` natif (`showModal()`) : le piège de focus, la touche
  Échap, le fond inerte et le retour du focus au déclencheur viennent du navigateur — ne
  pas le réécrire à la main. L'état ouvert/fermé reste au parent, et le champ à focaliser
  à l'ouverture porte `data-autofocus`. Un fichier par composant,
  `export default`, `className` accepté en dernier pour surcharger, fusion via
  `cn()` (`src/lib/cn.js`). `Button` prend `as` (`<Button as={Link} to="…">`).
  `Icon` porte un dictionnaire de tracés SVG 24×24 en `currentColor` : ajouter une
  icône = ajouter une entrée dans `paths`. Les icônes de `public/icons.svg` sont
  celles du template Vite et ne servent pas à l'UI.
- **Rythme** : chaque page commence par `<PageHeader>`, les grilles utilisent
  `gap-4`, les cartes `rounded-xl border border-slate-200 bg-white`.
- **Débordement horizontal** : un enfant de `grid`/`flex` a `min-width: auto`, donc un
  contenu large (URL insécable, table en `min-w-[…]` dans un `overflow-x-auto`) élargit
  la colonne et fait scroller la page entière au lieu d'être coupé. Toute colonne de
  grille qui contient du texte libre ou une table porte donc `min-w-0`, le texte long
  `truncate` (sur un élément `block`, jamais un `<a>` inline) ou `break-words`, et les
  éléments qui ne doivent pas se comprimer (icône, badge) `shrink-0`. `Card` et `Select`
  portent déjà `min-w-0` (et le `<select>` `w-full`, sinon il se dimensionne sur son
  option la plus longue) : c'est ce qui manquait et faisait scroller la fiche projet.

## Layout

`src/components/layout/AppLayout.jsx` est monté comme route parente (`element`) de
toutes les routes authentifiées et rend `<Outlet />` — les pages ne rendent que leur
contenu, jamais la nav. Sidebar fixe à partir de `md`, tiroir avec overlay en dessous ;
la topbar est collante et affiche le titre de la section courante.

La navigation est déclarée une seule fois dans `layout/navItems.js`
(`navItems`, `navItemsSecondary`, `currentNavTitle`) : ajouter une entrée d'onglet
se fait là, pas dans `Sidebar.jsx`.

Les SVG d'icônes sont dans `public/icons.svg` et référencés par `<use href="/icons.svg#id">`,
pas importés.

## Données & API

La source de vérité du modèle est `../server/prisma/schema.prisma`, et les endroits
réellement exposés sont listés dans `../server/CLAUDE.md`. Le client s'y cale :

- **Formes** : l'API renvoie du camelCase (`client_production` → `clientProduction`),
  les enums en **chaînes** (`'CONFIRMED'`, `'INTERMITTENCE'`) et — piège — les
  `Decimal` Prisma en **chaînes** (`'40.00'`, pas `40`). D'où `num()` dans
  `src/lib/format.js`, à passer sur tout champ décimal avant calcul ou affichage.
- **Enums** : `src/lib/enums.js` duplique les cinq enums du schéma
  (`MissionType`, `MissionStatus`, `DocumentCategory`, `ProjectTag`, `ProjectType`)
  avec leur libellé FR et leur `tone` de `Badge`. Modifier un enum côté serveur impose
  de mettre ce fichier à jour ; `enumMeta()` évite le crash en affichant la valeur
  brute si le client est en retard.
- **Appels** : `src/api/client.js` expose l'instance axios (`baseURL: VITE_API_URL`,
  défaut `http://localhost:4000`), le drapeau `USE_MOCKS` et `notFound()`. Un module par
  ressource dans `src/api/`, qui renvoie le mock ou tape l'API selon ce drapeau — les
  pages ne connaissent ni axios ni les mocks.

  | Module            | Fonctions                                                              |
  | ----------------- | ---------------------------------------------------------------------- |
  | `dashboard.js`    | `fetchDashboard()`                                                     |
  | `missions.js`     | `fetchMissions(filtres)`, `fetchMission(id)`                           |
  | `documents.js`    | `fetchDocuments(filtres)`                                              |
  | `projets.js`      | `fetchProjets(filtres)`, `fetchProjet(id)` — filtres : `tag`, `missionId` |
  | `portfolios.js`   | `fetchPortfolios()`, `fetchPortfolio(id)`, `fetchPortfolioPublic(slug)` |
  | `compte.js`       | `fetchProfil()`, `fetchConfigSeuil()`                                  |

  Les filtres (`type`, `statut`, `mois`, `client`, `categorie`, `tag`) sont
  réimplémentés dans les mocks, donc les UI de filtrage sont développables avant
  le back.
- **Mocks** : `src/mocks/db.js` est un **jeu de données unique** qui tient le rôle
  de la base pour un utilisateur (`user`, `configSeuil`, `missions`, `documents`,
  `projets`, `portfolios`, `portfolioProjets`). Chaque module d'`api/` en fait une
  *vue* — jamais une copie — pour qu'une même mission soit identique vue du
  dashboard, de la liste ou d'un document lié ; `mocks/dashboard.js` n'est qu'une
  projection de `db.js`. Ajouter des données se fait donc dans `db.js`, pas dans un
  mock de page. Les dates y sont **relatives au mois courant** pour que la démo ne se
  périme pas, et le jeu couvre volontairement toutes les valeurs d'enum et tous les
  champs nullables (mission sans `heures`, sans `date_fin`, sans `montant_ht`, document
  sans `mission_id`, projet perso sans mission), ainsi qu'une mission hors fenêtre
  glissante.
- **Dérivations** : les agrégats sont calculés côté client par des fonctions pures
  (`src/lib/dashboard.js`, `src/lib/documents.js`, `src/lib/missions.js`), à partir des
  lignes brutes. L'endpoint n'a donc qu'à renvoyer les lignes, pas des totaux — et la
  logique reste testable sans réseau.
- **Formulaires** : un fichier de validation par formulaire, en fonctions pures
  (`src/lib/missionForm.js`, `projetForm.js`, `portfolioForm.js`, `parametres.js`) :
  valeurs par défaut, contrôles alignés sur les bornes du schéma (`Decimal(6,2)`, etc.)
  et mise en forme vers le contrat de l'API. Ce sont des garde-fous d'ergonomie, **pas**
  une garantie : le serveur revalide tout de son côté.
- **Chargement** : une page peut exporter un `loader` nommé à côté de son composant
  par défaut ; le helper `page()` de `router.jsx` le branche sur la route, donc les
  données sont prêtes avant le premier rendu (pas d'état de chargement dans la page).
  `loader`, `action` et `ErrorBoundary` sont autorisés en export dans `.oxlintrc.json`.

### Règles métier déjà câblées

- Le seuil de `config_seuil` est **annuel** (`seuil_heures_annuel`, défaut 507 h =
  seuil d'intermittence), évalué sur une **fenêtre glissante** de `fenetre_mois` mois.
  Ce n'est pas un quota mensuel.
- Seules les missions `INTERMITTENCE` en statut `CONFIRMED` ou `TERMINATED` comptent
  dans ce seuil (cf. `STATUTS_ACQUIS`) : une mission `PROPOSED` est ignorée.
- `mission.heures` est nullable : à défaut, les heures valent
  `nb_jours × config_seuil.heures_jour_defaut` (`heuresMission()`).
- Il n'y a **pas de table client** : `mission.client_production` est un texte libre,
  c'est lui qui sert de clé de regroupement dans la répartition.
- `mission` n'a **pas de titre** : l'intitulé affiché dans les listes est
  `client_production`, complété par le type et la période.

## Dataviz

Les couleurs de graphe vivent dans `src/lib/viz.js`, **pas** dans les composants :
un graphe lit un rôle (`couleurType(type)`), jamais un hex.

- Palette catégorielle validée sur fond blanc (la surface des cartes) :
  `#4f46e5` (= `brand-600`, intermittence) ↔ `#eb6834` (freelance). ΔE CVD 31,4
  protan / 34,6 tritan, ΔE vision normale 39,2, contraste ≥ 3:1 pour les deux.
  Toute nouvelle paire de séries doit repasser ce contrôle, pas être choisie à l'œil.
- **La teinte suit l'entité, jamais son rang** : filtrer ne repeint jamais les
  séries restantes.
- Un seul axe de valeur par graphe, jamais deux échelles y.
- La teinte porte le **type** ; le **statut** est un second encodage (remplissage
  atténué pour une mission seulement proposée). Aucune information n'est portée par
  la couleur seule : type et statut sont aussi écrits en texte dans la vue Liste,
  qui sert de table équivalente au graphe.
- `tone: 'brand'` est réservé aux teintes de série : les badges de statut utilisent
  `warning` / `success` / `neutral`, pour qu'un statut ne prenne pas la couleur d'un type.
- Specs de marque : barres ≤ 24 px, bouts arrondis 4 px, grille et axes en filet
  continu d'un cran au-dessus de la surface (jamais en pointillés), légende dès deux
  séries, infobulle au survol.
- Les filtres sont sur **une seule rangée au-dessus** de ce qu'ils cadrent, jamais
  dans la carte d'un graphe : les deux vues rendent toujours la même sélection.

`recharts` est la bibliothèque retenue ; chart.js a été écarté pour ne pas en avoir
deux. Le chunk de la page Missions pèse ~365 kB à cause de recharts — acceptable parce
que le lazy loading par route ne le charge que là.

### Agenda mensuel

`MissionsAgenda` est écrit à la main, **sans bibliothèque de calendrier** :
react-big-calendar et FullCalendar apportent leur propre CSS, qui se bat avec
Tailwind, pour une grille de 6 × 7 cases plus courte à écrire qu'à configurer.

La logique est dans `src/lib/missions.js`, en fonctions pures :

- **Tout se calcule en UTC**, et les jours se comparent par leur clé `'AAAA-MM-JJ'`
  (`cleJour`). Les dates de l'API sont en UTC : passer par l'heure locale ferait
  basculer une mission d'un jour à l'autre selon le fuseau du navigateur — à l'ouest
  de Greenwich, minuit UTC est la veille au soir.
- `bornesMission` donne `[début, fin]`, en remplaçant une `date_fin` nulle par
  aujourd'hui (mission ouverte).
- `construireMois` attribue à chaque mission un **couloir stable par semaine**
  (placement au premier couloir libre, dans l'ordre des dates de début). Sans ça,
  une mission qui se poursuit remonte d'une ligne dès qu'une autre se termine et sa
  bande part en escalier. Les trous deviennent des couloirs `null` explicites, que le
  composant rend comme des espaceurs de même hauteur.
- Tous les couloirs ont la **même hauteur** (`h-5`), pastille nommée comme
  continuation, sinon l'alignement horizontal casse. Le nom n'est écrit qu'au premier
  jour de la mission et rappelé en début de semaine ; les bouts arrondis ne marquent
  que les extrémités réelles (`debute` / `termine`), pour que la mission se lise comme
  une bande continue.
- Le nombre de semaines s'adapte (4 à 6) pour ne jamais afficher une rangée
  entièrement hors du mois.

## Routing

Tout est déclaré dans `src/router.jsx` avec `createBrowserRouter` (react-router 7,
data router). Une page par fichier dans `src/pages/`, en `export default`.

Chaque route est chargée en lazy via le helper local `page()`, qui rebranche aussi les
exports nommés du module de page :

```js
const page = (importer) => async () => {
  const mod = await importer()
  return { Component: mod.default, loader: mod.loader, ErrorBoundary: mod.ErrorBoundary }
}
// ...
{ path: 'documents', lazy: page(() => import('./pages/Documents.jsx')) }
```

Vite produit ainsi un chunk par page, et le data router le charge *pendant* la
navigation, avant le rendu — donc pas de `<Suspense>` ni de fallback à prévoir.
Garder cette forme pour toute nouvelle route.

| Chemin                  | Page                   | Contenu                                       |
| ----------------------- | ---------------------- | --------------------------------------------- |
| `/login`                | `Login`                | connexion (code envoyé par email)             |
| `/signup`               | `Signup`               | inscription                                   |
| `/verify-code`          | `VerifyCode`           | saisie du code à 6 chiffres reçu par email    |
| `/`                     | `Dashboard`            | bloc B — jauge heures, CA/mois, répartition   |
| `/missions`             | `Missions`             | bloc A — vue mois + liste, filtres            |
| `/missions/:id`         | `MissionDetail`        | détail / édition d'une mission                |
| `/documents`            | `Documents`            | bloc C — liste, upload, filtres               |
| `/projets`              | `Projets`              | bloc D — liste des fiches projet              |
| `/projets/:id`          | `ProjetDetail`         | détail / édition d'une fiche projet           |
| `/portfolios`           | `PortfoliosAdmin`      | liste des pages publiques créées              |
| `/portfolios/:id`       | `PortfolioAdminDetail` | sélection et réordonnancement des projets     |
| `/parametres`           | `ParametresSeuil`      | seuils et fenêtre de mois                     |
| `/portfolio/:slug`      | `PortfolioPublic`      | **seule route publique**                      |
| `*`                     | `NotFound`             | 404                                           |

Les routes à paramètre sont des enfants de leur liste (`missions` → `:id`) pour qu'un
futur layout parent ne soit pas remonté à chaque navigation.

## Authentification

Le back **n'utilise pas Supabase Auth** : la connexion est un code à usage unique envoyé
par email et échangé contre un JWT (détail dans `../server/CLAUDE.md`). Rien n'est encore
branché côté client — quand ça le sera :

1. `POST /api/auth/request-code` avec `{ email }` depuis `/login` (le même appel sert
   d'inscription : le compte est créé s'il n'existe pas).
2. `POST /api/auth/verify-code` avec `{ email, code }` depuis `/verify-code`, qui renvoie
   `{ token, user }`.
3. Le jeton part ensuite en `Authorization: Bearer <token>` sur **toutes** les routes
   sauf `/api/public/*` — à poser dans un intercepteur de requête sur l'instance axios de
   `src/api/client.js`, jamais appel par appel.

Il n'y a **pas** de `@supabase/supabase-js` à installer côté client : le client ne parle
qu'à l'API Express.

## Variables d'environnement

Fichiers : `.env` (local, ignoré par git) et `.env.example` (versionné, à tenir à jour).

- Seules les variables préfixées `VITE_` sont exposées au code, via `import.meta.env.VITE_*`.
  Pas de `process.env` dans le code client.
- **Aucun secret** dans ces fichiers : tout finit dans le bundle public. En particulier,
  la clé Supabase du serveur (`SUPABASE_SECRET_KEY`) ne doit **jamais** être recopiée ici.
- `VITE_API_URL` pointe vers l'API Express (par défaut `http://localhost:4000`).
- `VITE_USE_MOCKS` — `'false'` pour taper la vraie API, toute autre valeur (ou absente)
  laisse les mocks actifs.

Ajouter une variable = l'ajouter aussi dans `.env.example` avec une valeur d'exemple.

## Conventions

- Composants en `.jsx`, un composant par fichier, `export default`.
- Pas de point-virgule en fin de ligne, guillemets simples, indentation 2 espaces
  (suivre le style existant de `src/router.jsx`).
- Une page = un fichier dans `src/pages/`, nommé comme dans le tableau des routes,
  déclarée en lazy dans `src/router.jsx`.
- Appels API : passer par l'instance de `src/api/client.js`, jamais d'URL absolue codée
  en dur ni d'`axios` importé dans une page.

## État actuel — pas encore fait

Le back a pris de l'avance : il expose désormais l'auth, le dashboard, les missions, les
projets (avec upload), les portfolios et la page publique. Le client, lui, est **encore
en lecture seule sur les mocks**. Les écarts à résorber, par ordre de blocage :

- **Aucun jeton n'est envoyé.** L'instance axios n'a pas d'intercepteur, et le jeton
  n'est ni stocké ni lu nulle part. Basculer `VITE_USE_MOCKS=false` aujourd'hui fait
  répondre **401 à toutes les routes** sauf `/api/public/portfolio/:slug`. C'est le
  premier chantier — voir la section Authentification. (À noter : `.env.example` livre
  déjà `VITE_USE_MOCKS=false`.)
- **Chemins désalignés avec le serveur** — à corriger dans `src/api/` :

  | Le client appelle              | Le serveur expose                     |
  | ------------------------------ | ------------------------------------- |
  | `/api/projets`, `/api/projets/:id` | `/api/projects`, `/api/projects/:id` |
  | `PUT /api/portfolios/:id/projets`  | `PUT /api/portfolios/:id/projects`   |
  | `GET /api/profil`              | rien — utiliser `GET /api/auth/me`     |
  | `/api/documents*`              | rien pour l'instant                    |

- **Aucune mutation n'est câblée.** Les modales (`MissionFormModal`, `ProjetFormModal`,
  `PortfolioFormModal`) valident la saisie mais ne postent rien : `src/api/` n'a que des
  `fetch*`. Le serveur accepte pourtant déjà `POST`/`PATCH`/`DELETE` sur les missions,
  les projets et les portfolios, `PUT /api/portfolios/:id/projects` pour le
  réordonnancement, et `PUT /api/parametres` pour les seuils. L'upload d'un média de
  projet se fait en `multipart/form-data`, champ `file`, 50 Mo max.
- **Aucune garde d'authentification** : toutes les routes sont accessibles. Quand
  `ProtectedRoute` arrivera, `/portfolio/:slug` doit rester en dehors — c'est la seule
  route publique, elle tape `/api/public/portfolio/:slug` et ne doit pas attendre de
  session.
- Les pages **`Login`, `Signup` et `VerifyCode` renvoient encore `null`** : elles
  s'affichent comme une zone vide. Toutes les autres pages ont du contenu. `/login`,
  `/signup`, `/verify-code`, `/portfolio/:slug` et la 404 sont volontairement hors du
  layout.
- **`errorElement` seulement sur `/portfolio/:slug`** : cette route publique exporte un
  `ErrorBoundary` (branché par le helper `page()`), parce qu'un visiteur sans compte ne
  doit pas tomber sur l'écran de dev de react-router quand le slug est inconnu ou la page
  désactivée. Les routes authentifiées n'en ont pas encore : à ajouter avec la garde
  d'auth, dès que le `loader` pourra échouer sur un 401 ou une erreur réseau.
- La `Topbar` affiche un nom et un avatar **en dur** : à brancher sur
  `user.firstName` / `lastName` quand la session existera.
- **Médias d'une fiche projet** : le schéma stocke **un seul** média par fiche —
  `projet.type` (enum `ProjectType` : `IMAGE` / `PDF` / `VIDEO` / `LINK`) et `projet.link`
  (une URL publique de Supabase Storage quand c'est un fichier). Une réalisation peut
  pourtant en montrer plusieurs (captation + photos + dossier de presse), donc le client
  passe partout par `mediasProjet()` (`src/lib/medias.js`), qui rend une *liste* : le
  tableau `medias` s'il existe, sinon le couple `type` + `link`. Les libellés viennent de
  `PROJET_TYPE` dans `enums.js`, `medias.js` n'ajoute que l'icône. Côté serveur, la suite
  est une table `projet_media` — **pas** un `projet_id` sur `document` : `document` est le
  coffre privé des justificatifs et `/portfolio/:slug` est public. Quand l'API renverra
  `medias`, seule cette fonction change.
- Petit défaut connu : dans `fetchPortfolioPublic`, un slug introuvable **en mode mock**
  ne s'arrête pas — l'exécution retombe sur l'appel réseau. À refermer par un
  `notFound('Portfolio')` explicite.
