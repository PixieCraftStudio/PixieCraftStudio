'use strict';
// Try the GitHub Pages version on this computer, with a pretend Supabase kept in memory (nothing is saved when it stops).
// Usage: npm run pages-preview   then open http://localhost:4000/  (setup code 123456)
const http = require('http');
const fs = require('fs');
const path = require('path');
const Core = require('../core');
const { createApi } = require('./api');
const { memoryStore } = require('./memory-store');

const PORT = Number(process.env.PORT) || 4000, ORIGIN = 'http://localhost:' + PORT;
const DOCS = path.join(__dirname, '..', 'docs');
const store = memoryStore(ORIGIN);
const api = createApi({ Core, store, setupCode: process.env.SETUP_CODE || '123456', maxVideoMB: 50 });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, ORIGIN);
  if (url.pathname.startsWith('/functions/v1/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await api(new Request(ORIGIN + url.pathname.slice('/functions/v1'.length) + url.search,
      { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if (url.pathname.startsWith('/upload/') && req.method === 'PUT') {
    const chunks = []; for await (const c of req) chunks.push(c);
    store.files.set(url.pathname.slice(8), { type: req.headers['content-type'], data: Buffer.concat(chunks) });
    res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{}');
  }
  if (url.pathname.startsWith('/storage/v1/object/public/media/')) {
    const f = store.files.get(url.pathname.split('/').pop());
    if (!f) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': f.type }); return res.end(f.data);
  }
  if (url.pathname === '/config.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    return res.end(`window.PIXIE_CONFIG = { supabaseUrl: '${ORIGIN}', supabaseKey: 'local' };`);
  }
  const file = path.join(DOCS, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(DOCS)) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (e, d) => {
    if (e) return fs.readFile(path.join(DOCS, '404.html'), (e2, d2) => { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(d2); });
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(d);
  });
}).listen(PORT, () => console.log(`GitHub Pages version (pretend database): ${ORIGIN}/  · board setup code ${process.env.SETUP_CODE || '123456'}`));
