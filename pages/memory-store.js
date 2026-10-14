// A stand-in for Supabase, kept in memory, used by the tests and by "npm run pages-preview" to try the GitHub Pages version locally.
function memoryStore(uploadBase) {
  const rows = new Map(), sessions = new Map(), files = new Map();
  return {
    rows, files,
    async revs() { return [...rows].map(([key, r]) => ({ key, rev: r.rev })); },
    async values(keys) { return keys.filter(k => rows.has(k)).map(k => ({ key: k, rev: rows.get(k).rev, value: rows.get(k).value })); },
    async commit(changes) {
      for (const c of changes) {
        const r = rows.get(c.key);
        const ok = c.op === 'put' ? (c.rev === 0 ? !r : r && r.rev === c.rev) : r && r.rev === c.rev;
        if (!ok) { const e = new Error('pixie_conflict'); e.conflict = true; throw e; }
      }
      for (const c of changes) { if (c.op === 'del') rows.delete(c.key); else rows.set(c.key, { value: c.value, rev: c.rev + 1 }); }
      return true;
    },
    async sessionGet(h) { return sessions.get(h) || null; },
    async sessionSet(h, kind, value, expires) { sessions.set(h, { kind, value, expires }); },
    async sessionDel(h) { sessions.delete(h); },
    async signUpload(name) { return uploadBase + '/upload/' + name; },
  };
}
if (typeof module === 'object' && module.exports) module.exports = { memoryStore };
