import { describe, it, expect } from 'vitest';
import {
    getEncounterType,
    getExpectedDifficulty,
    calculateXPReward,
    calculateXPToLevel,
} from '../src/utils/gameUtils.js';

// Tests de caractérisation de l'XP et des niveaux.
// Les valeurs viennent du code actuel. On ne dit pas qu'elles sont bonnes,
// on vérifie juste qu'elles ne bougent pas pendant le refacto.

describe('type de combat selon le niveau', () => {
    it('niveau 10 = miniboss, niveau 20 = boss, sinon mob normal', () => {
        expect(getEncounterType(1)).toBe('hostile');
        expect(getEncounterType(9)).toBe('hostile');
        expect(getEncounterType(10)).toBe('miniboss');
        expect(getEncounterType(11)).toBe('hostile');
        expect(getEncounterType(20)).toBe('boss');
    });

    it('le cycle recommence tous les 20 niveaux', () => {
        expect(getEncounterType(21)).toBe('hostile');
        expect(getEncounterType(30)).toBe('miniboss');
        expect(getEncounterType(40)).toBe('boss');
        expect(getEncounterType(200)).toBe('boss');
    });
});

describe('difficulté attendue', () => {
    it('monte de 1 tous les 20 niveaux', () => {
        expect(getExpectedDifficulty(1)).toBe(1);
        expect(getExpectedDifficulty(20)).toBe(1);
        expect(getExpectedDifficulty(21)).toBe(2);
        expect(getExpectedDifficulty(41)).toBe(3);
    });

    it('ne dépasse pas 7', () => {
        expect(getExpectedDifficulty(121)).toBe(7);
        expect(getExpectedDifficulty(200)).toBe(7);
    });
});

describe('xp', () => {
    it('niveau 1 : il faut 100 xp pour passer niveau 2', () => {
        expect(calculateXPToLevel(1, 1)).toBe(100);
    });

    it("l'xp demandée monte vite avec le niveau", () => {
        expect(calculateXPToLevel(1, 5)).toBe(114);
        expect(calculateXPToLevel(2, 21)).toBe(596);
        expect(calculateXPToLevel(3, 41)).toBe(3563);
        // énorme au niveau 200
        expect(calculateXPToLevel(7, 200)).toBe(68526276);
    });

    it('à la bonne difficulté : un mob tué = un niveau', () => {
        expect(calculateXPReward(1, 1)).toBe(calculateXPToLevel(1, 1));
        expect(calculateXPReward(2, 21)).toBe(calculateXPToLevel(2, 21));
        expect(calculateXPReward(3, 41)).toBe(calculateXPToLevel(3, 41));
    });

    it("plus dur que prévu : plus d'xp", () => {
        expect(calculateXPReward(2, 1)).toBe(300);
    });

    it("plus facile que prévu : moins d'xp", () => {
        expect(calculateXPReward(1, 21)).toBe(59);
    });

    it('sans niveau : ancien calcul', () => {
        expect(calculateXPReward(1)).toBe(100);
        expect(calculateXPReward(3)).toBe(900);
        expect(calculateXPToLevel(3)).toBe(900);
    });
});
