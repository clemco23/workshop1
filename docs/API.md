# Documentation API

Base URL locale : `http://localhost:4000/api`

Les routes protégées demandent :

```http
Authorization: Bearer <token>
```

Le token est retourné par `POST /auth/verify-code`.

## Routes

| Méthode | Route | Authentification | Description |
| --- | --- | --- | --- |
| GET | `/health` | Non | Vérifie le back et la connexion BDD |
| POST | `/auth/request-code` | Non | Envoie un code par e-mail |
| POST | `/auth/verify-code` | Non | Vérifie un code et retourne un JWT |
| GET | `/auth/me` | Oui | Retourne l'utilisateur connecté |
| GET / POST | `/missions` | Oui | Liste ou crée les missions |
| GET / PATCH / DELETE | `/missions/:id` | Oui | Consulte, modifie ou supprime une mission |
| GET / PUT | `/parametres` | Oui | Consulte ou modifie les seuils |
| GET | `/dashboard` | Oui | Retourne les données du tableau de bord |
| GET / POST | `/projects` | Oui | Liste ou crée les projets |
| GET / PATCH / DELETE | `/projects/:id` | Oui | Gère un projet précis |
| GET / POST | `/documents` | Oui | Liste ou ajoute les documents |
| GET | `/documents/:id` | Oui | Retourne les métadonnées d'un document |
| GET | `/documents/:id/url` | Oui | Génère une URL temporaire de consultation |
| PATCH / DELETE | `/documents/:id` | Oui | Modifie ou supprime un document |
| GET / POST | `/portfolios` | Oui | Liste ou crée les portfolios |
| GET / PATCH / DELETE | `/portfolios/:id` | Oui | Gère un portfolio précis |
| PUT | `/portfolios/:id/projects` | Oui | Met à jour les projets et leur ordre |
| GET | `/public/portfolio/:slug` | Non | Retourne un portfolio public |

## Authentification

Demander un code :

```json
{
  "email": "utilisateur@example.com"
}
```

Vérifier un code :

```json
{
  "email": "utilisateur@example.com",
  "code": "123456"
}
```

## Missions

Types autorisés : `INTERMITTENCE`, `FREELANCE`.

Statuts autorisés : `PROPOSED`, `CONFIRMED`, `TERMINATED`.

Filtres de `GET /missions` : `type`, `statut`, `mois` au format `YYYY-MM`, `client`.

Exemple de création :

```json
{
  "clientProduction": "Studio Vela",
  "type": "FREELANCE",
  "statut": "CONFIRMED",
  "dateDebut": "2026-09-01",
  "dateFin": "2026-09-03",
  "montantHt": 1800,
  "nbJours": 3,
  "note": "Montage vidéo"
}
```

## Projets et documents

Les envois de fichiers utilisent `multipart/form-data` avec le champ `file`.
La taille maximale est de 50 Mo.

Types de projet : `IMAGE`, `VIDEO`, `PDF`, `LINK`. Un projet `LINK` exige le
champ `link` et pas de fichier. Les autres types exigent un fichier cohérent.

## Portfolios

Un portfolio contient une sélection ordonnée des projets de son propriétaire.
Sa création retourne un `publicUrl`, qui permet de partager la page publique.

## Codes de réponse

| Code | Signification |
| --- | --- |
| 200 | Requête réussie |
| 201 | Ressource créée |
| 204 | Ressource supprimée |
| 400 | Données invalides |
| 401 | Authentification requise ou invalide |
| 404 | Ressource introuvable |
| 500 | Erreur interne |
