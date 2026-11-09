import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

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
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
