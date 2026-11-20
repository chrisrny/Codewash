import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { random, randomInt, pickRandom, setRandom } from '../src/services/random.js';
import { now, getToday, setNow } from '../src/services/clock.js';
import { getRandomMob, generateMathProblem } from '../src/utils/gameUtils.js';
import { HOSTILE_MOBS } from '../src/constants/gameData.jsx';
import PhantomEvent from '../src/components/PhantomEvent.jsx';

// Tests du hasard et de l'horloge injectés (DEBT-04).
// Avec setRandom() et setNow(), les tests donnent toujours le même résultat.

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const FAKE_NOW = Date.UTC(2026, 10, 20, 12, 0, 0); // 20/11/2026 à midi

afterEach(() => {
    setRandom(null);
    setNow(null);
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('random', () => {
    it('utilise Math.random par défaut', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.42);
        expect(random()).toBe(0.42);
    });

    it('setRandom choisit le nombre tiré', () => {
        setRandom(() => 0.7);
        expect(random()).toBe(0.7);
    });

    it('randomInt donne min avec 0 et max avec presque 1', () => {
        setRandom(() => 0);
        expect(randomInt(3, 8)).toBe(3);
        setRandom(() => 0.999);
        expect(randomInt(3, 8)).toBe(8);
    });

    it('pickRandom donne le premier puis le dernier élément', () => {
        setRandom(() => 0);
        expect(pickRandom(['a', 'b', 'c'])).toBe('a');
        setRandom(() => 0.999);
        expect(pickRandom(['a', 'b', 'c'])).toBe('c');
    });
});

describe('clock', () => {
    it('utilise Date.now par défaut', () => {
        vi.useFakeTimers();
        vi.setSystemTime(FAKE_NOW);
        expect(now()).toBe(FAKE_NOW);
    });

    it('setNow choisit l heure', () => {
        setNow(FAKE_NOW);
        expect(now()).toBe(FAKE_NOW);
        expect(getToday()).toBe('2026-11-20');
    });
});

describe('le jeu avec le hasard fixé', () => {
    it('getRandomMob donne toujours le même mob', () => {
        setRandom(() => 0);
        expect(getRandomMob(null)).toBe(Object.keys(HOSTILE_MOBS)[0]);
        expect(getRandomMob(null)).toBe(Object.keys(HOSTILE_MOBS)[0]);
    });

    it('generateMathProblem donne toujours le même calcul', () => {
        setRandom(() => 0);
        const first = generateMathProblem(1);
        const second = generateMathProblem(1);
        expect(second).toEqual(first);
    });
});

describe('PhantomEvent avec une fausse horloge', () => {
    let root = null;

    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        setNow(FAKE_NOW);
        setRandom(() => 0);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        document.body.innerHTML = '';
    });

    async function renderPhantom() {
        const div = document.createElement('div');
        document.body.appendChild(div);
        root = createRoot(div);
        await act(async () => {
            root.render(<PhantomEvent battlingSkillId={null} onAwardLevel={() => {}} />);
        });
        return div;
    }

    it('apparaît tout de suite si le cooldown est passé, et note l heure', async () => {
        const div = await renderPhantom();
        expect(div.querySelector('img')).toBe(null);

        await act(async () => vi.advanceTimersByTime(1));

        expect(div.querySelector('img').alt).toBe('Phantom');
        expect(localStorage.getItem('phantomEvent_lastSpawn_v1')).toBe(String(FAKE_NOW));
    });

    it('attend la fin du cooldown de 5 minutes', async () => {
        // dernière apparition il y a 1 minute : il reste 4 minutes à attendre
        localStorage.setItem('phantomEvent_lastSpawn_v1', String(FAKE_NOW - 60 * 1000));
        const div = await renderPhantom();

        await act(async () => vi.advanceTimersByTime(4 * 60 * 1000 - 1));
        expect(div.querySelector('img')).toBe(null);

        await act(async () => vi.advanceTimersByTime(1));
        expect(div.querySelector('img').alt).toBe('Phantom');
    });

    it('disparaît après 8 secondes de vol', async () => {
        const div = await renderPhantom();
        await act(async () => vi.advanceTimersByTime(1));
        expect(div.querySelector('img')).not.toBe(null);

        await act(async () => vi.advanceTimersByTime(8000));
        expect(div.querySelector('img')).toBe(null);
    });
});
