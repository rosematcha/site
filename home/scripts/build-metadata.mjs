import { mkdir, readFile, writeFile } from 'node:fs/promises';
const output = new URL('../../_site/', import.meta.url);
const shell = await readFile(new URL('index.html', output), 'utf8');
const events = JSON.parse(await readFile(new URL('../src/data/photos.json', import.meta.url), 'utf8'));
const routes = [
  { path: '/', title: 'rosematcha · Reese Lundquist' },
  ...['Work', 'Resume', 'Photos', 'Guestbook'].map(title => ({ path: `/${title.toLowerCase()}`, title: `${title} · rosematcha · Reese Lundquist` })),
  ...events.map(event => ({ path: `/photos/${event.id}`, title: `${event.title} ${event.year} · rosematcha · Reese Lundquist`, image: event.photos.find(photo => photo.id === event.coverId).src })),
];
function escape(value) { return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
for (const route of routes) {
  const url = `https://rosematcha.com${route.path}`;
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${escape(route.title)}</title>`);
  for (const [property, value] of [['og:title', route.title], ['og:url', url], ['og:image', route.image ? `https://rosematcha.com${route.image}` : 'https://rosematcha.com/img/portraits/me-camera.webp']]) {
    html = html.replace(new RegExp(`(<meta[^>]*property="${property}"[^>]*content=")[^"]*(")`), `$1${escape(value)}$2`);
  }
  html = html.replace(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/, `$1${url}$2`);
  const directory = route.path === '/' ? output : new URL(route.path.slice(1) + '/', output);
  await mkdir(directory, { recursive: true }); await writeFile(new URL('index.html', directory), html);
}
await writeFile(new URL('sitemap.xml', output), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>https://rosematcha.com${escape(route.path)}</loc></url>`).join('')}</urlset>\n`);

const fallbacks = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
const exactRoutes = routes.filter(route => route.path !== '/').map(route => `${route.path} ${route.path}/index.html 200`);
await writeFile(new URL('_redirects', output), exactRoutes.join('\n') + '\n' + fallbacks);
