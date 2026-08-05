import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Consume the shared protocol from source so no prebuild is needed in dev.
      '@chess/protocol': path.resolve(__dirname, '../packages/protocol/src/index.ts'),
    },
  },
})
