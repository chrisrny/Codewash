import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'release', 'electron', 'coverage']),
    {
        files: ['**/*.{js,jsx}'],
        extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        rules: {
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
            // Même limite que la mesure de départ de docs/DEBT.md. Les 14 fonctions existantes au-dessus
            // sont tolérées par --max-warnings dans package.json, une nouvelle fait échouer la CI.
            complexity: ['warn', 10],
        },
    },
]);
