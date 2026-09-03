# Editly

Editly est une application de gestion destinée aux professionnels de l'audiovisuel.
Elle centralise les missions d'intermittence et de freelance, les documents,
les projets médias et les portfolios publics partageables.

## Fonctionnalités

- Connexion sans mot de passe par code envoyé par e-mail
- Gestion des missions d'intermittence et de freelance
- Suivi des heures et du chiffre d'affaires sur 12 mois glissants
- Tableau de bord, seuil annuel et graphiques
- Ajout de documents associés aux missions
- Projets image, vidéo, PDF ou lien externe
- Génération de portfolios publics partageables

## Stack technique

| Domaine | Technologie |
| --- | --- |
| Front-end | React + Vite |
| Back-end | Node.js + Express |
| Base de données | PostgreSQL avec Prisma |
| Stockage | Supabase Storage |
| Authentification | Code e-mail + JWT |
| Tests | Vitest |
| Déploiement | Vercel et Render |

## Lancer le projet localement

```bash
# Front-end
cd client
npm install
npm run dev

# Back-end (dans un second terminal)
cd server
npm install
npm run dev
```

Le front est accessible par défaut sur `http://localhost:5173` et le back sur
`http://localhost:4000`. Créez `server/.env` à partir de `server/.env.example`
avant de démarrer le back. Ne partagez jamais ce fichier.

## Documentation

- [API](docs/API.md)
- [Tests unitaires](docs/TESTS.md)
- [Déploiement](docs/DEPLOYMENT.md)
