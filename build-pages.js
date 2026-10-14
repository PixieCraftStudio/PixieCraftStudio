'use strict';
// Builds the GitHub Pages version:
//   docs/                           the website itself (GitHub Pages serves this folder)
//   supabase/functions/api/index.ts the website's API, pasted into a Supabase Edge Function
//   supabase/setup.sql              the database tables, run once in Supabase
// Usage: node build-pages.js
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const out = (f, s) => { fs.mkdirSync(path.dirname(path.join(__dirname, f)), { recursive: true }); fs.writeFileSync(path.join(__dirname, f), s); };
const copy = (from, to) => { fs.mkdirSync(path.dirname(path.join(__dirname, to)), { recursive: true }); fs.copyFileSync(path.join(__dirname, from), path.join(__dirname, to)); };

// ---------- the website ----------
const runtime = `
(function () {
  'use strict';
  // Settings come from config.js (the Supabase address and its public key).
  var cfg = window.PIXIE_CONFIG || {}, base = String(cfg.supabaseUrl || '').trim().replace(/\\/+$/, ''), anon = String(cfg.supabaseKey || '').trim();
  var ROUTE = location.hash.slice(1) || '/';
  var P = window.PIXIE = { pages: true, logo: 'studio-logo.png', bg: 'bg.jpg', storefront: 'storefront.jpg', maxVideoMB: 50 };
  P.resetHelp = 'In Supabase, open SQL Editor and run: update pixie_rows set value = \\'[]\\', rev = rev + 1 where key = \\'studio:accounts\\'; Then open the board again and set up a new name and password. Clients and guest lists are kept.';
  P.route = function () { var i = ROUTE.indexOf('?'); return { path: i < 0 ? ROUTE : ROUTE.slice(0, i), query: new URLSearchParams(i < 0 ? '' : ROUTE.slice(i + 1)) }; };
  P.link = function (p) { return location.href.split('#')[0] + '#' + p; };
  P.setFrame = function (iframe, url) { iframe.src = P.link(url); };
  window.addEventListener('hashchange', function () { location.reload(); });

  // Sign-ins are kept in this browser and sent with each request, because the website (GitHub) and its database (Supabase) are on different addresses.
  var SKEY = { board: 'pixie-signin-board', couple: 'pixie-signin-couple' };
  function sid(kind) { try { return localStorage.getItem(SKEY[kind]); } catch (e) { return null; } }
  var realFetch = window.fetch.bind(window);
  window.fetch = async function (url, opts) {
    if (typeof url !== 'string' || url.indexOf('/api/') !== 0) return realFetch(url, opts);
    opts = Object.assign({}, opts || {});
    var h = Object.assign({}, opts.headers || {});
    if (anon) { h.apikey = anon; h.Authorization = 'Bearer ' + anon; }
    ['board', 'couple'].forEach(function (k) { var s = sid(k); if (s) h['x-pixie-' + k] = s; });
    opts.headers = h; delete opts.credentials;
    var res = await realFetch(base + '/functions/v1' + url, opts);
    var login = res.headers.get('x-pixie-login'), logout = res.headers.get('x-pixie-logout');
    try {
      if (login) { var i = login.indexOf(':'); localStorage.setItem(SKEY[login.slice(0, i)], login.slice(i + 1)); }
      if (logout && SKEY[logout]) localStorage.removeItem(SKEY[logout]);
      if (res.status === 401 && /\\/api\\/board\\//.test(url)) localStorage.removeItem(SKEY.board);
    } catch (e) { /* private browsing */ }
    return res;
  };
  // Pictures and videos go straight to Supabase storage with a one-time upload address.
  P.uploadMedia = async function (file) {
    var type = file.type || 'video/mp4';
    var t = await P.api('POST', '/api/board/media-url', { type: type, size: file.size });
    var res;
    try { res = await realFetch(t.uploadUrl, { method: 'PUT', headers: Object.assign({ 'Content-Type': type, 'x-upsert': 'false' }, anon ? { apikey: anon } : {}), body: file }); }
    catch (e) { throw new Error('The upload stopped. Please check your internet and try again.'); }
    if (!res.ok) throw new Error(res.status === 413 ? 'That file is too big for the free Supabase plan (50 MB).' : 'Could not upload the file. Please try again.');
    return t.ref;
  };
  P.uploadVideo = P.uploadMedia;
  P.mediaUrl = async function (ref) { return ref && ref.indexOf('/media/') === 0 ? base + '/storage/v1/object/public/media/' + ref.slice(7) : ref; };

  // Which view this address opens: guest RSVP (#/w/.., #/r/..), couple's view (#/couple/..) or Pixie's RSVP Board (anything else).
  window.__startPixie = function (apps) {
    if (!base) {
      document.getElementById('app').innerHTML = '<div class="a-login"><div class="a-login-card"><h1>Almost there!</h1><p>Open <b>config.js</b> in this website’s GitHub folder and add your Supabase project address and public key. The steps are in PUBLISH.md.</p></div></div>';
      return;
    }
    var p = P.route().path;
    var kind = /^\\/(w|r)\\//.test(p) ? 'guest' : /^\\/couple\\//.test(p) ? 'couple' : 'board';
    document.body.className = kind === 'guest' ? 'guest' : 'admin';
    apps[kind]();
  };
})();
`;
const js = s => s.replace(/<\/script/gi, '<\\/script');
const app = `// Pixie Craft Studio RSVP, GitHub Pages version. Built by build-pages.js from core.js and public/*.js; edit those, not this file.
${read('core.js')}
${runtime}
${read('public/env.js')}
${read('public/ui.js')}
${read('public/editor.js')}
window.__startPixie({
guest: function () {
${read('public/guest.js')}
}, couple: function () {
${read('public/couple.js')}
}, board: function () {
${read('public/board.js')}
} });
`;
const fonts = read('public/index.html').match(/<link rel="preconnect"[^\n]*\n<link rel="stylesheet" href="https:\/\/fonts[^\n]*/)[0];
// GitHub Pages can't send security headers, so the page carries its own rules: scripts only from this site, data only from Supabase.
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; "
  + "img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="same-origin">
<title>Wedding RSVP</title>
<meta property="og:title" content="You’re invited · RSVP">
<meta property="og:description" content="Kindly let us know if you can celebrate with us.">
<link rel="icon" href="studio-logo.png">
${fonts}
<link rel="stylesheet" href="app.css">
</head>
<body>
<div id="app"></div>
<div id="modal"></div>
<div id="toast" aria-live="polite"></div>
<script src="config.js"></script>
<script src="app.js"></script>
</body>
</html>
`;
// Old-style addresses (…/w/name) are sent to the matching page of the site.
const notFound = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>RSVP</title>
<script>
(function () {
  var p = location.pathname, m = p.match(/^(.*?)\\/(w|r|couple|board)(\\/.*)?$/);
  if (m) location.replace(m[1] + '/#/' + m[2] + (m[3] || ''));
  else document.write('<p style="font-family:sans-serif;text-align:center;margin-top:20vh">Page not found.</p>');
})();
</script></head><body></body></html>
`;
out('docs/index.html', html);
out('docs/404.html', notFound);
out('docs/app.js', js(app));
out('docs/app.css', read('public/app.css'));
out('docs/.nojekyll', '');
for (const f of ['studio-logo.png', 'storefront.jpg', 'bg.jpg', 'logo.jpg']) copy('public/' + f, 'docs/' + f);
// docs/config.js is the one file to fill in on GitHub. It is only written when missing, so a rebuild never wipes the settings.
if (!fs.existsSync(path.join(__dirname, 'docs', 'config.js'))) out('docs/config.js', `// Fill these in with your Supabase project's details (Supabase > Project Settings > API), then commit.
// Both are safe to be public: the key only lets visitors call the website's API, never read the database directly.
window.PIXIE_CONFIG = {
  supabaseUrl: '',   // like https://abcdefghijklmnop.supabase.co
  supabaseKey: '',   // the "anon public" or "publishable" key
};
`);

// ---------- the API, as one file for the Supabase Edge Function ----------
const fn = `// @ts-nocheck
// Pixie Craft Studio RSVP: the website's API, running on Supabase. Built by build-pages.js from core.js and pages/*.js; edit those, not this file.
// Secrets it reads (Supabase > Edge Functions > Secrets): SETUP_CODE (your own 6 numbers, needed once to create the studio sign-in),
// optional ALLOWED_ORIGIN (your GitHub Pages address, e.g. https://yourname.github.io) and WEDDING_UTC_OFFSET (default +08:00).
const Core = (function () {
  const module = { exports: {} };
${read('core.js')}
  return module.exports;
})();
${read('pages/api.js').replace(/\nif \(typeof module[^\n]*\n?$/, '\n')}
${read('pages/supabase-store.js').replace(/\nif \(typeof module[^\n]*\n?$/, '\n')}
const handle = createApi({
  Core,
  store: supabaseStore(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
  setupCode: Deno.env.get('SETUP_CODE') || '',
  origin: Deno.env.get('ALLOWED_ORIGIN') || '*',
  tz: Deno.env.get('WEDDING_UTC_OFFSET') || '+08:00',
  maxVideoMB: 50,
});
Deno.serve(handle);
`;
out('supabase/functions/api/index.ts', fn);
out('supabase/config.toml', `project_id = "pixie-rsvp"

# Lets the website call the API without a Supabase user account (it has its own studio and couple sign-ins).
[functions.api]
verify_jwt = false
`);
if (fs.existsSync(path.join(__dirname, 'pages', 'setup.sql'))) copy('pages/setup.sql', 'supabase/setup.sql');
console.log('Built docs/ (website) and supabase/ (API and database setup).');
