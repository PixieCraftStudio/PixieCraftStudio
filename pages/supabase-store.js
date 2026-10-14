// Where the GitHub Pages version keeps its data: a Supabase project (Postgres tables made by supabase/setup.sql, and a "media"
// storage bucket for uploaded pictures and videos). Only the Edge Function uses the secret service key; the website itself never sees it.
function supabaseStore(base, key) {
  const head = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  async function rest(path, opts) {
    const res = await fetch(base + '/rest/v1/' + path, Object.assign({}, opts, { headers: Object.assign({}, head, (opts && opts.headers) || {}) }));
    const text = await res.text();
    if (!res.ok) {
      const e = new Error('Database error ' + res.status + ': ' + text.slice(0, 300));
      if (/pixie_conflict/.test(text)) e.conflict = true;
      throw e;
    }
    return text ? JSON.parse(text) : null;
  }
  const list = keys => '(' + keys.map(k => '"' + k.replace(/["\\]/g, '') + '"').join(',') + ')';
  return {
    revs: () => rest('pixie_rows?select=key,rev'),
    values: keys => rest('pixie_rows?select=key,rev,value&key=in.' + encodeURIComponent(list(keys))),
    // All changes in one database transaction (the pixie_commit function); it refuses if a row changed since it was read.
    commit: changes => rest('rpc/pixie_commit', { method: 'POST', body: JSON.stringify({ changes }) }),
    async sessionGet(hash) {
      const rows = await rest('pixie_sessions?select=kind,value,expires&sid_hash=eq.' + hash);
      return rows && rows[0] ? { kind: rows[0].kind, value: rows[0].value, expires: Number(rows[0].expires) } : null;
    },
    async sessionSet(hash, kind, value, expires) {
      await rest('pixie_sessions', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ sid_hash: hash, kind, value, expires }) });
      // Clear sign-ins that ran out, now and then.
      if (Math.random() < 0.05) await rest('pixie_sessions?expires=lt.' + Date.now(), { method: 'DELETE' }).catch(() => {});
    },
    sessionDel: hash => rest('pixie_sessions?sid_hash=eq.' + hash, { method: 'DELETE' }),
    async signUpload(name) {
      const res = await fetch(base + '/storage/v1/object/upload/sign/media/' + name, { method: 'POST', headers: head, body: '{}' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error('Could not prepare the upload: ' + JSON.stringify(data).slice(0, 200));
      return base + '/storage/v1' + data.url;
    },
  };
}
if (typeof module === 'object' && module.exports) module.exports = { supabaseStore };
