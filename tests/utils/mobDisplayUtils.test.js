import { describe, it, expect, vi, afterEach } from 'vitest';
import { AURA_ADJECTIVES, getRandomAura } from '../../src/utils/mobDisplayUtils.js';

// Tests de caractérisation de src/utils/mobDisplayUtils.js.

afterEach(() => {
    vi.restoreAllMocks();
});

describe('auras', () => {
    it('aura au hasard parmi les 8', () => {
        vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999);
        expect(getRandomAura()).toBe('rainbow');
        expect(getRandomAura()).toBe('nature');
    });

    it('chaque aura tirée a un adjectif', () => {
        const spy = vi.spyOn(Math, 'random');
        for (let i = 0; i < 8; i++) {
            spy.mockReturnValue(i / 8);
            expect(AURA_ADJECTIVES[getRandomAura()]).toBeTruthy();
        }
    });
});
