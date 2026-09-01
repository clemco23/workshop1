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
- **Vite 8**, config dans `vite.config.js` : plugins `@vitejs/plugin-react` (Oxc) et
  `@tailwindcss/vite`.
- **Tailwind CSS 4** — pas de `tailwind.config.js` : la config passe par le plugin Vite
  et les directives CSS dans `src/index.css`. Ne pas recréer un fichier de config v3.
- **react-router-dom 7** en data router (voir la section Routing). **axios** et
  **recharts** sont installés mais pas encore utilisés.
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
    index.css         # styles globaux + Tailwind
    pages/            # un composant par route, encore vides (return null)
    assets/           # images importées par le code (hero.png, logos)
```

Les SVG d'icônes sont dans `public/icons.svg` et référencés par `<use href="/icons.svg#id">`,
pas importés.

## Routing

Tout est déclaré dans `src/router.jsx` avec `createBrowserRouter` (react-router 7,
data router). Une page par fichier dans `src/pages/`, en `export default`.

Chaque route est chargée en lazy via le helper local `page()` :

```js
const page = (loader) => async () => ({ Component: (await loader()).default })
// ...
{ path: 'documents', lazy: page(() => import('./pages/Documents.jsx')) }
```

Vite produit ainsi un chunk par page, et le data router le charge *pendant* la
navigation, avant le rendu — donc pas de `<Suspense>` ni de fallback à prévoir.
Garder cette forme pour toute nouvelle route.

| Chemin                  | Page                   | Contenu                                       |
| ----------------------- | ---------------------- | --------------------------------------------- |
| `/login`                | `Login`                | connexion (Supabase Auth)                     |
| `/signup`               | `Signup`               | inscription                                   |
| `/verify-code`          | `VerifyCode`           | saisie du code reçu (`email_verifie` / 2FA)   |
| `/`                     | `Dashboard`            | bloc B — jauge heures, CA/mois, répartition   |
| `/missions`             | `Missions`             | bloc A — vue mois + liste, filtres            |
| `/missions/:id`         | `MissionDetail`        | détail / édition d'une mission                |
| `/documents`            | `Documents`            | bloc C — liste, upload, filtres               |
| `/projets`              | `Projets`              | bloc D — liste des fiches projet              |
| `/projets/:id`          | `ProjetDetail`         | détail / édition d'une fiche projet           |
| `/portfolios`           | `PortfoliosAdmin`      | liste des pages publiques créées              |
| `/portfolios/:id`       | `PortfolioAdminDetail` | sélection et réordonnancement des projets     |
| `/profil`               | `Profil`               | `nom_affiche`, `bio`, `avatar_url`            |
| `/parametres`           | `ParametresSeuil`      | seuils et fenêtre de mois                     |
| `/portfolio/:slug`      | `PortfolioPublic`      | **seule route publique**                      |
| `*`                     | `NotFound`             | 404                                           |

Les routes à paramètre sont des enfants de leur liste (`missions` → `:id`) pour qu'un
futur layout parent ne soit pas remonté à chaque navigation.

### État actuel — pas encore fait

- **Aucune garde d'authentification** : toutes les routes sont accessibles. Quand
  `ProtectedRoute` arrivera, `/portfolio/:slug` doit rester en dehors — c'est la seule
  route publique, elle tape `/api/public/portfolio/:slug` et ne doit ni charger le client
  Supabase ni attendre une session.
- **Aucun layout partagé** : chaque page est montée seule, il n'y a pas encore de nav
  commune ni de `<Outlet />`.
- **Supabase n'est pas installé** : les pages d'auth sont vides. `@supabase/supabase-js`
  reste à ajouter, avec `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` dans
  `.env.example` (la clé anon est publique par design, ce n'est pas un secret).

## Variables d'environnement

Fichiers : `.env` (local, ignoré par git) et `.env.example` (versionné, à tenir à jour).

- Seules les variables préfixées `VITE_` sont exposées au code, via `import.meta.env.VITE_*`.
  Pas de `process.env` dans le code client.
- **Aucun secret** dans ces fichiers : tout finit dans le bundle public.
- `VITE_API_URL` pointe vers l'API Express (par défaut `http://localhost:4000`).

Ajouter une variable = l'ajouter aussi dans `.env.example` avec une valeur d'exemple.

## Conventions

- Composants en `.jsx`, un composant par fichier, `export default`.
- Pas de point-virgule en fin de ligne, guillemets simples, indentation 2 espaces
  (suivre le style existant de `src/router.jsx`).
- Une page = un fichier dans `src/pages/`, nommé comme dans le tableau des routes,
  déclarée en lazy dans `src/router.jsx`.
- Appels API : passer par `VITE_API_URL`, jamais d'URL absolue codée en dur.
