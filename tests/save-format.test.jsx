import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { setRandom } from '../src/services/random.js';
import { setNow } from '../src/services/clock.js';

// Test de régression du format de sauvegarde (contrat écrit dans docs/SAVE_FORMAT.md).
// Si ce test casse, c'est que le format a changé : il faut mettre la doc à jour
// et vérifier que les saves des joueurs se lisent encore.

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};

// Les clés que le jeu a le droit d'écrire (profil 1)
const KEYS = [
    'currentProfile_v1',
    'heroProfileNames_v1',
    'heroParentStatus_v1',
    'heroSkills_v23_p1',
    'borderEffect_p1',
    'borderColor_p1',
    'phantomEvent_lastSpawn_v1',
];

const SKILL_IDS = ['reading', 'math', 'writing', 'cleaning', 'memory', 'patterns'];

const SKILL_FIELDS = [
    'level',
    'xp',
    'difficulty',
    'earnedBadges',
    'mobHealth',
    'mobMaxHealth',
    'lostLevel',
    'recoveryDifficulty',
    'currentMob',
    'currentMiniboss',
    'currentBoss',
    'currentMinibossAura',
    'currentBossAura',
    'readingMob',
    'mathMob',
    'writingMob',
    'patternMob',
    'memoryMob',
    'readingMobAura',
    'mathMobAura',
    'writingMobAura',
    'patternMobAura',
];

const STATS_FIELDS = [
    'phantomsCaught',
    'totalMobsDefeated',
    'totalBossesDefeated',
    'totalMinibossesDefeated',
    'totalDeaths',
    'uniqueMobsDefeated',
    'uniqueBossesDefeated',
    'uniqueMinibossesDefeated',
    'themeChanges',
    'borderChanges',
    'battlesThisSession',
    'loginDates',
    'perfectMemoryGames',
    'achievementsUnlocked',
];

// Une compétence avec tous ses champs, comme le jeu l'écrit
function skill(values) {
    return {
        level: 1,
        xp: 0,
        difficulty: 1,
        earnedBadges: [],
        mobHealth: 5,
        mobMaxHealth: 5,
        lostLevel: false,
        recoveryDifficulty: null,
        currentMob: 'Zombie',
        currentMiniboss: 'Ravager',
        currentBoss: 'Warden',
        currentMinibossAura: 'frost',
        currentBossAura: 'lava',
        readingMob: null,
        mathMob: null,
        writingMob: null,
        patternMob: null,
        memoryMob: null,
        readingMobAura: null,
        mathMobAura: null,
        writingMobAura: null,
        patternMobAura: null,
        ...values,
    };
}

// La save complète d'un joueur qui a déjà bien joué
const FULL_SAVE = {
    skills: {
        reading: skill({ level: 3, xp: 40, readingMob: 'Skeleton', readingMobAura: 'shadow' }),
        math: skill({
            level: 12,
            xp: 130,
            difficulty: 2,
            earnedBadges: [1, 2],
            mobHealth: 9,
            mobMaxHealth: 15,
            mathMob: 'Creeper',
            mathMobAura: 'frost',
        }),
        writing: skill({
            level: 5,
            lostLevel: true,
            recoveryDifficulty: 1,
            writingMob: 'Spider',
            writingMobAura: 'plasma',
        }),
        cleaning: skill({ level: 7 }),
        memory: skill({ level: 2, memoryMob: 'Allay' }),
        patterns: skill({ level: 4, patternMob: 'Blaze', patternMobAura: 'rainbow' }),
    },
    theme: 'pokemon',
    stats: {
        phantomsCaught: 2,
        totalMobsDefeated: 31,
        totalBossesDefeated: 0,
        totalMinibossesDefeated: 1,
        totalDeaths: 1,
        uniqueMobsDefeated: ['Zombie', 'Creeper'],
        uniqueBossesDefeated: [],
        uniqueMinibossesDefeated: ['Ravager'],
        themeChanges: 1,
        borderChanges: 0,
        battlesThisSession: 4,
        loginDates: ['2026-11-18', '2026-11-20'],
        perfectMemoryGames: 0,
        achievementsUnlocked: ['first_steps'],
    },
};

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
    setNow(Date.UTC(2026, 10, 20, 12, 0, 0)); // 20/11/2026, déjà dans loginDates
    setRandom(() => 0);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
    await act(async () => root.unmount());
    root = null;
    document.body.innerHTML = '';
    setNow(null);
    setRandom(null);
    vi.restoreAllMocks();
});

describe('format de sauvegarde', () => {
    it('une save complète est relue et réécrite sans rien perdre', async () => {
        localStorage.setItem('heroSkills_v23_p1', JSON.stringify(FULL_SAVE));

        await renderApp();

        expect(readSave('heroSkills_v23_p1')).toEqual(FULL_SAVE);
    });

    it('la save écrite par le jeu a la forme de docs/SAVE_FORMAT.md', async () => {
        await renderApp();

        const save = readSave('heroSkills_v23_p1');
        expect(Object.keys(save)).toEqual(['skills', 'theme', 'stats']);
        expect(Object.keys(save.skills)).toEqual(SKILL_IDS);
        for (const id of SKILL_IDS) {
            expect(Object.keys(save.skills[id]).sort()).toEqual([...SKILL_FIELDS].sort());
        }
        expect(Object.keys(save.stats).sort()).toEqual([...STATS_FIELDS].sort());
        expect(typeof save.theme).toBe('string');
    });

    it("le jeu n'écrit que les clés listées dans la doc", async () => {
        await renderApp();

        const written = Object.keys(localStorage);
        expect(written).toContain('heroSkills_v23_p1');
        for (const key of written) {
            expect(KEYS).toContain(key);
        }
        expect(written).not.toContain('heroSkills_v23');
    });
});
