import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveAllowedHosts } from './src/utils/allowedHosts';

const allowedHosts = resolveAllowedHosts(process.env.MINDMAPP_ALLOWED_HOSTS);

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
});
