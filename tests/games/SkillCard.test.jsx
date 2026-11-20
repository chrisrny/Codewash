import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SkillCard from '../../src/components/skills/SkillCard.jsx';
import { BASE_ASSETS, SKILL_DATA, THEME_CONFIG } from '../../src/constants/gameData';

// Tests de caractérisation des 6 mini-jeux de SkillCard.jsx (DEBT-05, avant le découpage DEBT-06).
// On affiche la carte comme le fait App.jsx, on clique et on tape comme un joueur,
// puis on regarde ce que la carte renvoie au jeu (onMathSubmit, onStartBattle...).
// Les minuteries (setTimeout) sont simulées avec vi.useFakeTimers : on avance le temps à la main.

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Faux Audio : jsdom ne joue pas de son, on garde juste la liste des sons demandés
class FakeAudio {
    static created = [];

    constructor(src) {
        this.src = src;
        FakeAudio.created.push(this);
    }

    play() {
        return Promise.resolve();
    }
}

const sounds = () => FakeAudio.created.map((audio) => audio.src);

let root = null;
let props = null;

const skill = (id) => SKILL_DATA.find((s) => s.id === id);

const makeProps = (id, overrides = {}) => ({
    config: skill(id),
    data: { level: 1, xp: 0, mobHealth: 60, mobMaxHealth: 60 },
    themeData: THEME_CONFIG.minecraft,
    isCenter: true,
    isBattling: true,
    mobName: 'Zombie',
    mobAura: null,
    challenge: null,
    isListening: false,
    spokenText: '',
    damageNumbers: [],
    onStartBattle: vi.fn(),
    onEndBattle: vi.fn(),
    onMathSubmit: vi.fn(),
    onMicClick: vi.fn(),
    difficulty: 1,
    setDifficulty: vi.fn(),
    unlockedDifficulty: 1,
    selectedBorder: null,
    borderColor: null,
    bossHealing: false,
    ...overrides,
});

async function render(id, overrides) {
    props = makeProps(id, overrides);
    const div = document.createElement('div');
    document.body.appendChild(div);
    root = createRoot(div);
    await act(async () => root.render(<SkillCard {...props} />));
}

async function rerender(overrides) {
    props = { ...props, ...overrides };
    await act(async () => root.render(<SkillCard {...props} />));
}

const text = () => document.body.textContent;
const button = (label) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(label));

async function click(element) {
    await act(async () => element.click());
}

