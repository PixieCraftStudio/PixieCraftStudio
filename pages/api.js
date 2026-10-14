// The website's API for the GitHub Pages version. It runs as a Supabase Edge Function (see build-pages.js) and only uses
// standard web features (Request, Response, crypto.subtle), so the same code is tested locally with Node.
// The data rules themselves are core.js, shared with every other version of the site.
//   store: where the data lives (Supabase in production, memory in tests). See supabase-store.js for what it must offer.
function createApi(o) {
  const C = o.Core, store = o.store;
  const SESSION_MS = 30 * 24 * 3600e3;
  const IMAGE_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
  const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov', 'video/x-m4v': '.m4v' };
  const MAX_IMAGE = 15 * 1024 * 1024, MAX_VIDEO = (o.maxVideoMB || 50) * 1024 * 1024;
  // The setup code protects the first studio sign-in. Without the SETUP_CODE secret nobody can claim the site.
  const setupCode = o.setupCode || 'not-set-' + rand(16);

  const enc = new TextEncoder();
  function rand(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join(''); }
  function token() { return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function sha256(s) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))), b => b.toString(16).padStart(2, '0')).join(''); }
  // Passwords and couples' codes are stored scrambled (PBKDF2, 150,000 rounds).
  async function hashPin(pin, salt) {
    salt = salt || rand(16);
    const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return { salt, hash: Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('') };
  }

  // ---------- the data, kept as one row per couple plus a few rows for the studio ----------
  // A copy stays in memory between requests; only rows that changed elsewhere are read again.
  const cache = new Map(); // key -> { rev, json }
  async function loadDb() {
    const live = await store.revs(), seen = new Set(), need = [];
    for (const r of live) { seen.add(r.key); const c = cache.get(r.key); if (!c || c.rev !== r.rev) need.push(r.key); }
    for (const k of [...cache.keys()]) if (!seen.has(k)) cache.delete(k);
    for (let i = 0; i < need.length; i += 40) for (const r of await store.values(need.slice(i, i + 40))) cache.set(r.key, { rev: r.rev, json: r.value });
    if (!cache.size) return null;
    const db = { studio: {}, clients: [] }, byId = {};
    let order = [];
    for (const [k, c] of cache) {
      const v = JSON.parse(c.json);
      if (k === 'meta:order') order = v;
      else if (k.startsWith('meta:')) db[k.slice(5)] = v;
      else if (k.startsWith('studio:')) db.studio[k.slice(7)] = v;
      else if (k.startsWith('client:')) byId[k.slice(7)] = v;
    }
    db.clients = order.filter(id => byId[id]).map(id => byId[id]).concat(Object.keys(byId).filter(id => !order.includes(id)).map(id => byId[id]));
    return db;
  }
  function rowsOf(db) {
    const m = new Map();
    for (const [k, v] of Object.entries(db)) if (k !== 'clients' && k !== 'studio') m.set('meta:' + k, JSON.stringify(v));
    m.set('meta:order', JSON.stringify(db.clients.map(c => c.id)));
    for (const [k, v] of Object.entries(db.studio || {})) m.set('studio:' + k, JSON.stringify(v));
    for (const c of db.clients) m.set('client:' + c.id, JSON.stringify(c));
    return m;
  }
  // Saves only what changed, all together or not at all. If someone else saved in the meantime, the request runs again on fresh data.
  async function saveDb(db) {
    const rows = rowsOf(db), changes = [];
    for (const [key, json] of rows) { const c = cache.get(key); if (!c || c.json !== json) changes.push({ op: 'put', key, value: json, rev: c ? c.rev : 0 }); }
    for (const [key, c] of cache) if (!rows.has(key)) changes.push({ op: 'del', key, rev: c.rev });
    if (!changes.length) return;
    await store.commit(changes);
    for (const ch of changes) { if (ch.op === 'del') cache.delete(ch.key); else cache.set(ch.key, { rev: ch.rev + 1, json: ch.value }); }
  }

  // ---------- sign-ins (sent as headers, since GitHub Pages and the database live on different addresses) ----------
  const HEAD = { board: 'x-pixie-board', couple: 'x-pixie-couple' };
  async function current(req, kind) {
    const sid = req.headers.get(HEAD[kind]);
    if (!sid || sid.length > 100) return null;
    const s = await store.sessionGet(await sha256(sid));
    return s && s.kind === kind && s.expires > Date.now() ? s.value : null;
  }

  const cors = {
    'Access-Control-Allow-Origin': o.origin || '*',
    'Access-Control-Allow-Headers': 'content-type, x-pixie-board, x-pixie-couple, authorization, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'x-pixie-login, x-pixie-logout',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };
  const json = (status, body, extra) => new Response(JSON.stringify(body), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors, extra || {}) });

  return async function handle(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(req.url), at = url.pathname.indexOf('/api/');
      if (at < 0) return json(404, { error: 'Not found' });
      const path = url.pathname.slice(at);
      if (path === '/api/health') return json(200, { ok: true });
      let body = {};
      if (req.method !== 'GET') {
        const text = await req.text();
        if (text.length > 10e6) return json(413, { error: 'That is too big to save.' });
        if (text) { try { body = JSON.parse(text); } catch (e) { return json(400, { error: 'Something went wrong. Please try again.' }); } }
      }
      const boardName = await current(req, 'board'), coupleId = await current(req, 'couple');
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

      for (let attempt = 0; ; attempt++) {
        let db = await loadDb();
        db = C.upgradeData(db || C.defaultData(false));
        const board = boardName && db.studio.accounts.some(a => a.name === boardName) ? boardName : null;

        // Uploads go straight from the browser to file storage; this only hands out a one-time upload address.
        if (path === '/api/board/media-url' && req.method === 'POST') {
          if (!board) return json(401, { error: 'Please sign in again.' });
          const type = String(body.type || ''), ext = IMAGE_TYPES[type] || VIDEO_TYPES[type], size = Number(body.size) || 0;
          if (!ext) return json(415, { error: 'Please choose an MP4, WebM or MOV video, or a PNG, JPG, WebP or GIF picture.' });
          if (size > (IMAGE_TYPES[type] ? MAX_IMAGE : MAX_VIDEO)) return json(413, { error: IMAGE_TYPES[type] ? 'That picture is too big. Please use one under 15 MB.' : `That video is too big. Please use one under ${o.maxVideoMB || 50} MB.` });
          const name = rand(12) + ext;
          return json(200, { uploadUrl: await store.signUpload(name, type), ref: '/media/' + name });
        }
        const out = await C.handle(req.method, path, Object.fromEntries(url.searchParams), body,
          { db, board, couple: coupleId, now: new Date(), ip, tz: o.tz || '+08:00', hashPin, setupCode: db.studio.accounts.length ? null : setupCode });
        if (out.save) {
          try { await saveDb(db); }
          catch (e) { if (e.conflict && attempt < 5) { await new Promise(r => setTimeout(r, 40 + Math.random() * 120)); continue; } throw e; }
        }
        const headers = {};
        if (out.login) {
          const sid = token();
          await store.sessionSet(await sha256(sid), out.login.kind, String(out.login.value), Date.now() + SESSION_MS);
          headers['x-pixie-login'] = out.login.kind + ':' + sid;
        }
        if (out.logout) {
          const sid = req.headers.get(HEAD[out.logout]);
          if (sid) await store.sessionDel(await sha256(sid));
          headers['x-pixie-logout'] = out.logout;
        }
        return json(out.status, out.body, headers);
      }
    } catch (e) {
      console.error(e);
      return json(500, { error: 'Something went wrong on our side. Please try again in a minute.' });
    }
  };
}
if (typeof module === 'object' && module.exports) module.exports = { createApi };
