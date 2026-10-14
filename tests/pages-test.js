'use strict';
// Checks the GitHub Pages version's API (pages/api.js) against a pretend Supabase kept in memory.
const assert = require('assert');
const Core = require('../core');
const { createApi } = require('../pages/api');
const { memoryStore } = require('../pages/memory-store');

const store = memoryStore('http://files');
// Two copies of the API sharing one database, like two Supabase servers answering at the same time.
const one = createApi({ Core, store, setupCode: '424242' }), two = createApi({ Core, store, setupCode: '424242' });
function client(api) {
  const ses = {};
  return async (method, path, body) => {
    const headers = { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' };
    for (const k in ses) headers['x-pixie-' + k] = ses[k];
    const r = await api(new Request('https://x.supabase.co/api' + path.replace(/^\/api/, ''), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }));
    const login = r.headers.get('x-pixie-login'), logout = r.headers.get('x-pixie-logout');
    if (login) ses[login.split(':')[0]] = login.split(':')[1];
    if (logout) delete ses[logout];
    return { status: r.status, data: await r.json().catch(() => null), headers: r.headers };
  };
}
const results = [];
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ': ' + e.message]); } }

(async () => {
  const studio = client(one), studio2 = client(two), guest = client(one), couple = client(two);
  let A;
  await check('Studio setup needs the setup code; sign-in travels in a header', async () => {
    assert.strictEqual((await studio('POST', '/api/board/setup', { setupCode: '000000', name: 'Pixie', password: 'flowers123' })).status, 403);
    const r = await studio('POST', '/api/board/setup', { setupCode: '424242', name: 'Pixie', password: 'flowers123' });
    assert.strictEqual(r.status, 200);
    assert.ok(r.headers.get('access-control-expose-headers').includes('x-pixie-login'));
    assert.strictEqual((await studio('GET', '/api/board/clients')).status, 200);
    assert.strictEqual((await guest('GET', '/api/board/clients')).status, 401);
    assert.ok(![...store.rows.values()].some(r => r.value.includes('flowers123')), 'password stored scrambled');
  });
  await check('Clients, guest list and RSVP answers are saved', async () => {
    A = (await studio('POST', '/api/board/clients', { couple: 'Via & Arkin', weddingDate: '2035-03-20', deadline: '2035-02-09', code: '120825' })).data.client;
    assert.ok(A && A.slug);
    await studio('POST', `/api/board/clients/${A.id}/upload`, { mode: 'add', rows: [{ family: 'Santos Family', guest: 'Ana Santos', seats: '2' }, { family: 'Santos Family', guest: 'Ben Santos' }] });
    const f = await guest('POST', `/api/w/${A.slug}/find`, { name: 'Ana Santos' });
    assert.strictEqual(f.status, 200);
    const tok = (f.data.matches || f.data.results || [f.data])[0].token || f.data.token;
    const page = await guest('GET', '/api/r/' + tok);
    const g = page.data.reservation.guests;
    assert.strictEqual((await guest('POST', `/api/r/${tok}/rsvp`, { answers: Object.fromEntries(g.map(x => [x.id, 'attending'])) })).status, 200);
  });
  await check('Two servers saving at the same time don’t lose each other’s changes', async () => {
    await studio2('POST', '/api/board/login', { name: 'Pixie', password: 'flowers123' });
    await studio2('GET', '/api/board/clients'); // server two now has its own copy
    await studio('POST', `/api/board/clients/${A.id}/reservations`, { family: 'Cruz Family', seats: 1, guests: [{ name: 'Carlo Cruz' }] });
    await studio2('POST', `/api/board/clients/${A.id}/reservations`, { family: 'Reyes Family', seats: 1, guests: [{ name: 'Rina Reyes' }] });
    const fams = (await studio('GET', `/api/board/clients/${A.id}`)).data.client.reservations.map(r => r.family);
    assert.ok(fams.includes('Cruz Family') && fams.includes('Reyes Family'), fams.join(', '));
  });
  await check('Couple signs in with their code; they can’t edit the website', async () => {
    assert.strictEqual((await couple('POST', `/api/couple/${A.slug}/login`, { code: '120825' })).status, 200);
    assert.strictEqual((await couple('GET', `/api/couple/${A.slug}/state`)).status, 200);
    assert.strictEqual((await couple('PUT', '/api/board/studio', { site: null })).status, 401);
    assert.strictEqual((await couple('POST', '/api/board/media-url', { type: 'image/png', size: 10 })).status, 401);
  });
  await check('Uploads: only the studio gets an upload address; only pictures and videos', async () => {
    const r = await studio('POST', '/api/board/media-url', { type: 'image/png', size: 1000 });
    assert.strictEqual(r.status, 200); assert.ok(/^\/media\/[a-f0-9]{24}\.png$/.test(r.data.ref)); assert.ok(r.data.uploadUrl.startsWith('http://files/upload/'));
    assert.strictEqual((await studio('POST', '/api/board/media-url', { type: 'image/svg+xml', size: 10 })).status, 415);
    assert.strictEqual((await studio('POST', '/api/board/media-url', { type: 'video/mp4', size: 80e6 })).status, 413);
    const site = { pages: { couple: { styles: { 'div.c-hero > p.c-welcome-word': { d: { x: 120, y: 10, s: 1.2 } } }, decor: [{ id: 'abcd1234', type: 'image', src: r.data.ref, x: 50, y: 20, w: 15 }] } } };
    assert.strictEqual((await studio('PUT', '/api/board/studio', { site })).status, 200);
    const seen = (await couple('GET', `/api/couple/${A.slug}`)).data.studio.site.pages.couple;
    assert.strictEqual(seen.styles['div.c-hero > p.c-welcome-word'].d.x, 120);
  });
  await check('Backup download is for the studio only', async () => {
    assert.strictEqual((await guest('GET', '/api/board/backup')).status, 401);
    const r = await studio('GET', '/api/board/backup');
    assert.strictEqual(r.status, 200); assert.ok(r.data.clients.length === 1);
  });
  await check('Sign-out ends the sign-in', async () => {
    await studio('POST', '/api/board/logout', {});
    assert.strictEqual((await studio('GET', '/api/board/clients')).status, 401);
  });
  for (const [s, n] of results) console.log(s === 'PASS' ? '✔' : '✘', n);
  process.exit(results.some(r => r[0] === 'FAIL') ? 1 : 0);
})();
