import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    getRandomMob,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomBoss,
    getMobForSkill,
    getDifficultyMultiplier,
    calculateDamage,
    calculateMobHealth,
    getReadingWord,
    generateMathProblem,
    getWordForDifficulty,
} from '../../src/utils/gameUtils.js';
import { FUNNY_LONG_WORDS, READING_WORDS, WRITING_DIFFICULTY_POOLS } from '../../src/constants/gameData';

// Tests de caractérisation de src/utils/gameUtils.js (l'XP et les niveaux sont dans tests/xp-levels.test.js).
// On fige le comportement actuel, bugs compris : un test qui dit "bug" décrit ce que le code fait aujourd'hui.
// Math.random est remplacé par une valeur fixe : 0 = premier élément d'une liste, 0.999 = dernier.

const random = (...values) => {
    const spy = vi.spyOn(Math, 'random');
    values.forEach((v) => spy.mockReturnValueOnce(v));
    return spy;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('tirage des mobs', () => {
    it('mob hostile : premier ou dernier de la liste selon le hasard', () => {
        random(0, 0.999);
        expect(getRandomMob()).toBe('Blaze');
        expect(getRandomMob()).toBe('Zombie');
    });

    it('mob hostile : jamais celui exclu', () => {
        random(0);
        expect(getRandomMob('Blaze')).toBe('Bogged');
    });

    it('mob gentil, miniboss et boss', () => {
        random(0, 0, 0.999);
        expect(getRandomFriendlyMob()).toBe('Allay');
        expect(getRandomMiniboss()).toBe('Creaking');
        expect(getRandomBoss()).toBe('Wither');
    });
});

describe('mob affiché selon la compétence', () => {
    it('ménage : un coffre par niveau, Shulker Box tous les 5, Ender Chest tous les 20', () => {
        const chestAt = (level) => getMobForSkill({ id: 'cleaning' }, { level });
        expect([1, 2, 3, 4, 6].map(chestAt)).toEqual(['Chest', 'Trapped Chest', 'Barrel', 'Bundle', 'Trapped Chest']);
        expect(chestAt(5)).toBe('Shulker Box');
        expect(chestAt(15)).toBe('Shulker Box');
        expect(chestAt(20)).toBe('Ender Chest');
        expect(chestAt(40)).toBe('Ender Chest');
    });

    it('ménage : pas de miniboss ni de boss aux niveaux 10 et 20', () => {
        expect(getMobForSkill({ id: 'cleaning' }, { level: 10 })).toBe('Shulker Box');
    });

    it('mémoire : garde le mob enregistré, sinon en tire un gentil', () => {
        expect(getMobForSkill({ id: 'memory' }, { level: 20, memoryMob: 'Cow' })).toBe('Cow');
        random(0);
        expect(getMobForSkill({ id: 'memory' }, { level: 1 })).toBe('Allay');
    });

    it('niveau 20 : le boss enregistré, sinon un boss au hasard', () => {
        expect(getMobForSkill({ id: 'math' }, { level: 20, currentBoss: 'Warden' })).toBe('Warden');
        random(0);
        expect(getMobForSkill({ id: 'math' }, { level: 20 })).toBe('Ender Dragon');
    });

    it('niveau 10 : le miniboss enregistré, sinon un miniboss au hasard', () => {
        expect(getMobForSkill({ id: 'reading' }, { level: 10, currentMiniboss: 'Ravager' })).toBe('Ravager');
        random(0);
        expect(getMobForSkill({ id: 'reading' }, { level: 10 })).toBe('Creaking');
    });

    it('compétences de combat : chacune lit son propre champ de mob', () => {
        const skill = { level: 1, readingMob: 'Witch', mathMob: 'Ghast', writingMob: 'Slime', patternMob: 'Evoker' };
        expect(getMobForSkill({ id: 'reading' }, skill)).toBe('Witch');
        expect(getMobForSkill({ id: 'math' }, skill)).toBe('Ghast');
        expect(getMobForSkill({ id: 'writing' }, skill)).toBe('Slime');
        expect(getMobForSkill({ id: 'patterns' }, skill)).toBe('Evoker');
        random(0);
        expect(getMobForSkill({ id: 'math' }, { level: 1 })).toBe('Blaze');
    });

    it("autre compétence : garde currentMob s'il est hostile, sinon en tire un", () => {
        expect(getMobForSkill({ id: 'other' }, { level: 1, currentMob: 'Spider' })).toBe('Spider');
        random(0.999);
        expect(getMobForSkill({ id: 'other' }, { level: 1, currentMob: 'Cow' })).toBe('Zombie');
    });
});

describe('dégâts et vie des mobs', () => {
    it('chaque difficulté multiplie par 3', () => {
        expect([1, 2, 3, 7].map(getDifficultyMultiplier)).toEqual([1, 3, 9, 729]);
    });

    it('les dégâts ne dépendent que de la difficulté, pas du niveau du joueur', () => {
        expect(calculateDamage(1, 1)).toBe(12);
        expect(calculateDamage(99, 1)).toBe(12);
        expect(calculateDamage(1, 3)).toBe(108);
    });

    it('un mob meurt toujours en 5 coups', () => {
        for (const difficulty of [1, 2, 3, 4, 5, 6, 7]) {
            expect(calculateMobHealth(difficulty)).toBe(5 * calculateDamage(1, difficulty));
        }
        expect(calculateMobHealth(1)).toBe(60);
    });
});

describe('mots de lecture', () => {
    it('la difficulté donne la longueur du mot (3 lettres en difficulté 1, 8 en 6)', () => {
        random(0, 0);
        expect(getReadingWord(1)).toBe(READING_WORDS[3][0]);
        expect(getReadingWord(6)).toBe(READING_WORDS[8][0]);
    });

    it('difficulté 7 : un mot long et drôle', () => {
        random(0);
        expect(getReadingWord(7)).toBe(FUNNY_LONG_WORDS[0]);
    });

    it('difficulté inconnue : comme la difficulté 1', () => {
        random(0);
        expect(getReadingWord(9)).toBe(READING_WORDS[3][0]);
    });
});

describe('problèmes de maths', () => {
    it('difficulté 1 : addition de deux chiffres entre 0 et 9', () => {
        random(0, 0, 0);
        expect(generateMathProblem(1)).toEqual({ type: 'math', question: '0 + 0 = ?', answer: '0' });
        random(0, 0.999, 0.999);
        expect(generateMathProblem(1)).toEqual({ type: 'math', question: '9 + 9 = ?', answer: '18' });
    });

    it('difficulté 3 : soustraction', () => {
        random(0.5, 0.999, 0);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '20 - 1 = ?', answer: '19' });
    });

    it('bug : la soustraction peut donner un résultat négatif quand le premier nombre vaut 0', () => {
        random(0.5, 0, 0);
        expect(generateMathProblem(3)).toEqual({ type: 'math', question: '0 - 1 = ?', answer: '-1' });
    });

    it('difficulté 4 : multiplication entre 1 et 10', () => {
        random(0.999, 0, 0.999);
        expect(generateMathProblem(4)).toEqual({ type: 'math', question: '1 × 10 = ?', answer: '10' });
    });

    it('difficulté 5 : division qui tombe juste', () => {
        random(0.999, 0.5, 0.5);
        expect(generateMathProblem(5)).toEqual({ type: 'math', question: '36 ÷ 6 = ?', answer: '6' });
    });

    it('difficulté 6 : priorités de calcul', () => {
        random(0);
        expect(generateMathProblem(6)).toEqual({
            type: 'math',
            question: '3 + 4 × 2 = ?',
            answer: '11',
            isPemdas: true,
        });
    });

    it('difficulté 7 : calcul cauchemar', () => {
        random(0);
        expect(generateMathProblem(7)).toEqual({
            type: 'math',
            question: '((25 - 10) × 4 + 18) ÷ 2 - 7 = ?',
            answer: '32',
            isNightmare: true,
        });
    });

    it('difficultés 6 et 7 : toutes les réponses écrites en dur sont justes', () => {
        const spy = vi.spyOn(Math, 'random');
        for (const difficulty of [6, 7]) {
            for (let i = 0; i < 25; i++) {
                spy.mockReturnValue(i / 25);
                const { question, answer } = generateMathProblem(difficulty);
                const expression = question.replace(' = ?', '').replace(/×/g, '*').replace(/÷/g, '/');
                expect(String(Function(`return ${expression}`)()), question).toBe(answer);
            }
        }
    });

    it('difficulté inconnue : comme la difficulté 1', () => {
        random(0, 0.999, 0.999);
        expect(generateMathProblem(42).question).toBe('9 + 9 = ?');
    });
});

describe("mots d'écriture", () => {
    it('renvoie le mot en majuscules avec son nom et son image', () => {
        random(0);
        const item = WRITING_DIFFICULTY_POOLS[1][0];
        expect(getWordForDifficulty(1)).toEqual({
            word: item.word.toUpperCase(),
            displayName: item.displayName,
            image: item.imagePath,
        });
    });

    it('difficultés 6 et 7 : même liste que la difficulté 5', () => {
        random(0, 0);
        const first = WRITING_DIFFICULTY_POOLS[5][0].word.toUpperCase();
        expect(getWordForDifficulty(6).word).toBe(first);
        expect(getWordForDifficulty(7).word).toBe(first);
    });

    it('difficulté inconnue : liste de la difficulté 1', () => {
        random(0);
        expect(getWordForDifficulty(0).word).toBe(WRITING_DIFFICULTY_POOLS[1][0].word.toUpperCase());
    });
});
