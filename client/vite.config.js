import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devApiTarget = globalThis.process?.env?.VITE_DEV_API_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
      },
    },
  },
})
