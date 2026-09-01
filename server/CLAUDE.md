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

Prisma (le CLI charge automatiquement `prisma7.config.ts`) :

```bash
npx prisma validate            # vérifie le schéma
npx prisma generate            # régénère @prisma/client
npx prisma migrate dev         # crée/applique une migration (prisma/migrations)
npx prisma studio              # explorateur de données
```

Pas de linter ni de suite de tests ici. Pour vérifier un changement, démarrer le serveur
et interroger l'API :

```bash
curl http://localhost:4000/api/health
```

Pour vérifier uniquement la connexion base sans lancer Express :

```bash
node test-db.js                # affiche DB_OK ... ou DB_ERROR ...
```

## Stack

- **Express 5** (attention : le routage et la gestion des erreurs async diffèrent
  d'Express 4 — les rejets de promesse dans un handler sont propagés automatiquement).
- **CommonJS** (`require` / `module.exports`) — le `package.json` n'a pas `"type": "module"`.
  Ne pas introduire de syntaxe ESM sans changer ce champ. Seule exception :
  `prisma7.config.ts`, lu par le CLI Prisma et non par le runtime Node.
- **Prisma 7** + **PostgreSQL**, via le driver adapter `@prisma/adapter-pg` (`pg`).
  Le client est instancié avec l'adapter, pas avec une `url` de datasource :

  ```js
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  ```

  Le bloc `datasource db` du schéma n'a donc volontairement pas de champ `url` :
  l'URL vient de `prisma7.config.ts` pour le CLI et de l'adapter au runtime.
- **cors** et **dotenv**.

## Structure

```
server/
  src/
    index.js           # bootstrap : dotenv, prisma, cors, express.json, routes, app.listen
  prisma/
    schema.prisma      # modèles + enums (voir ci-dessous)
  prisma7.config.ts    # config CLI Prisma (schéma, chemin migrations, DATABASE_URL)
  test-db.js           # script ponctuel de test de connexion DB
```

Tout le code applicatif est encore dans `src/index.js`. En grossissant, extraire vers
`src/routes/`, `src/controllers/`, `src/middlewares/` et garder `index.js` comme
point de montage. Le `PrismaClient` doit rester un singleton partagé (l'extraire dans
`src/prisma.js`) — ne pas en instancier un par module.

Le dossier `src/generated/prisma` est gitignoré : si un `output` est ajouté au générateur,
c'est là qu'il doit pointer.

## Modèle de données

Enums : `MissionType` (INTERMITTENCE, FREELANCE), `MissionStatus` (PROPOSED, CONFIRMED,
TERMINATED), `DocumentCategory` (CONTRACT, EMPLOYER_ATTESTATION, QUOTE, INVOICE, OTHER),
`ProjectTag` (PRO, PERSONAL).

Modèles (`@@map` vers des tables en snake_case) : `User` (`users`), `ConfigSeuil`
(`config_seuil`, 1-1 avec User : seuil d'heures annuel intermittence), `Mission`
(`mission`), `Document` (`document`), `Project` (`projet`), `PortfolioPublic`
(`portfolio_public`, 1-1 avec User), `PortfolioPublicProjet` (`portfolio_public_projet`,
table de jointure ordonnée), `Code` (`codes`, codes à usage unique avec `expireAt`).

Conventions du schéma à respecter pour tout nouveau champ/modèle :

- clé primaire `String @id @default(uuid())` ;
- champs métier nommés en français (`dateDebut`, `montantHt`), mappés en snake_case
  via `@map` ; tables via `@@map`.
- `createdAt DateTime @default(now())` et, si le modèle est mutable,
  `updatedAt DateTime @updatedAt` ;
- montants et durées en `Decimal` avec `@db.Decimal(p, s)` explicite ;
- relations depuis `User` en `onDelete: Cascade`, relations optionnelles vers `Mission`
  en `onDelete: SetNull`.

## Routes existantes

| Méthode | Chemin        | Réponse                                                          |
| ------- | ------------- | ---------------------------------------------------------------- |
| GET     | `/`           | texte `API server is ready`                                      |
| GET     | `/api/health` | 200 `{ success, message, database, result, timestamp }` — fait un `SELECT 1` via Prisma ; 500 `{ success: false, message, error }` si la DB est injoignable |

Convention de réponse JSON : enveloppe avec un booléen `success`, puis `data` ou
`message` (et `error` en cas d'échec). Garder cette forme pour les nouvelles routes.

## Variables d'environnement

`dotenv.config()` est appelé en tête de `src/index.js`. Le `.env` est ignoré par git.

- `PORT` — port d'écoute, défaut `4000`.
- `CORS_ORIGIN` — origine autorisée, défaut `*`. En production, la fixer sur l'URL du
  client plutôt que de laisser `*` (le CORS est configuré avec `credentials: true`).
- `DATABASE_URL` — connexion PostgreSQL (pooler), utilisée par l'adapter `pg` et par le
  CLI Prisma. Pas de valeur de repli : sans elle, `/api/health` répond 500.
- `DIRECT_URL` — connexion directe (hors pooler), pour les migrations.
- `NODE_ENV`.

Toute nouvelle variable doit être lue via `process.env` avec une valeur de repli
explicite quand c'est possible, et documentée ici.

## Conventions

- Point-virgule en fin de ligne, guillemets simples, indentation 2 espaces
  (suivre le style de `src/index.js`).
- Les routes API sont préfixées `/api`.
- Statut HTTP explicite dans les réponses (`res.status(200).json(...)`).
- Les handlers qui touchent la DB sont `async` et enveloppent l'accès Prisma dans un
  `try/catch` renvoyant une 500 au format ci-dessus.
