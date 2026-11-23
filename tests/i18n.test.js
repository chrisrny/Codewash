import { describe, it, expect, afterEach } from 'vitest';
import { t, setLanguage, getLanguage, getLanguages, LANGUAGES } from '../src/i18n/index.js';

// Tests de src/i18n/index.js : la fonction t() et le choix de la langue.
// Pour tester une 2e langue sans fichier, on en ajoute une fausse ('test') le temps d'un test.

afterEach(() => {
    delete LANGUAGES.test;
    setLanguage('en');
});

function params(text) {
    return (text.match(/\{\w+\}/g) || []).sort();
}

describe('t', () => {
    it('donne le texte anglais par défaut', () => {
        expect(getLanguage()).toBe('en');
        expect(t('settings.title')).toBe('Settings');
    });

    it('remplace les {params} par les valeurs données', () => {
        expect(t('loot.levelReached', { level: 20 })).toBe('LEVEL 20 REACHED!');
        expect(t('menu.tierTooltip', { title: 'Gold', level: 60 })).toBe('Gold (Lvl 60)');
    });

    it('texte de la langue choisie, ou anglais s il manque dans cette langue', () => {
        LANGUAGES.test = { _name: 'Test', 'settings.title': 'Réglages' };
        setLanguage('test');

        expect(t('settings.title')).toBe('Réglages');
        expect(t('settings.music')).toBe('Music Volume');
    });

    it('clé inconnue partout : affiche la clé, pour la voir tout de suite', () => {
        expect(t('pas.une.cle')).toBe('pas.une.cle');
    });
});

describe('setLanguage et getLanguages', () => {
    it('une langue qui n existe pas ne change rien', () => {
        setLanguage('xx');

        expect(getLanguage()).toBe('en');
    });

    it('liste les langues avec leur nom, pour le menu', () => {
        expect(getLanguages()).toContainEqual({ code: 'en', name: 'English' });
    });
});

describe('fichiers de langue', () => {
    it('chaque langue a tous les textes de en.json, avec les mêmes {params}', () => {
        for (const code in LANGUAGES) {
            for (const key in LANGUAGES.en) {
                expect(LANGUAGES[code][key], `${code}.json : ${key}`).toBeTypeOf('string');
                expect(params(LANGUAGES[code][key]), `${code}.json : ${key}`).toEqual(params(LANGUAGES.en[key]));
            }
        }
    });
});
