// Couple's view: see who accepted their RSVP, add their own guests, and preview the guest page.
(function () {
  'use strict';
  const P = window.PIXIE, esc = P.esc, C = window.PixieCore, U = window.PixieUI;
  const app = document.getElementById('app');
  const slug = (P.route().path.match(/^\/couple\/([a-z0-9-]{1,60})$/) || [])[1] || '';
  const base = '/api/couple/' + slug;
  const V = { info: null, data: null, tab: 'tracker', filter: 'all', query: '', expanded: new Set(), device: 'mobile', target: '', error: '', busy: false,
    add: { family: '', seats: '', guests: [''] }, addError: '' };
  document.body.classList.add('is-couple');

  const wave = cls => `<svg class="${cls}" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0C48 0 72 60 120 60S192 0 240 0S312 60 360 60S432 0 480 0S552 60 600 60S672 0 720 0S792 60 840 60S912 0 960 0S1032 60 1080 60S1152 0 1200 0S1272 60 1320 60S1392 0 1440 0V60H0z"/></svg>`;
  const studio = () => V.info.studio || {};
  const names = n => esc(n).replace(/&amp;/g, '<span class="c-amp">&amp;</span>');

  function signIn() {
    const i = V.info;
    return `<div class="a-login">${P.floral('a-floral a-floral-tl')}${P.floral('a-floral a-floral-br')}<div class="a-login-card">
      <img class="a-login-logo" src="${esc(studio().logo || P.logo)}" alt="">
      <p class="a-brand-name">Pixie Craft Studio</p><p class="a-brand-label">Couple's RSVP View</p>
      <p class="c-login-names">${names(i.couple)}</p>
      <h1>See who's coming</h1>
      ${i.hasCode ? `<form data-form="login" class="a-stack" novalidate>
        <label class="a-field"><span>Your 6-number code</span><input name="code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password" required></label>
        ${V.error ? `<p class="a-error" role="alert">${esc(V.error)}</p>` : ''}
        <button class="b-btn b-btn-big a-btn-wide" ${V.busy ? 'disabled' : ''}>${V.busy ? 'Opening…' : 'Open my RSVP tracker'}</button>
        <p class="a-muted a-small">Pixie Craft Studio gave you this code. You can both use it.</p></form>`
      : '<p class="a-muted">Your sign-in code isn’t ready yet. Pixie Craft Studio will send it to you.</p>'}
    </div></div>`;
  }

  function hero() {
    const d = V.data, site = d.site;
    const pic = studio().banner || P.storefront;
    return `<section class="c-hero" style="background-image:url('${esc(pic)}')">
        <div class="c-hero-in">
          <div class="c-welcome"><p class="c-welcome-word">Welcome!</p><h1 class="c-names">${names(d.couple)}</h1></div>
          <div class="c-when">
            <p class="c-when-label">Your Wedding:</p>
            <p class="c-count-text">${esc(C.formatPadded(site.weddingDate))}</p>
            <p class="c-deadline"><b>RSVP Deadline:</b> ${esc(C.formatPadded(site.deadline))}${d.closed ? ' <span class="c-closed">Closed</span>' : ''}</p>
          </div>
        </div>
      </section>`;
  }

  function tracker() {
    const d = V.data, s = d.stats;
    const real = d.reservations.filter(r => !r.sample);
    const q = C.normName(V.query);
    const match = r => !q || C.normName(r.family).includes(q) || r.guests.some(g => C.normName(g.name).includes(q));
    const want = g => V.filter === 'all' || g.status === V.filter;
    const list = real.filter(r => match(r) && r.guests.some(want));
    const chip = (k, label, n) => `<button class="a-chip ${V.filter === k ? 'is-on' : ''}" data-act="filter" data-f="${k}" aria-pressed="${V.filter === k}">${label} <span>${n}</span></button>`;
    const tile = (cls, n, label, hint) => `<div class="c-tile ${cls}"><b>${n}</b><strong>${label}</strong><small>${hint}</small></div>`;
    return `${hero()}
      <div class="c-body">
        <section class="c-panel">
          <h2 class="c-h2">RSVP Progress</h2>
          ${s.invited ? `<p class="c-sub"><strong>${s.attending + s.notAttending} of ${s.invited}</strong> Guests Have Answered <span class="c-dot">•</span> ${s.familiesAnswered} of ${s.reservations} Families Replied</p>
            <div class="c-bar">${U.progress(s, true)}</div>
            <p class="c-legend"><span><i class="yes"></i>Attending</span><span><i class="no"></i>Not Attending</span><span><i class="wait"></i>Awaiting Response</span></p>`
            : '<p class="c-sub">Your guest list isn’t ready yet. Add your guests or ask Pixie Craft Studio to set it up.</p>'}
          <div class="c-tiles">
            ${tile('total', s.invited, 'Total Guests Invited', `in ${s.reservations} reservation${s.reservations === 1 ? '' : 's'}`)}
            ${tile('yes', s.attending, 'Attending', 'said Yes')}
            ${tile('no', s.notAttending, 'Not Attending', 'can’t make it')}
            ${tile('wait', s.awaiting, 'Awaiting Response', 'haven’t answered yet')}
          </div>
        </section>
        <section class="c-panel">
          <h2 class="c-h2">Who’s Coming</h2>
          <p class="c-sub">Answers show up here as soon as a guest sends their RSVP. Tap a family to see each guest.</p>
          <div class="a-chips" role="group" aria-label="Show">${chip('all', 'Everyone', s.invited)}${chip('attending', 'Attending', s.attending)}${chip('not_attending', 'Not Attending', s.notAttending)}${chip('awaiting', 'Awaiting', s.awaiting)}</div>
          <label class="c-search"><span class="a-sr">Search</span><input type="search" data-bind="query" value="${esc(V.query)}" placeholder="Search guest or family name..."></label>
          <div data-region="list">${list.length ? `<ul class="c-fams">${list.map(r => famRow(r, want)).join('')}</ul>` : `<p class="c-sub c-center">${real.length ? 'No guests match.' : 'No guests yet.'}</p>`}</div>
          ${studio().helpNote ? `<p class="c-help">${esc(studio().helpNote)}</p>` : ''}
        </section>
      </div>`;
  }
  function famRow(r, want) {
    const c = U.counts(r), open = V.expanded.has(r.id) || V.filter !== 'all' || V.query;
    return `<li class="c-fam ${open ? 'is-open' : ''}">
      <button class="c-fam-head" data-act="toggle" data-id="${r.id}" aria-expanded="${!!open}">
        <span class="c-fam-name">${esc(r.family)}</span>
        <span class="c-fam-meta">${r.seats} seat${r.seats === 1 ? '' : 's'} <span class="c-dot">•</span> ${r.submittedAt ? 'Replied ' + esc(U.ago(r.submittedAt)) : 'No reply yet'}</span>
        <span class="c-nums"><span class="yes" title="Attending">${c.attending}</span><span class="no" title="Not attending">${c.not_attending}</span><span class="wait" title="Awaiting">${c.awaiting}</span></span>
      </button>
      ${open ? `<ul class="c-guests">${r.guests.filter(want).map(g => `<li><span>${esc(g.name)}</span><span class="a-status ${g.status}">${U.STATUS_TEXT[g.status]}</span></li>`).join('')}</ul>` : ''}
    </li>`;
  }

  // Couples add families themselves; guests then find their names on the RSVP page.
  function addGuests() {
    const d = V.data, a = V.add;
    const mine = d.reservations.filter(r => r.addedBy === 'couple');
    return `<div class="c-body c-body-top">
      <section class="c-panel">
        <h2 class="c-h2">Add Guest/s</h2>
        <p class="c-sub">Add a family or group and the names of everyone invited. They can then find their invitation by typing their name on your RSVP page.</p>
        ${d.closed ? '<p class="c-note">Your RSVP deadline has passed, so new guests can’t be added here. Please message Pixie Craft Studio.</p>' : `
        <form class="c-form" data-form="add" novalidate>
          <div class="c-two">
            <label class="b-field"><span>Family or group name</span><input data-add="family" value="${esc(a.family)}" placeholder="eg. Santos Family" maxlength="80"></label>
            <label class="b-field"><span>Reserved seats</span><input data-add="seats" value="${esc(a.seats)}" inputmode="numeric" placeholder="eg. 3" maxlength="2"></label>
          </div>
          <div class="b-field"><span>Guest names</span>
            ${a.guests.map((g, i) => `<span class="c-guest-row"><input data-add="guest" data-i="${i}" value="${esc(g)}" placeholder="First name and surname" maxlength="80" aria-label="Guest ${i + 1}">${a.guests.length > 1 ? `<button type="button" class="c-x" data-act="add-remove" data-i="${i}" aria-label="Remove guest ${i + 1}">×</button>` : ''}</span>`).join('')}
            <button type="button" class="a-link c-more" data-act="add-more">+ Add another name</button>
          </div>
          ${V.addError ? `<p class="a-error" role="alert">${esc(V.addError)}</p>` : ''}
          <div class="c-actions"><button class="b-btn b-btn-big" ${V.busy ? 'disabled' : ''}>${V.busy ? 'Adding…' : 'Add to my guest list'}</button></div>
        </form>`}
      </section>
      <section class="c-panel">
        <h2 class="c-h2">Share Your RSVP</h2>
        <p class="c-sub">Send this link to your guests. Each family types their name to open their own invitation.</p>
        <div class="c-link"><code>${esc(P.link('/w/' + d.slug))}</code><button class="b-btn" data-act="copy-link">Copy link</button></div>
      </section>
      <section class="c-panel">
        <h2 class="c-h2">Guests You Added</h2>
        ${mine.length ? `<ul class="c-fams">${mine.map(r => `<li class="c-fam"><div class="c-fam-head c-fam-static">
            <span class="c-fam-name">${esc(r.family)}</span>
            <span class="c-fam-meta">${r.seats} seat${r.seats === 1 ? '' : 's'} <span class="c-dot">•</span> ${r.guests.map(g => esc(g.name)).join(', ')}</span>
            ${r.submittedAt ? '<span class="c-fam-done">Replied</span>' : `<button class="a-link" data-act="add-delete" data-id="${r.id}">Remove</button>`}
          </div></li>`).join('')}</ul>` : '<p class="c-sub">You haven’t added anyone yet. Guests Pixie Craft Studio set up for you are in your RSVP Tracker.</p>'}
      </section>
    </div>`;
  }

  function preview() {
    const d = V.data, opts = d.reservations.map(r => `<option value="${esc(r.token)}" ${V.target === r.token ? 'selected' : ''}>${esc(r.family)}${r.sample ? ' (example)' : ''}</option>`).join('');
    return `<div class="c-body c-body-top"><section class="c-panel">
      <h2 class="c-h2">Preview My RSVP</h2>
      <div class="a-preview-bar">
        <label class="a-field a-inline"><span>Show</span><select data-bind="target"><option value="">Whole guest journey (from the Welcome screen)</option>${opts}</select></label>
        <div class="a-seg" role="group" aria-label="Screen size"><button data-act="device" data-d="desktop" aria-pressed="${V.device === 'desktop'}">Desktop</button><button data-act="device" data-d="mobile" aria-pressed="${V.device === 'mobile'}">Mobile</button></div>
        <button class="a-btn a-btn-ghost" data-act="restart">Start over</button>
        <button class="b-btn" data-act="open-site">Open in a new tab</button>
      </div>
      <p class="a-muted a-small a-preview-hint">This is exactly what your guests see. Answers you pick here are <strong>not saved</strong>.</p>
      <div class="a-frame ${V.device}"><iframe title="RSVP preview" data-region="frame"></iframe></div>
    </section></div>`;
  }
  function loadFrame() {
    const f = app.querySelector('[data-region="frame"]');
    if (f) P.setFrame(f, V.target ? '/r/' + V.target + '?preview=1&step=reservation' : '/w/' + slug + '?preview=1');
  }

  function footer() {
    const st = studio();
    const icon = { facebook: '<path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/>',
      tiktok: '<path d="M16 3c.4 2.6 2 4.3 4.5 4.5v3.4c-1.7 0-3.2-.5-4.5-1.4v6.3A5.8 5.8 0 1 1 10.2 10v3.5a2.4 2.4 0 1 0 2.3 2.4V3z"/>',
      instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2"/>' };
    // Facebook and TikTok always show, as in the design; they become links once the studio adds them in Studio settings.
    const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${icon[k]}</svg>`, name = k => k[0].toUpperCase() + k.slice(1);
    const links = ['facebook', 'tiktok', 'instagram'].filter(k => st[k] || k !== 'instagram').map(k => st[k]
      ? `<a class="c-social" href="${esc(st[k])}" target="_blank" rel="noopener noreferrer" aria-label="Pixie Craft Studio on ${name(k)}">${svg(k)}</a>`
      : `<span class="c-social" role="img" aria-label="${name(k)}">${svg(k)}</span>`).join('');
    return `<p class="c-made">Made with ♡ by Pixie Craft Studio</p>
      <footer class="c-foot">${wave('b-wave')}
        <p class="c-connect">Let’s Connect</p>
        ${links ? `<div class="c-socials">${links}</div>` : ''}
        <p class="c-foot-strong">A little love goes a long way!</p>
        <p class="c-foot-text">Kindly follow us on our socials, Pixies! ♡ Every follow, like, and share helps our little dream grow and reach more people who might love what we create. Your support means the world to us as we turn our passion into something we can share with you.</p>
      </footer>`;
  }

  function render() {
    if (!V.info) return;
    if (!V.data) { app.innerHTML = signIn(); document.title = V.info.couple + ' · RSVP tracker'; return; }
    const tabs = [['tracker', 'RSVP Tracker'], ['add', '+ Add Guest/s'], ['preview', 'Preview My RSVP']];
    app.innerHTML = `<div class="c-app">
      <header class="c-top">
        <img class="c-logo" src="${esc(studio().logo || P.logo)}" alt="Pixie Craft Studio">
        <nav class="c-nav" aria-label="Sections">${tabs.map(([k, l]) => `<button data-act="tab" data-tab="${k}" class="${V.tab === k ? 'is-on' : ''}" ${V.tab === k ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</nav>
        <p class="c-top-names">${esc(V.data.couple)}</p>
        <button class="a-link c-out" data-act="logout">Sign-Out</button>
      </header>
      <main class="c-main">${V.tab === 'tracker' ? tracker() : V.tab === 'add' ? addGuests() : preview()}</main>
      ${footer()}</div>`;
    document.title = V.data.couple + ' · RSVP tracker';
    if (V.tab === 'preview') loadFrame();
  }

  async function load() { V.data = await P.api('GET', base + '/state'); }

  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'tab') { V.tab = b.dataset.tab; render(); window.scrollTo(0, 0); }
    if (act === 'filter') { V.filter = b.dataset.f; render(); }
    if (act === 'toggle') { V.expanded.has(b.dataset.id) ? V.expanded.delete(b.dataset.id) : V.expanded.add(b.dataset.id); const y = scrollY; render(); scrollTo(0, y); }
    if (act === 'device') { V.device = b.dataset.d; app.querySelector('.a-frame').className = 'a-frame ' + V.device; app.querySelectorAll('[data-act="device"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === V.device)); }
    if (act === 'restart') loadFrame();
    if (act === 'open-site') U.open('/w/' + slug);
    if (act === 'copy-link') U.copy(P.link('/w/' + V.data.slug), 'RSVP link copied!', 'RSVP link');
    if (act === 'add-more') { V.add.guests.push(''); render(); const ins = app.querySelectorAll('[data-add="guest"]'); ins[ins.length - 1].focus(); }
    if (act === 'add-remove') { V.add.guests.splice(Number(b.dataset.i), 1); render(); }
    if (act === 'add-delete') {
      const r = V.data.reservations.find(x => x.id === b.dataset.id);
      if (!(await U.confirm({ title: `Remove the ${r.family}?`, message: 'They won’t be able to find their invitation anymore.', yes: 'Remove', danger: true }))) return;
      try { await P.api('DELETE', base + '/reservations/' + r.id); await load(); render(); U.toast(`${r.family} was removed.`); }
      catch (err) { U.toast(err.message, 'error'); }
    }
    if (act === 'logout') { await P.api('POST', base + '/logout', {}).catch(() => {}); V.data = null; render(); }
  });
  app.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.add) {
      if (el.dataset.add === 'guest') V.add.guests[Number(el.dataset.i)] = el.value; else V.add[el.dataset.add] = el.value;
      return;
    }
    if (el.dataset.bind !== 'query') return;
    V.query = el.value;
    const tmp = document.createElement('div'); tmp.innerHTML = tracker();
    app.querySelector('[data-region="list"]').innerHTML = tmp.querySelector('[data-region="list"]').innerHTML;
  });
  app.addEventListener('change', e => { if (e.target.dataset.bind === 'target') { V.target = e.target.value; loadFrame(); } });
  app.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.target.dataset.form === 'add') {
      const a = V.add, guests = a.guests.map(x => x.trim()).filter(Boolean), seats = Number(a.seats || guests.length);
      V.addError = !a.family.trim() ? 'Please type a family or group name.' : !guests.length ? 'Please add at least one guest name.'
        : !Number.isInteger(seats) || seats < 1 ? 'Reserved seats must be a number, like 3.' : guests.length > seats ? 'There are more names than reserved seats.' : '';
      if (V.addError) return render();
      V.busy = true; render();
      try {
        await P.api('POST', base + '/reservations', { family: a.family, seats, guests: guests.map(name => ({ name })) });
        const fam = a.family.trim();
        V.add = { family: '', seats: '', guests: [''] }; V.busy = false; V.addError = ''; await load(); render(); U.toast(`${fam} was added to your guest list!`);
      } catch (err) { V.busy = false; V.addError = err.message; render(); }
      return;
    }
    const code = e.target.code.value.trim();
    if (!/^\d{6}$/.test(code)) { V.error = 'Your code is 6 numbers.'; return render(); }
    V.busy = true; V.error = ''; render();
    try { await P.api('POST', base + '/login', { code }); await load(); V.busy = false; render(); }
    catch (err) { V.busy = false; V.error = err.message; render(); const i = app.querySelector('[name=code]'); if (i) i.focus(); }
  });

  // New answers appear on their own.
  setInterval(async () => {
    if (!V.data || document.hidden || V.tab !== 'tracker') return;
    try {
      const { version } = await P.api('GET', base + '/version');
      if (version === V.data.version) return;
      await load();
      const focused = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind === 'query';
      const y = scrollY; render(); scrollTo(0, y);
      if (focused) { const q = app.querySelector('[data-bind="query"]'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    } catch (err) { if (err.status === 401) { V.data = null; render(); } }
  }, P.bundle ? 3000 : 8000);

  (async function start() {
    try {
      V.info = await P.api('GET', base);
      if (V.info.signedIn) await load();
      render();
      // The studio's saved website edits; the "Edit website" button only shows when the studio itself (signed in to the board) opens this page.
      if (P.siteStart) P.siteStart({ page: 'couple', root: app, canEdit: !!V.info.canEdit && !!V.data, site: studio().site });
    } catch (err) {
      app.innerHTML = `<div class="a-login"><div class="a-login-card"><h1>Sorry!</h1><p>${esc(err.message)}</p></div></div>`;
    }
  })();
})();
