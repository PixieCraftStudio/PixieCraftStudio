// Guest website: Welcome -> RSVP deadline notice -> Invitation & name search -> Reservation & answers -> Thank you.
(function () {
  'use strict';
  const P = window.PIXIE, esc = P.esc, C = window.PixieCore;
  const app = document.getElementById('app');
  const route = P.route();
  const preview = route.query.get('preview') === '1';
  // Opened inside the board's Design tab: elements can be moved, resized and turned; the page itself does not move on.
  const design = preview && route.query.get('design') === '1';
  const tokenFromLink = (route.path.match(/^\/r\/([A-Za-z0-9]{6,40})$/) || [])[1] || null;
  let slug = (route.path.match(/^\/w\/([a-z0-9-]{1,60})$/) || [])[1] || null;
  const pq = preview ? '?preview=1' : '';

  const G = { site: null, closed: false, step: 'welcome', token: tokenFromLink, r: null, answers: {}, error: '', busy: false, previewMode: false, history: [] };

  const t = (key, r) => esc(C.fill(G.site[key], G.site, r));
  // Text the couple wrote: **bold** words and blank lines between paragraphs are kept.
  // Formatting the studio adds in Wording: **bold**, *italic*, __underline__.
  const rich = (key, r) => t(key, r).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, '$1<em>$2</em>');
  const paras = (key, r, cls) => rich(key, r).split(/\n\s*\n/).map(x => `<p class="${cls || 'g-text'}">${x.replace(/\n/g, '<br>')}</p>`).join('');

  const ICONS = {
    person: '<circle cx="24" cy="15" r="7.5"/><path d="M9 41c0-8.5 6.7-14 15-14s15 5.5 15 14"/>',
    calendar: '<rect x="8" y="11" width="32" height="28" rx="5"/><path d="M8 19.5h32M16 7v8M32 7v8"/><path d="M24 34.5s-5-3-5-6.2a2.6 2.6 0 0 1 5-1.2 2.6 2.6 0 0 1 5 1.2c0 3.2-5 6.2-5 6.2z"/>',
    check: '<path d="M10 25l9 9 19-20"/>',
    cross: '<path d="M12 12l24 24M36 12L12 36" stroke-width="5"/>',
  };
  // Pinyon Script's own "&" is hard to read, so names borrow a classic script ampersand.
  const names = n => esc(n).replace(/&amp;/g, '<span class="g-amp">&amp;</span>');
  const icon = (name, cls) => `<svg class="${cls || 'g-icon'}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  // Small gold glow at the top of every card, as in the design.
  const glow = '<span class="g-glow" aria-hidden="true"></span>';
  // Thin gold line with a flourish in the middle.
  const flourish = '<svg class="g-flourish" viewBox="0 0 300 16" aria-hidden="true" focusable="false"><path d="M0 8h126M174 8h126"/><path d="M150 8c-6-7-16-7-18-1s8 7 12 2c4-5-2-9-8-6M150 8c6-7 16-7 18-1s-8 7-12 2c-4-5 2-9 8-6M150 8c-4 3-10 4-14 1M150 8c4 3 10 4 14 1"/></svg>';
  // Couple's uploaded logo, or a wreath with their initials.
  const crest = cls => G.theme && G.theme.logo
    ? `<img class="${cls}" src="${esc(G.theme.logo)}" alt="${esc(G.site.couple)}">`
    : P.monogram(G.site.couple, cls);
  // "25<sup>th</sup> December 2026"
  function weddingDate(s) {
    if (!C.validDate(s)) return esc(s || '');
    const [y, m, d] = s.split('-').map(Number);
    const sfx = d % 100 >= 11 && d % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[d % 10] || 'th';
    return `${d}<sup>${sfx}</sup> ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`;
  }

  // Screen changes: the current card fades/slides out, the next one fades/slides in (forward or back).
  const calm = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let moving = false;
  function transition(change, dir) {
    const card = app.querySelector('.g-card');
    const show = () => {
      change();
      window.scrollTo(0, 0);
      const next = app.querySelector('.g-card');
      if (next && !calm()) next.classList.add('g-enter-' + dir);
      const h = app.querySelector('h1, h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      moving = false;
    };
    if (!card || calm()) return show();
    moving = true;
    card.classList.add('g-leave-' + dir);
    setTimeout(show, 260);
  }
  function go(step) {
    if (moving) return;
    transition(() => {
      if (step !== G.step) G.history.push(G.step);
      G.step = step; G.error = G.pendingError || ''; G.pendingError = ''; G.justAnswered = null;
      render();
    }, 'fwd');
  }
  function back() {
    if (moving) return;
    transition(() => { G.step = G.history.pop() || 'welcome'; G.error = ''; render(); }, 'back');
  }

  const banner = () => G.previewMode ? '<div class="g-preview-banner">Preview · This is what your guests see. Nothing you choose here is saved.</div>' : '';
  const foot = '<p class="g-foot">With Love by Pixie Craft Studio</p>';
  function shell(inner, cls) {
    return `<div class="g-page">
      <div class="g-bg" aria-hidden="true"></div>
      ${banner()}
      <main class="g-card ${cls || ''}">${glow}${inner}</main>
      ${foot}
    </div>`;
  }

  const views = {
    welcome() {
      return shell(`
        ${icon('person')}
        <p class="g-eyebrow">${rich('welcomeEyebrow')}</p>
        <h1 class="g-title">${rich('welcomeTitle')}</h1>
        <div class="g-body">${paras('welcomeMessage')}</div>
        <button class="g-btn" data-act="next">${rich('welcomeButton')}</button>`);
    },
    notice() {
      return shell(`
        ${icon('calendar')}
        <p class="g-eyebrow">${rich('noticeEyebrow')}</p>
        <h1 class="g-title">${rich('noticeTitle')}</h1>
        <div class="g-body">${paras('noticeMessage')}${paras('noticeContact')}${paras('noticeClosing')}</div>
        <button class="g-btn" data-act="understand">${rich('noticeButton')}</button>`);
    },
    invite() {
      return shell(`
        ${crest('g-crest')}
        <p class="g-invite-heading">${rich('invitationHeading')}</p>
        <h1 class="g-couple">${names(G.site.couple)}</h1>
        <p class="g-date">${weddingDate(G.site.weddingDate)}</p>
        <p class="g-text g-question">${rich('inviteQuestion')}</p>
        <form class="g-search" data-form="search" novalidate>
          <label for="g-name" class="g-text">${rich('searchInstructions')}</label>
          <input id="g-name" name="name" autocomplete="name" placeholder="${t('searchPlaceholder')}" required>
          ${G.error ? `<p class="g-error" role="alert">${esc(G.error)}</p>` : ''}
          <button class="g-btn" ${G.busy ? 'disabled' : ''}>${G.busy ? 'Searching…' : t('searchButton')}</button>
        </form>`, 'g-card-invite');
    },
    // Full page (not a card): the couple's video or photo across the top, then the family's reservation.
    reservation() {
      const r = G.r, s = G.site;
      const answered = r.guests.filter(g => G.answers[g.id]).length;
      const going = r.guests.filter(g => G.answers[g.id] === 'attending');
      const notGoing = r.guests.filter(g => G.answers[g.id] === 'not_attending');
      const waiting = r.guests.filter(g => !G.answers[g.id]);
      const allDone = answered === r.guests.length;
      const guestCards = r.guests.map(g => {
        const a = G.answers[g.id];
        return `<li class="g-guest ${a ? 'is-answered' : ''}">
          <p class="g-guest-name">${esc(g.name)}</p>
          <div class="g-choices ${g.id === G.justAnswered ? 'g-just' : ''}" role="group" aria-label="Answer for ${esc(g.name)}">
            <button type="button" class="g-choice ${a === 'attending' ? 'is-on yes' : ''}" aria-pressed="${a === 'attending'}" data-act="answer" data-g="${g.id}" data-v="attending" ${G.closed ? 'disabled' : ''}>${rich('attendingLabel')}</button>
            <button type="button" class="g-choice ${a === 'not_attending' ? 'is-on no' : ''}" aria-pressed="${a === 'not_attending'}" data-act="answer" data-g="${g.id}" data-v="not_attending" ${G.closed ? 'disabled' : ''}>${rich('notAttendingLabel')}</button>
          </div>
        </li>`;
      }).join('');
      const list = (title, arr, mark, cls) => arr.length ? `<div class="g-glance-group ${cls}"><p class="g-glance-label">${title}</p><ul>${arr.map(g => `<li class="${g.id === G.justAnswered ? 'g-pop' : ''}">${mark}<span>${esc(g.name)}</span></li>`).join('')}</ul></div>` : '';
      const submitted = r.submittedAt && !G.closed
        ? `<p class="g-note">You already sent your RSVP. You can change your answers until ${esc(C.formatDeadline(s.deadline))}.</p>` : '';
      const closedBox = `<div class="g-closed" role="note">
          <p class="g-eyebrow">${rich('noticeTitle')}</p>
          <p>The RSVP deadline (${esc(C.formatDeadline(s.deadline))}) has passed, so answers can no longer be sent or changed here.</p>
          <p>${rich('noticeContact')}</p></div>`;
      return `<div class="g-page g-page-res">
        <div class="g-hero" data-region="hero" aria-hidden="true">${glow}</div>
        ${banner()}
        <main class="g-card g-card-res">
          <header class="g-res-head">
            <p class="g-greeting">${rich('greeting', r)}</p>
            <h1 class="g-family">${names(r.family)}</h1>
            <p class="g-seats"><span class="g-seats-num">${r.seats}</span><span class="g-seats-label">${rich('seatsLabel', r)}</span></p>
            <p class="g-fine">${rich('onlyListedNote', r)}</p>
          </header>
          ${G.closed ? closedBox : submitted}
          ${flourish}
          <section class="g-confirm" aria-labelledby="g-confirm-title">
            <h2 id="g-confirm-title" class="g-h2">${rich('confirmTitle')}</h2>
            <p class="g-fine g-left">${rich('responseInstructions')} <span class="g-sr" aria-live="polite">(${answered} of ${r.guests.length} answered)</span></p>
            <ul class="g-guests">${guestCards}</ul>
          </section>
          ${flourish}
          <section class="g-glance" aria-labelledby="g-review-title">
            <h2 id="g-review-title" class="g-h2">${rich('reviewTitle')}</h2>
            <p class="g-fine g-left">${rich('reviewSubtitle')}</p>
            <p class="g-glance-total">${going.length} out of ${r.guests.length} attending</p>
            ${list(t('attendingGroupLabel'), going, icon('check', 'g-mark'), 'yes')}
            ${list(t('notAttendingGroupLabel'), notGoing, icon('cross', 'g-mark'), 'no')}
            ${list('Still deciding', waiting, '<span class="g-mark g-mark-wait">–</span>', 'wait')}
          </section>
          ${G.error ? `<p class="g-error" role="alert">${esc(G.error)}</p>` : ''}
          ${G.closed ? '' : `<button class="g-btn" data-act="submit" ${!allDone || G.busy ? 'disabled' : ''}>${G.busy ? 'Sending…' : t('submitButton')}</button>
          ${allDone ? '' : '<p class="g-fine">Please choose an answer for every guest first.</p>'}`}
          <div class="g-adults">${paras('adultsOnly', r, 'g-fine')}</div>
        </main>
      </div>`;
    },
    thanks() {
      const going = G.r.guests.filter(g => G.answers[g.id] === 'attending').length;
      return shell(`
        ${crest('g-crest g-crest-sm')}
        <p class="g-thanks-eyebrow">${rich('thanksEyebrow', G.r)}</p>
        <h1 class="g-thanks-title">${rich('thanksHeading', G.r)}</h1>
        <div class="g-body">${paras('thanksMessage', G.r)}</div>
        <p class="g-thanks-total">${going} of ${G.r.guests.length} will be attending for ${esc(G.r.family)}</p>
        <p class="g-closing">${rich('thanksClosing', G.r)}</p>
        ${G.previewMode ? '<p class="g-note">Preview only: this answer was not saved.</p>' : ''}
        <button type="button" class="g-link" data-act="change">change my answers</button>`);
    },
    error() {
      return shell(`<h1 class="g-title">Sorry!</h1><p class="g-text">${esc(G.error || 'This page could not be loaded. Please try again in a moment.')}</p><button class="g-btn" data-act="reload">Try again</button>`);
    },
  };

  // Top of the reservation page: the uploaded video, else the background photo shown clearly.
  let heroToken = 0;
  async function paintHero() {
    const el = app.querySelector('[data-region="hero"]'), th = G.theme;
    if (!el || !th) return;
    const mine = ++heroToken;
    el.dataset.bg = th.background;
    el.style.backgroundImage = th.background === 'garden' ? `url("${P.bg}")` : th.background === 'custom' && th.customBg ? `url("${th.customBg}")` : '';
    const old = el.querySelector('video');
    if (!th.video) { if (old) old.remove(); return; }
    let src = null;
    try { src = await P.mediaUrl(th.video); } catch (e) { src = null; }
    if (mine !== heroToken || !src) return;
    if (old && old.dataset.ref === th.video) return;
    if (old) old.remove();
    const v = document.createElement('video');
    Object.assign(v, { muted: true, loop: true, autoplay: !calm(), playsInline: true, src });
    v.dataset.ref = th.video; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    el.prepend(v);
    if (!calm()) v.play().catch(() => {});
  }

  function render() {
    // Keep the playing video when only the answers change.
    const hero = app.querySelector('[data-region="hero"] video');
    app.innerHTML = (views[G.step] || views.welcome)();
    if (G.theme) P.paintBackground(app.querySelector('.g-bg'), G.theme);
    const spot = app.querySelector('[data-region="hero"]');
    if (hero && spot && G.theme && hero.dataset.ref === G.theme.video) { spot.prepend(hero); hero.play().catch(() => {}); }
    paintHero(); paintDecor();
  }

  // ---------- design elements (from the board's Design tab) ----------
  // Each element sits on the card: x, y (its middle) and w are in hundredths of the card's width (CSS cqw), so the design keeps its shape on any screen.
  const screenKey = () => G.step === 'error' ? null : G.step;
  const D = { sel: null };
  function elHtml(e) {
    const style = `left:${e.x}cqw;top:${e.y}cqw;width:${e.w}cqw;opacity:${e.op};transform:translate(-50%,-50%) rotate(${e.rot || 0}deg)`;
    const flip = e.flip ? ' g-el-flip' : '', on = design && D.sel === e.id ? ' is-sel' : '';
    const handles = design ? '<span class="g-el-h g-el-size" data-h="size"></span><span class="g-el-h g-el-turn" data-h="turn"></span>' : '';
    if (e.type === 'text') {
      const ts = `font-family:'${esc(P.fontFamily(e.font))}';font-size:${e.size}cqw;color:${e.color};font-weight:${e.bold ? 700 : 400};font-style:${e.italic ? 'italic' : 'normal'};text-align:${e.align || 'center'}`;
      return `<div class="g-el g-el-text${flip}${on}" data-el="${esc(e.id)}" style="${style}"><div class="g-el-words" style="${ts}">${esc(e.text)}</div>${handles}</div>`;
    }
    return `<div class="g-el${flip}${on}" data-el="${esc(e.id)}" style="${style}"><img alt="" draggable="false" data-src="${esc(e.src)}">${handles}</div>`;
  }
  function paintDecor() {
    const card = app.querySelector('.g-card'), k = screenKey();
    if (!card) return;
    card.querySelectorAll(':scope > .g-decor').forEach(x => x.remove());
    const list = (G.theme && G.theme.decor && G.theme.decor[k]) || [];
    if (!list.length) return;
    const fonts = list.filter(e => e.type === 'text').map(e => e.font);
    if (fonts.length) P.loadFonts(fonts);
    for (const layer of ['behind', 'under', 'front']) {
      const items = list.filter(e => (e.layer || 'front') === layer);
      if (!items.length) continue;
      const box = document.createElement('div');
      box.className = 'g-decor g-decor-' + layer; box.setAttribute('aria-hidden', 'true');
      box.innerHTML = items.map(elHtml).join('');
      card.appendChild(box);
    }
    card.querySelectorAll('img[data-src]').forEach(async img => {
      const src = await P.mediaUrl(img.dataset.src).catch(() => null);
      if (src) img.src = src;
    });
  }
  // Design tab only: drag to move, corner dot to resize, top dot to turn. Each finished move is sent back to the board.
  const tell = msg => window.parent.postMessage(Object.assign({ screen: screenKey() }, msg), '*');
  function decorList() { return ((G.theme && G.theme.decor && G.theme.decor[screenKey()]) || []); }
  function select(id) {
    D.sel = id;
    app.querySelectorAll('.g-el').forEach(x => x.classList.toggle('is-sel', x.dataset.el === id));
  }
  if (design) {
    document.body.classList.add('g-designing');
    app.addEventListener('pointerdown', e => {
      const node = e.target.closest('.g-el');
      if (!node) { if (D.sel) { select(null); tell({ type: 'pixie-decor-select', id: null }); } return; }
      e.preventDefault();
      const item = decorList().find(x => x.id === node.dataset.el); if (!item) return;
      if (D.sel !== item.id) { select(item.id); tell({ type: 'pixie-decor-select', id: item.id }); }
      const card = app.querySelector('.g-card'), unit = card.getBoundingClientRect().width / 100;
      const r = node.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const mode = e.target.dataset.h || 'move', start = { x: e.clientX, y: e.clientY, ix: item.x, iy: item.y, iw: item.w, d: Math.hypot(e.clientX - cx, e.clientY - cy) || 1 };
      const next = Object.assign({}, item);
      node.setPointerCapture(e.pointerId);
      const move = ev => {
        if (mode === 'move') { next.x = +(start.ix + (ev.clientX - start.x) / unit).toFixed(2); next.y = +(start.iy + (ev.clientY - start.y) / unit).toFixed(2); }
        if (mode === 'size') next.w = +Math.min(400, Math.max(2, start.iw * Math.hypot(ev.clientX - cx, ev.clientY - cy) / start.d)).toFixed(2);
        if (mode === 'turn') {
          let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90;
          if (a > 180) a -= 360;
          for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(a - snap) < 4) a = snap;
          next.rot = Math.round(a);
        }
        if (mode === 'size' && item.type === 'text') next.size = +Math.min(60, Math.max(1, item.size * next.w / start.iw)).toFixed(2);
        node.style.left = next.x + 'cqw'; node.style.top = next.y + 'cqw'; node.style.width = next.w + 'cqw';
        node.style.transform = `translate(-50%,-50%) rotate(${next.rot || 0}deg)`;
        if (item.type === 'text') node.querySelector('.g-el-words').style.fontSize = next.size + 'cqw';
      };
      const up = () => {
        node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up);
        if (next.x !== item.x || next.y !== item.y || next.w !== item.w || next.rot !== item.rot) tell({ type: 'pixie-decor-change', item: next });
      };
      node.addEventListener('pointermove', move); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    });
    // Arrow keys nudge, Delete removes (the board does the change so Undo works).
    window.addEventListener('keydown', e => {
      if (!D.sel || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      const step = e.shiftKey ? 2 : 0.5, d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (d) { e.preventDefault(); tell({ type: 'pixie-decor-nudge', id: D.sel, dx: d[0], dy: d[1] }); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); tell({ type: 'pixie-decor-delete', id: D.sel }); }
    });
  }
  // The board's Customize page sends unsaved looks here so the preview updates live.
  window.addEventListener('message', e => {
    if (!preview || e.source !== window.parent || !e.data) return;
    if (e.data.type === 'pixie-decor-select') { select(e.data.id); return; }
    if (e.data.type !== 'pixie-theme') return;
    if (design && e.data.selected !== undefined) D.sel = e.data.selected;
    // The look can arrive before this page has finished loading; keep it and use it once ready.
    if (!G.site) { G.pendingTheme = e.data.theme; return; }
    if (!G.previewMode) return;
    const logoChanged = !G.theme || G.theme.logo !== e.data.theme.logo;
    G.theme = e.data.theme; P.applyTheme(document.body, G.theme); P.paintBackground(app.querySelector('.g-bg'), G.theme);
    if (logoChanged && !moving) { const y = scrollY; render(); scrollTo(0, y); } else { paintHero(); paintDecor(); }
  });

  async function openReservation(token) {
    const data = await P.api('GET', '/api/r/' + token + pq);
    G.r = data.reservation; G.closed = data.closed; G.token = token;
    if (!G.site) { G.site = data.site; G.theme = data.theme; slug = data.slug; G.previewMode = data.preview; }
    G.answers = {};
    for (const g of G.r.guests) if (g.status !== 'awaiting') G.answers[g.id] = g.status;
  }

  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b || design) return;
    const act = b.dataset.act;
    if (act === 'back') return back();
    if (act === 'next') return go('notice');
    if (act === 'reload') return location.reload();
    if (act === 'understand') {
      if (!G.token) return go('invite');
      try { await openReservation(G.token); go('reservation'); }
      catch (err) { G.token = null; G.pendingError = err.message; go('invite'); }
      return;
    }
    if (act === 'answer') {
      G.answers[b.dataset.g] = b.dataset.v; G.justAnswered = b.dataset.g;
      const y = window.scrollY; render(); window.scrollTo(0, y);
      const again = app.querySelector(`[data-g="${b.dataset.g}"][data-v="${b.dataset.v}"]`);
      if (again) again.focus({ preventScroll: true });
      return;
    }
    if (act === 'submit') {
      G.busy = true; G.error = ''; render();
      try {
        await P.api('POST', '/api/r/' + G.token + '/rsvp', { answers: G.answers, preview });
        G.busy = false; G.history = []; go('thanks');
      } catch (err) {
        G.busy = false; G.error = err.message;
        if (err.status === 403) G.closed = true;
        render();
      }
      return;
    }
    if (act === 'change') {
      try { await openReservation(G.token); } catch (err) { /* keep what we have */ }
      transition(() => { G.history = ['invite']; G.step = 'reservation'; G.justAnswered = null; render(); }, 'back');
    }
  });

  app.addEventListener('submit', async e => {
    if (e.target.dataset.form !== 'search') return;
    e.preventDefault();
    if (design) return;
    const name = e.target.name.value;
    G.busy = true; G.error = ''; render();
    try {
      const { token } = await P.api('POST', '/api/w/' + slug + '/find', { name, preview });
      await openReservation(token);
      G.busy = false; go('reservation');
    } catch (err) {
      G.busy = false; G.error = err.message; render();
      const input = app.querySelector('#g-name'); input.value = name; input.focus();
    }
  });

  (async function start() {
    try {
      if (G.token) await openReservation(G.token);
      else if (slug) { const data = await P.api('GET', '/api/w/' + slug + pq); G.site = data.site; G.theme = data.theme; G.closed = data.closed; G.previewMode = data.preview; }
      else throw new Error('Please open the RSVP link you were sent.');
      if (G.pendingTheme && G.previewMode) G.theme = G.pendingTheme;
      P.applyTheme(document.body, G.theme);
      document.title = G.site.couple + ' · RSVP';
      const step = route.query.get('step');
      if (step === 'reservation' && G.token) { G.history = ['welcome', 'notice']; G.step = 'reservation'; }
      else if (step === 'thanks' && G.token) { G.history = []; G.step = 'thanks'; }
      else if (step === 'invite') { G.history = ['welcome', 'notice']; G.step = 'invite'; }
      else if (step === 'notice') { G.history = ['welcome']; G.step = 'notice'; }
      render();
      if (!calm() && !design) app.querySelector('.g-card').classList.add('g-enter-first');
    } catch (err) {
      G.error = err.message; G.site = Object.assign({}, C.DEFAULT_SITE); G.step = 'error'; render();
    }
  })();
})();
