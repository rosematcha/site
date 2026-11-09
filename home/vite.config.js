import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import events from './src/data/photos.json';
const pages = new Set(['/work', '/resume', '/photos', '/guestbook', ...events.map(event => `/photos/${event.id}`)]);
const routePreviews = {
  name: 'static-route-previews',
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url || '/', 'http://preview');
      const path = url.pathname.replace(/\/$/, '');
      if (request.method === 'POST' && !path) {
        response.statusCode = 503; response.end('Forms require Netlify hosting.'); return;
      }
      if (pages.has(path)) request.url = `${path}/index.html${url.search}`;
      next();
    });
  },
};
export default defineConfig({
  plugins: [react(), routePreviews],
  build: { emptyOutDir: false },
  server: {
    host: '127.0.0.1', port: 5479, strictPort: true,
    allowedHosts: ['botan.tail843dce.ts.net'],
    proxy: { '/.netlify/functions/get-guestbook-entries': { target: 'https://rosematcha.com', changeOrigin: true } },
  },
});
