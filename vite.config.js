import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Phase 24: fail a PRODUCTION build that would ship a localhost API address (or a malformed value) to browsers.
  // Unset is allowed: the app then uses the same-origin path "/api" (see src/config/api.js).
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const api = (env.VITE_API_BASE_URL || '').trim()
    if (/\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(api)) {
      throw new Error(`VITE_API_BASE_URL points at a local address (${api}); set the real API URL or leave it unset to use "/api".`)
    }
    if (api && !/^(https?:\/\/[^\s/]+(\/\S*)?|\/(?!\/)\S*)$/i.test(api)) {
      throw new Error('VITE_API_BASE_URL must be an http(s) URL or a path starting with "/".')
    }
    if (!api) console.warn('[config] VITE_API_BASE_URL is not set: the app will call the same-origin path "/api" (reverse proxy required).')
  }
  return { plugins: [react(), tailwindcss()] }
})
