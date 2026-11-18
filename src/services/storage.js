// Toutes les lectures et écritures du localStorage passent par ici (DEBT-02).
// Si une sauvegarde est cassée, on renvoie la valeur par défaut au lieu de planter (DEBT-03).

const CURRENT_PROFILE_KEY = 'currentProfile_v1';
const NAMES_KEY = 'heroProfileNames_v1';
const PARENT_KEY = 'heroParentStatus_v1';
const OLD_SAVE_KEY = 'heroSkills_v23';
const PHANTOM_KEY = 'phantomEvent_lastSpawn_v1';

function defaultNames() {
    return { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
}

function defaultParentStatus() {
    return { 1: false, 2: false, 3: false };
}

function saveKey(profileId) {
    return `heroSkills_v23_p${profileId}`;
}

function readJSON(key, defaultValue) {
    const text = localStorage.getItem(key);
    if (!text) return defaultValue;
    try {
        return JSON.parse(text);
    } catch {
        console.warn(`Sauvegarde cassée (${key}), valeur par défaut utilisée`);
        return defaultValue;
    }
}

function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function loadCurrentProfile() {
    const saved = localStorage.getItem(CURRENT_PROFILE_KEY);
    return saved ? parseInt(saved) : 1;
}

export function saveCurrentProfile(profileId) {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
}

export function loadProfileNames() {
    return readJSON(NAMES_KEY, defaultNames());
}

export function saveProfileNames(names) {
    writeJSON(NAMES_KEY, names);
}

export function loadParentStatus() {
    return readJSON(PARENT_KEY, defaultParentStatus());
}

export function saveParentStatus(status) {
    writeJSON(PARENT_KEY, status);
}

// Save d'un profil : { skills, theme, stats }. Renvoie null si pas de save.
// Le profil 1 peut encore avoir une très vieille save sous heroSkills_v23.
export function loadProfileSave(profileId) {
    let key = saveKey(profileId);
    if (!localStorage.getItem(key) && profileId === 1) key = OLD_SAVE_KEY;
    return readJSON(key, null);
}

export function saveProfileSave(profileId, data) {
    writeJSON(saveKey(profileId), data);
}

// Remet un profil à zéro : on efface sa save, son statut parent et son nom
export function resetProfile(profileId) {
    localStorage.removeItem(saveKey(profileId));
    if (profileId === 1) localStorage.removeItem(OLD_SAVE_KEY);

    const status = loadParentStatus();
    status[profileId] = false;
    saveParentStatus(status);

    const names = loadProfileNames();
    names[profileId] = `Player ${profileId}`;
    saveProfileNames(names);
}

export function loadBorderEffect(profileId) {
    return localStorage.getItem(`borderEffect_p${profileId}`) || 'solid';
}

export function loadBorderColor(profileId) {
    return localStorage.getItem(`borderColor_p${profileId}`) || '#FFD700';
}

export function saveBorder(profileId, effect, color) {
    localStorage.setItem(`borderEffect_p${profileId}`, effect);
    localStorage.setItem(`borderColor_p${profileId}`, color);
}

export function loadPhantomLastSpawn() {
    return parseInt(localStorage.getItem(PHANTOM_KEY) || '0', 10);
}

export function savePhantomLastSpawn(time) {
    localStorage.setItem(PHANTOM_KEY, time.toString());
}
