# Registre de dette technique

## 1. Carte du code

### Les fichiers principaux

| Fichier | Lignes | Rôle |
|---|---|---|
| `src/main.jsx` | 9 | Point d'entrée, lance `App` |
| `src/App.jsx` | 1492 | Presque tout : état du jeu, sauvegarde, combats, micro, menus |
| `src/components/skills/SkillCard.jsx` | 778 | Les 6 mini-jeux |
| `src/components/ui/GlobalStyles.jsx` | 1302 | Tout le CSS dans un seul composant |
| `src/components/PhantomEvent.jsx` | 150 | Événement aléatoire (Phantom) |
| `src/components/drawers/` | | Menus : principal, cosmétiques, paramètres |
| `src/components/modals/` | | Popups : reset, bug report (vide pour l'instant) |
| `src/constants/gameData.jsx` | 416 | Données : thèmes, compétences, mobs, mots |
| `src/constants/achievements.js` | 318 | Liste des succès |
| `src/utils/gameUtils.js` | 363 | Calculs : dégâts, XP, mobs aléatoires, problèmes de maths |
| `src/utils/achievementUtils.js` | 217 | Déblocage des succès |
| `src/utils/soundManager.js` | 287 | Musique et sons |
| `electron/main.cjs` | 54 | Fenêtre desktop, charge `dist/index.html` |

### Qui appelle quoi

```
main.jsx
 └── App.jsx
      ├── GlobalStyles, SafeImage, PixelHeart, AchievementToast
      ├── MenuDrawer, CosmeticsDrawer, SettingsDrawer -> ProfileCard
      ├── ResetModal, BugReportModal
      ├── SkillCard -> soundManager, gameUtils, mobDisplayUtils, gameData
      ├── PhantomEvent -> soundManager, gameData
      ├── gameUtils -> gameData
      ├── achievementUtils -> achievements
      └── soundManager
```

### Où est l'état

- Presque tout est dans `App.jsx` : 32 `useState` (profil, compétences, XP, stats, thème, volume, menus...).
- `SkillCard.jsx` a 17 `useState` pour les mini-jeux.
- Pas de Context ni de store : tout passe en props depuis `App.jsx`.

### Où sont les I/O

| I/O | Où | Détail |
|---|---|---|
| Sauvegarde (localStorage) | `App.jsx` (27 appels), `PhantomEvent.jsx` (2) | Clés : `heroSkills_v23_p{profil}`, `currentProfile_v1`, `heroProfileNames_v1`, `heroParentStatus_v1`, `borderEffect_p{profil}`, `borderColor_p{profil}`, `phantomEvent_lastSpawn_v1` |
| Sons | `soundManager.js`, mais aussi `SkillCard.jsx` (12 `new Audio` / `play()` en direct) | Les sons ne passent pas tous par le manager |
| Micro | `App.jsx` (`webkitSpeechRecognition`) | Jeu de lecture, Chrome seulement |
| Réseau | aucun | |
| Hasard | `Math.random` : `gameUtils.js` (23), `SkillCard.jsx` (5), `PhantomEvent.jsx` (3), autres (3) | Difficile à tester |
| Temps | `setTimeout` / `setInterval` : `App.jsx` (13), `SkillCard.jsx` (12), `PhantomEvent.jsx` (3). `Date.now` dans `App.jsx`, `PhantomEvent.jsx`, `achievementUtils.js` | Difficile à tester |

### Code mort

- `src/components/drawers/MenuDrawer_old.jsx` : importé nulle part
- `src/constants/assets.js` : importé nulle part
- `src/assets/react.svg` : reste du template Vite, pas utilisé

## 2. Mesures de départ

Mesurées le 16/11/2026 sur `dev` (commit `a0f8772`), avant tout refacto.

### Comment refaire les mesures

| Mesure | Outil | Commande |
|---|---|---|
| Taille des fichiers | wc | `find src -name '*.js' -o -name '*.jsx' \| xargs wc -l \| sort -rn` |
| Coverage | Vitest + @vitest/coverage-v8 | `npm run coverage` |
| Complexité cyclomatique | ESLint, règle `complexity` | `npx eslint src --rule '{"complexity": ["warn", 10]}'` |
| Duplication | jscpd | `npx jscpd src` |
| Lint | ESLint | `npm run lint` |

### Taille des fichiers

24 fichiers JS/JSX dans `src/`, 6938 lignes en tout. Les 3 plus gros font la moitié du code.

| Fichier | Lignes |
|---|---|
| `App.jsx` | 1492 |
| `GlobalStyles.jsx` | 1302 |
| `SkillCard.jsx` | 778 |
| `gameData.jsx` | 416 |
| `gameUtils.js` | 363 |
| `CosmeticsDrawer.jsx` | 322 |

### Coverage

- Projet reçu : 0 %, il n'y avait aucun test.
- Avec nos 19 tests de caractérisation : 45,9 % des lignes (43,3 % statements, 40,3 % branches, 38,1 % fonctions).
- Fichiers importants : `App.jsx` 34 %, `SkillCard.jsx` 45 %, `gameUtils.js` 50 %, `soundManager.js` 41 %.

### Complexité cyclomatique

On prend 10 comme limite. 14 fonctions la dépassent : 5 dans `App.jsx`, 2 dans `SkillCard.jsx`, 2 dans `CosmeticsDrawer.jsx`, 2 dans `gameUtils.js`, 1 dans `MenuDrawer.jsx`, `MobWithAura.jsx` et `ProfileCard.jsx`.

Les 5 pires :

| Où | Fonction | Complexité |
|---|---|---|
| `SkillCard.jsx` l.65 | le composant `SkillCard` | 107 |
| `App.jsx` l.94 | le `forEach` de `loadSkills` | 31 |
| `MenuDrawer.jsx` l.142 | l'affichage des succès | 27 |
| `App.jsx` l.569 | le `setSkills` de `handleSuccessHit` | 24 |
| `CosmeticsDrawer.jsx` l.108 | l'affichage des bordures | 21 |

### Duplication

2,53 % de lignes dupliquées (144 lignes), 6 clones trouvés par jscpd. Le plus gros clone (78 lignes) est entre `MenuDrawer.jsx` et `MenuDrawer_old.jsx`, le vieux fichier pas utilisé (DEBT-12).

### Lint

ESLint : 0 erreur, 0 warning avec la config de base du template Vite.

## 3. Liste de la dette

| ID | Fichier | Problème | Impact | Risque | Effort | Priorité | Statut |
|---|---|---|---|---|---|---|---|
| DEBT-01 | App.jsx | Fichier trop gros (1492 lignes, 32 useState), il fait tout | Haut | Haut | 3 jours | 1 | À faire |
| DEBT-02 | App.jsx, PhantomEvent.jsx | localStorage utilisé partout directement | Haut | Haut | 1 jour | 1 | À faire |
| DEBT-03 | App.jsx (l.51-52) | JSON.parse sans try/catch, une save cassée fait crash le jeu | Haut | Moyen | 1h | 1 | À faire |
| DEBT-04 | gameUtils.js, SkillCard.jsx... | Math.random, Date.now et setTimeout en dur, dur à tester | Moyen | Haut | 1 jour | 1 | À faire |
| DEBT-05 | tout le projet | Pas de tests, pas de CI | Haut | Haut | 2 jours | 1 | En cours |
| DEBT-06 | SkillCard.jsx | 778 lignes, les 6 mini-jeux dans le même fichier | Haut | Moyen | 3 jours | 2 | À faire |
| DEBT-07 | SkillCard.jsx | Des sons joués sans passer par soundManager | Moyen | Moyen | 2h | 2 | À faire |
| DEBT-08 | soundManager.js, SkillCard.jsx | Erreurs de son ignorées (.catch vide) | Bas | Moyen | 1h | 3 | À faire |
| DEBT-09 | GlobalStyles.jsx | 1302 lignes de CSS dans un fichier JS | Moyen | Bas | 1 jour | 3 | À faire |
| DEBT-10 | gameData.jsx | Thème Spy avec le fond Minecraft + 4 images qui n'existent pas | Moyen | Haut | 2h | 2 | À faire |
| DEBT-11 | gameData.jsx | Noms Minecraft en dur, les thèmes ne changent pas tout | Moyen | Haut | 1 jour | 2 | À faire |
| DEBT-12 | MenuDrawer_old.jsx, assets.js, react.svg | Fichiers pas utilisés | Bas | Bas | 30 min | 3 | À faire |
| DEBT-13 | build-exe.yml | Une release est créée à chaque push sur main | Moyen | Moyen | 1h | 2 | À faire |
| DEBT-14 | package.json | 31 vulnérabilités npm et vieilles dépendances | Moyen | Moyen | 1 jour | 2 | À faire |
| DEBT-15 | BugReportModal.jsx | Le bouton bug report ne fait rien | Moyen | Haut | 1 jour | 2 | À faire |
| DEBT-16 | App.jsx (micro) | Le micro marche que sur Chrome | Moyen | Moyen | 1 jour | 3 | À faire |

## 4. Matrice de risque

| Impact / Probabilité | Basse | Moyenne | Haute |
|---|---|---|---|
| Haut | | 03, 06 | 01, 02, 05 |
| Moyen | 09 | 07, 13, 14, 16 | 04, 10, 11, 15 |
| Bas | 12 | 08 | |

## 5. Plan d'attaque

1. Tests et CI d'abord (DEBT-05, DEBT-13) : sans tests on ne voit pas si on casse quelque chose.
2. La sauvegarde (DEBT-03, DEBT-02) : c'est ce qui peut casser le plus facilement.
3. Le hasard et le temps (DEBT-04) : pour pouvoir tester les jeux.
4. Découper App.jsx et SkillCard.jsx (DEBT-01, DEBT-06) : toutes les features passent par ces fichiers.
5. Le reste du nettoyage (DEBT-07, 08, 09, 12).
6. Avec les features : thèmes (DEBT-10, 11) et bug report (DEBT-15).
7. Les dépendances à la fin (DEBT-14), parce que ça peut tout casser.
8. DEBT-16 : on ne le fait pas, on le laisse en dette.