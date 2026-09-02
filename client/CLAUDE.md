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
    lib/              # cn, format, enums, session, erreurs, validation, dérivations métier
    mocks/            # jeu de données de référence — plus importé par le code (voir Données & API)
    components/
      ui/             # primitives réutilisables (Card, Button, Badge, Icon, Modal,
                      #   ConfirmDialog, RouteError, …)
      layout/         # AppLayout, Sidebar, Topbar, navItems.js
      auth/           # AuthShell (coquille de /login, /signup, /verify-code) et ProtectedRoute
      missions/       # agenda, timeline, table, résumé, légende, modale de formulaire
      documents/      # table et formulaire de dépôt
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
la topbar est collante, affiche le titre de la section courante et le menu de compte
(email + déconnexion).

C'est `AppLayout` qui **réhydrate la session** : la copie de `localStorage` s'affiche
tout de suite, un `GET /api/auth/me` la corrige ensuite. L'appel est ici et pas dans
une page parce que la coquille est montée une seule fois pour toute la partie
authentifiée — il ne se rejoue donc pas à chaque navigation. Si ce `me` répond 401, le
jeton est mort : on renvoie à `/login` sans attendre la navigation suivante.

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
  défaut `http://localhost:4000`) et ses deux intercepteurs. Un module par ressource
  dans `src/api/`, qui **tape toujours l'API** — les pages ne connaissent pas axios.

  | Module            | Fonctions                                                                    |
  | ----------------- | ---------------------------------------------------------------------------- |
  | `auth.js`         | `requestCode(email)`, `verifyCode(email, code)`, `fetchMe()`                 |
  | `dashboard.js`    | `fetchDashboard()`                                                           |
  | `missions.js`     | `fetchMissions(filtres)`, `fetchMission(id)`, `createMission`, `updateMission`, `deleteMission` |
  | `documents.js`    | `fetchDocuments(filtres)`, `createDocument({ fichier, categorie, missionId })`, `documentUrl(id)`, `deleteDocument` |
  | `projets.js`      | `fetchProjets(filtres)`, `fetchProjet(id)`, `createProjet`, `updateProjet`, `deleteProjet` |
  | `portfolios.js`   | `fetchPortfolios()`, `fetchPortfolio(id)`, `createPortfolio`, `updatePortfolio`, `updatePortfolioProjets(id, projectIds)`, `deletePortfolio`, `fetchPortfolioPublic(slug)` |
  | `compte.js`       | `fetchProfil()` (délègue à `/api/auth/me`), `fetchConfigSeuil()`, `updateConfigSeuil(champs)` |

  Les filtres (`type`, `statut`, `mois`, `client`, `categorie`, `tag`, `missionId`)
  sont appliqués par le serveur. En pratique les pages de liste chargent tout puis
  filtrent en mémoire — c'est instantané et ça ne redemande rien ; passer aux filtres
  côté API le jour où le volume l'exige.

  Deux points de forme à respecter :

  - **Le corps d'une réponse est la ressource elle-même**, pas une enveloppe. Seules
    `/api/health` et `/api/auth/*` portent encore un booléen `success` — d'où le
    `data.user` de `fetchMe()`. Ne pas étendre cette forme.
  - **Les mutations renvoient la ressource écrite**, mais les pages ne s'en servent
    presque jamais : elles appellent `revalidator.revalidate()` (react-router) pour
    relancer le `loader` de la route. Une seule source de vérité, et les champs
    dérivés du serveur (`ordre`, `updatedAt`, `projetsDisponibles`) restent justes.
    Une suppression qui vide la page courante navigue vers la liste en `replace`.
- **Mocks (hors circuit)** : `src/mocks/db.js` et `mocks/dashboard.js` sont conservés
  comme **jeu de données de référence** — la forme exacte du JSON de l'API pour un
  utilisateur — mais **plus aucun module ne les importe** : le drapeau `USE_MOCKS` a
  disparu, tout passe par le réseau. Ils ne sont donc plus dans le bundle, et rien ne
  garantit qu'ils suivent le schéma. Les remettre en circuit demanderait un vrai
  serveur de simulation (MSW) plutôt qu'un `if` dans chaque module.
- **Dérivations** : les agrégats sont calculés côté client par des fonctions pures
  (`src/lib/dashboard.js`, `src/lib/documents.js`, `src/lib/missions.js`), à partir des
  lignes brutes. L'endpoint n'a donc qu'à renvoyer les lignes, pas des totaux — et la
  logique reste testable sans réseau.
