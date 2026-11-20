// L'heure du jeu passe par ici (DEBT-04).
// Dans les tests, setNow() permet de choisir l'heure.

let fakeNow = null;

export function setNow(time) {
    fakeNow = time;
}

// Heure actuelle en millisecondes, comme Date.now()
export function now() {
    return fakeNow === null ? Date.now() : fakeNow;
}

// Date du jour au format YYYY-MM-DD
export function getToday() {
    return new Date(now()).toISOString().split('T')[0];
}
