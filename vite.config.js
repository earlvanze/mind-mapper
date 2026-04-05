import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = [
  'cyber.earlco.in',
  'cyber.talpa-stargazer.ts.net',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts,
  },
  preview: {
    host: true,
    allowedHosts,
  },
})
