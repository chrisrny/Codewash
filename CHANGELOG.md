# Changelog

Ce qui change dans CodeWash, PR par PR. Le plus récent est en haut.

On suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) :

- **Ajouté** : un nouveau fichier, test ou outil
- **Modifié** : du code qui change sans changer le jeu
- **Corrigé** : un bug en moins

Chaque PR ajoute sa ligne ici, dans la même PR.

## [Non publié] - branche `dev`

### Ajouté

- `docs/SAVE_FORMAT.md` : le contrat du format de sauvegarde, avec `tests/save-format.test.jsx` qui casse si le format change (DEBT-02, #34)
- `docs/TESTS.md` : la stratégie de tests, quel test fige quel flux critique (DEBT-05, #33)
- 39 tests de caractérisation des 6 mini-jeux de `SkillCard.jsx` (DEBT-05, #32)
- `CHANGELOG.md` avec toutes les PR depuis le début (#31)
- `src/services/random.js` et `src/services/clock.js` : tout le hasard et l'heure du jeu passent par là. `setRandom()` et `setNow()` servent à les fixer dans les tests (DEBT-04, #29)
- `src/services/storage.js` : tous les accès au localStorage sont dans ce fichier (DEBT-02, #28)
- 11 tests sur le hasard, l'heure et le Phantom avec une fausse horloge (#29)
- 21 tests sur `storage.js` (#28)
- Tests de caractérisation de `src/utils` (#26)
- CI : quality gates avec une coverage minimum, 14 warnings ESLint max (dont la complexité) et 1,5 % de duplication max avec jscpd (#25)
- CI : pipeline sur chaque PR avec lint, format, tests + coverage et build (#24)
- Prettier pour formater le code (`npm run format`) (#23)
- Tests de caractérisation de la sauvegarde, de l'XP et des niveaux (#21)
- Vitest et la coverage (`npm test`, `npm run coverage`) (#4)
- `docs/DEBT.md` : carte du code (#2), items de dette, matrice et plan d'attaque (#3), mesures de départ (#22)
- README (#1)

### Modifié

- Seuils de coverage remontés à 63 % (lignes) et 58 % (branches) (#32)
- `docs/DEBT.md` v2 : diagramme des dépendances, explication de l'ordre et tableau avant/après (#30)
- `gameUtils.js`, `mobDisplayUtils.js`, `App.jsx` et `PhantomEvent.jsx` utilisent `services/` à la place de `Math.random` et `Date` (#29)
- `App.jsx` passe par `services/storage.js` et perd 50 lignes (#28)
- Seuils de coverage remontés à 51 % (lignes) et 46 % (branches) (#26)
- Tout le code est reformaté avec Prettier (#23)

### Corrigé

- Simon : une erreur au premier tour arrêtait le jeu sans Game Over ni bouton Retry (DEBT-20, #32)
- Une sauvegarde cassée dans le localStorage ne fait plus planter le jeu, il remet les noms par défaut (DEBT-03, #28)
- La release Windows (.exe) était créée à chaque push sur `main`, maintenant seulement sur un tag `v*` (DEBT-13, #27)

## [v1] - 2026-11-05

- Le jeu de départ, avant notre travail.