- **Formulaires** : un fichier de validation par formulaire, en fonctions pures
  (`src/lib/missionForm.js`, `projetForm.js`, `portfolioForm.js`, `parametres.js`) :
  `versFormulaire()` (ressource → chaînes de saisie), `estModifie()`, `validerX()` et
  `versPayload()` (saisie → corps de l'API). Contrôles alignés sur les bornes du schéma
  (`Decimal(6,2)`, etc.). Ce sont des garde-fous d'ergonomie, **pas** une garantie : le
  serveur revalide tout, et c'est son message qui s'affiche en cas de refus.

  Les modales de création et d'édition sont **le même composant** (`MissionFormModal`,
  `ProjetFormModal`) : passer la ressource en prop bascule en édition. Les règles de
  saisie ne peuvent donc pas diverger entre les deux. Elles portent l'appel elles-mêmes
  et remontent le résultat par `onEnregistre`, sans connaître le routeur. Le pied du
  `<dialog>` étant hors du `<form>`, le bouton d'envoi est relié par `form={idFormulaire}`
  (`useId()`).

  ⚠️ **Le slug d'un portfolio ne se saisit pas** : le serveur le dérive du titre, y
  ajoute quatre octets aléatoires, puis le fige — un lien déjà partagé ne doit pas
  casser. `portfolioForm.js` n'expose donc qu'un `slugifier()` d'**aperçu**, et
  `PATCH /api/portfolios/:id` n'accepte que `titrePage` et `actif`.
- **Erreurs d'API** : `messageErreur(error, cas)` (`src/lib/erreurs.js`) traduit une
  erreur axios en phrase affichable — un cas formulé par l'appelant, sinon le `message`
  renvoyé par l'API, sinon un repli générique. Le statut brut n'est jamais montré.
  `authForm.js` s'en sert en n'ajoutant que ses propres statuts (404/502/503).
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

### Emboîtement des routes authentifiées

Trois niveaux, chacun pour une raison précise — ne pas les aplatir :

```
<ProtectedRoute />          garde : pas de jeton → redirection vers /login
  └── <AppLayout />         coquille : sidebar + topbar, montée une seule fois
        └── ErrorBoundary   route SANS chemin, qui ne porte que RouteError
              └── les pages
```

L'`ErrorBoundary` est sur une route **sans chemin sous** la coquille, et pas sur la
coquille elle-même : un `errorElement` remplace l'élément de sa propre route, donc le
poser sur `AppLayout` ferait disparaître la navigation en même temps que le contenu.
Ici l'erreur s'affiche dans l'`Outlet`, sidebar et topbar intactes.

