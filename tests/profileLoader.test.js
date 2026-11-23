import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadSkills, loadTheme, loadStats } from '../src/utils/profileLoader.js';
import { setRandom } from '../src/services/random.js';
import { calculateMobHealth } from '../src/utils/gameUtils.js';
import { getDefaultStats } from '../src/utils/achievementUtils.js';
import { HOSTILE_MOBS, FRIENDLY_MOBS, MINIBOSS_MOBS, BOSS_MOBS } from '../src/constants/gameData.jsx';

// Tests de src/utils/profileLoader.js : la lecture de la save d'un profil.
// Avec setRandom(() => 0), chaque tirage donne le premier élément de la liste.

const FIRST_HOSTILE = Object.keys(HOSTILE_MOBS)[0];
const FIRST_FRIENDLY = Object.keys(FRIENDLY_MOBS)[0];
const FIRST_MINIBOSS = Object.keys(MINIBOSS_MOBS)[0];
const FIRST_BOSS = Object.keys(BOSS_MOBS)[0];

function setSave(profileId, save) {
    localStorage.setItem(`heroSkills_v23_p${profileId}`, JSON.stringify(save));
}

beforeEach(() => {
    localStorage.clear();
    setRandom(() => 0);
});

afterEach(() => {
    setRandom(null);
});

describe('loadSkills', () => {
    it('sans save : 6 compétences neuves au niveau 1', () => {
        const skills = loadSkills(1);

        expect(Object.keys(skills)).toEqual(['reading', 'math', 'writing', 'cleaning', 'memory', 'patterns']);
        expect(skills.math).toMatchObject({
            level: 1,
            xp: 0,
            difficulty: 1,
            earnedBadges: [],
            lostLevel: false,
            recoveryDifficulty: null,
            currentMiniboss: FIRST_MINIBOSS,
            currentBoss: FIRST_BOSS,
        });
        expect(skills.math.mobHealth).toBe(calculateMobHealth(1));
    });

    it('sans save : chaque carte a son mob et son aura, les autres restent à null', () => {
        const skills = loadSkills(1);

        expect(skills.math.mathMob).toBe(FIRST_HOSTILE);
        expect(skills.math.mathMobAura).toBe('rainbow');
        expect(skills.math.readingMob).toBe(null);
        expect(skills.memory.memoryMob).toBe(FIRST_FRIENDLY);
        expect(skills.memory.patternMobAura).toBe(null);
        expect(skills.cleaning.mathMob).toBe(null);
    });

    it('garde les valeurs de la save', () => {
        setSave(1, { skills: { math: { level: 12, xp: 30, difficulty: 2, mathMob: 'Creeper' } } });

        const skills = loadSkills(1);

        expect(skills.math).toMatchObject({ level: 12, xp: 30, difficulty: 2, mathMob: 'Creeper' });
        expect(skills.reading.level).toBe(1);
    });

    it('vieux format sans "skills" : les compétences sont à la racine', () => {
        setSave(2, { math: { level: 7 } });

        expect(loadSkills(2).math.level).toBe(7);
    });

    it('champs à null dans une vieille save : remplacés par les valeurs par défaut', () => {
        setSave(1, {
            skills: {
                math: {
                    level: 5,
                    difficulty: null,
                    earnedBadges: null,
                    mobHealth: null,
                    lostLevel: null,
                    mathMob: null,
                    mathMobAura: null,
                    currentMiniboss: null,
                    currentBoss: null,
                    currentMinibossAura: null,
                    currentBossAura: null,
                },
            },
        });

        const math = loadSkills(1).math;

        expect(math).toMatchObject({
            level: 5,
            difficulty: 1,
            earnedBadges: [],
            mobHealth: calculateMobHealth(1),
            lostLevel: false,
            mathMob: FIRST_HOSTILE,
            mathMobAura: 'rainbow',
            currentMiniboss: FIRST_MINIBOSS,
            currentBoss: FIRST_BOSS,
            currentMinibossAura: 'rainbow',
            currentBossAura: 'rainbow',
        });
    });

    it('difficulté 0 : la vie du mob est calculée comme en difficulté 1', () => {
        setSave(1, { skills: { math: { difficulty: 0, mobHealth: null } } });

        expect(loadSkills(1).math.mobHealth).toBe(calculateMobHealth(1));
    });

    it('mémoire : mob gentil. Mémoire et ménage : pas de miniboss ni de boss ajoutés', () => {
        setSave(1, {
            skills: {
                memory: { memoryMob: null, currentBoss: null },
                cleaning: { currentMiniboss: null },
                patterns: { patternMob: null },
            },
        });

        const skills = loadSkills(1);

        expect(skills.memory.memoryMob).toBe(FIRST_FRIENDLY);
        expect(skills.memory.currentBoss).toBe(null);
        expect(skills.cleaning.currentMiniboss).toBe(null);
        expect(skills.patterns.patternMob).toBe(FIRST_HOSTILE);
    });

    it('compétence inconnue : gardée, avec les champs de base et un boss', () => {
        setSave(1, { skills: { dance: { level: 3 } } });

        const dance = loadSkills(1).dance;

        expect(dance).toMatchObject({
            level: 3,
            difficulty: 1,
            earnedBadges: [],
            mobHealth: calculateMobHealth(1),
            lostLevel: false,
            recoveryDifficulty: null,
            currentBoss: FIRST_BOSS,
        });
        expect(dance.readingMob).toBe(undefined);
    });
});

describe('loadTheme', () => {
    it('minecraft sans save, ou sans thème dans la save', () => {
        expect(loadTheme(1)).toBe('minecraft');
        setSave(1, { skills: {} });
        expect(loadTheme(1)).toBe('minecraft');
    });

    it('relit le thème de la save', () => {
        setSave(2, { theme: 'spy' });

        expect(loadTheme(2)).toBe('spy');
    });
});

describe('loadStats', () => {
    it('stats à zéro sans save, ou sans stats dans la save', () => {
        expect(loadStats(1)).toEqual(getDefaultStats());
        setSave(1, { skills: {} });
        expect(loadStats(1)).toEqual(getDefaultStats());
    });

    it('complète des stats incomplètes', () => {
        setSave(1, { stats: { totalDeaths: 3 } });

        expect(loadStats(1)).toEqual({ ...getDefaultStats(), totalDeaths: 3 });
    });
});
