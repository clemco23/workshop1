# CLAUDE.md — server

API Express 5 du monorepo `wks1`. Le frontend React/Vite vit dans `../client`
(voir `../client/CLAUDE.md`).

## Commandes

Toujours lancer depuis `server/` :

```bash
npm install
npm run dev     # nodemon src/index.js (rechargement auto)
npm start       # node src/index.js
```

Pas de linter ni de suite de tests ici. Pour vérifier un changement, démarrer le serveur
et interroger l'API :

```bash
curl http://localhost:4000/api/health
```

## Stack

- **Express 5** (attention : le routage et la gestion des erreurs async diffèrent
  d'Express 4 — les rejets de promesse dans un handler sont propagés automatiquement).
- **CommonJS** (`require` / `module.exports`) — le `package.json` n'a pas `"type": "module"`.
  Ne pas introduire de syntaxe ESM sans changer ce champ.
- **cors** et **dotenv**.

## Structure

```
server/
  src/
    index.js    # bootstrap : dotenv, cors, express.json, routes, app.listen
```

Tout est encore dans `src/index.js`. En grossissant, extraire vers
`src/routes/`, `src/controllers/`, `src/middlewares/` et garder `index.js` comme
point de montage.

## Routes existantes

| Méthode | Chemin        | Réponse                                              |
| ------- | ------------- | ---------------------------------------------------- |
| GET     | `/`           | texte `API server is ready`                          |
| GET     | `/api/health` | `{ success, message, timestamp }`                     |

Convention de réponse JSON : enveloppe avec un booléen `success`, puis `data` ou
`message`. Garder cette forme pour les nouvelles routes.

## Variables d'environnement

`dotenv.config()` est appelé en tête de `src/index.js`. Le `.env` est ignoré par git.

- `PORT` — port d'écoute, défaut `4000`.
- `CORS_ORIGIN` — origine autorisée, défaut `*`. En production, la fixer sur l'URL du
  client plutôt que de laisser `*` (le CORS est configuré avec `credentials: true`).

Toute nouvelle variable doit être lue via `process.env` avec une valeur de repli
explicite, et documentée ici.

## Conventions

- Point-virgule en fin de ligne, guillemets simples, indentation 2 espaces
  (suivre le style de `src/index.js`).
- Les routes API sont préfixées `/api`.
- Statut HTTP explicite dans les réponses (`res.status(200).json(...)`).
