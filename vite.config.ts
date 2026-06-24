import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages project path: https://<user>.github.io/rent-vs-buy-calc/
export default defineConfig({
  base: '/rent-vs-buy-calc/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
