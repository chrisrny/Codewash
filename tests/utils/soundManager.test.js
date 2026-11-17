import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Tests de caractérisation de src/utils/soundManager.js.
// Audio est remplacé par un faux qui enregistre ce qu'on lui demande de jouer (jsdom ne joue pas de son).
// Le module garde un état global (volume, instance BGM) : on le recharge avant chaque test.

class FakeAudio {
    static created = [];

    constructor(src) {
        this.src = src;
        this.volume = 1;
        this.plays = 0;
        this.paused = false;
        this.listeners = {};
        FakeAudio.created.push(this);
    }

    play() {
        this.plays += 1;
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
    }

    addEventListener(event, callback) {
        this.listeners[event] = callback;
    }
}

let sound;

beforeEach(async () => {
    FakeAudio.created = [];
    vi.stubGlobal('Audio', FakeAudio);
    vi.resetModules();
    sound = await import('../../src/utils/soundManager.js');
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

const lastAudio = () => FakeAudio.created.at(-1);

describe("sons de l'interface", () => {
    it('chaque raccourci joue son fichier', () => {
        const cases = [
            [sound.playClick, 'click'],
            [sound.playActionCardLeft, 'actioncard_left'],
            [sound.playActionCardRight, 'actioncard_right'],
            [sound.playDeath, 'death'],
            [sound.playFail, 'fail'],
            [sound.playLevelUp, 'levelup'],
            [sound.playNotification, 'notification'],
            [sound.playSuccessfulHit, 'successful_hit'],
            [sound.playAchievement, 'notification'],
        ];
        for (const [play, name] of cases) {
            play();
            expect(lastAudio().src).toBe(`assets/sounds/ui/${name}.wav`);
            expect(lastAudio().plays).toBe(1);
        }
    });

    it('volume des effets : 0.5 par défaut, modifiable', () => {
        expect(sound.getSfxVolume()).toBe(0.5);
        sound.playClick();
        expect(lastAudio().volume).toBe(0.5);
        sound.setSfxVolume(0.2);
        sound.playClick();
        expect(lastAudio().volume).toBe(0.2);
    });

    it('son inconnu : rien ne se passe', () => {
        sound.playUISound('nope');
        expect(FakeAudio.created).toHaveLength(0);
    });

    it('lecture bloquée par le navigateur : erreur avalée sans rien dire (DEBT-08)', async () => {
        vi.spyOn(FakeAudio.prototype, 'play').mockRejectedValue(new Error('autoplay bloqué'));
        expect(() => sound.playClick()).not.toThrow();
        await Promise.resolve();
    });
});

describe('sons des mobs', () => {
    it('blessure et mort : dossier du mob, fichier standard', () => {
        sound.playMobHurt('Zombie');
        expect(lastAudio().src).toBe('assets/sounds/mob/zombie/hurt.wav');
        sound.playMobDeath('Magma Cube');
        expect(lastAudio().src).toBe('assets/sounds/mob/magmacube/death.wav');
        expect(lastAudio().volume).toBe(0.5);
    });

    it('nom affiché différent du dossier', () => {
        sound.playMobHurt('Enderman');
        expect(lastAudio().src).toBe('assets/sounds/mob/endermen/hurt.wav');
        sound.playMobHurt('Bunny');
        expect(lastAudio().src).toBe('assets/sounds/mob/rabbit/hurt.wav');
    });

    it('mob sans son connu : rien ne se passe', () => {
        sound.playMobHurt('Herobrine');
        sound.playMobDeath('Allay');
        expect(FakeAudio.created).toHaveLength(0);
    });
});

describe('musique de fond', () => {
    it('une seule instance partagée', () => {
        expect(sound.getBGMManager()).toBe(sound.getBGMManager());
    });

    it('lecture : piste au hasard, volume 0.3', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const bgm = sound.getBGMManager();
        bgm.play();
        expect(lastAudio().src).toBe('assets/sounds/bgm/calm1.wav');
        expect(lastAudio().volume).toBe(0.3);
        expect(bgm.isPlaying).toBe(true);
    });

    it('relancer la lecture réutilise le même lecteur', () => {
        const bgm = sound.getBGMManager();
        bgm.play();
        bgm.play();
        expect(FakeAudio.created).toHaveLength(1);
        expect(lastAudio().plays).toBe(2);
    });

    it('fin de piste : enchaîne sur une autre piste, jamais la même', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const bgm = sound.getBGMManager();
        bgm.play();
        lastAudio().listeners.ended();
        expect(lastAudio().src).toBe('assets/sounds/bgm/calm2.wav');
        lastAudio().listeners.ended();
        expect(lastAudio().src).toBe('assets/sounds/bgm/calm1.wav');
    });

    it('pause, puis toggle relance', () => {
        const bgm = sound.getBGMManager();
        bgm.play();
        bgm.toggle();
        expect(bgm.isPlaying).toBe(false);
        expect(lastAudio().paused).toBe(true);
        bgm.toggle();
        expect(bgm.isPlaying).toBe(true);
    });

    it('pause avant toute lecture : rien ne se passe', () => {
        const bgm = sound.getBGMManager();
        bgm.pause();
        expect(bgm.isPlaying).toBe(false);
        expect(FakeAudio.created).toHaveLength(0);
    });

    it('volume : appliqué tout de suite et gardé pour la suite', () => {
        const bgm = sound.getBGMManager();
        bgm.setVolume(0.8);
        bgm.play();
        expect(lastAudio().volume).toBe(0.8);
        bgm.setVolume(0.1);
        expect(lastAudio().volume).toBe(0.1);
    });

    it('une seule piste : rejoue la même', () => {
        const bgm = sound.getBGMManager();
        bgm.tracks = ['assets/sounds/bgm/calm1.wav'];
        expect(bgm.getRandomTrack()).toBe(0);
        bgm.currentTrackIndex = 0;
        expect(bgm.getRandomTrack()).toBe(0);
    });
});
