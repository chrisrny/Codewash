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
