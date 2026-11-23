# Traduction

Comment marchent les langues dans CodeWash, et comment en ajouter une.

## 1. Comment ça marche

- Tous les textes affichés sont dans `src/i18n/`, avec un fichier JSON par langue : `en.json`, `fr.json`...
- Dans le code, on n'écrit jamais un texte en dur. On appelle `t('clé')` :

```jsx
import { t } from '../../i18n';

<h2>{t('settings.title')}</h2>
<p>{t('loot.levelReached', { level: 20 })}</p>
```

- `src/i18n/index.js` trouve tout seul les fichiers JSON du dossier (avec `import.meta.glob` de Vite). Une nouvelle langue ne demande donc aucun changement de code.
- Si un texte manque dans une langue, le jeu affiche le texte anglais. S'il manque partout, il affiche la clé (par exemple `menu.titel`) : on voit tout de suite l'erreur.
- L'anglais est la langue par défaut.

## 2. Le format d'un fichier de langue

```json
{
  "_name": "English",
  "settings.title": "Settings",
  "loot.levelReached": "LEVEL {level} REACHED!"
}
```

- `_name` : le nom de la langue dans la liste du menu, écrit dans cette langue (`Français`, `Español`).
- Les clés : `écran.texte`. Elles sont les mêmes dans toutes les langues, seul le texte change.
- `{level}` : une valeur donnée par le code. On la garde telle quelle dans la traduction, mais on peut la déplacer dans la phrase.
- `reset.confirmWord` et `parent.answer` sont les mots que le joueur doit taper (`DELETE`, `FLOPPY DISK`). On peut les traduire (`SUPPRIMER`, `DISQUETTE`).

## 3. Ajouter une langue

1. Copier `src/i18n/en.json` en `src/i18n/xx.json`, où `xx` est le code de la langue (`fr`, `es`, `de`...).
2. Changer `_name`, puis traduire chaque texte. Ne pas toucher aux clés ni aux `{...}`.
3. Lancer `npm test`. Le test « chaque langue a tous les textes de en.json » dit quelle clé manque, ou quel `{param}` a été cassé.
4. Lancer le jeu avec `npm run dev` et vérifier les textes trop longs pour les boutons.

## 4. Ajouter un texte dans le jeu

1. Ajouter la clé dans `en.json`, et dans les autres langues.
2. Utiliser `t('ma.cle')` dans le composant.
3. Lancer `npm test` : il vérifie que toutes les langues ont la nouvelle clé.

## 5. Ce qui n'est pas encore traduit

Au 23/11, `t()` est utilisé dans `App.jsx`, les menus, les réglages et les popups. Il reste :

- les noms et descriptions des succès (`src/constants/achievements.js`) ;
- les compétences, les thèmes et les badges (`src/constants/gameData.jsx`) ;
- les mini-jeux (`SkillCard.jsx`) et les questions des défis dans `App.jsx` (`Simon Says!`, `Spell it!`...) ;
- les messages du micro. `Mic Off` sert aussi dans la logique de `SkillCard.jsx`, donc il sera traduit avec le service micro (DEBT-16) ;
- les mots des mini-jeux de lecture et d'écriture : il faudra une liste de mots par langue, et un micro qui écoute dans la langue choisie.

Ce qui reste en anglais exprès : les messages `console.error`, qui sont pour le développeur et pas pour le joueur.
