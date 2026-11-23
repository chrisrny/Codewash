// Système de langues du jeu.
// Chaque langue est un fichier JSON dans ce dossier : en.json, fr.json...
// Ajouter une langue = ajouter un fichier, sans toucher au code (voir docs/TRADUCTION.md).
const files = import.meta.glob('./*.json', { eager: true, import: 'default' });

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = {};

for (const path in files) {
    const code = path.replace('./', '').replace('.json', '');
    LANGUAGES[code] = files[path];
}

let current = DEFAULT_LANGUAGE;

export function setLanguage(code) {
    if (LANGUAGES[code]) current = code;
}

export function getLanguage() {
    return current;
}

// Pour la liste du menu : [{ code: 'en', name: 'English' }, ...]
export function getLanguages() {
    return Object.keys(LANGUAGES).map((code) => ({ code, name: LANGUAGES[code]._name }));
}

// t('settings.title') ou t('loot.levelReached', { level: 20 }) avec "LEVEL {level} REACHED!" dans le JSON.
// Si le texte manque dans la langue, on prend l'anglais. S'il manque partout, on affiche la clé.
export function t(key, params = {}) {
    let text = LANGUAGES[current][key] ?? LANGUAGES[DEFAULT_LANGUAGE][key] ?? key;
    for (const name in params) {
        text = text.replaceAll(`{${name}}`, params[name]);
    }
    return text;
}
