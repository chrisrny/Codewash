import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    loadCurrentProfile,
    saveCurrentProfile,
    loadProfileNames,
    saveProfileNames,
    loadParentStatus,
    saveParentStatus,
    loadProfileSave,
    saveProfileSave,
    resetProfile,
    loadBorderEffect,
    loadBorderColor,
    saveBorder,
    loadPhantomLastSpawn,
    savePhantomLastSpawn,
} from '../src/services/storage.js';

beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('profil courant', () => {
    it('vaut 1 sans sauvegarde', () => {
        expect(loadCurrentProfile()).toBe(1);
    });

    it('relit ce qui a été sauvegardé', () => {
        saveCurrentProfile(3);
        expect(localStorage.getItem('currentProfile_v1')).toBe('3');
        expect(loadCurrentProfile()).toBe(3);
    });
});

describe('noms des profils', () => {
    it('noms par défaut sans sauvegarde', () => {
        expect(loadProfileNames()).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
    });

    it('relit ce qui a été sauvegardé', () => {
        saveProfileNames({ 1: 'Léo', 2: 'Player 2', 3: 'Player 3' });
        expect(loadProfileNames()[1]).toBe('Léo');
    });

    it('save cassée : noms par défaut au lieu de planter (DEBT-03)', () => {
        localStorage.setItem('heroProfileNames_v1', '{pas du json');
        expect(loadProfileNames()).toEqual({ 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' });
        expect(console.warn).toHaveBeenCalled();
    });
});

describe('statut parent', () => {
    it('personne n est parent sans sauvegarde', () => {
        expect(loadParentStatus()).toEqual({ 1: false, 2: false, 3: false });
    });

    it('relit ce qui a été sauvegardé', () => {
        saveParentStatus({ 1: true, 2: false, 3: false });
        expect(loadParentStatus()[1]).toBe(true);
    });

    it('save cassée : valeurs par défaut (DEBT-03)', () => {
        localStorage.setItem('heroParentStatus_v1', '{pas du json');
        expect(loadParentStatus()).toEqual({ 1: false, 2: false, 3: false });
    });
});

describe('save d un profil', () => {
    it('null sans sauvegarde', () => {
        expect(loadProfileSave(2)).toBe(null);
    });

    it('relit ce qui a été sauvegardé', () => {
        saveProfileSave(2, { skills: { math: { level: 4 } }, theme: 'spy' });
        expect(localStorage.getItem('heroSkills_v23_p2')).not.toBe(null);
        expect(loadProfileSave(2).skills.math.level).toBe(4);
        expect(loadProfileSave(2).theme).toBe('spy');
    });

    it('save cassée : null au lieu de planter', () => {
        localStorage.setItem('heroSkills_v23_p1', '{pas du json');
        expect(loadProfileSave(1)).toBe(null);
    });

    it('profil 1 : lit la vieille clé heroSkills_v23 s il n a pas de save', () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ skills: { math: { level: 6 } } }));
        expect(loadProfileSave(1).skills.math.level).toBe(6);
    });

    it('profil 1 : garde sa vraie save si elle existe', () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ skills: { math: { level: 6 } } }));
        saveProfileSave(1, { skills: { math: { level: 2 } } });
        expect(loadProfileSave(1).skills.math.level).toBe(2);
    });

    it('les autres profils ne lisent pas la vieille clé', () => {
        localStorage.setItem('heroSkills_v23', JSON.stringify({ skills: { math: { level: 6 } } }));
        expect(loadProfileSave(2)).toBe(null);
    });
});

describe('reset d un profil', () => {
    it('efface la save, le statut parent et le nom du profil', () => {
        saveProfileSave(2, { skills: { math: { level: 9 } } });
        saveParentStatus({ 1: true, 2: true, 3: false });
        saveProfileNames({ 1: 'Léo', 2: 'Sam', 3: 'Player 3' });

        resetProfile(2);

        expect(loadProfileSave(2)).toBe(null);
        expect(loadParentStatus()).toEqual({ 1: true, 2: false, 3: false });
        expect(loadProfileNames()).toEqual({ 1: 'Léo', 2: 'Player 2', 3: 'Player 3' });
    });

    it('profil 1 : efface aussi la vieille clé', () => {
        localStorage.setItem('heroSkills_v23', '{}');
        saveProfileSave(1, { skills: {} });

        resetProfile(1);

        expect(localStorage.getItem('heroSkills_v23')).toBe(null);
        expect(localStorage.getItem('heroSkills_v23_p1')).toBe(null);
    });

    it('marche aussi sans aucune sauvegarde', () => {
        resetProfile(3);
        expect(loadParentStatus()[3]).toBe(false);
        expect(loadProfileNames()[3]).toBe('Player 3');
    });
});

describe('bordure', () => {
    it('valeurs par défaut sans sauvegarde', () => {
        expect(loadBorderEffect(1)).toBe('solid');
        expect(loadBorderColor(1)).toBe('#FFD700');
    });

    it('chaque profil a sa bordure', () => {
        saveBorder(2, 'rainbow', '#FF0000');
        expect(loadBorderEffect(2)).toBe('rainbow');
        expect(loadBorderColor(2)).toBe('#FF0000');
        expect(loadBorderEffect(1)).toBe('solid');
    });
});

describe('phantom', () => {
    it('0 si le phantom n est jamais apparu', () => {
        expect(loadPhantomLastSpawn()).toBe(0);
    });

    it('relit l heure de la dernière apparition', () => {
        savePhantomLastSpawn(1763460000000);
        expect(loadPhantomLastSpawn()).toBe(1763460000000);
    });
});
