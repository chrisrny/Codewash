import { describe, it, expect } from 'vitest';
import {
    getDefaultStats,
    isAchievementUnlocked,
    getCurrentTier,
    getNextTier,
    getTierProgress,
    getNewlyUnlockedAchievements,
    getNewTierAchievements,
    addUniqueToArray,
    getAchievementDisplayName,
} from '../../src/utils/achievementUtils.js';

// Tests de caractérisation de src/utils/achievementUtils.js.
// Paliers de "phantom_hunter" (fantômes attrapés) : 5, 10, 15, 20, 25, 50, 75, 100.

const skills = (...levels) => Object.fromEntries(levels.map((level, i) => [`skill${i}`, { level }]));
const sixSkillsAtLevel1 = skills(1, 1, 1, 1, 1, 1);
const phantoms = (phantomsCaught) => ({ ...getDefaultStats(), phantomsCaught });

describe('stats par défaut', () => {
    it('tout à zéro, listes vides', () => {
        const stats = getDefaultStats();
        expect(stats.totalMobsDefeated).toBe(0);
        expect(stats.uniqueMobsDefeated).toEqual([]);
        expect(stats.achievementsUnlocked).toEqual([]);
        expect(Object.keys(stats)).toHaveLength(14);
    });

    it('un nouvel objet à chaque appel (pas de liste partagée)', () => {
        const a = getDefaultStats();
        a.uniqueMobsDefeated.push('Zombie');
        expect(getDefaultStats().uniqueMobsDefeated).toEqual([]);
    });
});

describe('succès débloqué', () => {
    it('succès simple : débloqué dès que sa condition est vraie', () => {
        const stats = getDefaultStats();
        expect(isAchievementUnlocked('first_steps', stats, sixSkillsAtLevel1)).toBe(false);
        stats.totalMobsDefeated = 1;
        expect(isAchievementUnlocked('first_steps', stats, sixSkillsAtLevel1)).toBe(true);
    });

    it('succès à paliers : débloqué au premier palier', () => {
        expect(isAchievementUnlocked('phantom_hunter', phantoms(4), {})).toBe(false);
        expect(isAchievementUnlocked('phantom_hunter', phantoms(5), {})).toBe(true);
    });

    it('succès inconnu : jamais débloqué', () => {
        expect(isAchievementUnlocked('nope', getDefaultStats(), {})).toBe(false);
    });
});

describe('paliers', () => {
    it('palier atteint : -1 avant le premier, puis index du plus haut atteint', () => {
        expect(getCurrentTier('phantom_hunter', phantoms(0), {})).toBe(-1);
        expect(getCurrentTier('phantom_hunter', phantoms(5), {})).toBe(0);
        expect(getCurrentTier('phantom_hunter', phantoms(24), {})).toBe(3);
        expect(getCurrentTier('phantom_hunter', phantoms(1000), {})).toBe(7);
    });

    it('succès simple ou inconnu : pas de palier', () => {
        expect(getCurrentTier('first_steps', getDefaultStats(), {})).toBe(-1);
        expect(getCurrentTier('nope', getDefaultStats(), {})).toBe(-1);
        expect(getNextTier('first_steps', getDefaultStats(), {})).toBeNull();
        expect(getTierProgress('first_steps', getDefaultStats(), {})).toBe(0);
    });

    it('palier suivant, null au dernier', () => {
        expect(getNextTier('phantom_hunter', phantoms(0), {})).toEqual({ level: 5, tierName: 'Bronze Ghost Buster' });
        expect(getNextTier('phantom_hunter', phantoms(7), {})).toEqual({ level: 10, tierName: 'Silver Ghost Buster' });
        expect(getNextTier('phantom_hunter', phantoms(100), {})).toBeNull();
    });

    it('progression en % vers le palier suivant, 100 au dernier', () => {
        expect(getTierProgress('phantom_hunter', phantoms(0), {})).toBe(0);
        expect(getTierProgress('phantom_hunter', phantoms(2), {})).toBe(40);
        expect(getTierProgress('phantom_hunter', phantoms(7), {})).toBe(40);
        expect(getTierProgress('phantom_hunter', phantoms(100), {})).toBe(100);
    });

    it('niveaux cumulés : somme des niveaux de toutes les compétences', () => {
        expect(getCurrentTier('combined_levels', getDefaultStats(), skills(50, 49))).toBe(-1);
        expect(getCurrentTier('combined_levels', getDefaultStats(), skills(50, 50))).toBe(0);
    });

    it('maîtrise : niveau de la compétence la plus basse', () => {
        expect(getCurrentTier('skill_mastery', getDefaultStats(), skills(80, 20, 99))).toBe(0);
        expect(getCurrentTier('skill_mastery', getDefaultStats(), skills(80, 19, 99))).toBe(-1);
    });

    it('bug : maîtrise sans aucune compétence = dernier palier (Math.min() vaut Infinity)', () => {
        expect(getCurrentTier('skill_mastery', getDefaultStats(), {})).toBe(7);
    });
});

describe('nouveaux succès', () => {
    it('liste les succès qui viennent de se débloquer', () => {
        const before = getDefaultStats();
        const after = { ...before, totalMobsDefeated: 1, totalDeaths: 1 };
        expect(getNewlyUnlockedAchievements(before, after, sixSkillsAtLevel1, sixSkillsAtLevel1)).toEqual([
            'first_steps',
            'ouch',
        ]);
    });

    it('un succès déjà débloqué ne revient pas', () => {
        const stats = { ...getDefaultStats(), totalMobsDefeated: 3 };
        expect(getNewlyUnlockedAchievements(stats, stats, sixSkillsAtLevel1, sixSkillsAtLevel1)).toEqual([]);
    });

    it('liste les succès à paliers qui ont monté de palier', () => {
        expect(getNewTierAchievements(phantoms(4), phantoms(5), sixSkillsAtLevel1, sixSkillsAtLevel1)).toEqual([
            { achievementId: 'phantom_hunter', tierIndex: 0 },
        ]);
        expect(getNewTierAchievements(phantoms(5), phantoms(9), sixSkillsAtLevel1, sixSkillsAtLevel1)).toEqual([]);
    });
});

describe('helpers', () => {
    it("ajoute une valeur à une liste seulement si elle n'y est pas", () => {
        const list = ['Zombie'];
        expect(addUniqueToArray(list, 'Creeper')).toEqual(['Zombie', 'Creeper']);
        expect(addUniqueToArray(list, 'Zombie')).toBe(list);
        expect(list).toEqual(['Zombie']);
    });

    it('nom affiché : nom du palier atteint, sinon nom du succès', () => {
        expect(getAchievementDisplayName('phantom_hunter', phantoms(0), {})).toBe('Ghost Buster');
        expect(getAchievementDisplayName('phantom_hunter', phantoms(12), {})).toBe('Silver Ghost Buster');
        expect(getAchievementDisplayName('first_steps', getDefaultStats(), {})).toBe('First Steps');
        expect(getAchievementDisplayName('nope', getDefaultStats(), {})).toBe('');
    });
});
