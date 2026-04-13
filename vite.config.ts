import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveAllowedHosts } from './src/utils/allowedHosts';

const allowedHosts = resolveAllowedHosts(process.env.MINDMAPP_ALLOWED_HOSTS);
const port = parseInt(process.env.MINDMAPP_PORT || '5180', 10);

// Debug: intercept manualChunks calls
function debugChunks(id) {
  if (id.includes('node_modules')) {
    const rel = id.replace(/.*node_modules[/\\]/, '').replace(/.*[/\\]node_modules[/\\]/, '');
    console.error('[CHUNK]', rel.slice(0, 80));
  }
}

export default defineConfig({
  plugins: [react()],
  server: { host: true, allowedHosts, port, strictPort: true },
  preview: { host: true, allowedHosts, port, strictPort: true },
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          debugChunks(id);
          if (!id.includes('node_modules')) return;
          return 'vendor';
        },
      },
    },
  },
});
