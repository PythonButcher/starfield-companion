import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', proxy: {
    '/api': (process.env.BACKEND_URL || 'http://127.0.0.1:5000'),
    '/media': { target: (process.env.BACKEND_URL || 'http://127.0.0.1:5000'), bypass(req) { if (req.headers.accept?.includes('text/html')) return '/index.html'; } },
  } },
});
