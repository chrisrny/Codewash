import { describe, it, expect } from 'vitest';
import * as gameUtils from '../src/utils/gameUtils.js';

// Test de fumée : vérifie seulement que Vitest arrive à charger le vrai code du jeu.
// Les tests de caractérisation arrivent dans la branche test/utils.
describe('smoke', () => {
    it('charge src/utils/gameUtils.js', () => {
        expect(typeof gameUtils.calculateDamage).toBe('function');
    });
});
