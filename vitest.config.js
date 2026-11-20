import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Config des tests, séparée de vite.config.js pour ne pas toucher au build Electron.
export default defineConfig({
    plugins: [react()],
    test: {
        // jsdom simule le navigateur : localStorage, window, document (utilisés partout dans src/)
        environment: 'jsdom',
        include: ['tests/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{js,jsx}'],
            // text : résumé dans le terminal / html : rapport navigable dans coverage/ / lcov : pour la CI
            // json-summary : lu par la CI pour afficher la coverage et les seuils dans le résumé du run
            reporter: ['text', 'html', 'lcov', 'json-summary'],
            // Coverage mesurée le 17/11/2026 après les tests des mini-jeux, arrondie à l'inférieur :
            // la CI échoue si elle baisse. On remonte ces chiffres dès qu'une PR de tests les dépasse,
            // on ne les baisse jamais sans l'écrire dans docs/DEBT.md.
            thresholds: {
                lines: 63,
                statements: 62,
                branches: 58,
                functions: 57,
            },
        },
    },
});
