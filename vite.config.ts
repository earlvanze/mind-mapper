import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveAllowedHosts } from './src/utils/allowedHosts';

const allowedHosts = resolveAllowedHosts(process.env.MINDMAPP_ALLOWED_HOSTS);
const port = parseInt(process.env.MINDMAPP_PORT || '5180', 10);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts,
    port,
    strictPort: true,
  },
  preview: {
    host: true,
    allowedHosts,
    port,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'zustand'],
          'export-libs': ['html-to-image', 'jspdf'],
        },
      },
    },
  },
});
