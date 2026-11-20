# Format de sauvegarde

Le contrat entre le jeu et ce qu'il garde dans le localStorage. Toutes les lectures et écritures passent par `src/services/storage.js` (DEBT-02).

**Règle : si on change ce format, on change ce fichier et `tests/save-format.test.jsx` dans la même PR.** Sinon le test casse. Et les saves des anciennes versions doivent toujours se lire (voir section 3).

## 1. Les clés du localStorage

`{N}` = numéro du profil (1, 2 ou 3).

| Clé                         | Contenu                                                                                                   | Si la clé n'existe pas             |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `currentProfile_v1`         | Numéro du profil actif, en texte (`"2"`)                                                                  | `1`                                |
| `heroProfileNames_v1`       | Nom de chaque profil : `{"1": "Léo", "2": "Player 2", "3": "Player 3"}`                                   | `Player 1`, `Player 2`, `Player 3` |
| `heroParentStatus_v1`       | Profil parent ou pas : `{"1": false, "2": true, "3": false}`                                              | `false` partout                    |
| `heroSkills_v23_p{N}`       | La save du profil N, en JSON (section 2)                                                                  | Partie neuve                       |
| `heroSkills_v23`            | Très vieille save, d'avant les profils. Lue seulement pour le profil 1 s'il n'a pas de save. Jamais écrite | Rien                               |
| `borderEffect_p{N}`         | Effet de bordure choisi (`"solid"`)                                                                       | `"solid"`                          |
| `borderColor_p{N}`          | Couleur de la bordure (`"#FFD700"`)                                                                       | `"#FFD700"`                        |
| `phantomEvent_lastSpawn_v1` | Heure de la dernière apparition du Phantom, en millisecondes                                              | `0`                                |

Le jeu réécrit la save au démarrage, puis à chaque changement (niveau, thème, stats, profil...).

Le reset d'un profil efface `heroSkills_v23_p{N}` (et `heroSkills_v23` pour le profil 1), et remet son nom et son statut parent par défaut. La bordure ne change pas.

## 2. La save d'un profil

```json
{
    "skills": { "reading": {}, "math": {}, "writing": {}, "cleaning": {}, "memory": {}, "patterns": {} },
    "theme": "minecraft",
    "stats": {}
}
```

### `skills` : une entrée par compétence

Les 6 compétences sont `reading`, `math`, `writing`, `cleaning`, `memory` et `patterns`. Chacune a les 22 champs suivants. Le jeu met `null` quand un champ ne sert pas à cette compétence.

| Champ                                                               | Type             | Sens                                                                                  |
| ------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `level`                                                             | nombre           | Niveau, commence à 1                                                                  |
| `xp`                                                                | nombre           | XP gagnée vers le niveau suivant                                                      |
| `difficulty`                                                        | nombre (1 à 7)   | Difficulté choisie                                                                    |
| `earnedBadges`                                                      | liste de nombres | Badges gagnés (paliers 1 à 7)                                                         |
| `mobHealth`, `mobMaxHealth`                                         | nombre           | Vie actuelle et vie max du mob en face                                                |
| `lostLevel`                                                         | booléen          | Le joueur est mort et a perdu un niveau                                               |
| `recoveryDifficulty`                                                | nombre ou `null` | Difficulté proposée pour récupérer le niveau perdu                                    |
| `currentMob`                                                        | texte            | Nom du mob en face (`"Zombie"`)                                                       |
| `currentMiniboss`, `currentBoss`                                    | texte            | Miniboss du niveau 10 et boss du niveau 20                                            |
| `currentMinibossAura`, `currentBossAura`                            | texte            | Leur aura (`"frost"`)                                                                 |
| `readingMob`, `mathMob`, `writingMob`, `patternMob`, `memoryMob`    | texte ou `null`  | Mob affiché sur la carte. Rempli seulement pour sa compétence (`mathMob` pour `math`) |
| `readingMobAura`, `mathMobAura`, `writingMobAura`, `patternMobAura` | texte ou `null`  | Aura de ce mob, pareil                                                                |

### `theme`

Texte : `"minecraft"`, `"kpop"`, `"pokemon"` ou `"spy"`.

### `stats` : les compteurs des succès

| Champ                                                                    | Type                        | Sens                                                                     |
| ------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| `phantomsCaught`                                                         | nombre                      | Phantoms attrapés                                                        |
| `totalMobsDefeated`, `totalMinibossesDefeated`, `totalBossesDefeated`    | nombre                      | Mobs, minibosses et boss battus                                          |
| `totalDeaths`                                                            | nombre                      | Morts du joueur                                                          |
| `uniqueMobsDefeated`, `uniqueMinibossesDefeated`, `uniqueBossesDefeated` | liste de textes             | Noms des mobs déjà battus, sans doublon                                  |
| `themeChanges`, `borderChanges`                                          | nombre                      | Changements de thème et de bordure                                       |
| `battlesThisSession`                                                     | nombre                      | Combats lancés. Malgré son nom, il est sauvegardé et jamais remis à zéro |
| `loginDates`                                                             | liste de dates `YYYY-MM-DD` | Jours où le jeu a été ouvert. Le jeu ajoute la date du jour au démarrage |
| `perfectMemoryGames`                                                     | nombre                      | Parties de mémoire sans erreur                                           |
| `achievementsUnlocked`                                                   | liste de textes             | Id des succès débloqués (`"first_steps"`)                                |

## 3. Ce que le jeu fait en lisant une save

Le jeu doit pouvoir relire les saves des anciennes versions. En lisant `heroSkills_v23_p{N}` :

- un champ manque dans une compétence : valeur par défaut (difficulté 1, pas de badge, vie du mob selon la difficulté, mobs et auras tirés au hasard) ;
- une compétence manque : elle repart au niveau 1 ;
- vieux format sans `skills` (les compétences directement à la racine) : la save est relue, puis réécrite au format de la section 2 ;
- `theme` manque : `"minecraft"` ;
- `stats` manquent ou sont incomplètes : complétées avec des 0 et des listes vides ;
- le profil 1 n'a pas de save : le jeu lit `heroSkills_v23`, sans l'effacer ;
- le JSON est cassé : partie neuve, et l'ancienne save est écrasée (comportement figé exprès, voir `docs/TESTS.md` section 6).

## 4. Les tests qui protègent ce contrat

| Test                         | Ce qu'il vérifie                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/save-format.test.jsx` | Une save complète est relue et réécrite sans rien perdre. La save écrite a exactement les champs de la section 2. Le jeu n'écrit que les clés de la section 1 |
| `tests/save.test.jsx`        | Les cas de la section 3 : pas de save, champs manquants, vieux format, très vieille clé, saves cassées                                                        |
| `tests/storage.test.js`      | Chaque fonction de `storage.js` : valeurs par défaut, saves cassées, reset d'un profil                                                                        |
