# Déploiement

```text
Navigateur → Vercel (front React) → Render (API Express) → Supabase (BDD et fichiers)
```

## Vercel : front-end

Déployez le dossier `client` avec Vite. Ajoutez cette variable dans Vercel :

```env
VITE_API_URL=https://votre-api.onrender.com
```

Redéployez le front après une modification de variable d'environnement.

## Render : back-end

Configuration du service :

```text
Root Directory : server
Build Command  : npm install && npx prisma generate
Start Command  : npm start
```

Variables Render à renseigner, sans jamais les commit :

```env
NODE_ENV=production
DATABASE_URL=<url-supabase>
DIRECT_URL=<url-directe-supabase>
JWT_SECRET=<secret-long-et-aleatoire>
CORS_ORIGIN=https://votre-front.vercel.app
PUBLIC_APP_URL=https://votre-front.vercel.app
GMAIL_USER=<compte-gmail>
GMAIL_APP_PASSWORD=<mot-de-passe-application>
SUPABASE_URL=<url-supabase>
SUPABASE_SECRET_KEY=<cle-secrete>
SUPABASE_PROJECT_MEDIA_BUCKET=project-media
SUPABASE_DOCUMENT_BUCKET=documents
```

Ne définissez pas `PORT` sur Render : Render fournit cette valeur automatiquement.

## Supabase

Supabase héberge PostgreSQL, le bucket `project-media` et le bucket `documents`.
Après une modification du schéma Prisma, lancez depuis `server` :

```bash
npx prisma db push
npx prisma generate
```

## Sécurité

- Ne committez jamais `.env`.
- Ne partagez jamais une clé Supabase secrète, l'URL de BDD, un JWT ou le mot de
  passe d'application Gmail.
- `CORS_ORIGIN` doit correspondre exactement à l'URL Vercel, sans slash final.
