# Stratégie de tests

Comment on teste CodeWash, et quel test protège quelle partie du jeu.

## 1. En bref

- Outils : [Vitest](https://vitest.dev/) avec jsdom (un faux navigateur avec `localStorage`, `document` et `window`), et la coverage avec v8.
- Les tests sont dans `tests/`, un fichier par partie du jeu. Il y en a 156 au 20/11.
- La CI lance `npm run coverage` sur chaque PR. Si un test casse ou si la coverage passe sous les seuils, on ne merge pas.

```bash
npm test            # lance tous les tests
npm run coverage    # tests + coverage (rapport dans coverage/index.html)
```

On a deux sortes de tests :

| Sorte                   | À quoi ça sert                                          | Exemples                                             |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Test de caractérisation | Figer ce que fait le vieux code **avant** de le refacto | `save.test.jsx`, `xp-levels.test.js`, `tests/utils/`, `tests/games/` |
| Test unitaire           | Tester le nouveau code qu'on écrit                      | `storage.test.js`, `random-clock.test.jsx`           |

La règle : **d'abord les tests, ensuite le refacto**. Un refacto ne doit changer le résultat d'aucun test. Si un test doit changer, c'est qu'on corrige un bug exprès, et la PR le dit avec le numéro DEBT.

## 2. C'est quoi un test de caractérisation

Le jeu a été codé par une IA, sans tests et sans doc. On ne sait pas toujours ce que le code est censé faire. Un test de caractérisation ne vérifie pas que le code est juste : il note ce que le code fait **aujourd'hui**, même si c'est bizarre. Si un refacto change ce comportement par erreur, le test casse tout de suite.

On les écrit en 3 étapes :

1. on choisit une entrée, par exemple une sauvegarde dans le localStorage ;
2. on lance le vrai code (on affiche le vrai `App`, sans le modifier) ;
3. on regarde le résultat et on l'écrit dans le `expect`.

### Exemple : DEBT-03, la sauvegarde cassée

Si les noms des profils dans le localStorage ne sont pas du JSON valide, le jeu faisait un `JSON.parse` sans `try/catch` et plantait au démarrage.

**Avant (PR #21)** : on a figé ce comportement, même si c'est un bug. Le test vérifiait que le jeu plante :

```js
it('noms de profils cassés : le jeu plante (DEBT-03)', async () => {
    localStorage.setItem('heroProfileNames_v1', '{pas du json');

    await expect(renderApp()).rejects.toThrow(SyntaxError);
});
```

**Après (PR #28)** : on a sorti le localStorage dans `src/services/storage.js`, avec un `try/catch`. Le comportement change exprès, donc on change le test, avec la même entrée :

```js
it('noms de profils cassés : le jeu ne plante plus et remet les noms par défaut', async () => {
    localStorage.setItem('heroProfileNames_v1', '{pas du json');

    await renderApp();

    expect(readSave('heroProfileNames_v1')).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
});
```

Les 7 autres tests de `save.test.jsx` n'ont pas bougé pendant ce refacto. C'est la preuve que la sauvegarde marche comme avant.

## 3. Les flux critiques et les tests qui les figent

| Flux                                | Fichier de test (nb de tests)               | Ce qui est figé                                                                 | Qui    |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| Sauvegarde et profils               | `tests/save.test.jsx` (9)                   | Partie neuve, relire une save, vieilles saves, saves cassées, dernier profil    | Arthur |
| Lecture et écriture du localStorage | `tests/storage.test.js` (21)                | Chaque clé du localStorage, valeurs par défaut, reset d'un profil               | Arthur |
| Format de la save (contrat)         | `tests/save-format.test.jsx` (3)            | Une save complète relue sans perte, les champs et les clés de `docs/SAVE_FORMAT.md` | Arthur |
| XP et niveaux                       | `tests/xp-levels.test.js` (10)              | XP pour passer un niveau, XP gagnée, mob / miniboss / boss, difficulté attendue | Arthur |
| Hasard et heure                     | `tests/random-clock.test.jsx` (11)          | Tirages fixés, le Phantom (apparition, cooldown, départ)                        | Arthur |
| Combat                              | `tests/utils/gameUtils.test.js` (28)        | Tirage des mobs, dégâts, vie, un mob meurt en 5 coups                           | Christ |
| Contenu des mini-jeux               | `tests/utils/gameUtils.test.js`             | Calculs, mots de lecture et d'écriture selon la difficulté                      | Christ |
| Succès                              | `tests/utils/achievementUtils.test.js` (17) | Déblocage, paliers, nouveaux succès                                             | Christ |
| Sons et musique                     | `tests/utils/soundManager.test.js` (15)     | Sons de l'interface et des mobs, musique de fond                                | Christ |
| Auras des mobs                      | `tests/utils/mobDisplayUtils.test.js` (2)   | Aura tirée et son adjectif                                                      | Christ |
| Les 6 mini-jeux (l'écran)           | `tests/games/SkillCard.test.jsx` (39)       | Maths, écriture, lecture, ménage, mémoire et Simon, joués comme un joueur : ce que la carte renvoie au jeu | Christ |

`tests/smoke.test.js` vérifie juste que Vitest marche.

## 4. Partie app (Arthur)

### `tests/save.test.jsx` : la sauvegarde vue par le jeu

C'est le flux le plus important : c'est la progression de l'enfant. Si elle casse, il perd tout.

On affiche le vrai `App` dans jsdom (`createRoot` + `act`), sans toucher à `App.jsx`. On remplit le localStorage avant, puis on regarde ce que le jeu a sauvegardé. Le son est remplacé par une fonction vide, parce que jsdom ne sait pas jouer de son.

Ce qui est figé :

- sans sauvegarde : 6 compétences au niveau 1, thème minecraft, profil 1, noms « Player 1 », « Player 2 », « Player 3 » ;
- une save est relue telle quelle (niveau, xp, difficulté, thème) ;
- une vieille save où il manque des champs est complétée ;
- le vieux format sans `skills` est relu et réécrit dans le nouveau ;
- le profil 1 reprend la très vieille clé `heroSkills_v23` sans la supprimer ;
- le jeu charge le dernier profil utilisé ;
- les saves cassées : voir DEBT-03 plus haut et la section 6.

### `tests/storage.test.js` : le module de sauvegarde

Tests unitaires de `src/services/storage.js`, créé en #28. Chaque fonction a un cas sans save et un cas avec une save. Les noms des profils, le statut parent et la save d'un profil ont aussi un cas avec une save cassée. On teste aussi le reset d'un profil et la vieille clé du profil 1. Coverage : 100 %.

### `tests/xp-levels.test.js` : XP et niveaux

Tests des fonctions de `gameUtils.js` qui calculent la progression : `getEncounterType`, `getExpectedDifficulty`, `calculateXPReward` et `calculateXPToLevel`. Les valeurs viennent du code actuel, on ne dit pas qu'elles sont bonnes. Par exemple : il faut 100 xp pour passer niveau 2, le niveau 10 est un miniboss, le niveau 20 un boss, le cycle recommence tous les 20 niveaux, et la difficulté ne dépasse pas 7.

### `tests/random-clock.test.jsx` : hasard et heure

Tests de `src/services/random.js` et `src/services/clock.js`, créés en #29. Avec `setRandom(() => 0)`, le hasard donne toujours le même résultat. Avec `setNow(...)`, on choisit l'heure. Ça permet de tester des choses impossibles avant :

- `getRandomMob` et `generateMathProblem` donnent toujours le même résultat ;
- le Phantom avec une fausse horloge (`vi.useFakeTimers`) : il apparaît si les 5 minutes de cooldown sont passées, il attend sinon, et il part après 8 secondes.

## 5. Partie utils et mini-jeux (Christ)

À compléter par Christ : ce que chaque fichier de `tests/utils/` et `tests/games/SkillCard.test.jsx` fige, et pourquoi.

## 6. Les comportements bizarres qu'on a figés exprès

Les tests de caractérisation figent aussi les bugs. On ne les corrige pas en douce pendant un refacto : on les note, puis on les corrige dans une PR à part qui change le test.

| Comportement                                                                    | Test                       | Suite                       |
| ------------------------------------------------------------------------------- | -------------------------- | --------------------------- |
| Noms de profils cassés : le jeu plantait                                        | `save.test.jsx`            | Corrigé en #28 (DEBT-03)    |
| Save d'un profil cassée : le jeu repart au niveau 1 et écrase l'ancienne save   | `save.test.jsx`            | Pas encore dans le registre |
| Une soustraction peut donner un résultat négatif                                | `gameUtils.test.js`, `SkillCard.test.jsx` | DEBT-17                     |
| Maîtrise sans aucune compétence = dernier palier (`Math.min()` vaut `Infinity`) | `achievementUtils.test.js` | Pas encore dans le registre |
| Son bloqué par le navigateur : l'erreur est avalée sans rien dire               | `soundManager.test.js`     | DEBT-08                     |
| Simon : une erreur au premier tour arrêtait le jeu, sans Game Over ni Retry      | `SkillCard.test.jsx`       | Corrigé en #32 (DEBT-20)    |
| Écriture : une mauvaise réponse n'est pas envoyée au jeu, donc pas de pénalité (en maths, si) | `SkillCard.test.jsx` | DEBT-21 |

## 7. Coverage

Mesurée avec `npm run coverage` le 20/11 :

| Fichier                                  | Lignes | Branches |
| ---------------------------------------- | ------ | -------- |
| Tout `src/`                              | 65,0 % | 60,9 %   |
| `src/services/` (storage, random, clock) | 100 %  | 100 %    |
| `src/components/skills/SkillCard.jsx`    | 91,2 % | 81,8 %   |
| `src/utils/gameUtils.js`                 | 88,1 % | 74,7 %   |
| `src/App.jsx`                            | 31,4 % | 33,7 %   |

Avec les tests des mini-jeux (#32), `SkillCard.jsx` est passé de 38,8 % à 91,2 % des lignes, et tout `src/` de 53,1 % à 64,9 %.

Les seuils de la CI sont dans `vitest.config.js` : 63 % pour les lignes, 62 % pour les statements, 58 % pour les branches et 57 % pour les fonctions. On les remonte quand la coverage monte, et on ne les baisse jamais.

### Code nouveau et code modifié

Le but : 100 % des lignes nouvelles et 80 % des lignes modifiées couvertes par des tests.

- Aujourd'hui, chaque nouveau fichier arrive avec ses tests dans la même PR. `storage.js`, `random.js` et `clock.js` sont à 100 %.
- Pour le prouver sur chaque PR, Christ ajoute dans la CI un calcul de la coverage des seules lignes touchées par la PR (tâche « Diff coverage »).

### Ce qui n'est pas encore bien testé

- `App.jsx` (31 %) : le combat et l'écran principal. Il va être découpé en composants, chacun avec ses tests.
- `MenuDrawer_old.jsx` (0 %) : jamais utilisé, il va être supprimé.
