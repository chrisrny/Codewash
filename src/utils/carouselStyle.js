// Style des cartes du carrousel, sorti d'App.jsx (DEBT-01).
// Le carrousel a 7 cartes, de offset -3 à +3 (les ±3 sont cachées).
// Les tableaux sont rangés par distance au centre : 0, 1, 2, 3.
const TRANSLATE_Y = [-55, -30, 20, 75];
const ROTATE_X = [0, -4, -8, -12];
const OPACITY = [1, 0.6, 0.3, 0];

function getZIndex(distance, isBattling) {
    if (isBattling) return 50;
    if (distance === 0) return 20;
    return 10 - distance;
}

// isBattling : cette carte est en combat. inBattle : un combat est en cours.
export function getCardStyle(offset, isBattling, inBattle) {
    const distance = Math.abs(offset);
    const isCenter = offset === 0;

    return {
        transform: `translateX(${offset * 320}px) translateY(${TRANSLATE_Y[distance]}px) rotateX(${ROTATE_X[distance]}deg) scale(${isCenter ? 1.1 : 0.85})`,
        opacity: OPACITY[distance],
        zIndex: getZIndex(distance, isBattling),
        filter: isCenter ? 'none' : 'brightness(0.5) blur(1px)',
        cursor: !isCenter && !inBattle ? 'pointer' : 'default',
        transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    };
}
