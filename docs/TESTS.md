# Tests unitaires

Les tests du back-end utilisent [Vitest](https://vitest.dev/). Ils sont regroupés
dans `server/tests` pour ne pas mélanger le code de l'application et les tests.

```text
server/
├── src/       # code de l'application
└── tests/     # tests unitaires
```

## Commandes

Depuis le dossier `server` :

```bash
npm test
npm run test:watch
npm run coverage
```

- `npm test` exécute la suite une fois.
- `npm run test:watch` relance automatiquement les tests pendant le développement.
- `npm run coverage` affiche les pourcentages de couverture et crée un rapport dans
  `server/coverage/index.html`.

Le dossier `coverage` est généré automatiquement et ignoré par Git.

## Tests existants

| Fichier | Vérifications |
| --- | --- |
| `authService.test.js` | JWT créé, token absent et token invalide |
| `missionValidationService.test.js` | Données de mission, dates, nombres, types et statuts |

Les appels à Prisma, Supabase Storage et Gmail ne sont pas faits dans les tests
unitaires. Ils seront simulés avec des mocks pour tester les services concernés.
