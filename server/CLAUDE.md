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

Prisma (le CLI lit `prisma7.config.ts` — malgré son nom, c'est bien Prisma 6) :

```bash
npx prisma validate            # vérifie le schéma
npx prisma generate            # régénère @prisma/client
npx prisma migrate dev         # crée/applique une migration (prisma/migrations)
npx prisma studio              # explorateur de données
```

Pas de linter ni de suite de tests ici. Pour vérifier un changement, démarrer le
serveur et interroger l'API :

```bash
curl http://localhost:4000/api/health          # teste aussi la connexion DB (SELECT 1)
```

Une route protégée demande un jeton : demander un code par mail, le lire dans la boîte
de réception, puis l'échanger.

```bash
curl -X POST localhost:4000/api/auth/request-code -H 'Content-Type: application/json' -d '{"email":"moi@exemple.fr"}'
curl -X POST localhost:4000/api/auth/verify-code  -H 'Content-Type: application/json' -d '{"email":"moi@exemple.fr","code":"123456"}'
curl localhost:4000/api/missions -H 'Authorization: Bearer <token>'
```

## Stack

- **Express 5** (attention : le routage et la gestion des erreurs async diffèrent
  d'Express 4 — les rejets de promesse dans un handler sont propagés automatiquement).
- **CommonJS** (`require` / `module.exports`) — le `package.json` n'a pas `"type": "module"`.
  Ne pas introduire de syntaxe ESM sans changer ce champ. Seule exception :
  `prisma7.config.ts`, lu par le CLI Prisma et non par le runtime Node.
- **Prisma 6** + **PostgreSQL** (Supabase). Le client est un `new PrismaClient()` nu,
  **sans driver adapter** : en Prisma 6 la connexion part directement du bloc
  `datasource db` du schéma, qui porte donc `url = env("DATABASE_URL")` et
  `directUrl = env("DIRECT_URL")`. Ne pas réintroduire `@prisma/adapter-pg`.
- **jsonwebtoken** + **bcryptjs** + **nodemailer** pour l'authentification (voir la
  section dédiée).
- **multer** (stockage mémoire) + **@supabase/supabase-js** pour l'upload des médias de
  projet vers Supabase Storage — le serveur n'écrit **aucun fichier sur son disque**.
- **cors** et **dotenv**.

`pg` et `better-sqlite3` sont encore dans les dépendances mais **plus importés nulle
part** (restes de l'ancien montage par adapter) : ne pas construire dessus.

## Structure

```
server/
  src/
    index.js                 # bootstrap : dotenv, cors, express.json, montage des routes,
                             #   listen, puis le middleware d'erreur
    config/
      prisma.js              # singleton PrismaClient — le seul endroit qui l'instancie
    routes/                  # un fichier par préfixe : déclare les verbes, branche requireAuth
      authRoutes.js       healthRoutes.js     missionRoutes.js    settingsRoutes.js
      dashboardRoutes.js  projectRoutes.js    documentRoutes.js   portfolioRoutes.js
      publicPortfolioRoutes.js
    controllers/             # validation du body/query + accès Prisma + réponse HTTP
      authController.js      missionController.js   settingsController.js
      dashboardController.js projectController.js   documentController.js
      portfolioController.js
    services/
      authService.js            # codes à usage unique, JWT, résolution du user depuis le header
      emailService.js           # envoi du code par Gmail (nodemailer)
      projectMediaService.js    # médias de projet — bucket public, URL publique
      documentStorageService.js # justificatifs — URL signée, jamais d'URL publique
    middlewares/
      authMiddleware.js      # requireAuth : pose req.user ou répond 401
  prisma/
    schema.prisma            # modèles + enums (voir ci-dessous)
  prisma7.config.ts          # config CLI Prisma (schéma, chemin migrations, DATABASE_URL)
```

Le découpage route / controller / service est en place : **une nouvelle ressource suit
le même moule** — un fichier dans `routes/` monté dans `index.js`, un fichier dans
`controllers/`, et la logique réutilisable ou l'appel externe dans `services/`.

`prisma` s'importe **toujours** depuis `config/prisma.js` (`const { prisma } =
require('../config/prisma')`) : ne jamais instancier un second `PrismaClient`.

Il n'y a pas encore de dossier `prisma/migrations/` : le schéma a été poussé
directement. La première `migrate dev` le créera.

Le dossier `src/generated/prisma` est gitignoré : si un `output` est ajouté au
générateur, c'est là qu'il doit pointer.

## Modèle de données

Enums : `MissionType` (INTERMITTENCE, FREELANCE), `MissionStatus` (PROPOSED, CONFIRMED,
TERMINATED), `DocumentCategory` (CONTRACT, EMPLOYER_ATTESTATION, QUOTE, INVOICE, OTHER),
`ProjectTag` (PRO, PERSONAL), `ProjectType` (IMAGE, PDF, VIDEO, LINK).

Modèles (`@@map` vers des tables en snake_case) :

| Modèle                  | Table                      | Rôle                                                |
| ----------------------- | -------------------------- | --------------------------------------------------- |
| `User`                  | `users`                    | compte ; **pas de mot de passe** (auth par code)     |
| `EmailVerificationCode` | `email_verification_code`  | codes à usage unique : `codeHash`, `expiresAt`, `usedAt` |
| `ConfigSeuil`           | `config_seuil`             | 1-1 avec User : seuil d'heures annuel intermittence  |
| `Mission`               | `mission`                  |                                                      |
| `Document`              | `document`                 | coffre **privé** des justificatifs                   |
| `Project`               | `projet`                   | fiche réalisation ; **un seul** média (`type` + `link`) |
| `PortfolioPublic`       | `portfolio_public`         | page publique, `slug` unique, `actif`                |
| `PortfolioPublicProjet` | `portfolio_public_projet`  | table de jointure ordonnée (`ordre`)                 |

Conventions du schéma à respecter pour tout nouveau champ/modèle :

- clé primaire `String @id @default(uuid())` ;
- champs métier nommés en français (`dateDebut`, `montantHt`), mappés en snake_case
  via `@map` ; tables via `@@map`.
- `createdAt DateTime @default(now())` et, si le modèle est mutable,
  `updatedAt DateTime @updatedAt` ;
- montants et durées en `Decimal` avec `@db.Decimal(p, s)` explicite ;
- relations depuis `User` en `onDelete: Cascade`, relations optionnelles vers `Mission`
  en `onDelete: SetNull`.

Rappel côté client : Prisma sérialise les `Decimal` en **chaînes** (`'40.00'`) dans le
JSON — c'est voulu, `../client/src/lib/format.js` a un `num()` pour ça.

## Authentification

Il n'y a **pas de mot de passe** et **pas de Supabase Auth** (Supabase ne sert ici que
de base Postgres et de Storage) : la connexion se fait par code à usage unique envoyé
par email, échangé contre un JWT.

1. `POST /api/auth/request-code` — normalise l'email (trim + minuscules), **crée le
   `User` s'il n'existe pas** (inscription et connexion sont donc le même appel), tire
   un code à 6 chiffres, en stocke le `bcrypt` (jamais le code en clair) avec une
   expiration à **10 minutes**, et l'envoie via `emailService`.
2. `POST /api/auth/verify-code` — reprend le dernier code non utilisé et non expiré, le
   compare en `bcrypt.compare`, le marque `usedAt`, et renvoie `{ token, user }`. Le JWT
   porte `{ userId, email }`, signé avec `JWT_SECRET`, valable **7 jours**.
3. Les appels suivants portent `Authorization: Bearer <token>`.

`requireAuth` (`middlewares/authMiddleware.js`) résout le user via `getUserFromToken()`
et pose `req.user` (sélection restreinte : `id`, `email`, `firstName`, `lastName`,
`createdAt`) ou répond `401 { message: 'Non authentifié' }`. Un jeton invalide ou expiré
n'est pas distingué d'un jeton absent — `getUserFromToken` renvoie `null` dans tous les
cas.

**Toute nouvelle route métier est protégée** : `router.use(requireAuth)` en tête du
fichier de routes, et **chaque requête Prisma filtre sur `userId: req.user.id`**, y
compris les lectures par id (`findFirst({ where: { id, userId } })`, jamais
`findUnique({ where: { id } })`, sinon on lit la ressource d'un autre). Les identifiants
reçus dans un body (`missionId`, `projectIds`) sont revérifiés comme appartenant au
`req.user` avant d'être écrits.

La seule exception est `/api/public/*`, monté sans `requireAuth` — voir plus bas.

## Routes existantes

Toutes préfixées `/api` sauf `/`. « Auth » = protégée par `requireAuth`.

| Méthode | Chemin                        | Auth | Réponse                                                    |
| ------- | ----------------------------- | :--: | ----------------------------------------------------------- |
| GET     | `/`                           |      | texte `API server is ready`                                  |
| GET     | `/api/health`                 |      | 200 `{ success, message, database, result, timestamp }` — `SELECT 1` via Prisma ; 500 `{ success: false, message, error }` si la DB est injoignable |
| POST    | `/api/auth/request-code`      |      | 200 `{ success, message, email }` ; 400 email invalide ; 502/503 email non parti |
| POST    | `/api/auth/verify-code`       |      | 200 `{ success, message, token, user }` ; 400 code invalide/expiré ; 404 utilisateur inconnu |
| GET     | `/api/auth/me`                |  •   | 200 `{ user }` ; 401 sinon (lit le header lui-même, pas via le middleware) |
| GET     | `/api/dashboard`              |  •   | 200 `{ user, configSeuil, missions, documents }` — lignes brutes, **aucun total** : les agrégats sont calculés dans le client (`src/lib/dashboard.js`) |
| GET     | `/api/missions`               |  •   | 200 `Mission[]`, triées par `dateDebut` desc                 |
| POST    | `/api/missions`               |  •   | 201 `Mission`                                                |
| GET     | `/api/missions/:id`           |  •   | 200 `Mission` avec `documents` et `projects` ; 404            |
| PATCH   | `/api/missions/:id`           |  •   | 200 `Mission` (mise à jour partielle) ; 404                   |
| DELETE  | `/api/missions/:id`           |  •   | 204 sans corps ; 404                                          |
| GET     | `/api/projects`               |  •   | 200 `Project[]`, triés par `date` desc                        |
| POST    | `/api/projects`               |  •   | 201 `Project` — `multipart/form-data`, champ fichier `file`   |
| GET     | `/api/projects/:id`           |  •   | 200 `Project` avec sa `mission` et ses `portfolios` (voir plus bas) ; 404 |
| PATCH   | `/api/projects/:id`           |  •   | 200 `Project` ; 404                                           |
| DELETE  | `/api/projects/:id`           |  •   | 204 — supprime aussi le média dans Storage                    |
| GET     | `/api/documents`              |  •   | 200 `Document[]` avec leur `mission`, triés par `uploadedAt` desc |
| POST    | `/api/documents`              |  •   | 201 `Document` — `multipart/form-data`, champ fichier `file`  |
| GET     | `/api/documents/:id`          |  •   | 200 `Document` avec sa `mission` ; 404                        |
| GET     | `/api/documents/:id/url`      |  •   | 200 `{ url }` — lien signé valable **1 h** ; 404              |
| PATCH   | `/api/documents/:id`          |  •   | 200 `Document` — remplace le fichier si `file` est fourni ; 404 |
| DELETE  | `/api/documents/:id`          |  •   | 204 — supprime aussi le fichier dans Storage                  |
| GET     | `/api/portfolios`             |  •   | 200 `PortfolioPublic[]` + `nbProjets` et `publicUrl`          |
| POST    | `/api/portfolios`             |  •   | 201 portfolio avec ses projets ; slug généré                  |
| GET     | `/api/portfolios/:id`         |  •   | 200 portfolio + `projets` (ordonnés) + `projetsDisponibles` ; 404 |
| PATCH   | `/api/portfolios/:id`         |  •   | 200 — `titrePage` et `actif` seulement (le slug n'est pas modifiable) ; 404 |
| PUT     | `/api/portfolios/:id/projects`|  •   | 200 — **remplace** toute la sélection ; renvoie la même charge que le GET ; 404 |
| DELETE  | `/api/portfolios/:id`         |  •   | 204 ; 404                                                     |
| GET     | `/api/public/portfolio/:slug` |      | 200 `{ slug, titrePage, auteur, projets[] }` ; 404 si le slug est inconnu **ou le portfolio inactif** |
| GET     | `/api/parametres`             |  •   | 200 `ConfigSeuil` — `upsert`, donc crée la ligne aux valeurs par défaut à la première lecture |
| PUT     | `/api/parametres`             |  •   | 200 `ConfigSeuil` ; 400 si aucun champ connu dans le body      |

### Missions

Filtres en query sur `GET /api/missions` : `type`, `statut` (valeurs d'enum, 400 sinon),
`client` (`contains`, insensible à la casse), `mois` au format `YYYY-MM` (400 sinon).
Attention : `mois` filtre sur `dateDebut`, donc une mission commencée le mois d'avant et
toujours en cours n'y apparaît pas — à revoir si le client attend un chevauchement.

Validation du body (`missionData()`) : `clientProduction` non vide, `type` dans l'enum,
`dateFin >= dateDebut`, nombres finis `>= 0`, chaînes vides ramenées à `null`. En
`PATCH`, seuls les champs présents dans le body sont validés et écrits.

### Projets et médias

`POST` et `PATCH /api/projects` passent par **multer en `memoryStorage`** (champ `file`,
**50 Mo** max) : le fichier ne touche jamais le disque, il part directement dans
Supabase Storage via `projectMediaService`.

- Le chemin de stockage est `{userId}/projects/{uuid}{extension}` : le préfixe par
  utilisateur est ce qui rend les objets attribuables — le garder pour tout nouveau
  média.
- `project.link` reçoit l'URL **publique** renvoyée par Storage. Un projet de type
  `LINK` n'accepte pas de fichier et fournit son `link` dans le body (validé : http/https
  uniquement). Un projet `IMAGE` / `PDF` / `VIDEO` accepte l'un ou l'autre, et le type du
  fichier doit correspondre au `type` déclaré (mimetype **ou** extension).
- Le nettoyage est symétrique : si l'écriture en base échoue après l'upload, le média
  fraîchement envoyé est supprimé ; un `PATCH` qui remplace le média supprime l'ancien ;
  un `DELETE` supprime le média du projet. **Toute nouvelle écriture de média doit garder
  cette symétrie**, sinon Storage se remplit d'orphelins.
- Un échec de suppression dans Storage est seulement journalisé, il ne fait pas échouer
  la requête (la ligne en base est la source de vérité).

`GET /api/projects/:id` renvoie aussi **`portfolios`** : les pages publiques où la fiche
figure, chacune avec son `ordre`. C'est ce qui permet au client de dire si une
réalisation est exposée, et où. La table de jonction est **aplatie** avant la réponse —
le client lit un tableau de portfolios, pas des lignes de liaison — et la projection est
explicite (`id`, `slug`, `titrePage`, `actif`) : `user_id` n'a rien à faire dans une
réponse, même authentifiée.

Filtres en query sur `GET /api/projects` : `tag`, `type`, et `missionId` — dont la
valeur spéciale **`aucune`** liste les fiches non rattachées, même convention que les
documents. La liste inclut la `mission` de chaque fiche : sans elle, un projet rattaché
s'afficherait comme un projet perso dans les cartes du client.

### Documents

Le coffre des justificatifs. Même mécanique que les médias de projet — multer en
`memoryStorage` (champ `file`, 50 Mo), chemin `{userId}/documents/{uuid}{extension}`,
nettoyage symétrique en cas d'échec ou de remplacement — avec **une différence qui
gouverne tout le reste** : un justificatif n'a jamais d'URL publique.

- La lecture passe donc par `GET /api/documents/:id/url`, qui rend une **URL signée
  valable une heure** (`createSignedUrl`). Le client ne fabrique jamais l'URL depuis
  `fichier_path` : ce champ est un chemin de stockage, pas une adresse.
- Formats acceptés : PDF et images (mimetype **ou** extension, comme pour les projets).
- Filtres en query sur `GET /api/documents` : `categorie`, et `missionId` — dont la
  valeur spéciale **`aucune`** liste les documents non rattachés (`mission_id IS NULL`).
- `PATCH` accepte un nouveau `file` : l'ancien objet n'est supprimé qu'une fois la ligne
  mise à jour.

⚠️ **Le bucket a un repli qui n'en est pas un.** `documentStorageService` lit
`SUPABASE_DOCUMENT_BUCKET` et, à défaut, retombe sur `SUPABASE_PROJECT_MEDIA_BUCKET` —
c'est-à-dire le bucket **public** des médias de projet. Les justificatifs y sont alors
lisibles par quiconque connaît l'URL, la signature ne protégeant plus rien. Le repli
dépanne en développement ; en production, `SUPABASE_DOCUMENT_BUCKET` doit pointer un
bucket privé dédié, et cette variable devrait devenir obligatoire.

### Portfolios

- Le **slug est généré côté serveur** à la création : `slugify(titrePage)` (accents
  retirés, minuscules, non-alphanumériques en tirets, 60 caractères max) suivi de 4
  octets aléatoires en hexadécimal. Il n'est **jamais** modifiable ensuite — un lien
  public déjà partagé ne doit pas casser.
- Chaque réponse porte un `publicUrl` calculé depuis `PUBLIC_APP_URL` : le client n'a pas
  à reconstruire l'URL, et un changement de domaine se fait au seul niveau de la variable
  d'environnement.
- `PUT /:id/projects` **remplace** la sélection entière (`deleteMany` + `createMany` dans
  une `$transaction`), l'`ordre` valant l'index du tableau `projectIds` + 1. C'est ce qui
  fait du réordonnancement une opération idempotente : le client envoie la liste dans
  l'ordre voulu, pas des deltas.
- `GET /:id` renvoie aussi `projetsDisponibles` (les projets de l'utilisateur **non**
  sélectionnés), pour que l'écran d'administration se peuple en un seul appel.
- La route publique ne renvoie **que** les champs d'affichage (`titre`, `description`,
  `tag`, `type`, `date`, `link`, `ordre`) plus le nom de l'auteur : ni identifiants, ni
  `userId`, ni email. **Garder cette projection explicite** — ne jamais y passer une
  entité Prisma entière.

### Convention de réponse

Le corps est **la ressource elle-même** (objet ou tableau), pas une enveloppe : `200
[ ...missions ]`, `200 { ...configSeuil }`. En erreur, **`{ message }`** avec un statut
explicite.

`/api/health` et `/api/auth/*` portent encore un booléen `success` : c'est l'ancienne
convention, conservée parce que le client la lit. **Ne pas l'étendre aux nouvelles
routes** — suivre la forme ci-dessus.

Statut HTTP toujours explicite (`res.status(200).json(...)`), `201` sur une création,
`204` sans corps sur une suppression.

### Gestion des erreurs

Les controllers ne formatent pas leurs erreurs : ils enveloppent tout dans un
`try/catch` et terminent par `return next(error)`. Le middleware final de `src/index.js`
traduit `error.status` en code HTTP (500 par défaut) et renvoie `{ message }`, avec un
cas particulier pour `LIMIT_FILE_SIZE` de multer (400, « fichier trop volumineux »).

Les erreurs de validation sont donc de simples `Error` portant `error.status = 400`,
levées par les helpers (`invalid()`, `parseDate`, `parseNumber`, `positiveInteger`…) :
c'est ce qui permet de garder la validation en fonctions pures, hors du handler. Un
service indisponible lève de même `status: 503` (Storage non configuré) ou `502` (upload
échoué).

## Variables d'environnement

`dotenv.config()` est appelé en tête de `src/index.js` avec un chemin explicite vers
`../.env`, **avant** tout `require` qui lit `process.env`. Le `.env` est ignoré par git,
`.env.example` est versionné et doit rester à jour.

- `PORT` — port d'écoute, défaut `4000`.
- `CORS_ORIGIN` — origine autorisée, défaut `*`. En production, la fixer sur l'URL du
  client plutôt que de laisser `*` (le CORS est configuré avec `credentials: true`).
- `DATABASE_URL` — connexion PostgreSQL (pooler), lue par le bloc `datasource` du schéma
  et par le CLI Prisma. Pas de valeur de repli : sans elle, `/api/health` répond 500.
- `DIRECT_URL` — connexion directe (hors pooler), pour les migrations.
- `JWT_SECRET` — signature des jetons. Le repli `'dev-secret-change-me'` est **pour le
  dev uniquement** : le définir en production, sinon les jetons sont forgeables.
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — compte Gmail dédié et mot de passe d'application
  Google pour l'envoi des codes. Absents, `emailService` lève
  `CONFIGURATION_GMAIL_MANQUANTE` et aucune connexion n'est possible.
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` / `SUPABASE_PROJECT_MEDIA_BUCKET` — Storage des
  médias de projet, servis par URL publique. `SUPABASE_SECRET_KEY` est une **clé de
  service** : elle ne doit jamais être exposée au client ni préfixée `VITE_`. Absentes,
  les routes projets qui touchent un fichier répondent 503.
- `SUPABASE_DOCUMENT_BUCKET` — bucket **privé** des justificatifs. Techniquement
  facultative (repli sur `SUPABASE_PROJECT_MEDIA_BUCKET`), mais ce repli range des
  documents privés dans un bucket public : à considérer comme obligatoire hors
  développement, voir la section Documents.
- `PUBLIC_APP_URL` — URL publique du front, défaut `http://localhost:5173`, utilisée pour
  composer le `publicUrl` des portfolios.
- `NODE_ENV`.

Toute nouvelle variable doit être lue via `process.env` avec une valeur de repli
explicite quand c'est possible, documentée ici **et** ajoutée à `.env.example`.

## Conventions de code

- Point-virgule en fin de ligne, guillemets simples, indentation 2 espaces
  (suivre le style de `src/controllers/missionController.js`).
- Les routes API sont préfixées `/api`.
- Les controllers sont `async (req, res, next)`, en `try/catch`, terminés par
  `return next(error)`.
- Un helper de validation lève une `Error` avec `status`, il ne répond jamais lui-même.

## État actuel — à faire

- **Bucket des documents à isoler** : tant que `SUPABASE_DOCUMENT_BUCKET` n'est pas
  définie, les justificatifs partent dans le bucket public des médias de projet (voir la
  section Documents). C'est le point le plus urgent : les URL signées n'apportent aucune
  confidentialité sur un bucket public.
- **`console.log` de debug** dans `index.js` : chaque requête est journalisée (méthode et
  chemin). À retirer ou à passer derrière `NODE_ENV !== 'production'`.
- `ENVOI_EMAIL_ECHOUE` est intercepté dans `authController` mais **aucun service ne le
  lève** : un envoi Gmail qui échoue ressort en 500 au lieu du 502 prévu.
- Le middleware d'erreur est déclaré **après `app.listen()`** dans `index.js`. Ça
  fonctionne (la pile est consultée à chaque requête), mais le remonter juste avant le
  `listen` évite la surprise à la lecture.
- **Aucune limite de débit sur `/api/auth/request-code`** : l'appel crée un `User` et
  envoie un mail sans contrôle, il est ouvert au spam.
- Pas de migration versionnée (`prisma/migrations/` absent), pas de tests.
