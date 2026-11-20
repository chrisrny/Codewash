// Tout le hasard du jeu passe par ici (DEBT-04).
// Dans les tests, setRandom() permet de choisir les nombres tirés.

let fakeRandom = null;

export function setRandom(fn) {
    fakeRandom = fn;
}

// Nombre entre 0 (compris) et 1 (non compris), comme Math.random()
export function random() {
    return fakeRandom ? fakeRandom() : Math.random();
}

// Entier entre min et max, les deux compris
export function randomInt(min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
}

// Un élément au hasard dans une liste
export function pickRandom(list) {
    return list[Math.floor(random() * list.length)];
}
