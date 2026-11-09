import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
const originalFetch = globalThis.fetch;
const originalToken = process.env.NETLIFY_API_TOKEN;
const originalForm = process.env.GUESTBOOK_FORM_ID;
let fixture = 0;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.NETLIFY_API_TOKEN;
  else process.env.NETLIFY_API_TOKEN = originalToken;
  if (originalForm === undefined) delete process.env.GUESTBOOK_FORM_ID;
  else process.env.GUESTBOOK_FORM_ID = originalForm;
});
async function handler(configured = true) {
  if (configured) { process.env.NETLIFY_API_TOKEN = 'fixture-token'; process.env.GUESTBOOK_FORM_ID = 'fixture-form'; }
  else { delete process.env.NETLIFY_API_TOKEN; delete process.env.GUESTBOOK_FORM_ID; }
  const module = await import(`../functions/get-guestbook-entries.js?fixture=${fixture++}`);
  return module.handler;
}
test('reports missing configuration without attempting a network call', async () => {
  const run = await handler(false); let fetched = false;
  globalThis.fetch = () => { fetched = true; throw new Error('Unexpected request'); };
  const response = await run(); assert.equal(response.statusCode, 500); assert.equal(fetched, false);
  assert.deepEqual(JSON.parse(response.body), { error: 'Configuration error.' });
});
test('filters the honeypot, sorts newest first, and retains real form fields', async () => {
  const run = await handler();
  globalThis.fetch = (url, options) => {
    assert.equal(url, 'https://api.netlify.com/api/v1/forms/fixture-form/submissions');
    assert.equal(options.headers.Authorization, 'Bearer fixture-token');
    return Promise.resolve(Response.json([
      { id: 'older', created_at: '2025-01-01T00:00:00Z', data: { name: 'Older', message: 'Earlier entry.' } },
      { id: 'spam', created_at: '2026-10-02T00:00:00Z', data: { 'bot-field': 'filled', name: 'Spam' } },
      { id: 'newer', created_at: '2026-10-01T00:00:00Z', data: { 'bot-field': '', name: 'Newer', message: 'New entry.', website: 'https://example.org/' } },
    ]));
  };
  const response = await run(); const entries = JSON.parse(response.body);
  assert.equal(response.statusCode, 200); assert.deepEqual(entries.map(entry => entry.id), ['newer', 'older']);
  assert.equal(entries[0].website, 'https://example.org/'); assert.match(response.headers['Cache-Control'], /s-maxage=60/);
});
test('returns an error instead of sample data when the upstream fails', async () => {
  const run = await handler(); globalThis.fetch = () => Promise.resolve(new Response('Unavailable', { status: 503 }));
  const response = await run(); assert.equal(response.statusCode, 503); assert.deepEqual(JSON.parse(response.body), { error: 'Failed to fetch submissions.' });
});
