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

Chaque pull request (et chaque push sur `dev`) lance [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Une PR ne se merge pas si la CI est rouge. Le résumé du run affiche la coverage face aux seuils, le rapport détaillé est téléchargeable dans l'onglet Actions (artefact `coverage`).

La CI échoue si une de ces règles casse :

| Règle | Outil | Où la changer |
| --- | --- | --- |
| Pas d'erreur de lint, au plus 14 warnings (les 14 fonctions trop complexes déjà là) | ESLint, règle `complexity` à 10 | `eslint.config.js`, `--max-warnings` dans `package.json` |
| Au plus 1,5 % de lignes dupliquées dans `src/` (1,25 % mesuré après le formatage Prettier) | jscpd | script `duplication` dans `package.json` |
| Code formaté | Prettier | `.prettierrc.json` |
| Tous les tests passent, coverage au-dessus des seuils (lignes 44 %, statements 43 %, branches 40 %, fonctions 38 %) | Vitest + coverage v8 | `thresholds` dans `vitest.config.js` |
| Le jeu build | Vite | |

Les seuils ne font que monter : quand une PR améliore la coverage ou retire une fonction trop complexe, on remonte le seuil (ou on baisse `--max-warnings`) dans la même PR. Baisser un seuil, c'est de la dette : on l'écrit dans `docs/DEBT.md` avec la raison.

La CI tourne sur les runners self-hosted fournis par Epitech (`runs-on: self-hosted`) : les runners hébergés par GitHub (`ubuntu-latest`) ne démarrent pas sur l'orga, faute de crédits.

Pour lancer les mêmes vérifications en local avant de push :

```bash
npm run lint
npm run duplication
npm run format:check   # npm run format pour corriger
npm run coverage
npm run build
```