`components/ui/RouteError.jsx` trie les trois façons dont un `loader` échoue :
session expirée (`error.sessionExpiree`, posé par l'intercepteur) → `/login` ;
404 → carte « introuvable » ; le reste → `messageErreur()` et un bouton *Réessayer*.

`/portfolio/:slug` reste **en dehors** des trois niveaux et exporte son propre
`ErrorBoundary` : c'est la seule page vue par quelqu'un sans compte, elle ne doit
montrer ni la coquille de l'app, ni un lien vers l'espace privé.

## Authentification

Le back **n'utilise pas Supabase Auth** : la connexion est un code à usage unique envoyé
par email et échangé contre un JWT (détail dans `../server/CLAUDE.md`). Le parcours est
câblé de bout en bout.

1. `/login` (ou `/signup`) appelle `requestCode(email)` → `POST /api/auth/request-code`.
   Le même appel vaut inscription : le serveur crée le compte si l'email est inconnu, il
   n'y a donc pas de second endpoint pour s'inscrire.
2. `/verify-code` appelle `verifyCode(email, code)` → `POST /api/auth/verify-code`, qui
   renvoie `{ token, user }`.
3. `enregistrerSession()` (`src/lib/session.js`) range les deux dans `localStorage`, et
   l'**intercepteur de requête** de `src/api/client.js` pose
   `Authorization: Bearer <token>` sur chaque appel — jamais appel par appel dans un
   module ou une page.

Points de conception à ne pas défaire :

- **L'email voyage par le state de navigation**, pas par l'URL : `/verify-code` en a
  besoin pour le second appel, et une adresse n'a rien à faire dans un historique. Une
  arrivée directe sur `/verify-code` sans state redirige vers `/login`.
- **`localStorage`, pas `sessionStorage`** : le jeton vaut sept jours côté serveur,
  fermer l'onglet ne doit pas déconnecter. Un JWT lisible par les scripts de la page est
  le compromis assumé — pas de cookie `httpOnly` possible tant que l'API et le client ne
  partagent pas de domaine. Tous les accès au stockage sont dans un `try/catch` (il lève
  en navigation privée).
- **L'intercepteur relit le jeton à chaque requête** plutôt que de le capturer au
  démarrage, pour qu'une connexion ou une déconnexion prenne effet immédiatement.
- **Un 401 est traité une seule fois, dans l'intercepteur de réponse** : il efface la
  session (elle ne vaut plus rien) et marque l'erreur `sessionExpiree`, que `RouteError`
  et `AppLayout` savent lire. `request-code` et `verify-code` en sont exclues — un code
  invalide n'est pas une session expirée, et il n'y a rien à effacer. `/api/auth/me`,
  lui, n'est pas exclu : c'est justement là que la péremption se détecte.
- **La garde ne vérifie que la *présence* du jeton**, jamais sa validité : seul le
  serveur peut en juger, et il le fait à chaque appel. Un jeton périmé passe donc la
  garde, échoue sur le premier appel, et le chemin ci-dessus prend le relais. C'est ce
  qui évite un appel de vérification à chaque navigation.
- **La page demandée survit à la redirection** : la garde dépose `state.depuis`, `/login`
  le relaie à `/verify-code`, qui y renvoie après l'échange du code.
- **La déconnexion est purement locale** (`Topbar`) : le JWT n'est pas révocable côté
  serveur, il n'y a donc pas d'endpoint à appeler. Effacer la session suffit —
  l'intercepteur cesse aussitôt de poser l'en-tête.
- Les trois écrans partagent `components/auth/AuthShell.jsx` : volet de présentation à
  gauche (masqué sous `lg`), formulaire à droite. Le lockup de marque y est le même que
  dans la `Sidebar` — un seul repère visuel pour toute l'app.

Il n'y a **pas** de `@supabase/supabase-js` à installer côté client : le client ne parle
qu'à l'API Express.

## Variables d'environnement

Fichiers : `.env` (local, ignoré par git) et `.env.example` (versionné, à tenir à jour).

- Seules les variables préfixées `VITE_` sont exposées au code, via `import.meta.env.VITE_*`.
  Pas de `process.env` dans le code client.
- **Aucun secret** dans ces fichiers : tout finit dans le bundle public. En particulier,
  la clé Supabase du serveur (`SUPABASE_SECRET_KEY`) ne doit **jamais** être recopiée ici.
- `VITE_API_URL` pointe vers l'API Express (par défaut `http://localhost:4000`).
  C'est la seule variable du client — `VITE_USE_MOCKS` a disparu avec le retrait des
  mocks du circuit (voir Données & API). L'app ne fonctionne donc **qu'avec le serveur
  démarré** : `npm run dev` dans `../server`, et une base joignable
  (`curl localhost:4000/api/health`).

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

L'app est branchée de bout en bout sur l'API : authentification, garde de routes,
lectures, **toutes les mutations** (missions, projets, portfolios, seuils, documents) et
les suppressions avec confirmation. Ce qui reste :

- **Aucun fichier depuis le formulaire de projet.** Le serveur accepte un
  `multipart/form-data` (champ `file`, 50 Mo) sur `POST` et `PATCH /api/projects` et
  range l'URL publique dans `link` ; `ProjetFormModal` ne saisit qu'un `link` et envoie
  du JSON. Une réalisation dont le média est un fichier local doit donc être uploadée
  autrement. Le point d'entrée est unique : `versPayload()` + l'appel dans
  `ProjetFormModal` — à basculer en `FormData` comme `api/documents.js` le fait déjà.
- **Pas d'édition d'un document déposé** : `PATCH /api/documents/:id` existe (il
  remplace même le fichier), mais aucune UI ne le déclenche — on ne peut que déposer,
  télécharger ou supprimer. Changer la catégorie d'un justificatif oblige à le
  redéposer.
- **`window.open()` après un `await`** dans le téléchargement d'un document
  (`DocumentsTable`) : le lien signé est demandé au clic, donc l'ouverture est
  asynchrone. Les navigateurs l'autorisent tant que le délai reste court, mais un
  bloqueur strict peut la refuser sans que rien ne s'affiche. À revoir si le cas
  remonte (ouvrir l'onglet d'abord, y naviguer ensuite).
- **Aucun `onDelete` en cascade côté écran** : supprimer une mission laisse ses
  documents et fiches projet en place, `mission_id` passant à `null` (`SetNull` dans le
  schéma). C'est le comportement voulu, et la boîte de confirmation le dit — mais aucune
  vue ne liste ensuite ces orphelins autrement que par le filtre « sans mission liée ».
- Pas de page **compte / profil**, pas d'entrée de nav : `fetchProfil()`
  (`api/compte.js`) n'est appelée nulle part hors de la réhydratation.
  `users.first_name` / `last_name` restent à `null` — aucun écran ne permet de les
  saisir, et **aucune route serveur de les écrire**. La `Topbar` retombe donc sur la
  partie locale de l'email.
- **Pas de tests, et plus de mocks en circuit** : le retrait de `USE_MOCKS` rend l'app
  dépendante d'un serveur démarré, y compris pour développer un écran. Si ça devient
  gênant, la bonne réponse est MSW (un vrai serveur de simulation, qui intercepte au
  niveau réseau) — pas de réintroduire un `if` dans chaque module d'`api/`.
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
- Le formulaire de dépôt n'accepte **qu'un fichier à la fois** : la catégorie et la
  mission valent pour lui. Un dépôt multiple demanderait une ligne de réglages par
  fichier, pas une boucle sur le même formulaire.
