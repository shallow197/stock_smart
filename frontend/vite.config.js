import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le frontend PWA (port 5173) proxy /api et /storage vers l'API Laravel (port 8000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/storage': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
