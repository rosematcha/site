// Each route's page, prerendered: the built shell with the route's markup (src/entry-server.tsx, built to dist-ssr) in #root
// (React writes the preloads for its high-priority pictures there) and its title, OG tags and canonical; plus 404.html, the
// sitemap and _redirects.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url).href);
const output = new URL('../../_site/', import.meta.url);
const shell = await readFile(new URL('index.html', output), 'utf8');
const events = JSON.parse(await readFile(new URL('../src/data/photos.json', import.meta.url), 'utf8'));
const routes = [
  { path: '/', title: 'rosematcha · Reese Lundquist' },
  ...['Work', 'Resume', 'Photos', 'Guestbook'].map(title => ({ path: `/${title.toLowerCase()}`, title: `${title} · rosematcha · Reese Lundquist` })),
  ...events.map(event => ({ path: `/photos/${event.id}`, title: `${event.title} ${event.year} · rosematcha · Reese Lundquist`, image: event.photos.find(photo => photo.id === event.coverId).src })),
];
function escape(value) { return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function head(route) {
  const url = `https://rosematcha.com${route.path}`;
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${escape(route.title)}</title>`);
  for (const [property, value] of [['og:title', route.title], ['og:url', url], ['og:image', route.image ? `https://rosematcha.com${route.image}` : 'https://rosematcha.com/img/portraits/me-camera.webp']]) {
    html = html.replace(new RegExp(`(<meta[^>]*property="${property}"[^>]*content=")[^"]*(")`), `$1${escape(value)}$2`);
  }
  return html.replace(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/, `$1${url}$2`);
}
// a page's own chunks (its page module and what it imports beyond the main bundle), modulepreloaded so none waits on another
const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', output), 'utf8'));
const main = manifest['index.html'].file;
function chunks(key, out = new Set()) {
  const entry = manifest[key];
  if (!entry || out.has(entry.file) || entry.file === main) return out;
  out.add(entry.file);
  for (const k of entry.imports ?? []) chunks(k, out);
  return out;
}
const pageOf = path => {
  if (path === '/') return 'Home';
  if (path.startsWith('/photos/')) return 'Set';
  return { '/work': 'Work', '/resume': 'Resume', '/photos': 'Photos', '/guestbook': 'Guestbook' }[path] ?? 'NotFound';
};
const preloads = path => [...chunks(`src/pages/${pageOf(path)}Page.tsx`)].map(file => `<link rel="modulepreload" crossorigin href="/${file}">`).join('\n    ');
const page = (html, path) => html.replace('</head>', `  ${preloads(path)}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
for (const route of routes) {
  const directory = route.path === '/' ? output : new URL(route.path.slice(1) + '/', output);
  await mkdir(directory, { recursive: true }); await writeFile(new URL('index.html', directory), page(head(route), route.path));
}
// Not found, served with a 404 status for any unknown path (netlify.toml): no canonical or og:url of its own
const missing = head({ path: '/404', title: 'Page not found · rosematcha · Reese Lundquist' }).replace(/\s*<link[^>]*rel="canonical"[^>]*>/, '').replace(/\s*<meta[^>]*property="og:url"[^>]*>/, '');
await writeFile(new URL('404.html', output), page(missing, '/404'));
await writeFile(new URL('sitemap.xml', output), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>https://rosematcha.com${escape(route.path)}</loc></url>`).join('')}</urlset>\n`);

const fallbacks = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
const exactRoutes = routes.filter(route => route.path !== '/').map(route => `${route.path} ${route.path}/index.html 200`);
await writeFile(new URL('_redirects', output), exactRoutes.join('\n') + '\n' + fallbacks);
await rm(new URL('.vite/', output), { recursive: true });
