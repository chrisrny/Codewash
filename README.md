# Level Up RPG

Jeu éducatif en React + Vite.

## Installation

```bash
npm install
```

## Lancer le jeu

```bash
npm run dev
```

Puis ouvrir http://localhost:5173

## Lancer les tests

```bash
npm test            # lance tous les tests une fois
npm run test:watch  # relance les tests à chaque modification
npm run coverage    # tests + rapport de couverture (terminal + coverage/index.html)
```

Les tests sont dans `tests/` et utilisent [Vitest](https://vitest.dev) avec jsdom (simule le navigateur : `localStorage`, `window`...).

## Intégration continue

Chaque pull request (et chaque push sur `dev`) lance [`.github/workflows/ci.yml`](.github/workflows/ci.yml) : lint, format, tests + coverage, build. Le rapport de coverage est téléchargeable dans l'onglet Actions (artefact `coverage`). Une PR ne se merge pas si la CI est rouge.

Pour lancer les mêmes vérifications en local avant de push :

```bash
npm run lint
npm run format:check   # npm run format pour corriger
npm run coverage
npm run build
```
