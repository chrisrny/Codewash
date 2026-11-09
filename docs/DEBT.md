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