// Taper dans un champ contrôlé par React : il faut passer par le setter natif puis envoyer "input"
async function type(input, value) {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    await act(async () => {
        setValue.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

async function wait(ms) {
    await act(async () => vi.advanceTimersByTime(ms));
}

beforeEach(() => {
    vi.useFakeTimers();
    FakeAudio.created = [];
    vi.stubGlobal('Audio', FakeAudio);
});

afterEach(async () => {
    if (root) {
        await act(async () => root.unmount());
        root = null;
    }
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('carte hors combat', () => {
    it('affiche le niveau, le mob et le bouton qui lance le combat', async () => {
        await render('math', { isBattling: false });
        expect(text()).toContain('Lvl 1');
        expect(text()).toContain('Zombie');
        await click(button(skill('math').actionName));
        expect(props.onStartBattle).toHaveBeenCalledTimes(1);
    });

    it('barre de vie en % de la vie max du mob', async () => {
        await render('math', { isBattling: false, data: { level: 1, xp: 0, mobHealth: 30, mobMaxHealth: 60 } });
        expect(text()).toContain('50%');
    });

    it('mob inconnu : affiche un Zombie à la place', async () => {
        await render('math', { isBattling: false, mobName: 'Cow' });
        expect(document.querySelector('img[alt="Zombie"]')).not.toBeNull();
    });

    it('pas de réglage de difficulté tant que la difficulté 2 est verrouillée', async () => {
        await render('math', { isBattling: false, unlockedDifficulty: 1 });
        expect(document.querySelector('img[alt^="Difficulty"]')).toBeNull();
    });

    it('réglage de difficulté : - et + restent entre 1 et la difficulté débloquée', async () => {
        await render('math', { isBattling: false, difficulty: 2, unlockedDifficulty: 3 });
        const [minus, plus] = document
            .querySelector('img[alt="Difficulty 2"]')
            .closest('.flex')
            .querySelectorAll('button');
        await click(minus);
        await click(plus);
        expect(props.setDifficulty.mock.calls).toEqual([[1], [3]]);

        await rerender({ difficulty: 3 });
        await click(plus);
        expect(props.setDifficulty).toHaveBeenLastCalledWith(3);
    });

    it('ménage : jamais de réglage de difficulté', async () => {
        await render('cleaning', { isBattling: false, unlockedDifficulty: 3, mobName: 'Chest' });
        expect(document.querySelector('img[alt^="Difficulty"]')).toBeNull();
    });
});

describe('carte en combat', () => {
    it("panneau d'infos : nom du mob avec son aura, compétence et niveau", async () => {
        await render('math', { mobAura: 'frost', challenge: { question: '1 + 1 = ?', answer: '2' } });
        expect(text()).toContain('Frozen Zombie');
        expect(text()).toContain('Level1');
    });

    it('cliquer à côté de la carte quitte le combat', async () => {
        await render('math', { challenge: { question: '1 + 1 = ?', answer: '2' } });
        await click(document.querySelector('.fixed.inset-0'));
        expect(props.onEndBattle).toHaveBeenCalledTimes(1);
    });

    it("barre d'XP : xp actuelle / xp pour passer le niveau", async () => {
        await render('math', {
            data: { level: 1, xp: 40, mobHealth: 60, mobMaxHealth: 60 },
            challenge: { question: '1 + 1 = ?', answer: '2' },
        });
        expect(text()).toContain('40 / 100');
    });
});

describe('maths', () => {
    const challenge = { question: '5 + 7 = ?', answer: '12' };

    it('affiche le calcul', async () => {
        await render('math', { challenge });
        expect(text()).toContain('5 + 7 = ?');
    });

    it('bonne réponse : envoyée dès que tous les chiffres sont tapés', async () => {
        await render('math', { challenge });
        const input = document.querySelector('input');
        await type(input, '1');
        expect(props.onMathSubmit).not.toHaveBeenCalled();
        await type(input, '12');
        expect(props.onMathSubmit).toHaveBeenCalledWith('12');
    });

    it('les lettres sont ignorées', async () => {
        await render('math', { challenge: { question: '3 + 4 = ?', answer: '7' } });
        await type(document.querySelector('input'), 'a7');
        expect(props.onMathSubmit).toHaveBeenCalledWith('7');
    });

    it('mauvaise réponse : WRONG envoyé, son d’erreur, champ bloqué 500 ms puis vidé', async () => {
        await render('math', { challenge });
        const input = document.querySelector('input');
        await type(input, '13');
        expect(props.onMathSubmit).toHaveBeenCalledWith('WRONG');
        expect(sounds()).toContain(BASE_ASSETS.audio.mismatch);
        expect(input.disabled).toBe(true);
        await wait(500);
        expect(input.disabled).toBe(false);
        expect(input.value).toBe('');
    });

    it('réponse négative (DEBT-17) : le signe - est accepté', async () => {
        await render('math', { challenge: { question: '0 - 1 = ?', answer: '-1' } });
        await type(document.querySelector('input'), '-1');
        expect(props.onMathSubmit).toHaveBeenCalledWith('-1');
    });
});

describe('écriture', () => {
    it("affiche les images de l'objet, avec un + entre deux images", async () => {
        await render('writing', { challenge: { question: 'Write', answer: 'TNTBED', images: ['a.png', 'b.png'] } });
        expect([...document.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual(
            expect.arrayContaining(['a.png', 'b.png'])
        );
        expect(text()).toContain('+');
    });

    it('bonne réponse : tapée en minuscules, envoyée en majuscules', async () => {
        await render('writing', { challenge: { question: 'Write', answer: 'CAT', images: ['cat.png'] } });
        await type(document.querySelector('input'), 'cat');
        expect(props.onMathSubmit).toHaveBeenCalledWith('CAT');
    });

    it('mot en deux parties : les espaces ne comptent pas', async () => {
        await render('writing', { challenge: { question: 'Write', answer: 'IRON GOLEM', images: ['golem.png'] } });
        await type(document.querySelector('input'), 'iron golem');
        expect(props.onMathSubmit).toHaveBeenCalledWith('IRONGOLEM');
    });

    it("mauvaise réponse : son d'erreur mais rien n'est envoyé au jeu (contrairement aux maths)", async () => {
        await render('writing', { challenge: { question: 'Write', answer: 'CAT', images: ['cat.png'] } });
        const input = document.querySelector('input');
        await type(input, 'dog');
        expect(props.onMathSubmit).not.toHaveBeenCalled();
        expect(sounds()).toContain(BASE_ASSETS.audio.mismatch);
        await wait(500);
        expect(input.value).toBe('');
    });
});

describe('lecture', () => {
    const challenge = { question: 'SUN', answer: 'SUN' };
    const wordBox = () => document.querySelector('.flex-1.bg-black\\/40');

    it('affiche le mot et l’état du micro', async () => {
        await render('reading', { challenge });
        expect(text()).toContain('SUN');
        expect(text()).toContain('Mic Off');
        expect(text()).toContain('Tap to Speak');
        await rerender({ isListening: true });
        expect(text()).toContain('Listening...');
    });

    it('le bouton micro et le bouton de secours appellent le jeu', async () => {
        await render('reading', { challenge });
        await click(button('Tap to Speak'));
        expect(props.onMicClick).toHaveBeenCalledTimes(1);
        await click(button('Skip / Manual Success'));
        expect(props.onMathSubmit).toHaveBeenCalledWith('SUN');
    });

    it('mot mal prononcé : la case tremble 500 ms', async () => {
        await render('reading', { challenge });
        await rerender({ spokenText: 'MOON' });
        expect(wordBox().className).toContain('animate-shake');
        await wait(500);
        expect(wordBox().className).not.toContain('animate-shake');
    });

    it('bon mot, homophone ou texte trop court : pas de tremblement', async () => {
        await render('reading', { challenge });
        for (const spokenText of ['SUN', 'SON', 'S']) {
            await rerender({ spokenText });
            expect(wordBox().className, spokenText).not.toContain('animate-shake');
        }
    });
});

describe('ménage', () => {
    const challenge = { question: 'Clean', answer: 'CLEANED' };

    it('Complete! ouvre la question parentale, la bonne réponse valide le combat', async () => {
        await render('cleaning', { mobName: 'Chest', challenge });
        await click(button('Complete!'));
        expect(text()).toContain('What is this?');
        const input = document.querySelector('input');
        await type(input, 'floppy disk');
        await click(button('Submit'));
        expect(props.onMathSubmit).toHaveBeenCalledWith('CLEANED');
        expect(text()).not.toContain('What is this?');
    });

    it('mauvaise réponse parentale : message d’erreur, rien n’est validé', async () => {
        await render('cleaning', { mobName: 'Chest', challenge });
        await click(button('Complete!'));
        await type(document.querySelector('input'), 'disk');
        await click(button('Submit'));
        expect(text()).toContain('Incorrect answer');
        expect(props.onMathSubmit).not.toHaveBeenCalled();
    });

    it('pas de panneau d’infos pendant le combat', async () => {
        await render('cleaning', { mobName: 'Chest', challenge });
        expect(text()).not.toContain('BATTLE');
    });
});

describe('mémoire', () => {
    const cards = () => [...document.querySelectorAll('.aspect-\\[2\\/3\\].cursor-pointer')];
    const face = (card) => card.querySelectorAll('img')[1].getAttribute('src');
    const flipped = () => cards().filter((card) => card.className.includes('rotate-y-180')).length;

    // Regroupe les cartes encore en jeu par image : { image: [carte, carte] }
    const pairs = () =>
        cards().reduce((acc, card) => {
            (acc[face(card)] ||= []).push(card);
            return acc;
        }, {});

    it('difficulté 1 : 3 paires, soit 6 cartes', async () => {
        await render('memory');
        expect(cards()).toHaveLength(6);
        expect(Object.values(pairs()).every((pair) => pair.length === 2)).toBe(true);
    });

    it('la difficulté change le nombre de paires (7 = 10 paires)', async () => {
        await render('memory', { difficulty: 7 });
        expect(cards()).toHaveLength(20);
    });

    it('toutes les paires trouvées : WIN envoyé au jeu', async () => {
        await render('memory');
        for (const [first, second] of Object.values(pairs())) {
            await click(first);
            await click(second);
            await wait(300);
        }
        expect(cards()).toHaveLength(0);
        expect(sounds().filter((src) => src === BASE_ASSETS.audio.match)).toHaveLength(3);
        await wait(500);
        expect(props.onMathSubmit).toHaveBeenCalledWith('WIN');
    });

    it('deux cartes différentes : son d’erreur, puis elles se retournent', async () => {
        await render('memory');
        const [pairA, pairB] = Object.values(pairs());
        await click(pairA[0]);
        await click(pairB[0]);
        expect(flipped()).toBe(2);
        await wait(300);
        expect(sounds()).toContain(BASE_ASSETS.audio.mismatch);
        await wait(500);
        expect(flipped()).toBe(0);
        expect(props.onMathSubmit).not.toHaveBeenCalled();
    });

    it("pendant qu'une paire est vérifiée, les autres clics sont ignorés", async () => {
        await render('memory');
        const [pairA, pairB, pairC] = Object.values(pairs());
        await click(pairA[0]);
        await click(pairB[0]);
        await click(pairC[0]);
        expect(flipped()).toBe(2);
    });

    it('recliquer sur une carte déjà retournée ne fait rien', async () => {
        await render('memory');
        const [pairA] = Object.values(pairs());
        await click(pairA[0]);
        await click(pairA[0]);
        expect(flipped()).toBe(1);
    });

    it('quitter le combat vide le plateau', async () => {
        await render('memory');
        await rerender({ isBattling: false });
        expect(cards()).toHaveLength(0);
    });
});

describe('motifs (Simon)', () => {
    const axolotl = (color) =>
        [...document.querySelectorAll('span')].find((s) => s.textContent === color).parentElement;

    // Difficulté 1, tour 1 : départ à 500 ms, allumé 800 ms, éteint 280 ms
    const SHOW_FIRST_ROUND = 1600;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    it('le nombre d’axolotls dépend de la difficulté (1 = 2, 7 = 8)', async () => {
        await render('patterns');
        expect(document.querySelectorAll('img[alt="Pink"], img[alt="Cyan"]')).toHaveLength(2);
        expect(document.querySelector('img[alt="Gold"]')).toBeNull();
        await act(async () => root.unmount());
        document.body.innerHTML = '';
        await render('patterns', { difficulty: 7 });
        expect(Object.keys(BASE_ASSETS.axolotls).every((c) => document.querySelector(`img[alt="${c}"]`))).toBe(true);
    });

    it('début : la séquence est montrée (Watch!), puis c’est au joueur', async () => {
        await render('patterns');
        expect(text()).toContain('Round: 0');
        expect(text()).toContain('Watch!');
        await wait(SHOW_FIRST_ROUND);
        expect(text()).toContain('Your turn!');
        expect(sounds()).toContain('assets/sounds/axolotl/c4.wav');
    });

    it('cliquer pendant que la séquence est montrée ne fait rien', async () => {
        await render('patterns');
        await click(axolotl('Pink'));
        await wait(SHOW_FIRST_ROUND);
        expect(text()).toContain('Round: 0');
    });

    it('séquence réussie : tour suivant et WIN avec des dégâts qui montent (2, puis 3)', async () => {
        await render('patterns');
        await wait(SHOW_FIRST_ROUND);
        Math.random.mockReturnValue(0.6); // prochain axolotl tiré : Cyan
        await click(axolotl('Pink'));
        expect(text()).toContain('Round: 1');
        await wait(300);
        expect(props.onMathSubmit).toHaveBeenLastCalledWith('WIN', 2);

        // La séquence garde Pink et ajoute Cyan
        await wait(5000);
        await click(axolotl('Pink'));
        await click(axolotl('Cyan'));
        await wait(300);
        expect(props.onMathSubmit).toHaveBeenLastCalledWith('WIN', 3);
        expect(text()).toContain('Round: 2');
    });

    it('difficulté 7 : chaque tour tire une séquence entièrement nouvelle, plus longue de 1', async () => {
        await render('patterns', { difficulty: 7 });
        await wait(1000);
        Math.random.mockReturnValue(0.99); // tous les tirages suivants : Black
        await click(axolotl('Pink'));
        await wait(5000);
        await click(axolotl('Black'));
        await click(axolotl('Black'));
        await wait(300);
        expect(props.onMathSubmit).toHaveBeenLastCalledWith('WIN', 3);
    });

    it('erreur après un tour réussi : Game Over et bouton Retry qui relance', async () => {
        await render('patterns');
        await wait(SHOW_FIRST_ROUND);
        await click(axolotl('Pink'));
        await wait(5000);
        await click(axolotl('Cyan'));
        expect(text()).toContain('Game Over! Rounds: 1');
        expect(sounds()).toContain(BASE_ASSETS.audio.mismatch);
        await click(button('Retry'));
        expect(text()).toContain('Round: 0');
        expect(text()).toContain('Watch!');
    });

    it('erreur au premier tour : Game Over et Retry permettent de recommencer', async () => {
        await render('patterns');
        await wait(SHOW_FIRST_ROUND);
        await click(axolotl('Cyan'));
        expect(text()).not.toContain('Your turn!');
        expect(text()).toContain('Game Over! Rounds: 0');
        await click(button('Retry'));
        expect(text()).toContain('Round: 0');
        expect(text()).toContain('Watch!');
        expect(props.onMathSubmit).not.toHaveBeenCalled();
    });
});
