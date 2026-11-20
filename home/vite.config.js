import { existsSync, readFileSync, statSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import events from './src/data/photos.json';
// like Netlify: the site's pages and any built file are served as they are; an app beside the site (a directory with its own
// index.html) moves to its slash form, where its relative scripts and data resolve; /projects moves to /work; anything else is
// the prerendered Not found with a 404 status
const pages = new Set(['/work', '/resume', '/photos', '/guestbook', ...events.map(event => `/photos/${event.id}`)]);
const site = new URL('../_site/', import.meta.url);
const exists = path => existsSync(new URL(`.${path}`, site)); // (the URL's own percent-encoding is decoded by the file URL)
function notFound(response) {
  response.statusCode = 404; response.setHeader('content-type', 'text/html');
  response.end(readFileSync(new URL('404.html', site)));
}
function serve(path, url, request, response, next) {
  const index = exists(`${path}/index.html`);
  if (index && !pages.has(path) && !url.pathname.endsWith('/')) {
    response.statusCode = 301; response.setHeader('location', `${path}/${url.search}`); response.end(); return;
  }
  if (index) { request.url = `${path}/index.html${url.search}`; next(); return; }
  if (exists(path) && !statSync(new URL(`.${path}`, site)).isDirectory()) { next(); return; }
  notFound(response);
}
function route(request, response, next) {
  const url = new URL(request.url || '/', 'http://preview');
  const path = url.pathname.replace(/\/$/, '');
  if (request.method === 'POST' && !path) {
    response.statusCode = 503; response.end('Forms require Netlify hosting.'); return;
  }
  if (path === '/projects') {
    response.statusCode = 301; response.setHeader('location', '/work'); response.end(); return;
  }
  if (!path || path.startsWith('/.netlify') || path.startsWith('/@')) { next(); return; }
  serve(path, url, request, response, next);
}
const routePreviews = {
  name: 'static-route-previews',
  configurePreviewServer(server) {
    server.middlewares.use(route);
  },
};
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), routePreviews],
  publicDir: isSsrBuild ? false : 'public', // the prerender bundle needs no copy of the images
  build: { emptyOutDir: false, manifest: !isSsrBuild }, // the manifest names each page's chunks (scripts/build-metadata.mjs)
  server: {
    host: '127.0.0.1', port: 5479, strictPort: true,
    allowedHosts: ['botan.tail843dce.ts.net'],
    proxy: { '/.netlify/functions/get-guestbook-entries': { target: 'https://rosematcha.com', changeOrigin: true } },
  },
}));
