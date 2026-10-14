// "Edit website": Canva-style editing of the couple's view and the board, right on the page. Only the signed-in studio gets it.
// Click anything to select it, drag to move, pull the corners to resize, the knob to turn, double-click words to retype them.
// The studio can also add its own uploaded elements and text boxes, change colors and fonts, and hide parts.
// Moves are kept separately for computers and phones, so each layout can be arranged on its own.
// Changes are studio-wide: an edit on one couple's view shows on every couple's view. Couples and guests only see the saved result.
(function () {
  'use strict';
  const P = window.PIXIE, esc = P.esc, U = window.PixieUI;
  const PAGE_NAMES = { couple: 'Couple’s view · all couples', board: 'Pixie’s RSVP Board' };
  const COLORS = [['pink', '--b-pink', 'Pink'], ['pinkDark', '--b-pink-dark', 'Deep pink'], ['cream', '--b-cream', 'Cream'],
    ['olive', '--b-olive', 'Olive'], ['sage', '--b-sage', 'Sage'], ['sand', '--b-sand', 'Sand'], ['yellow', '--b-yellow', 'Butter'], ['text', '', 'Text']];
  const FONTS = ['Italianno', 'Della Respira', 'Great Vibes', 'Gloock', 'Poppins', 'Montserrat', 'Cormorant Garamond', 'Playfair Display', 'Bodoni Moda', 'Lora',
    'EB Garamond', 'Libre Baskerville', 'Prata', 'Marcellus', 'Cinzel', 'DM Serif Display', 'Italiana', 'Tenor Sans', 'Nunito Sans', 'Josefin Sans', 'Raleway', 'Quicksand',
    'Pinyon Script', 'Parisienne', 'Alex Brush', 'Allura', 'Dancing Script', 'Tangerine', 'Monsieur La Doulaise', 'Petit Formal Script', 'Imperial Script', 'Corinthia'];
  const TEXT_PRESETS = [
    { k: 'heading', label: 'Add a heading', font: 'Italianno', size: 6, w: 50, color: '#646446' },
    { k: 'sub', label: 'Add a subheading', font: 'Gloock', size: 2.6, w: 40, color: '#4a443a' },
    { k: 'body', label: 'Add a little body text', font: 'Poppins', size: 1.2, w: 30, color: '#4a443a' },
    { k: 'script', label: 'Add a script line', font: 'Great Vibes', size: 3.2, w: 34, color: '#b9698b' },
  ];
  // Parts that hold each couple's own data (names, guest lists, numbers). Their words are not retyped here, only restyled or moved.
  const NO_TEXT = '[data-noedit], [data-region="list"], .c-names, .c-top-names, .c-count, .c-fams, .c-tile b, .b-clients, .b-client, .c-link code, .a-chip span';
  const STATE_CLASS = /^(is-|has-|yes$|no$|wait$|attending$|not_attending$|awaiting$)/;
  const PHONE = '(max-width: 560px)';
  const clone = o => JSON.parse(JSON.stringify(o));
  const empty = () => ({ colors: {}, fonts: {}, texts: {}, styles: {}, decor: [] });
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const r2 = v => Math.round(v * 100) / 100;
  const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  // Line icons, drawn in the current text color.
  const I = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    upload: '<path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
    text: '<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7.2" r="1.1"/><circle cx="14.5" cy="7.2" r="1.1"/>',
    layers: '<path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>',
    flip: '<path d="M12 3v18" stroke-dasharray="2 2.5"/><path d="M9 7 4 17h5z"/><path d="m15 7 5 10h-5z"/>',
    front: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5H6a2 2 0 0 0-2 2v9" stroke-dasharray="2 2.5"/>',
    back: '<rect x="4" y="4" width="11" height="11" rx="2" stroke-dasharray="2 2.5"/><path d="M9 20h9a2 2 0 0 0 2-2V9"/>',
    hide: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 22 12a16 16 0 0 1-3.2 4.2M6.6 6.6A16 16 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5"/>',
    parent: '<rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="2.5 2.5"/><rect x="8" y="8" width="8" height="8" rx="1.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 9"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
    desktop: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
    sparkle: '<path d="M12 3.5l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    alignL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', alignC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', alignR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.4-5.7L20 8.5"/><path d="M20 3.5v5h-5"/>',
    pointer: '<path d="m5 3 14 7-6 2-2 6z"/>',
    fill: '<path d="m5 12 7-7 7 7-7 7z"/><path d="M19 15.5c0 1.4.9 2.5 2 2.5"/>',
    opacity: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17" /><path d="M12 7h4M12 11h6M12 15h5"/>',
  };
  const ic = k => `<svg class="x-ic" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;

  const E = { page: '', root: null, canEdit: false, cur: empty(), saved: empty(), full: null, lib: [], open: false, mode: 'edit', sel: null,
    panel: null, replace: false, undo: [], redo: [], lastRemember: 0, busy: false, saving: false, dev: 'd', inline: null };
  const ORIG = new WeakMap();
  let observer = null, styleTag = null, front = null, back = null, fab = null, queued = false;
  let ui = null, bar = null, rail = null, fly = null, tb = null, hl = null, hover = null, guide = null, chip = null;

  // ---------- show the saved look (everyone) ----------
  P.siteStart = function (opts) {
    const first = !E.root;
    if (E.page !== opts.page) E.savedHere = false;
    E.page = opts.page; E.root = opts.root; E.canEdit = !!opts.canEdit;
    // After a save in the editor this page already shows the newest edits; otherwise take what the page loaded.
    if (!E.open && !E.savedHere) { E.cur = clone((opts.site && opts.site.pages && opts.site.pages[opts.page]) || empty()); E.saved = clone(E.cur); }
    if (first) {
      styleTag = document.createElement('style'); styleTag.id = 'x-site-style'; document.head.appendChild(styleTag);
      front = layerBox('x-decor x-decor-front'); back = layerBox('x-decor x-decor-back');
      observer = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; applyContent(); }); } });
      observer.observe(E.root, { childList: true, subtree: true });
      addEventListener('resize', () => { const d = matchMedia(PHONE).matches ? 'm' : 'd'; if (E.open && d !== E.dev) { E.dev = d; drawBar(); } placeHl(); });
      addEventListener('scroll', () => placeHl(), { passive: true });
    }
    if (E.canEdit && !fab) {
      fab = document.createElement('button');
      fab.className = 'x-fab x-ui'; fab.type = 'button'; fab.innerHTML = ic('sparkle') + '<span>Edit website</span>';
      fab.addEventListener('click', openEditor);
      document.body.appendChild(fab);
    }
    if (fab) fab.hidden = !E.canEdit || E.open;
    applyAll();
  };
  function layerBox(cls) { const d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); document.body.appendChild(d); return d; }

  function applyAll() { applyLook(); applyContent(); paintDecor(); }
  // Moves, sizes and turns of a part, for one layout (computer or phone).
  function boxCss(o) {
    const r = [];
    if (!o) return r;
    if (o.x || o.y) r.push(`translate:${o.x || 0}px ${o.y || 0}px`);
    if (o.s && o.s !== 1) r.push('scale:' + o.s);
    if (o.r) r.push(`rotate:${o.r}deg`);
    if (o.w) r.push(`width:${o.w}px`, 'max-width:none', 'min-width:0', 'flex:0 0 auto', 'box-sizing:border-box');
    return r;
  }
  function applyLook() {
    const c = E.cur, b = document.body;
    for (const [k, v] of COLORS) { const val = c.colors[k]; if (k === 'text') b.style.color = val || ''; else if (val) b.style.setProperty(v, val); else b.style.removeProperty(v); }
    if (c.fonts.display) b.style.setProperty('--b-display', `'${c.fonts.display}', Georgia, serif`); else b.style.removeProperty('--b-display');
    if (c.fonts.sans) b.style.setProperty('--sans', `'${c.fonts.sans}', system-ui, sans-serif`); else b.style.removeProperty('--sans');
    const used = [c.fonts.display, c.fonts.sans, ...Object.values(c.styles).map(s => s.font), ...c.decor.map(e => e.font)].filter(Boolean);
    if (used.length) P.loadFonts(used);
    const css = [], desk = [], phone = [];
    const rule = (sel, list) => `#app ${sel}{${list.map(x => x + ' !important').join(';')}}`;
    for (const [sel, s] of Object.entries(c.styles)) {
      const r = [];
      if (s.hide) r.push('display:none');
      if (s.color) r.push('color:' + s.color);
      if (s.bg) r.push('background:' + s.bg);
      if (s.size) r.push('font-size:' + s.size + 'px');
      if (s.font) r.push(`font-family:'${s.font}', Georgia, serif`);
      if (s.bold !== undefined) r.push('font-weight:' + (s.bold ? 700 : 400));
      if (s.italic !== undefined) r.push('font-style:' + (s.italic ? 'italic' : 'normal'));
      if (s.align) r.push('text-align:' + s.align);
      if (s.z) { r.push('z-index:36'); if (s.zr) r.push('position:relative'); }
      if (r.length) css.push(rule(sel, r));
      const d = boxCss(s.d), m = boxCss(s.m);
      if (d.length) desk.push(rule(sel, d));
      if (m.length) phone.push(rule(sel, m));
    }
    styleTag.textContent = css.join('\n') + (desk.length ? `\n@media (min-width: 561px){${desk.join('\n')}}` : '') + (phone.length ? `\n@media ${PHONE}{${phone.join('\n')}}` : '');
  }
  // Words and pictures inside the page. Runs again whenever the page redraws itself.
  function applyContent() {
    if (!E.root) return;
    observer.disconnect();
    const t = E.cur.texts;
    const walk = document.createTreeWalker(E.root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && !n.parentElement.closest('input, textarea, select, script, style, .x-ui, ' + NO_TEXT) ? 1 : 2 });
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const tracked = ORIG.has(n), orig = tracked ? ORIG.get(n) : norm(n.data);
      if (!orig) continue;
      if (has(t, orig)) { if (norm(n.data) !== t[orig] || !tracked) { setData(n, t[orig]); ORIG.set(n, orig); } }
      else if (tracked && norm(n.data) !== orig) setData(n, orig);
    }
    for (const [sel, s] of Object.entries(E.cur.styles)) {
      if (!s.img) continue;
      let list; try { list = E.root.querySelectorAll(sel); } catch (e) { continue; }
      P.mediaUrl(s.img).then(src => { if (!src) return; list.forEach(el => { if (el.tagName === 'IMG') { if (el.getAttribute('src') !== src) el.src = src; } else el.style.backgroundImage = `url("${src}")`; }); }).catch(() => {});
    }
    observer.observe(E.root, { childList: true, subtree: true });
    if (E.sel && E.sel.type === 'part' && !(E.sel.el && E.sel.el.isConnected)) E.sel.el = findPart(E.sel.sel, E.sel.index);
    placeHl();
  }
  function setData(n, text) { const m = n.data.match(/^(\s*)[\s\S]*?(\s*)$/); n.data = m[1] + text + m[2]; }

  // ---------- free elements (pictures and text boxes), placed in hundredths of the page width ----------
  const elTransform = e => `translate(-50%,-50%) rotate(${e.rot || 0}deg)${e.flip ? ' scaleX(-1)' : ''}`;
  function elHtml(e) {
    const on = E.open && E.sel && E.sel.type === 'el' && E.sel.id === e.id;
    const inner = e.type === 'image' ? `<img alt="" draggable="false" data-src="${esc(e.src)}">`
      : `<div class="x-el-t" style="font-family:'${esc(e.font)}', Georgia, serif;color:${esc(e.color)};font-size:${e.size}cqw;font-weight:${e.bold ? 700 : 400};font-style:${e.italic ? 'italic' : 'normal'};text-align:${e.align || 'center'}">${esc(e.text)}</div>`;
    return `<div class="x-el ${on ? 'is-sel' : ''}" data-id="${esc(e.id)}" data-phone="${e.phone === false ? 0 : 1}" style="left:${e.x}cqw;top:${e.y}cqw;width:${e.w}cqw;opacity:${e.op};transform:${elTransform(e)}">${inner}</div>`;
  }
  function paintDecor() {
    if (!front) return;
    front.innerHTML = E.cur.decor.filter(e => e.layer !== 'behind').map(elHtml).join('');
    back.innerHTML = E.cur.decor.filter(e => e.layer === 'behind').map(elHtml).join('');
    for (const box of [front, back]) box.querySelectorAll('img[data-src]').forEach(async img => { const s = await P.mediaUrl(img.dataset.src).catch(() => null); if (s) { img.src = s; img.onload = placeHl; } });
  }
  const nodeOf = id => (front && front.querySelector(`[data-id="${id}"]`)) || (back && back.querySelector(`[data-id="${id}"]`));
  function updateNode(e) {
    const n = nodeOf(e.id); if (!n) return;
    Object.assign(n.style, { left: e.x + 'cqw', top: e.y + 'cqw', width: e.w + 'cqw', opacity: e.op, transform: elTransform(e) });
    const t = n.querySelector('.x-el-t'); if (t) t.style.fontSize = e.size + 'cqw';
  }

  // ---------- opening and closing the editor (studio only) ----------
  async function openEditor() {
    if (E.open) return;
    try {
      const st = (await P.api('GET', '/api/board/studio')).studio;
      E.full = st.site || null; E.lib = st.elements || [];
      E.cur = clone((E.full && E.full.pages && E.full.pages[E.page]) || empty()); E.saved = clone(E.cur);
    } catch (err) { U.toast(err.status === 401 ? 'Please sign in to Pixie’s RSVP Board first.' : err.message, 'error'); return; }
    E.open = true; E.mode = 'edit'; E.sel = null; E.undo = []; E.redo = []; E.panel = null; E.dev = matchMedia(PHONE).matches ? 'm' : 'd';
    document.body.classList.add('x-editing'); fab.hidden = true;
    ui = document.createElement('div'); ui.className = 'x-ui x-root';
    ui.innerHTML = '<div class="x-hover"></div><div class="x-guide"></div><div class="x-hl"></div><div class="x-chip"></div><div class="x-tb" role="toolbar" aria-label="Selected part"></div><nav class="x-rail" aria-label="Editor tools"></nav><aside class="x-fly"></aside><div class="x-bar"></div>';
    document.body.appendChild(ui);
    [hover, guide, hl, chip, tb, rail, fly, bar] = ['.x-hover', '.x-guide', '.x-hl', '.x-chip', '.x-tb', '.x-rail', '.x-fly', '.x-bar'].map(s => ui.querySelector(s));
    hl.innerHTML = ['nw', 'ne', 'sw', 'se'].map(h => `<span class="x-hd x-hd-c x-hd-${h}" data-h="${h}"></span>`).join('')
      + ['e', 'w'].map(h => `<span class="x-hd x-hd-side x-hd-${h}" data-h="${h}"></span>`).join('')
      + `<span class="x-hd x-hd-rot" data-h="rot" title="Drag to turn">${ic('rotate')}</span>`;
    ui.addEventListener('click', onUiClick); ui.addEventListener('input', onUiInput); ui.addEventListener('change', onUiChange);
    hl.addEventListener('pointerdown', onHlDown); hl.addEventListener('dblclick', e => { e.preventDefault(); inlineEdit(); });
    applyAll(); drawAll();
    U.toast('Click anything on the page to edit it.');
  }
  function closeEditor() {
    endInline(false);
    E.open = false; E.sel = null;
    document.body.classList.remove('x-editing'); fab.hidden = false;
    if (ui) ui.remove(); ui = bar = rail = fly = tb = hl = hover = guide = chip = null;
    applyAll();
  }
  const dirty = () => JSON.stringify(E.cur) !== JSON.stringify(E.saved);
  addEventListener('beforeunload', e => { if (E.open && dirty()) { e.preventDefault(); e.returnValue = ''; } });

  function remember(force) {
    const now = Date.now();
    if (!force && now - E.lastRemember < 700) return;
    E.lastRemember = now; E.undo.push(JSON.stringify(E.cur)); if (E.undo.length > 100) E.undo.shift(); E.redo = [];
  }
  // full: also redraw the toolbar and side panel. Typing, sliders and color pickers skip that so they keep their focus.
  function changed(full) { applyAll(); drawBar(); if (full !== false) { drawTb(); drawFly(); } placeHl(); }
  function drawAll() { drawBar(); drawRail(); drawFly(); drawTb(); placeHl(); }

  // ---------- picking parts of the page ----------
  const sig = n => n.tagName.toLowerCase() + [...n.classList].filter(c => /^[a-zA-Z][\w-]*$/.test(c) && !STATE_CLASS.test(c)).slice(0, 2).map(c => '.' + c).join('');
  // The clicked part, written as a CSS selector (classes and position), so the change still applies after the page redraws itself.
  function selectorFor(el) {
    const parts = [];
    let n = el, sel = '';
    while (n && n !== E.root && parts.length < 7) {
      let p = sig(n);
      const par = n.parentElement;
      if (par) {
        const like = [...par.children].filter(x => sig(x) === p);
        if (like.length > 1) p += `:nth-of-type(${[...par.children].filter(x => x.tagName === n.tagName).indexOf(n) + 1})`;
      }
      parts.unshift(p);
      sel = parts.join(' > ');
      let count = 2; try { count = E.root.querySelectorAll(sel).length; } catch (e) { /* keep climbing */ }
      if (count === 1 && (n.classList.length || parts.length > 2)) break;
      n = par;
    }
    while (sel.length > 240 && parts.length > 1) { parts.shift(); sel = parts.join(' > '); }
    return sel;
  }
  function findPart(sel, index) { try { const all = E.root.querySelectorAll(sel); return all[Math.min(index || 0, all.length - 1)] || null; } catch (e) { return null; } }
  // The words a part shows, when there is exactly one piece of wording in it.
  function textNodeOf(el) {
    if (!el || el.closest(NO_TEXT)) return null;
    const list = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => norm(n.data) && !n.parentElement.closest('input, textarea, select, ' + NO_TEXT) ? 1 : 2 });
    for (let n = walk.nextNode(); n; n = walk.nextNode()) list.push(n);
    return list.length === 1 ? list[0] : null;
  }
  const inPage = t => t && t.closest && E.root.contains(t) && !t.closest('.x-ui');
  function selectPart(el) {
    const sel = selectorFor(el);
    let index = 0; try { index = [...E.root.querySelectorAll(sel)].indexOf(el); } catch (err) { /* keep 0 */ }
    E.sel = { type: 'part', sel, el, index: Math.max(0, index) }; E.replace = false;
    paintDecor(); drawTb(); placeHl(); if (E.panel === 'uploads') drawFly();
  }
  function selectEl(id) { E.sel = { type: 'el', id }; E.replace = false; paintDecor(); drawTb(); placeHl(); }
  function deselect() { E.sel = null; E.replace = false; paintDecor(); drawTb(); placeHl(); }
  const selEl = () => E.sel && E.sel.type === 'el' ? E.cur.decor.find(x => x.id === E.sel.id) : null;
  const selStyle = () => E.sel && E.sel.type === 'part' ? (E.cur.styles[E.sel.sel] || {}) : {};
  const selNode = () => !E.sel ? null : E.sel.type === 'el' ? nodeOf(E.sel.id) : (E.sel.el && E.sel.el.isConnected ? E.sel.el : null);
  // This part's moves for the layout being edited (computer or phone).
  function boxOf(create) {
    const k = E.sel.sel, s = E.cur.styles[k] || {};
    if (!create) return s[E.dev] || {};
    s[E.dev] = Object.assign({}, s[E.dev] || {}); E.cur.styles[k] = s;
    return s[E.dev];
  }
  function tidy(sel) {
    const s = E.cur.styles[sel]; if (!s) return;
    for (const dv of ['d', 'm']) {
      const o = s[dv]; if (!o) continue;
      if (!o.x) delete o.x; if (!o.y) delete o.y; if (!o.r) delete o.r; if (o.s === 1) delete o.s;
      if (!Object.keys(o).length) delete s[dv];
    }
    for (const k of Object.keys(s)) if (s[k] === undefined || s[k] === '' || s[k] === false) delete s[k];
    if (!Object.keys(s).length) delete E.cur.styles[sel];
  }

  // The selection frame with its handles, and the toolbar that floats above it.
  function placeHl() {
    if (!hl) return;
    const n = E.open && E.mode === 'edit' && !E.inline ? selNode() : null;
    if (!n) { hl.style.display = 'none'; tb.style.display = 'none'; return; }
    const r = n.getBoundingClientRect();
    Object.assign(hl.style, { display: 'block', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
    hl.classList.toggle('is-small', r.width < 70 || r.height < 34);
    tb.style.display = 'flex';
    if (matchMedia(PHONE).matches) { tb.style.left = ''; tb.style.top = ''; return; }
    const tw = tb.offsetWidth, th = tb.offsetHeight;
    let top = r.top - th - 18; if (top < 10) top = Math.min(innerHeight - th - 110, r.bottom + 46);
    tb.style.left = clamp(r.left + r.width / 2 - tw / 2, 92, innerWidth - tw - 12) + 'px';
    tb.style.top = Math.max(10, top) + 'px';
  }

  // In edit mode a click picks a part instead of using it.
  document.addEventListener('mousedown', e => { if (E.open && E.mode === 'edit' && inPage(e.target)) e.preventDefault(); }, true);
  document.addEventListener('click', e => {
    if (!E.open || E.mode !== 'edit' || !inPage(e.target)) return;
    if (e.target.closest('.x-decor')) return;
    e.preventDefault(); e.stopPropagation();
    selectPart(e.target.nodeType === 1 ? e.target : e.target.parentElement);
  }, true);
  document.addEventListener('submit', e => { if (E.open && E.mode === 'edit' && inPage(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('mousemove', e => {
    if (!hover) return;
    const t = E.mode === 'edit' && !document.body.classList.contains('x-dragging') && inPage(e.target) && !e.target.closest('.x-decor') && e.target !== E.sel?.el ? e.target : null;
    if (!t) { hover.style.display = 'none'; return; }
    const r = t.getBoundingClientRect();
    Object.assign(hover.style, { display: 'block', left: r.left - 2 + 'px', top: r.top - 2 + 'px', width: r.width + 4 + 'px', height: r.height + 4 + 'px' });
  });
  document.addEventListener('keydown', e => {
    if (!E.open || E.inline || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); return doUndo(e.shiftKey); }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); return doUndo(true); }
    if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); return save(); }
    if (e.key === 'Escape') { if (E.panel) { E.panel = null; drawRail(); drawFly(); } else deselect(); return; }
    if (!E.sel || E.mode !== 'edit') return;
    const el = selEl(), mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv) {
      e.preventDefault(); remember();
      if (el) { const st = e.shiftKey ? 2 : 0.25; el.x = r2(el.x + mv[0] * st); el.y = r2(el.y + mv[1] * st); updateNode(el); }
      else { const st = e.shiftKey ? 10 : 1, o = boxOf(true); o.x = (o.x || 0) + mv[0] * st; o.y = (o.y || 0) + mv[1] * st; tidy(E.sel.sel); applyLook(); }
      drawBar(); return placeHl();
    }
    if (e.key === 'Enter') { e.preventDefault(); return inlineEdit(); }
    if ((e.ctrlKey || e.metaKey) && k === 'd' && el) { e.preventDefault(); return act('el-dup'); }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return act(el ? 'el-del' : 'part-hide'); }
  });

  // ---------- drag to move, resize and turn (pictures, text boxes and any part of the page) ----------
  document.addEventListener('pointerdown', e => {
    if (!E.open || E.mode !== 'edit' || E.inline) return;
    const box = e.target.closest && e.target.closest('.x-el'); if (!box) return;
    e.preventDefault();
    if (!(E.sel && E.sel.id === box.dataset.id)) selectEl(box.dataset.id);
    startDrag(e, 'move');
  });
  function onHlDown(e) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    startDrag(e, (e.target.closest('[data-h]') || {}).dataset?.h || 'move');
  }
  function startDrag(e, h) {
    const node = selNode(); if (!node) return;
    const isEl = E.sel.type === 'el', el = selEl();
    const r = node.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const W = document.documentElement.clientWidth / 100, p0 = { x: e.clientX, y: e.clientY }, d0 = Math.hypot(p0.x - cx, p0.y - cy) || 1;
    const b0 = isEl ? null : boxOf(false);
    const start = isEl ? { x: el.x, y: el.y, w: el.w, size: el.size, rot: el.rot || 0 }
      : { x: b0.x || 0, y: b0.y || 0, s: b0.s || 1, r: b0.r || 0, w: b0.w || node.offsetWidth, left: r.left, right: r.right };
    let moved = false, o = null;
    const move = ev => {
      const dx = ev.clientX - p0.x, dy = ev.clientY - p0.y;
      if (!moved) {
        if (Math.abs(dx) + Math.abs(dy) < 4) return;
        moved = true; remember(true); if (!isEl) o = boxOf(true);
        document.body.classList.add('x-dragging'); tb.style.visibility = 'hidden';
      }
      let label = '';
      if (h === 'move') {
        let nx = dx; const mid = document.documentElement.clientWidth / 2, snap = !ev.altKey && Math.abs(cx + dx - mid) < 7;
        if (snap) nx = mid - cx;
        guide.style.display = snap ? 'block' : 'none';
        if (isEl) { el.x = r2(start.x + nx / W); el.y = r2(start.y + dy / W); } else { o.x = Math.round(start.x + nx); o.y = Math.round(start.y + dy); }
      } else if (h === 'rot') {
        let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI - 90;
        a = ((a + 540) % 360) - 180; if (!ev.shiftKey) { a = Math.round(a); if (Math.abs(a % 45) < 4 || Math.abs(a % 45) > 41) a = Math.round(a / 45) * 45; }
        if (isEl) el.rot = a; else o.r = a;
        label = Math.round(a) + '°';
      } else if (h.length === 2) {
        const ratio = Math.max(0.05, Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0);
        if (isEl) { el.w = r2(clamp(start.w * ratio, 1, 400)); if (el.type === 'text') el.size = r2(clamp(start.size * ratio, 0.3, 60)); label = Math.round(el.w * W) + ' px'; }
        else { o.s = r2(clamp(start.s * ratio, 0.1, 6)); label = Math.round(o.s * 100) + '%'; }
      } else {
        const sign = h === 'e' ? 1 : -1;
        if (isEl) { el.w = r2(clamp(start.w + sign * dx * 2 / W, 1, 400)); label = Math.round(el.w * W) + ' px'; }
        else {
          o.w = Math.round(clamp(start.w + sign * dx / start.s, 10, 4000)); applyLook();
          // Keep the opposite edge where it was, however the page lines this part up.
          const rr = node.getBoundingClientRect(); o.x = Math.round((o.x || 0) + (h === 'e' ? start.left - rr.left : start.right - rr.right));
          label = o.w + ' px wide';
        }
      }
      if (isEl) updateNode(el); else applyLook();
      placeHl(); showChip(label, ev);
    };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      guide.style.display = 'none'; chip.style.display = 'none'; tb.style.visibility = '';
      document.body.classList.remove('x-dragging');
      if (moved) {
        if (isEl) { el.x = clamp(el.x, -200, 300); el.y = clamp(el.y, -400, 3000); } else tidy(E.sel.sel);
        changed();
      } else if (h === 'move' && !isEl) clickThrough(p0);
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  function showChip(label, ev) {
    if (!label) { chip.style.display = 'none'; return; }
    chip.textContent = label; Object.assign(chip.style, { display: 'block', left: ev.clientX + 16 + 'px', top: ev.clientY + 16 + 'px' });
  }
  // A click (no drag) on the selection frame: pick whatever is under the pointer, or start typing when it is the same words again.
  function clickThrough(p) {
    hl.style.pointerEvents = 'none';
    const t = document.elementFromPoint(p.x, p.y);
    hl.style.pointerEvents = '';
    if (!t) return;
    const box = t.closest('.x-el');
    if (box) return selectEl(box.dataset.id);
    if (!inPage(t)) return deselect();
    if (t === E.sel.el && textNodeOf(t)) return inlineEdit();
    selectPart(t);
  }

  // ---------- typing right on the page ----------
  function inlineEdit() {
    if (!E.sel || E.inline) return;
    const el = selEl();
    let target, text, node = null;
    if (el) { if (el.type !== 'text') return; target = nodeOf(el.id).querySelector('.x-el-t'); text = el.text; }
    else {
      node = textNodeOf(E.sel.el);
      if (!node) { U.toast(E.sel.el && E.sel.el.closest(NO_TEXT) ? 'These words come from each couple’s guest list, so they can’t be retyped.' : 'Click right on the words you want to change.'); return; }
      target = node.parentElement; text = norm(node.data);
    }
    const r = (el ? nodeOf(el.id) : target).getBoundingClientRect(), cs = getComputedStyle(target);
    const scale = el ? 1 : (boxOf(false).s || 1);
    const box = document.createElement('div');
    box.className = 'x-inline x-ui';
    try { box.contentEditable = 'plaintext-only'; } catch (e) { /* older browsers */ }
    if (box.contentEditable !== 'plaintext-only') box.contentEditable = 'true';
    box.textContent = text;
    Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', minWidth: Math.max(60, r.width) + 'px', minHeight: r.height + 'px',
      fontFamily: cs.fontFamily, fontSize: parseFloat(cs.fontSize) * scale + 'px', fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, color: cs.color,
      letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, textAlign: cs.textAlign, textTransform: cs.textTransform });
    ui.appendChild(box);
    E.inline = { box, el: el && el.id, node, orig: node ? (ORIG.get(node) || norm(node.data)) : '' };
    placeHl();
    box.focus();
    const rg = document.createRange(); rg.selectNodeContents(box); const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
    box.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); endInline(false); }
      if (ev.key === 'Enter' && (!el || !ev.shiftKey)) { ev.preventDefault(); endInline(true); }
    });
    box.addEventListener('blur', () => endInline(true));
  }
  function endInline(keep) {
    const it = E.inline; if (!it) return;
    E.inline = null;
    const v = it.box.textContent.replace(/\r/g, '');
    it.box.remove();
    if (keep) {
      if (it.el) {
        const el = E.cur.decor.find(x => x.id === it.el);
        if (el && v.trim() !== el.text) { remember(true); el.text = v.trim().slice(0, 400) || 'Your text'; }
      } else if (it.node) {
        const nv = norm(v);
        if (nv !== (has(E.cur.texts, it.orig) ? E.cur.texts[it.orig] : it.orig)) {
          remember(true);
          if (nv === it.orig) delete E.cur.texts[it.orig]; else E.cur.texts[it.orig] = nv;
          ORIG.set(it.node, it.orig); setData(it.node, nv);
        }
      }
    }
    if (ui) changed();
  }

  // ---------- the editor's own controls ----------
  function drawBar() {
    if (!bar) return;
    const d = dirty();
    bar.innerHTML = `<div class="x-brand">${ic('sparkle')}<div><b>Edit website</b><small>${esc(PAGE_NAMES[E.page] || '')}</small></div></div>
      <span class="x-sep"></span>
      <button type="button" class="x-ib" data-x="undo" ${E.undo.length ? '' : 'disabled'} title="Undo (Ctrl+Z)" aria-label="Undo">${ic('undo')}</button>
      <button type="button" class="x-ib" data-x="redo" ${E.redo.length ? '' : 'disabled'} title="Redo (Ctrl+Y)" aria-label="Redo">${ic('redo')}</button>
      <span class="x-sep"></span>
      <div class="x-seg" role="group" aria-label="Mode"><button type="button" data-x="mode" data-m="edit" aria-pressed="${E.mode === 'edit'}">${ic('pointer')}<span>Edit</span></button><button type="button" data-x="mode" data-m="preview" aria-pressed="${E.mode === 'preview'}">${ic('eye')}<span>Preview</span></button></div>
      <span class="x-dev" title="Moves and sizes are kept separately for computers and phones. Make the window narrow (or open the page on a phone) to arrange the phone layout.">${ic(E.dev === 'm' ? 'phone' : 'desktop')}<span>${E.dev === 'm' ? 'Phone layout' : 'Computer layout'}</span></span>
      <span class="x-grow"></span>
      <button type="button" class="x-btn x-btn-ghost" data-x="cancel">${d ? 'Discard' : 'Close'}</button>
      <button type="button" class="x-btn x-btn-main" data-x="save" ${d && !E.saving ? '' : 'disabled'}>${ic('check')}<span>${E.saving ? 'Saving…' : d ? 'Save' : 'Saved'}</span></button>`;
  }
  const RAIL = [['uploads', 'upload', 'Uploads'], ['text', 'text', 'Text'], ['styles', 'palette', 'Styles'], ['changes', 'layers', 'Changes']];
  function drawRail() {
    if (!rail) return;
    rail.innerHTML = RAIL.map(([k, icon, label]) => `<button type="button" data-x="panel" data-p="${k}" class="${E.panel === k ? 'is-on' : ''}" aria-pressed="${E.panel === k}">${ic(icon)}<span>${label}</span></button>`).join('');
  }
  function drawFly() {
    if (!fly) return;
    if (!E.panel || E.mode !== 'edit') { fly.classList.remove('is-open'); fly.innerHTML = ''; return; }
    const scroll = (fly.querySelector('.x-fly-body') || {}).scrollTop || 0;
    const title = { uploads: E.replace ? 'Replace the picture' : 'My elements', text: 'Text', styles: 'Page colors & fonts', changes: 'Your changes' }[E.panel];
    fly.innerHTML = `<header><h2>${title}</h2><button type="button" class="x-ib" data-x="panel" data-p="${E.panel}" aria-label="Close panel">${ic('close')}</button></header>
      <div class="x-fly-body">${{ uploads: flyUploads, text: flyText, styles: flyStyles, changes: flyChanges }[E.panel]()}</div>`;
    fly.classList.add('is-open');
    fly.querySelectorAll('img[data-src]').forEach(async img => { const s = await P.mediaUrl(img.dataset.src).catch(() => null); if (s) img.src = s; });
    const body = fly.querySelector('.x-fly-body'); if (body) body.scrollTop = scroll;
  }
  function flyUploads() {
    const cur = E.replace ? selStyle().img : null;
    return `<label class="x-drop"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple data-x="upload">${ic('upload')}
        <b>${E.busy ? 'Uploading…' : 'Upload pictures'}</b><small>PNG with a see-through background works best · JPG, WebP, GIF</small></label>
      ${E.replace ? `<p class="x-note">Pick a picture to put in place of the selected one.${cur ? ' <button type="button" class="x-link" data-x="part-img-reset">Use the original</button>' : ''}</p>` : '<p class="x-note">Click an element to place it on the page, then drag it anywhere.</p>'}
      ${E.lib.length ? `<div class="x-grid">${E.lib.slice().reverse().map(x => `<div class="x-tile ${cur === x.src ? 'is-on' : ''}">
          <button type="button" data-x="${E.replace ? 'part-img' : 'add-el'}" data-id="${esc(x.id)}" title="${esc(x.name)}"><img alt="${esc(x.name)}" data-src="${esc(x.src)}"></button>
          <button type="button" class="x-tile-x" data-x="lib-remove" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.name)} from My elements">${ic('close')}</button></div>`).join('')}</div>`
        : '<div class="x-empty">Your uploaded flowers, frames, stickers and photos will show here.</div>'}`;
  }
  function flyText() {
    return `<div class="x-presets">${TEXT_PRESETS.map(t => `<button type="button" data-x="add-text" data-k="${t.k}" style="font-family:'${t.font}', serif;color:${t.color}" class="x-preset x-preset-${t.k}">${esc(t.label)}</button>`).join('')}</div>
      <p class="x-note">To change the website’s own words, double-click them on the page and type.</p>`;
  }
  function flyStyles() {
    const c = E.cur, cs = getComputedStyle(document.body);
    const colorVal = (k, v) => c.colors[k] || toHex(k === 'text' ? cs.color : cs.getPropertyValue(v)) || '#000000';
    const fontSel = (name, val) => `<select data-x="${name}"><option value="">Design font</option>${FONTS.map(f => `<option ${val === f ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}</select>`;
    return `<h3>Colors</h3><div class="x-swatches">${COLORS.map(([k, v, l]) => `<label class="x-sw"><input type="color" data-x="color" data-k="${k}" value="${colorVal(k, v)}"><span>${l}</span></label>`).join('')}</div>
      <h3>Fonts</h3>
      <label class="x-fl"><span>Titles</span>${fontSel('font-display', c.fonts.display)}</label>
      <label class="x-fl"><span>Text</span>${fontSel('font-sans', c.fonts.sans)}</label>
      ${Object.keys(c.colors).length || Object.keys(c.fonts).length ? `<button type="button" class="x-btn x-btn-ghost x-wide" data-x="reset-look">${ic('reset')}<span>Back to the design colors and fonts</span></button>` : ''}`;
  }
  function flyChanges() {
    const st = Object.entries(E.cur.styles), words = Object.entries(E.cur.texts);
    const hidden = st.filter(([, s]) => s.hide), moved = st.filter(([, s]) => s.d || s.m), looks = st.filter(([, s]) => !s.hide && Object.keys(s).some(k => !['d', 'm'].includes(k)));
    const row = (label, btn) => `<li><span>${label}</span>${btn}</li>`;
    const sec = (title, list) => list.length ? `<h3>${title}</h3><ul class="x-list">${list.join('')}</ul>` : '';
    const out = sec('Hidden', hidden.map(([s]) => row(esc(prettySel(s)), `<button type="button" class="x-chipbtn" data-x="unhide" data-s="${esc(s)}">${ic('eye')}Show</button>`)))
      + sec('Moved or resized', moved.map(([s, v]) => row(`${esc(prettySel(s))} <small>${[v.d ? 'computer' : '', v.m ? 'phone' : ''].filter(Boolean).join(' & ')}</small>`, `<button type="button" class="x-chipbtn" data-x="unmove" data-s="${esc(s)}">${ic('reset')}Put back</button>`)))
      + sec('Restyled', looks.map(([s]) => row(esc(prettySel(s)), `<button type="button" class="x-chipbtn" data-x="unlook" data-s="${esc(s)}">${ic('reset')}Reset</button>`)))
      + sec('Changed words', words.map(([a, b]) => row(`<s>${esc(a.slice(0, 40))}</s> ${esc(b.slice(0, 40)) || '<i>(empty)</i>'}`, `<button type="button" class="x-chipbtn" data-x="unword" data-t="${esc(a)}">${ic('reset')}Undo</button>`)))
      + sec('Added elements', E.cur.decor.map(e => row(e.type === 'text' ? `“${esc(e.text.slice(0, 30))}”` : 'Picture', `<button type="button" class="x-chipbtn" data-x="pick-el" data-id="${esc(e.id)}">${ic('pointer')}Select</button>`)));
    return (out || '<div class="x-empty">Nothing changed yet. Click anything on the page to start.</div>')
      + (out ? `<button type="button" class="x-btn x-btn-ghost x-wide x-danger" data-x="reset-all">${ic('reset')}<span>Start over on this page</span></button>` : '');
  }
  const prettySel = s => {
    const last = s.split(' > ').pop(), n = (last.match(/:nth-of-type\((\d+)\)/) || [])[1];
    const name = last.replace(/:nth-of-type\(\d+\)/, '').replace(/^[a-z0-9]+\.?/, '').split('.')[0].replace(/^(c|b|a|x|g)-/, '').replace(/[-_]/g, ' ').trim();
    const tag = last.match(/^[a-z0-9]+/)[0], words = { h1: 'title', h2: 'heading', h3: 'heading', p: 'text', img: 'picture', button: 'button', a: 'link', span: 'text', li: 'row', ul: 'list', section: 'box', div: 'box', header: 'top bar', footer: 'footer', nav: 'menu', svg: 'icon', b: 'bold text', small: 'small text' };
    return (name || words[tag] || tag) + (n ? ' ' + n : '');
  };
  function toHex(v) {
    v = String(v || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(x => x + x).join('').toLowerCase();
    if (/^rgba\(.*,\s*0\)$/.test(v) || v === 'transparent') return '';
    const m = v.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
    return m ? '#' + [m[1], m[2], m[3]].map(x => Number(x).toString(16).padStart(2, '0')).join('') : '';
  }

  // The floating toolbar for whatever is selected.
  function drawTb() {
    if (!tb) return;
    if (!E.sel || E.mode !== 'edit') { tb.innerHTML = ''; tb.style.display = 'none'; return; }
    const ib = (x, icon, title, on, extra) => `<button type="button" class="x-ib ${on ? 'is-on' : ''}" data-x="${x}" ${extra || ''} title="${title}" aria-label="${title}" ${on !== undefined ? `aria-pressed="${!!on}"` : ''}>${I[icon] ? ic(icon) : icon}</button>`;
    const fontSel = (x, val, design) => `<select class="x-font" data-x="${x}" title="Font">${design ? '<option value="">Design font</option>' : ''}${FONTS.map(f => `<option ${val === f ? 'selected' : ''}>${f}</option>`).join('')}</select>`;
    const size = (val, unit) => `<div class="x-size"><button type="button" data-x="size-down" aria-label="Smaller text">${ic('minus')}</button><span>${val}${unit}</span><button type="button" data-x="size-up" aria-label="Bigger text">${ic('plus')}</button></div>`;
    const swatch = (x, val, title, kind) => `<label class="x-swatch x-swatch-${kind}" title="${title}"><input type="color" data-x="${x}" value="${val}"><span style="--sw:${val}"></span></label>`;
    const sep = '<span class="x-sep"></span>';
    const el = selEl();
    let h = '';
    if (el) {
      if (el.type === 'text') {
        h += fontSel('el-font', el.font) + size(Math.round(el.size * 10) / 10, '') + swatch('el-color', el.color, 'Text color', 'text')
          + ib('el-bold', '<b class="x-glyph">B</b>', 'Bold', el.bold) + ib('el-italic', '<i class="x-glyph">I</i>', 'Italic', el.italic)
          + ib('el-align', { left: 'alignL', center: 'alignC', right: 'alignR' }[el.align || 'center'], 'Line up the text') + sep + ib('edit-text', 'edit', 'Type the words') + sep;
      } else h += ib('el-flip', 'flip', 'Flip', el.flip);
      h += `<label class="x-op" title="See-through">${ic('opacity')}<input type="range" data-x="el-op" min="0.05" max="1" step="0.05" value="${el.op}"></label>` + sep
        + ib('el-up', 'front', 'Bring forward') + ib('el-down', 'back', 'Send backward')
        + ib('el-layer', 'layers', el.layer === 'behind' ? 'Behind the boxes (click to bring in front)' : 'In front of the page (click to put behind the boxes)', el.layer === 'behind')
        + ib('el-phone', 'phone', el.phone === false ? 'Hidden on phones (click to show)' : 'Shown on phones (click to hide)', el.phone !== false)
        + sep + ib('el-dup', 'copy', 'Duplicate (Ctrl+D)') + ib('el-del', 'trash', 'Delete', false, 'data-danger="1"');
    } else {
      const s = selStyle(), part = E.sel.el, cs = part && part.isConnected ? getComputedStyle(part) : null, node = textNodeOf(part);
      const isImg = part && (part.tagName === 'IMG' || (cs && cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)));
      const fsize = s.size || (cs ? Math.round(parseFloat(cs.fontSize)) : 16);
      h += `<span class="x-tb-name">${esc(prettySel(E.sel.sel))}</span>` + sep;
      if (isImg) h += `<button type="button" class="x-pill" data-x="replace" title="Replace the picture">${ic('image')}<span>Replace</span></button>` + sep;
      h += fontSel('part-font', s.font, true) + size(fsize, '') + swatch('part-color', s.color || toHex(cs && cs.color) || '#000000', 'Text color', 'text')
        + swatch('part-bg', s.bg || toHex(cs && cs.backgroundColor) || '#ffffff', 'Fill color', 'fill')
        + ib('part-bold', '<b class="x-glyph">B</b>', 'Bold', !!s.bold) + ib('part-italic', '<i class="x-glyph">I</i>', 'Italic', !!s.italic)
        + ib('part-align', { left: 'alignL', center: 'alignC', right: 'alignR' }[s.align || (cs && cs.textAlign === 'right' ? 'right' : cs && cs.textAlign === 'center' ? 'center' : 'left')], 'Line up the text') + sep;
      if (node) h += ib('edit-text', 'edit', 'Type new words (or double-click them)');
      h += ib('part-front', 'front', 'Bring to front', !!s.z) + ib('part-up', 'parent', 'Select the box around it') + sep
        + (Object.keys(s).length || has(E.cur.texts, node ? (ORIG.get(node) || norm(node.data)) : '\u0000') ? ib('part-reset', 'reset', 'Put it back the way it was') : '')
        + ib('part-hide', 'hide', 'Hide this part', false, 'data-danger="1"');
    }
    tb.innerHTML = h;
  }

  // ---------- actions ----------
  function setStyle(fn) {
    remember(true);
    const k = E.sel.sel, s = Object.assign({}, E.cur.styles[k] || {}); fn(s);
    E.cur.styles[k] = s; tidy(k);
  }
  function addElement(e) {
    remember(true);
    const W = document.documentElement.clientWidth / 100;
    const el = Object.assign({ id: newId(), x: 50, y: r2((scrollY + innerHeight * 0.42) / W), rot: 0, op: 1, layer: 'front', flip: false }, e);
    E.cur.decor.push(el); E.mode = 'edit';
    changed(); selectEl(el.id);
  }
  async function saveLib(lib) { E.lib = (await P.api('PUT', '/api/board/studio', { elements: lib })).studio.elements || lib; }
  async function upload(files) {
    E.busy = true; drawFly();
    let added = 0;
    try {
      const lib = E.lib.slice();
      for (const file of files) {
        if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { U.toast(`${file.name} isn’t a PNG, JPG, WebP or GIF.`, 'error'); continue; }
        if (file.size > 15e6) { U.toast(`${file.name} is too big. Please use pictures under 15 MB.`, 'error'); continue; }
        const { blob, w, h } = await P.shrinkImage(file);
        const src = await P.uploadMedia(blob.type ? blob : new Blob([blob], { type: file.type }));
        lib.push({ id: newId(), name: file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 80), src, w, h }); added++;
      }
      if (added) { await saveLib(lib); U.toast(added === 1 ? 'Added to My elements.' : `${added} elements added to My elements.`); }
    } catch (err) { U.toast(err.message, 'error'); }
    E.busy = false; drawFly();
  }
  function doUndo(redo) {
    endInline(false);
    const from = redo ? E.redo : E.undo, to = redo ? E.undo : E.redo;
    if (!from.length) return;
    to.push(JSON.stringify(E.cur)); E.cur = JSON.parse(from.pop());
    if (E.sel && E.sel.type === 'el' && !selEl()) E.sel = null;
    E.lastRemember = 0; changed();
  }
  async function save() {
    if (!dirty() || E.saving) return;
    const full = E.full && E.full.pages ? clone(E.full) : { pages: {} };
    full.pages[E.page] = E.cur;
    E.saving = true; drawBar();
    try {
      const st = (await P.api('PUT', '/api/board/studio', { site: full })).studio;
      E.full = st.site; E.cur = clone(st.site.pages[E.page]); E.saved = clone(E.cur); E.savedHere = true;
      U.toast(E.page === 'couple' ? 'Saved! Every couple’s view now shows your changes.' : 'Saved!');
    } catch (err) { U.toast(err.message, 'error'); }
    E.saving = false; changed();
  }

  async function onUiClick(e) {
    const b = e.target.closest('[data-x]'); if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.tagName === 'TEXTAREA' || b.disabled) return;
    act(b.dataset.x, b);
  }
  async function act(x, b) {
    const el = selEl(), ds = (b && b.dataset) || {};
    if (x === 'panel') { E.panel = E.panel === ds.p ? null : ds.p; if (E.panel !== 'uploads') E.replace = false; drawRail(); return drawFly(); }
    if (x === 'mode') { endInline(true); E.mode = ds.m; hover.style.display = 'none'; document.body.classList.toggle('x-previewing', E.mode === 'preview'); paintDecor(); return drawAll(); }
    if (x === 'undo' || x === 'redo') return doUndo(x === 'redo');
    if (x === 'save') return save();
    if (x === 'cancel') {
      if (dirty() && !(await U.confirm({ title: 'Discard your changes?', message: 'Everything since the last save will be undone.', yes: 'Discard', no: 'Keep editing', danger: true }))) return;
      E.cur = clone(E.saved); return closeEditor();
    }
    if (x === 'add-text') {
      const t = TEXT_PRESETS.find(p => p.k === ds.k) || TEXT_PRESETS[0];
      return addElement({ type: 'text', text: t.label.replace(/^Add (a |a little )?/, '').replace(/^./, c => c.toUpperCase()), font: t.font, color: t.color, size: t.size, w: t.w, bold: false, italic: false, align: 'center' });
    }
    if (x === 'add-el') { const it = E.lib.find(y => y.id === ds.id); if (it) addElement({ type: 'image', src: it.src, w: 16 }); return; }
    if (x === 'lib-remove') {
      const it = E.lib.find(y => y.id === ds.id); if (!it) return;
      if (!(await U.confirm({ title: 'Remove from My elements?', message: 'Copies already placed on your pages stay where they are.', yes: 'Remove', danger: true }))) return;
      try { await saveLib(E.lib.filter(y => y.id !== it.id)); } catch (err) { U.toast(err.message, 'error'); }
      return drawFly();
    }
    if (x === 'pick-el') { E.mode = 'edit'; const n = nodeOf(ds.id); if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => selectEl(ds.id), 250); return; }
    if (x === 'reset-look') { remember(true); E.cur.colors = {}; E.cur.fonts = {}; return changed(); }
    if (x === 'reset-all') {
      if (!(await U.confirm({ title: 'Start over on this page?', message: 'All your changes to this page go back to the original design. You can still undo, or close without saving.', yes: 'Start over', danger: true }))) return;
      remember(true); E.cur = empty(); E.sel = null; return changed();
    }
    if (['unhide', 'unmove', 'unlook'].includes(x)) {
      remember(true);
      const k = ds.s, s = Object.assign({}, E.cur.styles[k] || {});
      if (x === 'unhide') delete s.hide;
      if (x === 'unmove') { delete s.d; delete s.m; }
      if (x === 'unlook') for (const key of Object.keys(s)) if (!['d', 'm', 'hide'].includes(key)) delete s[key];
      E.cur.styles[k] = s; tidy(k); return changed();
    }
    if (x === 'unword') { remember(true); delete E.cur.texts[ds.t]; return changed(); }
    if (x === 'edit-text') return inlineEdit();
    if (x === 'size-up' || x === 'size-down') {
      const up = x === 'size-up';
      if (el) { remember(); el.size = r2(clamp(el.size * (up ? 1.1 : 1 / 1.1), 0.3, 60)); return changed(); }
      const cs = getComputedStyle(E.sel.el), cur = selStyle().size || Math.round(parseFloat(cs.fontSize));
      setStyle(s => { s.size = clamp(cur + (up ? (cur >= 30 ? 4 : 1) : -(cur > 30 ? 4 : 1)), 6, 160); }); return changed();
    }
    if (el) {
      remember(true);
      if (x === 'el-bold') el.bold = !el.bold;
      if (x === 'el-italic') el.italic = !el.italic;
      if (x === 'el-align') el.align = { left: 'center', center: 'right', right: 'left' }[el.align || 'center'];
      if (x === 'el-flip') el.flip = !el.flip;
      if (x === 'el-layer') el.layer = el.layer === 'behind' ? 'front' : 'behind';
      if (x === 'el-phone') { if (el.phone === false) delete el.phone; else el.phone = false; }
      if (x === 'el-del') { E.cur.decor = E.cur.decor.filter(y => y !== el); E.sel = null; }
      if (x === 'el-dup') { const c = Object.assign(clone(el), { id: newId(), x: el.x + 2.5, y: el.y + 2.5 }); E.cur.decor.push(c); E.sel = { type: 'el', id: c.id }; }
      if (x === 'el-up' || x === 'el-down') { const l = E.cur.decor, i = l.indexOf(el), j = x === 'el-up' ? i + 1 : i - 1; if (j >= 0 && j < l.length) [l[i], l[j]] = [l[j], l[i]]; }
      return changed();
    }
    if (E.sel && E.sel.type === 'part') {
      if (x === 'part-up') {
        const p = E.sel.el && E.sel.el.parentElement;
        if (!p || p === E.root || !E.root.contains(p)) return U.toast('This is already the biggest box.');
        return selectPart(p);
      }
      if (x === 'replace') { E.replace = true; E.panel = 'uploads'; drawRail(); return drawFly(); }
      if (x === 'part-hide') { setStyle(s => { s.hide = true; }); E.sel = null; changed(); return U.toast('Hidden. Find it under Changes to show it again.'); }
      if (x === 'part-reset') {
        remember(true);
        const node = textNodeOf(E.sel.el); if (node) delete E.cur.texts[ORIG.get(node) || norm(node.data)];
        delete E.cur.styles[E.sel.sel]; return changed();
      }
      if (x === 'part-img') { const it = E.lib.find(y => y.id === ds.id); if (it) setStyle(s => { s.img = it.src; }); return changed(); }
      if (x === 'part-img-reset') { setStyle(s => { delete s.img; }); changed(); return U.toast('The original picture comes back after you save and reload the page.'); }
      if (x === 'part-front') { const pos = getComputedStyle(E.sel.el).position; setStyle(s => { s.z = !s.z; s.zr = s.z && pos === 'static' ? true : undefined; }); return changed(); }
      if (x === 'part-bold') setStyle(s => { s.bold = !s.bold; });
      if (x === 'part-italic') setStyle(s => { s.italic = !s.italic; });
      if (x === 'part-align') { const cur = selStyle().align || getComputedStyle(E.sel.el).textAlign; setStyle(s => { s.align = { left: 'center', start: 'center', center: 'right', right: 'left', end: 'left' }[cur] || 'center'; }); }
      return changed();
    }
  }
  function onUiInput(e) {
    const t = e.target, x = t.dataset.x, el = selEl(); if (!x) return;
    if (x === 'color') { remember(); E.cur.colors[t.dataset.k] = t.value; return changed(false); }
    if (el && x === 'el-op') { remember(); el.op = Number(t.value); updateNode(el); return drawBar(); }
    if (el && x === 'el-color') { remember(); el.color = t.value; t.nextElementSibling.style.setProperty('--sw', t.value); return changed(false); }
    if (E.sel && E.sel.type === 'part' && (x === 'part-color' || x === 'part-bg')) {
      remember(); const k = E.sel.sel, s = Object.assign({}, E.cur.styles[k] || {}); s[x === 'part-color' ? 'color' : 'bg'] = t.value; E.cur.styles[k] = s;
      t.nextElementSibling.style.setProperty('--sw', t.value); return changed(false);
    }
  }
  function onUiChange(e) {
    const t = e.target, x = t.dataset.x, el = selEl(); if (!x) return;
    if (x === 'upload' && t.files.length) return upload([...t.files]);
    if (x === 'font-display' || x === 'font-sans') { remember(true); const k = x.slice(5); if (t.value) E.cur.fonts[k] = t.value; else delete E.cur.fonts[k]; return changed(); }
    if (el && x === 'el-font') { remember(true); el.font = t.value; return changed(); }
    if (E.sel && E.sel.type === 'part' && x === 'part-font') { setStyle(s => { s.font = t.value || undefined; }); return changed(); }
    // Sliders and color pickers already showed their changes; now the toolbar can catch up.
    if (['el-op', 'el-color', 'part-color', 'part-bg', 'color'].includes(x)) { drawBar(); if (x === 'color') return; drawTb(); placeHl(); }
  }
})();
