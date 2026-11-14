import { defineConfig } from 'vite-plus'
import react from '@vitejs/plugin-react'

type VitePlusConfig = Parameters<typeof defineConfig>[0]

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
} as VitePlusConfig)
