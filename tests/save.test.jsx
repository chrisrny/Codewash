import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';

// Tests de caractérisation de la sauvegarde (DEBT-02, DEBT-03).
// On ne touche pas à App.jsx : on remplit le localStorage, on affiche le jeu,
// puis on regarde ce que le jeu a sauvegardé.

// Dit à React qu'on est dans des tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom ne sait pas jouer de son, on remplace play() et pause()
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};

let root = null;

async function renderApp() {
    const div = document.createElement('div');
    document.body.appendChild(div);
    root = createRoot(div);
    await act(async () => {
        root.render(<App />);
    });
}

function readSave(key) {
    return JSON.parse(localStorage.getItem(key));
}

beforeEach(() => {
    localStorage.clear();
    // le jeu fait des console.warn quand il n'y a pas de save, on les cache
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
    if (root) {
        await act(async () => root.unmount());
        root = null;
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('sauvegarde', () => {
    it('sans sauvegarde : crée une partie neuve au niveau 1', async () => {
        await renderApp();

        const save = readSave('heroSkills_v23_p1');
        expect(Object.keys(save.skills)).toEqual(['reading', 'math', 'writing', 'cleaning', 'memory', 'patterns']);
        for (const skill of Object.values(save.skills)) {
            expect(skill.level).toBe(1);
            expect(skill.xp).toBe(0);
            expect(skill.difficulty).toBe(1);
        }
        expect(save.theme).toBe('minecraft');
        expect(localStorage.getItem('currentProfile_v1')).toBe('1');
        expect(readSave('heroProfileNames_v1')).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(readSave('heroParentStatus_v1')).toEqual({ 1: false, 2: false, 3: false });
    });

    it("garde le niveau, l'xp et le thème d'une sauvegarde", async () => {
        const old = { skills: { math: { level: 12, xp: 30, difficulty: 2 } }, theme: 'pokemon' };
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify(old));

        await renderApp();

        const save = readSave('heroSkills_v23_p1');
        expect(save.skills.math.level).toBe(12);
        expect(save.skills.math.xp).toBe(30);
        expect(save.skills.math.difficulty).toBe(2);
        expect(save.skills.reading.level).toBe(1);
        expect(save.theme).toBe('pokemon');
    });

    it('complète une vieille sauvegarde où il manque des champs', async () => {
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify({ skills: { math: { level: 5 } } }));

        await renderApp();

        const math = readSave('heroSkills_v23_p1').skills.math;
        expect(math.level).toBe(5);
        expect(math.xp).toBe(0);
        expect(math.difficulty).toBe(1);
        expect(math.earnedBadges).toEqual([]);
        expect(math.lostLevel).toBe(false);
        expect(math.recoveryDifficulty).toBe(null);
    });

    it('lit le vieux format sans "skills" et le réécrit dans le nouveau', async () => {
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify({ math: { level: 7, xp: 3 } }));

        await renderApp();

        const save = readSave('heroSkills_v23_p1');
        expect(save.skills.math.level).toBe(7);
        expect(save.skills.math.xp).toBe(3);
        expect(save.theme).toBe('minecraft');
    });

    it('profil 1 : reprend la très vieille clé heroSkills_v23 sans la supprimer', async () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ skills: { math: { level: 4 } } }));

        await renderApp();

        expect(readSave('heroSkills_v23_p1').skills.math.level).toBe(4);
        expect(localStorage.getItem('heroSkills_v23')).not.toBe(null);
    });

    it('charge le dernier profil utilisé', async () => {
        localStorage.setItem('currentProfile_v1', '2');
        localStorage.setItem('heroSkills_v23_p2', JSON.stringify({ skills: { math: { level: 9 } } }));

        await renderApp();

        expect(readSave('heroSkills_v23_p2').skills.math.level).toBe(9);
        expect(localStorage.getItem('heroSkills_v23_p1')).toBe(null);
    });

    it('sauvegarde cassée : le jeu repart au niveau 1 et écrase la save', async () => {
        localStorage.setItem('heroSkills_v23_p1', '{pas du json');

        await renderApp();

        const save = readSave('heroSkills_v23_p1');
        expect(save.skills.math.level).toBe(1);
        expect(save.theme).toBe('minecraft');
    });

    // Avant le refacto, ce test vérifiait que le jeu plantait (DEBT-03)
    it('noms de profils cassés : le jeu ne plante plus et remet les noms par défaut', async () => {
        localStorage.setItem('heroProfileNames_v1', '{pas du json');

        await renderApp();

        expect(readSave('heroProfileNames_v1')).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
    });

    it('statut parent cassé : le jeu ne plante plus non plus', async () => {
        localStorage.setItem('heroParentStatus_v1', '{pas du json');

        await renderApp();

        expect(readSave('heroParentStatus_v1')).toEqual({ 1: false, 2: false, 3: false });
    });
});
