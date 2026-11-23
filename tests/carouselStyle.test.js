import { describe, it, expect } from 'vitest';
import { getCardStyle } from '../src/utils/carouselStyle.js';

// Tests de src/utils/carouselStyle.js : la place des 7 cartes du carrousel.
// Les valeurs viennent de l'ancien code d'App.jsx, avant le refacto.

describe('getCardStyle', () => {
    it('carte du centre : en haut, plus grande, nette, devant les autres', () => {
        expect(getCardStyle(0, false, false)).toEqual({
            transform: 'translateX(0px) translateY(-55px) rotateX(0deg) scale(1.1)',
            opacity: 1,
            zIndex: 20,
            filter: 'none',
            cursor: 'default',
            transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        });
    });

    it('cartes à côté (±1) : un peu plus bas, sombres et cliquables', () => {
        expect(getCardStyle(1, false, false)).toMatchObject({
            transform: 'translateX(320px) translateY(-30px) rotateX(-4deg) scale(0.85)',
            opacity: 0.6,
            zIndex: 9,
            filter: 'brightness(0.5) blur(1px)',
            cursor: 'pointer',
        });
        expect(getCardStyle(-1, false, false).transform).toBe(
            'translateX(-320px) translateY(-30px) rotateX(-4deg) scale(0.85)'
        );
    });

    it('cartes du bord (±2) : encore plus bas et plus transparentes', () => {
        expect(getCardStyle(-2, false, false)).toMatchObject({
            transform: 'translateX(-640px) translateY(20px) rotateX(-8deg) scale(0.85)',
            opacity: 0.3,
            zIndex: 8,
        });
    });

    it("cartes cachées (±3) : invisibles, elles servent à l'animation", () => {
        expect(getCardStyle(3, false, false)).toMatchObject({
            transform: 'translateX(960px) translateY(75px) rotateX(-12deg) scale(0.85)',
            opacity: 0,
            zIndex: 7,
        });
    });

    it('pendant un combat : la carte qui se bat passe devant tout', () => {
        expect(getCardStyle(0, true, true).zIndex).toBe(50);
    });

    it('pendant un combat : les autres cartes ne sont plus cliquables', () => {
        expect(getCardStyle(1, false, true).cursor).toBe('default');
        expect(getCardStyle(-2, false, true).cursor).toBe('default');
    });
});
