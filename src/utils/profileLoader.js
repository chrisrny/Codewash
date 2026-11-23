// Lecture de la save d'un profil, sortie d'App.jsx (DEBT-01).
// Le format de la save est décrit dans docs/SAVE_FORMAT.md.
import { loadProfileSave } from '../services/storage';
import { getRandomMob, getRandomFriendlyMob, getRandomMiniboss, getRandomBoss, calculateMobHealth } from './gameUtils';
import { getRandomAura } from './mobDisplayUtils';
import { getDefaultStats } from './achievementUtils';
import { SKILL_DATA } from '../constants/gameData';

// Le mob et l'aura affichés sur la carte de chaque compétence
const CARD_MOB_FIELDS = {
    memory: 'memoryMob',
    patterns: 'patternMob',
    reading: 'readingMob',
    math: 'mathMob',
    writing: 'writingMob',
};

const CARD_AURA_FIELDS = {
    reading: 'readingMobAura',
    math: 'mathMobAura',
    writing: 'writingMobAura',
    patterns: 'patternMobAura',
};

// Compétence neuve au niveau 1
function newSkill(id) {
    return {
        level: 1,
        xp: 0,
        currentMob: getRandomMob(null),
        difficulty: 1,
        earnedBadges: [],
        mobHealth: calculateMobHealth(1),
        mobMaxHealth: calculateMobHealth(1),
        lostLevel: false,
        recoveryDifficulty: null,
        memoryMob: id === 'memory' ? getRandomFriendlyMob() : null,
        patternMob: id === 'patterns' ? getRandomMob(null) : null,
        currentMiniboss: getRandomMiniboss(),
        currentBoss: getRandomBoss(),
        readingMob: id === 'reading' ? getRandomMob(null) : null,
        mathMob: id === 'math' ? getRandomMob(null) : null,
        writingMob: id === 'writing' ? getRandomMob(null) : null,
        readingMobAura: id === 'reading' ? getRandomAura() : null,
        mathMobAura: id === 'math' ? getRandomAura() : null,
        writingMobAura: id === 'writing' ? getRandomAura() : null,
        patternMobAura: id === 'patterns' ? getRandomAura() : null,
        currentMinibossAura: getRandomAura(),
        currentBossAura: getRandomAura(),
    };
}

// Champs qui manquent dans les vieilles saves
function fillBasicFields(skill) {
    if (typeof skill.difficulty !== 'number') skill.difficulty = 1;
    if (!Array.isArray(skill.earnedBadges)) skill.earnedBadges = [];
    if (typeof skill.mobHealth !== 'number') {
        const diff = skill.difficulty || 1;
        skill.mobHealth = calculateMobHealth(diff);
        skill.mobMaxHealth = calculateMobHealth(diff);
    }
    if (typeof skill.lostLevel !== 'boolean') skill.lostLevel = false;
    if (skill.recoveryDifficulty === undefined) skill.recoveryDifficulty = null;
}

function fillCardMob(id, skill) {
    const field = CARD_MOB_FIELDS[id];
    if (field && !skill[field]) {
        skill[field] = id === 'memory' ? getRandomFriendlyMob() : getRandomMob(null);
    }
}

function fillCardAura(id, skill) {
    const field = CARD_AURA_FIELDS[id];
    if (field && !skill[field]) skill[field] = getRandomAura();
}

// Miniboss et boss, sauf pour le ménage et la mémoire
function fillBosses(id, skill) {
    if (id === 'cleaning' || id === 'memory') return;
    if (!skill.currentMiniboss) skill.currentMiniboss = getRandomMiniboss();
    if (!skill.currentBoss) skill.currentBoss = getRandomBoss();
    if (!skill.currentMinibossAura) skill.currentMinibossAura = getRandomAura();
    if (!skill.currentBossAura) skill.currentBossAura = getRandomAura();
}

export function loadSkills(profileId) {
    const skills = {};
    SKILL_DATA.forEach((s) => {
        skills[s.id] = newSkill(s.id);
    });

    const saved = loadProfileSave(profileId);
    if (!saved) return skills;

    // Vieux format : les compétences sont directement à la racine, sans "skills"
    const data = saved.skills || saved;
    Object.keys(data).forEach((id) => {
        const skill = { ...skills[id], ...data[id] };
        fillBasicFields(skill);
        fillCardMob(id, skill);
        fillCardAura(id, skill);
        fillBosses(id, skill);
        skills[id] = skill;
    });
    return skills;
}

export function loadTheme(profileId) {
    const saved = loadProfileSave(profileId);
    return (saved && saved.theme) || 'minecraft';
}

export function loadStats(profileId) {
    const saved = loadProfileSave(profileId);
    if (saved && saved.stats) {
        return { ...getDefaultStats(), ...saved.stats };
    }
    return getDefaultStats();
}
