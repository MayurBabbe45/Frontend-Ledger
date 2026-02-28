import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy:{
      '/api': {
        target: 'https://backend-ledger-af1t.onrender.com',
        changeOrigin: true,
        secure: false, // Helps proxy HTTPS targets from local HTTP
      }
    }
  }
})