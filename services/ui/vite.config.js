import { defineConfig } from 'vite';

const backendPort = process.env.BACKEND_PORT || '4000';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/auth': {
        target: `http://backend:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
