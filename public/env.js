// Small helpers shared by the guest website and the couple dashboard.
// The single-file version sets window.PIXIE before this file runs to swap in its own routing and storage.
(function () {
  'use strict';
  const P = window.PIXIE = window.PIXIE || {};
  P.bundle = !!P.bundle;
  P.logo = P.logo || '/studio-logo.png';
  P.storefront = P.storefront || '/storefront.jpg';
  P.bg = P.bg || '/bg.jpg';
  P.route = P.route || function () {
    return { path: location.pathname, query: new URLSearchParams(location.search) };
  };
  P.link = P.link || function (p) { return location.origin + p; };
  P.setFrame = P.setFrame || function (iframe, url) { iframe.src = url; };
  // Uploaded top-of-page video or design element. On the server it is sent as the raw file; the single-file version keeps it in this browser instead.
  P.uploadMedia = P.uploadMedia || async function (file) {
    let res, data = {};
    try { res = await fetch('/api/board/media', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.type || 'video/mp4' }, body: file }); }
    catch (e) { throw new Error('The upload stopped. Please check your internet and try again.'); }
    try { data = await res.json(); } catch (e) { /* empty */ }
    if (!res.ok) throw new Error(data.error || 'Could not upload the file.');
    return data.url || data.video;
  };
  P.uploadVideo = P.uploadVideo || P.uploadMedia;
  // Big photos are made smaller (longest side 1600px) before they are uploaded as design elements. GIFs are kept as they are.
  P.shrinkImage = function (file) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight, scale = Math.min(1, 1600 / Math.max(w, h));
        if (file.type === 'image/gif' || (scale === 1 && file.size < 3e6)) { URL.revokeObjectURL(url); return resolve({ blob: file, w, h }); }
        const cv = document.createElement('canvas'); cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        cv.toBlob(b => b ? resolve({ blob: b, w: cv.width, h: cv.height }) : reject(new Error('That picture could not be prepared.')), type, 0.9);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} could not be opened as a picture.`)); };
      img.src = url;
    });
  };
  P.mediaUrl = P.mediaUrl || async function (ref) { return ref; };

  P.api = async function (method, url, body) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    let res, data = {};
    try { res = await fetch(url, opts); } catch (e) { throw new Error('Could not connect. Please check your internet and try again.'); }
    try { data = await res.json(); } catch (e) { /* empty */ }
    if (!res.ok) { const e = new Error(data.error || 'Something went wrong. Please try again.'); e.status = res.status; throw e; }
    return data;
  };

  P.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  };

  // ---------- client look: colors, fonts, background ----------
  // Google Fonts styles to load for each family ('' = the one regular style).
  const AXES = {
    'Playfair Display': 'ital,wght@0,400;0,600;1,400;1,500', 'Cormorant Garamond': 'ital,wght@0,500;0,600;0,700;1,500;1,600', 'Bodoni Moda': 'ital,wght@0,400;0,600;1,400;1,500',
    'Cinzel': 'wght@400;600', 'Cinzel Decorative': 'wght@400;700', 'Dancing Script': 'wght@400;600', 'Lora': 'ital,wght@0,400;0,600;0,700;1,400',
    'EB Garamond': 'ital,wght@0,400;0,600;0,700;1,400', 'Crimson Pro': 'ital,wght@0,400;0,600;0,700;1,400', 'Libre Baskerville': 'ital,wght@0,400;0,700;1,400',
    'Nunito Sans': 'wght@400;600;700', 'Montserrat': 'ital,wght@0,400;0,600;0,700;1,400', 'Josefin Sans': 'ital,wght@0,400;0,600;1,400', 'Raleway': 'ital,wght@0,400;0,600;1,400',
    'Quicksand': 'wght@400;600', 'Libre Caslon Display': '', 'DM Serif Display': 'ital@0;1', 'Gloock': '', 'Prata': '', 'Gilda Display': '', 'Marcellus': '', 'Forum': '',
    'Della Respira': '', 'Bellefair': '', 'Italiana': '', 'Tenor Sans': '', 'Great Vibes': '', 'Parisienne': '', 'Pinyon Script': '', 'Alex Brush': '', 'Allura': '',
    'Tangerine': 'wght@400;700', 'Italianno': '', 'Monsieur La Doulaise': '', 'Petit Formal Script': '', 'Mrs Saint Delafield': '', 'Rouge Script': '', 'Imperial Script': '',
    'Ballet': '', 'WindSong': '', 'Corinthia': '', 'Luxurious Script': '', 'Herr Von Muellerhoff': '',
  };
  P.FONT_FAMILIES = Object.keys(AXES);
  // The studio's own uploaded font is registered under this name.
  const CUSTOM = 'My uploaded font', CUSTOM_FAMILY = 'PixieUploadedFont';
  let customLoaded = '';
  P.loadCustomFont = function (f) {
    if (!f || !f.data || customLoaded === f.data || !window.FontFace) return;
    customLoaded = f.data;
    new FontFace(CUSTOM_FAMILY, `url(${f.data})`).load().then(face => document.fonts.add(face)).catch(() => {});
  };
  P.fontFamily = n => n === CUSTOM ? CUSTOM_FAMILY : n;
  P.loadFonts = function (names) {
    const fams = [...new Set(names)].filter(n => n in AXES).map(n => 'family=' + n.replace(/ /g, '+') + (AXES[n] ? ':' + AXES[n] : ''));
    if (!fams.length) return;
    const href = 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap';
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  };
  const SERIF = "'Cormorant Garamond', Georgia, serif";
  P.applyTheme = function (el, t) {
    if (!t) return;
    const c = t.colors || {};
    const set = (k, v) => v && el.style.setProperty(k, v);
    set('--g-ink', c.heading); set('--g-rose', c.text); set('--g-pink', c.button); set('--g-pink-light', c.accent);
    if (c.card) set('--g-card', c.card + 'f2');
    const fam = P.fontFamily;
    P.loadCustomFont(t.customFont);
    set('--display', `'${fam(t.headingFont)}', ${SERIF}`);
    set('--serif', `'${fam(t.bodyFont)}', ${SERIF}`);
    if (c.card) set('--g-paper', c.card);
    set('--g-script', `'${fam(t.scriptFont || 'Great Vibes')}', 'Great Vibes', cursive`);
    set('--g-head-style', t.headingItalic ? 'italic' : 'normal');
    el.dataset.script = t.scriptFont || 'Great Vibes';
    el.dataset.heading = t.headingFont || '';
    el.dataset.body = t.bodyFont || '';
    el.dataset.hide = ((t.decor && t.decor.hide) || []).join(' ');
    const sz = t.sizes || {}, fx = t.effects || {}, card = t.cardSize || {};
    for (const k of ['names', 'titles', 'text']) el.style.setProperty('--g-fs-' + k, String((sz[k] || 100) / 100));
    el.dataset.fxNames = fx.names || 'none'; el.dataset.fxTitles = fx.titles || 'none';
    el.style.setProperty('--g-zoom-d', String((card.desktop || 100) / 100));
    el.style.setProperty('--g-zoom-m', String((card.mobile || 90) / 100));
    P.loadFonts([t.headingFont, t.bodyFont, t.scriptFont || 'Great Vibes', 'Montserrat', 'Great Vibes']);
  };
  P.paintBackground = function (el, t) {
    if (!el || !t) return;
    el.dataset.bg = t.background;
    el.classList.toggle('is-sharp', !t.blur);
    el.style.backgroundImage = t.background === 'garden' ? `url("${P.bg}")` : t.background === 'custom' && t.customBg ? `url("${t.customBg}")` : '';
  };

  // Wreath crest with the couple's initials, used when no logo has been uploaded.
  let m = 0;
  P.monogram = function (couple, cls) {
    const names = String(couple || '').split(/\s*(?:&|\band\b|\+)\s*/i).filter(Boolean);
    const ini = names.slice(0, 2).map(x => x.trim().charAt(0).toUpperCase());
    const id = 'mg' + (++m);
    let leaves = '', blooms = '';
    for (let i = 0; i < 26; i++) {
      const a = (-70 + i * 12.2) * Math.PI / 180, side = i % 2 ? 1 : -1;
      const r = 66 + side * 4, x = 100 + Math.cos(a) * r, y = 98 + Math.sin(a) * r;
      const rot = (a * 180 / Math.PI) + 90 + side * 35;
      if (i < 13 || i > 13) leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="3.6" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i % 3 ? '#a9bf9f' : '#c9d6bf'}" opacity=".85"/>`;
    }
    const flower = (deg, r, col) => {
      const a = deg * Math.PI / 180, x = 100 + Math.cos(a) * 66, y = 98 + Math.sin(a) * 66;
      let p = '';
      for (let k = 0; k < 5; k++) { const b = k * 72 * Math.PI / 180; p += `<circle cx="${(x + Math.cos(b) * r * .55).toFixed(1)}" cy="${(y + Math.sin(b) * r * .55).toFixed(1)}" r="${(r * .5).toFixed(1)}" fill="${col}" opacity=".8"/>`; }
      return p + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * .25).toFixed(1)}" fill="#e6c25e"/>`;
    };
    blooms = flower(200, 11, '#f2b8c6') + flower(225, 8, '#f6dd8f') + flower(160, 9, '#f4c7b4') + flower(-20, 11, '#f2b8c6') + flower(15, 8, '#bcd0e8') + flower(-45, 8, '#f6dd8f') + flower(45, 9, '#f4c7b4');
    const bow = '<path d="M100 166c-10-8-24-6-22 2s14 4 22-2zm0 0c10-8 24-6 22 2s-14 4-22-2z" fill="none" stroke="#c9d6bf" stroke-width="2.4"/><path d="M100 166l-12 22M100 166l12 22" stroke="#c9d6bf" stroke-width="2.4" stroke-linecap="round"/>';
    const letters = ini.length === 2
      ? `<text x="84" y="108" font-size="52" text-anchor="middle">${P.esc(ini[0])}</text><text x="100" y="114" font-size="20" text-anchor="middle">&amp;</text><text x="117" y="126" font-size="52" text-anchor="middle">${P.esc(ini[1])}</text>`
      : `<text x="100" y="118" font-size="58" text-anchor="middle">${P.esc(ini[0] || '♡')}</text>`;
    return `<svg class="${cls || ''}" viewBox="0 0 200 200" role="img" aria-label="${P.esc(couple)}">
      <defs><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="${m * 5}"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs>
      <g filter="url(#${id})">${leaves}${blooms}${bow}</g>
      <circle cx="100" cy="98" r="44" fill="none" stroke="#d9c7a0" stroke-width=".8" opacity=".7"/>
      <g fill="#8c9a86" font-family="'Bodoni Moda', 'Playfair Display', Georgia, serif" font-style="italic" opacity=".92">${letters}</g></svg>`;
  };

  // Soft watercolor flower cluster used as a corner decoration.
  let n = 0;
  P.floral = function (cls) {
    const id = 'wc' + (++n);
    const flower = (x, y, r, color, rot) => {
      let petals = '';
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 + rot) * Math.PI / 180;
        petals += `<ellipse cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" rx="${(r * 0.55).toFixed(1)}" ry="${(r * 0.42).toFixed(1)}" transform="rotate(${i * 72 + rot} ${(x + Math.cos(a) * r * 0.62).toFixed(1)} ${(y + Math.sin(a) * r * 0.62).toFixed(1)})" fill="${color}" opacity=".5"/>`;
      }
      return petals + `<circle cx="${x}" cy="${y}" r="${(r * 0.2).toFixed(1)}" fill="#d9b25c" opacity=".75"/>`;
    };
    const leaf = (x, y, rx, ry, rot) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#a9bf9f" opacity=".55"/>`;
    return `<svg class="${cls || ''}" viewBox="0 0 220 220" aria-hidden="true" focusable="false">
      <defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="${n * 7}"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter></defs>
      <g filter="url(#${id})">
        ${leaf(70, 120, 34, 11, -35)}${leaf(132, 62, 30, 10, -70)}${leaf(150, 140, 28, 9, 20)}${leaf(40, 60, 26, 8, 45)}
        ${flower(88, 82, 46, '#eaa3b5', 10)}${flower(150, 108, 30, '#f2b9a1', 40)}${flower(48, 150, 24, '#e9b6c4', 70)}
        <circle cx="178" cy="60" r="5" fill="#d9b25c" opacity=".55"/><circle cx="118" cy="168" r="4" fill="#e7967f" opacity=".5"/><circle cx="24" cy="100" r="3.5" fill="#d9b25c" opacity=".5"/>
      </g></svg>`;
  };
})();
