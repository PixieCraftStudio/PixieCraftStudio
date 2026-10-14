// Pixie's RSVP Board: the studio's own dashboard for every client.
// Client tracker, RSVP link generator, quick customize (background, colors, fonts), upload RSVP (guest list), wording and preview.
(function () {
  'use strict';
  const P = window.PIXIE, esc = P.esc, C = window.PixieCore, U = window.PixieUI;
  const app = document.getElementById('app');

  const B = {
    auth: null, list: null, meta: null, view: 'tracker', client: null, tab: 'guests', error: '', busy: false,
    trackQuery: '', trackFilter: 'all', query: '', expanded: new Set(), form: null, formDirty: false,
    siteDraft: null, siteDirty: false, themeDraft: null, themeDirty: false, upload: null, newCode: null,
    previewTarget: '', previewDevice: 'mobile', version: 0, pending: false,
  };
  const PHASE = { open: ['Collecting RSVPs', ''], closed: ['RSVP closed', 'a-pill-closed'], done: ['Wedding done', 'a-pill-done'] };
  const TABS = [['guests', 'Guest List'], ['upload', 'Upload RSVP'], ['links', 'RSVP Links'], ['customize', 'Customize'], ['design', 'Design'], ['wording', 'Wording'], ['preview', 'Preview']];
  const bundleNote = () => P.bundle ? '<div class="a-banner a-banner-info"><span><strong>Try-out version.</strong> This file keeps everything in this browser only. Links you copy here only open on this computer, and nothing syncs to couples or guests. Host the full site for real clients.</span></div>' : '';
  const randomCode = () => String(Math.floor(100000 + Math.random() * 900000));

  async function api(method, url, body) {
    try { return await P.api(method, url, body); }
    catch (e) {
      if (e.status === 401 && url.startsWith('/api/board/')) { B.list = null; await loadAuth(); render(); U.toast('Please sign in again.', 'error'); }
      throw e;
    }
  }
  async function loadStudio() { try { B.studio = (await api('GET', '/api/board/studio')).studio; } catch (e) { B.studio = null; } }
  async function loadAuth() { B.auth = await P.api('GET', '/api/board/auth'); }
  async function loadList() {
    const d = await api('GET', '/api/board/clients');
    B.list = d.clients; B.meta = d; B.version = d.version; B.pending = false;
  }
  async function loadClient(id) {
    const d = await api('GET', '/api/board/clients/' + id);
    B.client = d.client; B.version = d.version;
  }
  function useClient(c) { B.client = c; const i = B.list.findIndex(x => x.id === c.id); if (i >= 0) B.list[i] = c; }

  // ---------- sign in ----------
  function viewSignIn() {
    const au = B.auth;
    const brand = `<img class="a-login-logo" src="${esc(P.logo)}" alt=""><p class="a-brand-name">Pixie Craft Studio</p><p class="a-brand-label">Pixie's RSVP Board</p>`;
    if (au.setupNeeded) {
      return `<div class="a-login">${P.floral('a-floral a-floral-tl')}${P.floral('a-floral a-floral-br')}<div class="a-login-card">${brand}
        <h1>Set up the studio sign-in</h1>
        <p class="a-muted">This board is only for Pixie Craft Studio. Couples and guests never see it.</p>
        ${bundleNote()}
        <form data-form="setup" class="a-stack" novalidate>
          ${au.needsSetupCode ? '<label class="a-field"><span>Setup code</span><input name="setupCode" inputmode="numeric" autocomplete="off" required><small>Shown in the window where the website was started.</small></label>' : ''}
          <label class="a-field"><span>Your name</span><input name="name" autocomplete="username" required></label>
          <label class="a-field"><span>Password (at least 8 characters)</span><input name="password" type="password" autocomplete="new-password" required></label>
          ${B.error ? `<p class="a-error" role="alert">${esc(B.error)}</p>` : ''}
          <button class="a-btn a-btn-wide" ${B.busy ? 'disabled' : ''}>Create sign-in and open the board</button>
        </form></div></div>`;
    }
    return `<div class="a-login">${P.floral('a-floral a-floral-tl')}${P.floral('a-floral a-floral-br')}<div class="a-login-card">${brand}
      <h1>Welcome back!</h1>${bundleNote()}
      <form data-form="login" class="a-stack" novalidate>
        <label class="a-field"><span>Your name</span><input name="name" autocomplete="username" required></label>
        <label class="a-field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
        ${B.error ? `<p class="a-error" role="alert">${esc(B.error)}</p>` : ''}
        <button class="a-btn a-btn-wide" ${B.busy ? 'disabled' : ''}>${B.busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <button type="button" class="a-link a-small a-forgot" data-act="forgot">Forgot your name or password?</button></div></div>`;
  }

  // ---------- layout ----------
  const wave = cls => `<svg class="${cls}" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 0C48 0 72 60 120 60S192 0 240 0S312 60 360 60S432 0 480 0S552 60 600 60S672 0 720 0S792 60 840 60S912 0 960 0S1032 60 1080 60S1152 0 1200 0S1272 60 1320 60S1392 0 1440 0V60H0z"/></svg>`;
  const studioLogo = () => (B.studio && B.studio.logo) || P.logo;
  function layout(inner) {
    return `<div class="a-app b-app">
      <header class="b-top">
        <button class="b-brand" data-act="go" data-view="tracker">Pixie Craft Studio</button>
        <button class="b-badge" data-act="go" data-view="studio" aria-label="Studio settings" title="Studio settings (logo and social links)"><img src="${esc(studioLogo())}" alt=""></button>
        <div class="b-user"><span>Signed in as ${esc(B.meta.me)}</span><button class="a-link" data-act="logout">Sign-Out</button></div>
      </header>
      <main class="a-main b-main">${bundleNote()}${inner}</main>
      <footer class="b-foot">${wave('b-wave')}<p>For Admins Only!</p></footer></div>`;
  }

  // ---------- client tracker ----------
  function viewTracker() {
    const all = B.list;
    const q = C.normName(B.trackQuery);
    const list = all.filter(c => (B.trackFilter === 'all' || c.phase === B.trackFilter) && (!q || C.normName(c.couple + ' ' + c.slug).includes(q)))
      .sort((a, b) => (a.phase === 'done') - (b.phase === 'done') || a.weddingDate.localeCompare(b.weddingDate));
    const count = k => all.filter(c => c.phase === k).length;
    const chip = (k, label, n) => `<button class="a-chip ${B.trackFilter === k ? 'is-on' : ''}" data-act="track-filter" data-f="${k}" aria-pressed="${B.trackFilter === k}">${label} <span>${n}</span></button>`;
    return `<div class="b-head"><div><h1 class="b-title">Client Tracker</h1><p>Every couple’s RSVPs, all in one place. Select a couple to manage their guests, invitation links, and wedding theme with ease.</p></div>
        <button class="b-btn b-btn-big" data-act="go" data-view="new">+ New Client</button></div>
      <div class="b-toolbar"><div class="a-chips" role="group" aria-label="Show">${chip('all', 'All', all.length)}${chip('open', 'Collecting RSVPs', count('open'))}${chip('closed', 'RSVP Closed', count('closed'))}${chip('done', 'Wedding Done', count('done'))}</div>
        ${all.length > 6 ? `<label class="a-search a-search-inline"><span class="a-sr">Search clients</span><input type="search" data-bind="trackQuery" value="${esc(B.trackQuery)}" placeholder="Search couple names..."></label>` : ''}</div>
      <div data-region="clients">${list.length ? `<div class="b-clients">${list.map(clientCard).join('')}</div>`
        : all.length ? '<p class="a-muted a-center">No clients match.</p>'
        : `<div class="a-empty">${P.floral('a-floral a-floral-empty')}<h2>No clients yet</h2><p>Add your first couple to create their RSVP page.</p><button class="b-btn b-btn-big" data-act="go" data-view="new">+ New Client</button></div>`}</div>`;
  }
  function clientCard(c) {
    const s = c.stats, [label, cls] = PHASE[c.phase];
    const days = U.daysLeft(C, { deadline: c.deadline });
    return `<article class="b-client">
      <button class="b-client-open" data-act="open" data-id="${c.id}" aria-label="Open ${esc(c.couple)}"></button>
      <div class="b-cover">${c.cover ? `<img src="${esc(c.cover)}" alt="">` : P.monogram(c.couple, 'b-cover-mono')}</div>
      <div class="b-client-top"><span class="b-pill ${cls}">${label}</span>${c.phase === 'open' ? `<span>${days} day${days === 1 ? '' : 's'} to deadline</span>` : ''}</div>
      <h2 class="b-client-name">${esc(c.couple)}</h2>
      <p class="b-client-dates">Wedding: ${esc(C.formatPadded(c.weddingDate))} | RSVP by ${esc(C.formatPadded(c.deadline))}</p>
      ${U.progress(s)}
      <div class="b-client-foot"><p class="b-client-nums"><span><strong>${s.invited}</strong> Invited</span><span><strong>${s.attending}</strong> Yes</span><span><strong>${s.notAttending}</strong> No</span><span><strong>${s.awaiting}</strong> Waiting</span></p>
        <button class="b-open" data-act="open" data-id="${c.id}"><span>Open</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>
    </article>`;
  }

  // ---------- new client (a card over the tracker) ----------
  function viewNew() {
    const f = B.form || {};
    return `<div class="b-modal-bg" data-act="modal-bg"><div class="b-modal" role="dialog" aria-modal="true" aria-labelledby="b-new-title">
      <button type="button" class="b-close" data-act="go" data-view="tracker" aria-label="Close">×</button>
      <h2 class="b-title b-modal-title" id="b-new-title">New Client</h2>
      <form class="b-form" data-form="new" novalidate>
        <label class="b-field"><span>Couple’s Names</span><input name="couple" value="${esc(f.couple || '')}" placeholder="eg. Jennie & Taehyung" required maxlength="80"></label>
        <div class="b-two"><label class="b-field"><span>Wedding Date</span><input name="weddingDate" type="date" value="${esc(f.weddingDate || '')}" required></label>
        <label class="b-field"><span>RSVP Deadline</span><input name="deadline" type="date" value="${esc(f.deadline || '')}" required><small>Guests can’t answer after this date.</small></label></div>
        <label class="b-field"><span>Couple’s 6-Number Code</span><span class="b-inline"><input name="code" inputmode="numeric" maxlength="6" value="${esc(f.code || randomCode())}" required><button type="button" class="b-btn b-btn-soft" data-act="gen-code">New Code</button></span>
          <small>The couple uses this to open their RSVP tracker. Their anniversary (like 120825) works well.</small></label>
        <label class="b-field"><span>Notes</span><small class="b-under">Only you can see this.</small><textarea name="notes" rows="4">${esc(f.notes || '')}</textarea></label>
        <label class="b-check"><input type="checkbox" name="sample" ${f.sample === false ? '' : 'checked'}> Add an example family so the couple can try the RSVP</label>
        ${B.error ? `<p class="a-error" role="alert">${esc(B.error)}</p>` : ''}
        <div class="b-actions"><button class="b-btn b-btn-create" ${B.busy ? 'disabled' : ''}>${B.busy ? 'Creating…' : 'Create'}</button></div>
      </form></div></div>`;
  }

  // ---------- studio settings: header logo, couple's view banner, social links ----------
  function viewStudio() {
    const st = B.studio || {};
    const pic = (k, label, help, cls) => `<div class="b-field"><span>${label}</span><small>${help}</small>
      <div class="a-media-row"><span class="${cls}"><img src="${esc(st[k] || (k === 'logo' ? P.logo : P.storefront))}" alt=""></span>
      <div class="a-stack"><label class="b-btn b-btn-soft a-file-btn"><input type="file" accept="image/png,image/jpeg,image/webp" data-bind="studio-${k}">Upload…</label>
      ${st[k] ? `<button type="button" class="a-link" data-act="studio-clear" data-k="${k}">Use the default</button>` : ''}</div></div></div>`;
    return `<div class="b-modal-bg" data-act="modal-bg"><div class="b-modal" role="dialog" aria-modal="true" aria-labelledby="b-studio-title">
      <button type="button" class="b-close" data-act="go" data-view="tracker" aria-label="Close">×</button>
      <h2 class="b-title b-modal-title" id="b-studio-title">Studio Settings</h2>
      <form class="b-form" data-form="studio" novalidate>
        ${pic('logo', 'Studio logo', 'Shown at the top of this board and in every couple’s view.', 'a-logo-thumb')}
        ${pic('banner', 'Couple’s view banner', 'The picture behind “Welcome!” in every couple’s view. Without one, the Pixie Craft storefront is shown.', 'a-cover-thumb')}
        <label class="b-field"><span>Facebook page</span><input name="facebook" type="url" value="${esc(st.facebook || '')}" placeholder="https://facebook.com/pixiecraftstudio"></label>
        <label class="b-field"><span>TikTok</span><input name="tiktok" type="url" value="${esc(st.tiktok || '')}" placeholder="https://tiktok.com/@pixiecraftstudio"></label>
        <label class="b-field"><span>Instagram</span><input name="instagram" type="url" value="${esc(st.instagram || '')}" placeholder="https://instagram.com/pixiecraftstudio"></label>
        <label class="b-field"><span>Help note in the couple’s view</span><textarea name="helpNote" rows="2">${esc(st.helpNote || '')}</textarea></label>
        <div class="b-actions b-actions-split"><button type="button" class="a-link" data-act="backup">Download a backup of everything</button><button class="b-btn b-btn-create" ${B.busy ? 'disabled' : ''}>Save</button></div>
      </form></div></div>`;
  }

  // ---------- client workspace ----------
  function viewClient() {
    const c = B.client, [label, cls] = PHASE[c.phase];
    const body = { guests: B.form ? viewForm : viewGuests, upload: viewUpload, links: viewLinks, customize: viewCustomize, design: viewDesign, wording: viewWording, preview: viewPreview }[B.tab]();
    return `<button class="a-back" data-act="go" data-view="tracker">← All clients</button>
      <div class="a-client-head"><div><h1 class="a-script a-client-title">${esc(c.couple)}</h1>
        <p class="a-muted">Wedding ${esc(C.formatLong(c.weddingDate))} · RSVP by ${esc(C.formatLong(c.deadline))} <span class="a-pill ${cls}">${label}</span></p></div>
        <div class="a-row"><button class="a-btn a-btn-sm a-btn-ghost" data-act="open-guest">Open RSVP page</button><button class="a-btn a-btn-sm a-btn-ghost" data-act="open-couple">Open couple’s view</button></div></div>
      <nav class="a-tabs" aria-label="Client sections">${TABS.map(([k, l]) => `<button data-act="tab" data-tab="${k}" class="${B.tab === k ? 'is-on' : ''}" ${B.tab === k ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</nav>
      ${B.pending ? '<div class="a-banner a-banner-info"><span>New RSVP answers came in. They will show after you save or cancel.</span></div>' : ''}
      <div class="a-tab-body">${body}</div>`;
  }

  // Guest list
  function viewGuests() {
    const c = B.client, s = c.stats;
    const examples = c.reservations.filter(r => r.sample);
    const q = C.normName(B.query);
    const list = c.reservations.filter(r => !q || C.normName(r.family).includes(q) || r.guests.some(g => C.normName(g.name).includes(q)));
    let body;
    if (!c.reservations.length) body = `<div class="a-empty"><h2>No guests yet</h2><p>Add families one by one, or upload the whole guest list at once.</p>
        <div class="a-row a-center-row"><button class="a-btn a-btn-big" data-act="add">+ Add Reservation</button><button class="a-btn a-btn-big a-btn-soft" data-act="tab" data-tab="upload">Upload RSVP list</button></div></div>`;
    else if (!list.length) body = `<div class="a-empty"><h2>No matches</h2><button class="a-btn a-btn-ghost" data-act="clear-search">Clear search</button></div>`;
    else body = `<table class="a-table"><thead><tr><th>Family or Group Name</th><th>Reserved Seats</th><th>Attending</th><th>Not Attending</th><th>Awaiting Response</th><th><span class="a-sr">Actions</span></th></tr></thead>
      <tbody>${list.map(rowHtml).join('')}</tbody></table>`;
    return `${s.invited ? `<div class="a-panel a-mb"><p class="a-progress-text"><strong>${s.attending + s.notAttending} of ${s.invited}</strong> guests have answered · ${s.familiesAnswered} of ${s.reservations} families replied</p>${U.progress(s, true)}${U.legend}${U.stats(s)}</div>` : ''}
      <div class="a-page-head"><div><h2 class="a-h2">Guest List</h2><p class="a-muted">${s.reservations} reservation${s.reservations === 1 ? '' : 's'} · ${s.invited} guests. Tap a family to see each guest’s answer.</p></div>
        <div class="a-row"><button class="a-btn a-btn-ghost" data-act="export">Download list (CSV)</button><button class="a-btn" data-act="add">+ Add Reservation</button></div></div>
      ${examples.length ? `<div class="a-banner"><span><strong>Example:</strong> ${examples.map(r => esc(r.family)).join(', ')} is only for trying the RSVP. It isn’t counted and real guests can’t find it.</span><button class="a-btn a-btn-ghost a-btn-sm" data-act="remove-examples">Remove example</button></div>` : ''}
      ${c.reservations.length ? `<label class="a-search"><span class="a-sr">Search</span><input type="search" data-bind="query" value="${esc(B.query)}" placeholder="Search guest or family name..."></label>` : ''}
      <div data-region="list">${body}</div>`;
  }
  function rowHtml(r) {
    const c = U.counts(r), open = B.expanded.has(r.id), over = r.guests.length > r.seats;
    return `<tr class="${r.sample ? 'is-example' : ''} ${open ? 'is-open' : ''}">
      <td data-label="Family or Group Name"><button class="a-family" data-act="toggle" data-id="${r.id}" aria-expanded="${open}"><span class="a-chev" aria-hidden="true">${open ? '▾' : '▸'}</span>${esc(r.family)}</button>
        ${r.sample ? '<span class="a-pill a-pill-example">Example</span>' : ''}${r.addedBy === 'couple' ? '<span class="a-pill">Added by the couple</span>' : ''}${over ? `<span class="a-pill a-pill-warn">${r.guests.length} guests for ${r.seats} seat${r.seats === 1 ? '' : 's'}</span>` : ''}</td>
      <td data-label="Reserved Seats">${r.seats}</td>
      <td data-label="Attending"><span class="a-num yes">${c.attending}</span></td>
      <td data-label="Not Attending"><span class="a-num no">${c.not_attending}</span></td>
      <td data-label="Awaiting Response"><span class="a-num wait">${c.awaiting}</span></td>
      <td class="a-actions"><button class="a-btn a-btn-sm" data-act="edit" data-id="${r.id}">Edit</button>
        <button class="a-btn a-btn-sm a-btn-ghost" data-act="copy-family" data-id="${r.id}">Copy RSVP Link</button>
        <button class="a-btn a-btn-sm a-btn-ghost" data-act="preview-res" data-id="${r.id}">Preview</button>
        <button class="a-btn a-btn-sm a-btn-ghost a-danger" data-act="delete-res" data-id="${r.id}">Delete</button></td></tr>
    ${open ? `<tr class="a-detail"><td colspan="6"><ul class="a-guest-pills">${r.guests.map(g => `<li><span>${esc(g.name)}</span><span class="a-status ${g.status}">${U.STATUS_TEXT[g.status]}</span></li>`).join('')}</ul>
      <p class="a-muted a-small">${r.submittedAt ? 'Answered ' + esc(U.ago(r.submittedAt)) + '.' : 'No reply yet.'}</p></td></tr>` : ''}`;
  }
  function viewForm() {
    const f = B.form, isNew = !f.id;
    return `<button class="a-back" data-act="cancel-form">← Back to Guest List</button>
      <h2 class="a-h2">${isNew ? 'Add Reservation' : 'Edit Reservation'}</h2>
      <form class="a-panel a-stack" data-form="reservation" novalidate>
        <label class="a-field"><span>Family or Group Name</span><input data-bind="family" value="${esc(f.family)}" placeholder="e.g. Villarin Family" maxlength="80"></label>
        <div class="a-field"><span id="seats-l">Number of Reserved Seats</span>
          <div class="a-stepper" role="group" aria-labelledby="seats-l"><button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="seats" data-d="-1" aria-label="One less seat">−</button>
          <input data-bind="seats" type="number" min="1" max="50" inputmode="numeric" value="${esc(f.seats)}" aria-labelledby="seats-l">
          <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="seats" data-d="1" aria-label="One more seat">+</button></div></div>
        <fieldset class="a-guests-edit"><legend>Guest Names</legend>
          ${f.guests.map((g, i) => `<div class="a-guest-row">
            <label class="a-field"><span>Guest ${i + 1}</span><input data-bind="gname" data-i="${i}" value="${esc(g.name)}" placeholder="First name and surname" maxlength="80"></label>
            <label class="a-field"><span>RSVP answer</span><select data-bind="gstatus" data-i="${i}" class="a-status-select ${g.status}">${C.STATUSES.map(s => `<option value="${s}" ${g.status === s ? 'selected' : ''}>${U.STATUS_TEXT[s]}</option>`).join('')}</select></label>
            <button type="button" class="a-btn a-btn-ghost a-btn-sm a-danger" data-act="remove-guest" data-i="${i}" ${f.guests.length < 2 ? 'disabled' : ''}>Remove</button></div>`).join('')}
          <button type="button" class="a-btn a-btn-soft a-btn-sm" data-act="add-guest">+ Add another guest</button>
        </fieldset>
        <div data-region="warn">${seatWarning()}</div>
        ${B.error ? `<p class="a-error" role="alert">${esc(B.error)}</p>` : ''}
        <div class="a-row-end"><button type="button" class="a-btn a-btn-ghost" data-act="cancel-form">Cancel</button><button class="a-btn" ${B.busy ? 'disabled' : ''}>${isNew ? 'Save Reservation' : 'Save Changes'}</button></div>
      </form>`;
  }
  function seatWarning() {
    const f = B.form, n = f.guests.filter(g => g.name.trim()).length, seats = Number(f.seats) || 0;
    if (n <= seats || !seats) return '';
    return `<div class="a-banner a-banner-warn" role="status"><span>${n} guests are listed but only ${seats} seat${seats === 1 ? ' is' : 's are'} reserved. This won’t be changed for you.</span>
      <button type="button" class="a-btn a-btn-sm a-btn-soft" data-act="match-seats">Make it ${n} seats</button></div>`;
  }

  // Upload RSVP
  function parseTable(text) {
    const rows = []; let row = [], cell = '', q = false;
    const delim = (text.split('\n')[0].match(/\t/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? '\t' : ',';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const clean = rows.map(r => r.map(x => x.trim())).filter(r => r.some(Boolean));
    if (!clean.length) return [];
    const head = clean[0].map(h => C.normName(h));
    const find = re => head.findIndex(h => re.test(h));
    let cols = { family: find(/famil|group|household|party/), guest: find(/guest|name|invitee/), seats: find(/seat/), status: find(/status|rsvp|answer|attend/) };
    let data = clean.slice(1);
    if (cols.family < 0 || cols.guest < 0) { cols = { family: 0, guest: 1, seats: 2, status: 3 }; data = clean; }
    return data.map(r => ({ family: r[cols.family] || '', guest: r[cols.guest] || '', seats: cols.seats >= 0 ? r[cols.seats] || '' : '', status: cols.status >= 0 ? r[cols.status] || '' : '' }));
  }
  function viewUpload() {
    const u = B.upload;
    const groups = u ? C.groupRows(u.rows) : [];
    const guests = groups.reduce((a, g) => a + g.guests.length, 0);
    return `<h2 class="a-h2">Upload RSVP list</h2>
      <p class="a-muted">Upload the couple’s guest list and every family gets its own reservation and RSVP link. Use a spreadsheet saved as <strong>CSV</strong> (in Excel or Google Sheets: File → Download / Save as → CSV). One row per guest.</p>
      <div class="a-panel a-stack">
        <div class="a-upload-cols"><div><p><strong>Columns</strong></p><ul class="a-small a-tight"><li><strong>Family</strong>: family or group name (required)</li><li><strong>Guest</strong>: guest’s full name (required)</li><li><strong>Seats</strong>: reserved seats for the family (optional, defaults to the number of guests)</li><li><strong>Status</strong>: Attending / Not Attending (optional)</li></ul>
          <button class="a-btn a-btn-ghost a-btn-sm" data-act="template">Download a sample file</button></div>
          <div class="a-stack"><label class="a-drop"><input type="file" accept=".csv,.tsv,.txt,text/csv" data-bind="file"><span>☁ Choose a CSV file</span><small>${u && u.fileName ? esc(u.fileName) : 'or drop it here'}</small></label>
          <label class="a-field"><span>…or paste rows from a spreadsheet</span><textarea data-bind="paste" rows="4" placeholder="Family, Guest, Seats&#10;Villarin Family, John Wendren Villarin, 3">${u && u.pasted ? esc(u.pasted) : ''}</textarea></label></div></div>
      </div>
      ${u ? `<div class="a-panel a-mt a-stack">
        <h3 class="a-h3">Check before importing: ${groups.length} famil${groups.length === 1 ? 'y' : 'ies'}, ${guests} guest${guests === 1 ? '' : 's'}</h3>
        ${groups.length ? `<div class="a-scroll"><table class="a-table a-table-plain"><thead><tr><th>Family</th><th>Seats</th><th>Guests</th></tr></thead><tbody>
          ${groups.slice(0, 200).map(g => `<tr><td>${esc(g.family)}</td><td>${g.seats}${g.guests.length > g.seats ? ' <span class="a-pill a-pill-warn">more guests than seats</span>' : ''}</td><td>${g.guests.map(x => esc(x.name) + (x.status !== 'awaiting' ? ` <span class="a-status ${x.status}">${U.STATUS_TEXT[x.status]}</span>` : '')).join(', ')}</td></tr>`).join('')}</tbody></table></div>
          <fieldset class="a-radio"><legend>How to import</legend>
            <label><input type="radio" name="mode" value="add" ${u.mode !== 'replace' ? 'checked' : ''} data-bind="mode"> Add to the current guest list (families with the same name get the new guests added)</label>
            <label><input type="radio" name="mode" value="replace" ${u.mode === 'replace' ? 'checked' : ''} data-bind="mode"> Replace the whole guest list (removes current families and their answers)</label></fieldset>
          <div class="a-row-end"><button class="a-btn a-btn-ghost" data-act="upload-clear">Clear</button><button class="a-btn" data-act="upload-go" ${B.busy ? 'disabled' : ''}>Import ${guests} guests</button></div>`
        : '<p class="a-error">No rows with both a family name and a guest name were found. Check the columns above.</p>'}</div>` : ''}`;
  }

  // RSVP links
  function viewLinks() {
    const c = B.client, real = c.reservations.filter(r => !r.sample);
    const guestLink = P.link('/w/' + c.slug), coupleLink = P.link('/couple/' + c.slug);
    const linkRow = (label, help, url, act) => `<div class="a-link-row"><div><p class="a-link-label">${label}</p><p class="a-muted a-small">${help}</p><code class="a-url">${esc(url)}</code></div>
      <div class="a-row"><button class="a-btn a-btn-sm" data-act="copy-text" data-text="${esc(url)}" data-msg="Link copied!">Copy</button><button class="a-btn a-btn-sm a-btn-ghost" data-act="${act}">Open</button></div></div>`;
    return `<h2 class="a-h2">RSVP Links</h2>
      <div class="a-panel a-stack">
        ${linkRow('Guest RSVP page', 'One link for everyone. Guests search their name to find their family.', guestLink, 'open-guest')}
        ${linkRow('Couple’s view', 'Private tracker for the couple. They sign in with their 6-number code.', coupleLink, 'open-couple')}
        <div class="a-link-row a-link-code"><div><p class="a-link-label">Couple’s code</p>
          <p class="a-muted a-small">${B.newCode ? `New code: <strong class="a-code">${esc(B.newCode)}</strong>. Send it to the couple now. For safety it won’t be shown again.` : c.hasCode ? 'A code is set. You can give the couple a new one any time.' : 'No code yet, so the couple can’t sign in.'}</p></div>
          <form class="a-inline-row" data-form="code" novalidate><input name="code" inputmode="numeric" maxlength="6" placeholder="New 6-number code" aria-label="New couple code"><button class="a-btn a-btn-sm">Set code</button></form></div>
        <form class="a-link-row" data-form="slug" novalidate><div><p class="a-link-label">Link name</p><p class="a-muted a-small">The part after /w/ and /couple/. Changing it stops old links from working.</p></div>
          <div class="a-inline-row"><input name="slug" value="${esc(c.slug)}" aria-label="Link name" maxlength="40"><button class="a-btn a-btn-sm a-btn-ghost">Save</button></div></form>
      </div>
      <div class="a-page-head a-mt"><div><h2 class="a-h2">Family links</h2><p class="a-muted">Personal links skip the name search and open the family’s reservation directly.</p></div>
        ${real.length ? '<div class="a-row"><button class="a-btn a-btn-ghost" data-act="links-csv">Download all (CSV)</button><button class="a-btn" data-act="links-copy">Copy all links</button></div>' : ''}</div>
      ${real.length ? `<div class="a-panel"><ul class="a-family-links">${real.map(r => `<li><span><strong>${esc(r.family)}</strong><code class="a-url">${esc(P.link('/r/' + r.token))}</code></span>
        <button class="a-btn a-btn-sm a-btn-ghost" data-act="copy-family" data-id="${r.id}">Copy</button></li>`).join('')}</ul></div>` : '<p class="a-muted">Add or upload guests to generate family links.</p>'}
      <div class="a-panel a-mt a-danger-zone"><div><p class="a-link-label">Delete this client</p><p class="a-muted a-small">Removes the RSVP page, couple’s view, guest list and every answer.</p></div>
        <button class="a-btn a-btn-danger a-btn-sm" data-act="delete-client">Delete client</button></div>`;
  }

  // Customize (quick look)
  const fontVars = t => `--fs-h:'${esc(P.fontFamily(t.headingFont))}';--fs-b:'${esc(P.fontFamily(t.bodyFont))}';--fs-s:'${esc(P.fontFamily(t.scriptFont))}';--fs-st:${t.headingItalic ? 'italic' : 'normal'}`;
  function fontSelect(key, label, list) {
    const t = B.themeDraft, all = t.customFont ? [B.meta.customFont, ...list] : list;
    return `<label class="a-field"><span>${label}</span><select data-theme="${key}" class="a-font-select" style="font-family:'${esc(P.fontFamily(t[key]))}'">${all.map(f => `<option value="${esc(f)}" style="font-family:'${esc(P.fontFamily(f))}'" ${t[key] === f ? 'selected' : ''}>${esc(f === B.meta.customFont ? f + ' (' + t.customFont.name + ')' : f)}</option>`).join('')}</select></label>`;
  }
  // A % slider for font sizes and card size; the number beside it updates as it moves.
  const slider = (path, label, min, max) => {
    const [a, b] = path.split('.'), v = (B.themeDraft[a] || {})[b] || 100;
    return `<label class="a-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="5" value="${v}" data-nest="${path}"><output>${v}%</output></label>`;
  };
  const effectSelect = (k, label) => `<label class="a-field a-field-sm"><span>${label}</span><select data-nest-sel="effects.${k}">${Object.entries(B.meta.effects).map(([v, l]) => `<option value="${v}" ${(B.themeDraft.effects || {})[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  function themeFonts(t) { P.loadCustomFont(t.customFont); P.loadFonts([t.headingFont, t.bodyFont, t.scriptFont]); }
  // Show the saved/uploaded video in the Customize page.
  async function paintVideoThumb() {
    const box = app.querySelector('[data-region="video-thumb"]'), ref = B.themeDraft && B.themeDraft.video;
    if (!box || !ref) return;
    const src = await P.mediaUrl(ref).catch(() => null);
    if (!src || box.dataset.ref === ref) return;
    box.dataset.ref = ref;
    box.innerHTML = `<video src="${esc(src)}" muted loop playsinline autoplay></video>`;
  }
  function viewCustomize() {
    const t = B.themeDraft, m = B.meta;
    // Every font in the lists, so each choice shows in its own style.
    P.loadFonts([...m.scriptFonts, ...m.headingFonts, ...m.bodyFonts]); P.loadCustomFont(t.customFont);
    const sw = (k, p) => `<button type="button" class="a-swatch ${t.palette === k ? 'is-on' : ''}" data-act="palette" data-p="${k}" aria-pressed="${t.palette === k}">
      <span class="a-swatch-dots">${['card', 'accent', 'button', 'text', 'heading'].map(x => `<i style="background:${p[x]}"></i>`).join('')}</span><span>${esc(p.name)}</span></button>`;
    const COLOR_LABELS = [['heading', 'Headings'], ['text', 'Text'], ['button', 'Buttons'], ['accent', 'Icons & accents'], ['card', 'Card']];
    const bgTile = (k, label) => `<button type="button" class="a-bg-tile ${t.background === k ? 'is-on' : ''}" data-act="bg" data-bg="${k}" aria-pressed="${t.background === k}">
      <span class="a-bg-thumb" data-bg="${k}" style="${k === 'garden' ? `background-image:url('${esc(P.bg)}')` : k === 'custom' && t.customBg ? `background-image:url('${t.customBg}')` : ''}"></span><span>${esc(label)}</span></button>`;
    return `<div class="a-customize">
      <form class="a-stack" data-form="theme" novalidate>
        <section class="a-panel a-stack"><h3 class="a-h3">Color palette</h3>
          <div class="a-swatches">${Object.entries(m.palettes).map(([k, p]) => sw(k, p)).join('')}</div>
          <details class="a-more"><summary>Fine-tune colors</summary><div class="a-colors">${COLOR_LABELS.map(([k, l]) => `<label class="a-color"><input type="color" data-color="${k}" value="${esc(t.colors[k])}"><span>${l}</span></label>`).join('')}</div></details>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Fonts</h3>
          <p class="a-muted a-small">Elegant fonts, the same families you’ll find in Canva. Have a font file of your own? Upload it below and pick “${esc(m.customFont)}”.</p>
          <div class="a-font-group">${fontSelect('scriptFont', 'Names (couple, family, “See you soon!”)', m.scriptFonts)}
            <div class="a-font-adjust">${slider('sizes.names', 'Size', 60, 160)}${effectSelect('names', 'Effect')}</div></div>
          <div class="a-font-group">${fontSelect('headingFont', 'Titles', m.headingFonts)}
            <div class="a-font-adjust">${slider('sizes.titles', 'Size', 60, 160)}${effectSelect('titles', 'Effect')}</div>
            <label class="a-check"><input type="checkbox" data-theme="headingItalic" ${t.headingItalic ? 'checked' : ''}> Italic titles</label></div>
          <div class="a-font-group">${fontSelect('bodyFont', 'Text', m.bodyFonts)}
            <div class="a-font-adjust">${slider('sizes.text', 'Size', 60, 160)}</div></div>
          <p class="a-font-sample" data-region="font-sample" style="${fontVars(t)}"><b>Via &amp; Arkin</b><span>A Little Note!</span>Your seat has been lovingly reserved just for you.</p>
          <div class="a-upload-row">
            <label class="a-btn a-btn-ghost a-btn-sm a-file-btn"><input type="file" accept=".woff2,.woff,.ttf,.otf,font/*" data-bind="fontfile">${t.customFont ? 'Replace my font…' : 'Upload a font file…'}</label>
            ${t.customFont ? `<span class="a-small">${esc(t.customFont.name)}</span><button type="button" class="a-link" data-act="font-remove">Remove</button>` : '<span class="a-muted a-small">WOFF2, WOFF, TTF or OTF · under 3 MB</span>'}
          </div>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Card size</h3>
          <p class="a-muted a-small">Makes the RSVP cards smaller or bigger. Phones and computers are set separately.</p>
          ${slider('cardSize.desktop', 'On computers', 70, 120)}
          ${slider('cardSize.mobile', 'On phones', 70, 120)}
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Couple photo</h3>
          <p class="a-muted a-small">Shown on this couple’s card in the Client Tracker and at the top of their couple’s view. Guests don’t see it.</p>
          <div class="a-media-row">
            <span class="a-cover-thumb">${t.cover ? `<img src="${esc(t.cover)}" alt="">` : '<span class="a-muted a-small">No photo</span>'}</span>
            <div class="a-stack">
              <label class="a-btn a-btn-ghost a-btn-sm a-file-btn"><input type="file" accept="image/png,image/jpeg,image/webp" data-bind="coverfile">${t.cover ? 'Replace photo…' : 'Upload a photo…'}</label>
              ${t.cover ? '<button type="button" class="a-link" data-act="cover-remove">Remove photo</button>' : ''}
            </div>
          </div>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Logo</h3>
          <p class="a-muted a-small">Shown on the invitation and thank-you cards. Without one, a flower wreath with the couple’s initials is used.</p>
          <div class="a-media-row">
            <span class="a-logo-thumb">${t.logo ? `<img src="${esc(t.logo)}" alt="">` : P.monogram(B.client.site.couple, 'a-logo-mono')}</span>
            <div class="a-stack">
              <label class="a-btn a-btn-ghost a-btn-sm a-file-btn"><input type="file" accept="image/png,image/jpeg,image/webp" data-bind="logofile">${t.logo ? 'Replace logo…' : 'Upload a logo…'}</label>
              ${t.logo ? '<button type="button" class="a-link" data-act="logo-remove">Use the initials wreath instead</button>' : '<span class="a-muted a-small">PNG with a clear background looks best.</span>'}
            </div>
          </div>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Top video</h3>
          <p class="a-muted a-small">Plays silently across the top of each family’s RSVP page. Without one, the background photo is shown there.</p>
          <div class="a-media-row">
            <span class="a-video-thumb" data-region="video-thumb">${t.video ? '' : '<span class="a-muted a-small">No video</span>'}</span>
            <div class="a-stack">
              <label class="a-btn a-btn-ghost a-btn-sm a-file-btn ${B.videoBusy ? 'is-busy' : ''}"><input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v" data-bind="videofile" ${B.videoBusy ? 'disabled' : ''}>${B.videoBusy ? 'Uploading…' : t.video ? 'Replace video…' : 'Upload a video…'}</label>
              ${t.video ? '<button type="button" class="a-link" data-act="video-remove">Remove video</button>' : `<span class="a-muted a-small">MP4, WebM or MOV · up to 1 minute, up to 1080p (Full HD) · under ${MAX_VIDEO_MB} MB.</span>`}
            </div>
          </div>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Background</h3>
          <div class="a-bg-tiles">${Object.entries(m.backgrounds).map(([k, l]) => bgTile(k, l)).join('')}</div>
          <label class="a-btn a-btn-ghost a-btn-sm a-file-btn"><input type="file" accept="image/jpeg,image/png,image/webp" data-bind="bgfile">Upload a photo…</label>
          <label class="a-check"><input type="checkbox" data-theme="blur" ${t.blur ? 'checked' : ''}> Soft blur on the photo</label>
        </section>
        <div class="a-savebar ${B.themeDirty ? 'is-dirty' : ''}" data-region="themebar">
          <span class="a-savebar-msg">${B.themeDirty ? 'The preview shows changes that aren’t saved yet.' : 'This is the saved look.'}</span>
          <button type="button" class="a-btn a-btn-ghost" data-act="cancel-theme" ${B.themeDirty ? '' : 'hidden'}>Cancel</button>
          <button class="a-btn" ${B.busy ? 'disabled' : ''}>Save look</button>
        </div>
      </form>
      <div class="a-customize-preview"><div class="a-seg a-seg-sm" role="group" aria-label="Preview screen">${[['welcome', 'Welcome'], ['invite', 'Invitation'], ['family', 'Family page']].map(([k, l]) => `<button type="button" data-act="look-screen" data-s="${k}" aria-pressed="${(B.lookScreen || 'welcome') === k}">${l}</button>`).join('')}</div>
        <div class="a-frame mobile"><iframe title="Look preview" data-region="frame"></iframe></div></div>
    </div>`;
  }
  function sendTheme() {
    const f = app.querySelector('[data-region="frame"]');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'pixie-theme', theme: B.themeDraft }, '*');
  }
  function themeChanged(rerender) {
    B.themeDirty = true;
    if (rerender) {
      // Redraw only the controls so the live preview keeps running.
      const open = app.querySelector('.a-more') && app.querySelector('.a-more').open;
      const tmp = document.createElement('div'); tmp.innerHTML = viewCustomize();
      app.querySelector('form[data-form="theme"]').replaceWith(tmp.querySelector('form[data-form="theme"]'));
      if (open) app.querySelector('.a-more').open = true;
      themeFonts(B.themeDraft); paintVideoThumb();
    }
    else {
      const bar = app.querySelector('[data-region="themebar"]');
      bar.classList.add('is-dirty'); bar.querySelector('.a-savebar-msg').textContent = 'The preview shows changes that aren’t saved yet.'; bar.querySelector('[data-act="cancel-theme"]').hidden = false;
      const fs = app.querySelector('[data-region="font-sample"]'); const t = B.themeDraft;
      fs.setAttribute('style', fontVars(t));
      app.querySelectorAll('.a-font-select').forEach(sel => { sel.style.fontFamily = `'${P.fontFamily(t[sel.dataset.theme])}'`; });
      themeFonts(t);
    }
    sendTheme();
  }
  const MAX_VIDEO_MB = P.maxVideoMB || 250;
  // Length and size of a video file, read before uploading (null if this browser can't tell).
  function videoInfo(file) {
    return new Promise(resolve => {
      const v = document.createElement('video'), url = URL.createObjectURL(file);
      const done = x => { URL.revokeObjectURL(url); resolve(x); };
      v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = () => done({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
      v.onerror = () => done(null);
      setTimeout(() => done(null), 8000);
      v.src = url;
    });
  }
  // Shrinks a picture before saving. Logos keep a see-through background (PNG).
  function resizeImage(file, max, keepClear) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, (max || 1800) / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        resolve(keepClear && file.type !== 'image/jpeg' ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('That file could not be opened as a picture.'));
      img.src = url;
    });
  }

  // Wording
  const SECTIONS = [
    ['Welcome Screen', 'The first page guests see.', [['welcomeEyebrow', 'Small heading above the title'], ['welcomeTitle', 'Title'], ['welcomeMessage', 'Message', 'area'], ['welcomeButton', 'Button label']]],
    ['RSVP Deadline Notice', 'Shown right after the welcome screen.', [['deadline', 'RSVP deadline date', 'date'], ['noticeEyebrow', 'Small heading'], ['noticeTitle', 'Title'], ['noticeMessage', 'Message', 'area'], ['noticeContact', 'What happens after the deadline', 'area'], ['noticeClosing', 'Closing line'], ['noticeButton', 'Button label']]],
    ['Wedding Invitation', 'Names, date, and the name search.', [['couple', 'Couple’s names'], ['weddingDate', 'Wedding date', 'date'], ['invitationHeading', 'Small heading above the names'], ['inviteQuestion', 'Question under the date'], ['searchInstructions', 'Guest search instructions', 'area'], ['searchPlaceholder', 'Example inside the search box'], ['searchButton', 'Search button label']]],
    ['Family Page', 'Family name and seats are filled in automatically.', [['greeting', 'Greeting (above the family name)', 'area'], ['seatsLabel', 'Label under the seat number'], ['onlyListedNote', 'Note about who is included', 'area']]],
    ['Guest Answers', 'The answer and recap part.', [['confirmTitle', 'Title above the guest names'], ['responseInstructions', 'Response instructions', 'area'], ['attendingLabel', 'Attending button'], ['notAttendingLabel', 'Not Attending button'], ['reviewTitle', 'Recap title'], ['reviewSubtitle', 'Recap note'], ['attendingGroupLabel', 'Heading for guests attending'], ['notAttendingGroupLabel', 'Heading for guests not attending'], ['submitButton', 'Submit button'], ['adultsOnly', 'Adults-only notice', 'area']]],
    ['Thank-You Screen', 'Shown after a guest sends their RSVP.', [['thanksEyebrow', 'Small line above the heading'], ['thanksHeading', 'Heading'], ['thanksMessage', 'Message', 'area'], ['thanksClosing', 'Closing']]],
  ];
  function viewWording() {
    const s = B.siteDraft;
    return `<h2 class="a-h2">Wording</h2>
      <div class="a-banner a-banner-info"><span>Filled in for you: <code>{couple}</code>, <code>{deadline}</code>, <code>{family}</code>, <code>{seats}</code>. Select words and press <strong>B</strong>, <em>I</em> or <u>U</u> to make them bold, italic or underlined. An empty line starts a new paragraph.</span></div>
      <form data-form="site" class="a-sections" novalidate>
      ${SECTIONS.map(([title, help, fields], i) => `<details class="a-section" ${i === 0 ? 'open' : ''}><summary><span class="a-section-n">${i + 1}</span><span><strong>${title}</strong><small>${help}</small></span></summary>
        <div class="a-stack">${fields.map(([k, label, type]) => `<div class="a-field"><label for="w-${k}">${label}</label>
          ${type === 'date' ? '' : `<div class="a-fmt" role="toolbar" aria-label="Format ${esc(label)}"><button type="button" data-act="fmt" data-k="${k}" data-m="**" title="Bold"><b>B</b></button><button type="button" data-act="fmt" data-k="${k}" data-m="*" title="Italic"><i>I</i></button><button type="button" data-act="fmt" data-k="${k}" data-m="__" title="Underline"><u>U</u></button></div>`}
          ${type === 'area' ? `<textarea id="w-${k}" data-site="${k}" rows="${k === 'welcomeMessage' ? 7 : 3}">${esc(s[k])}</textarea>` : `<input id="w-${k}" data-site="${k}" type="${type === 'date' ? 'date' : 'text'}" value="${esc(s[k])}">`}
          ${type === 'date' ? `<small>${esc(k === 'deadline' ? C.formatDeadline(s[k]) : C.formatWeddingDate(s[k]))} (as guests see it)</small>` : ''}</div>`).join('')}
          <button type="button" class="a-link a-small" data-act="restore" data-sec="${i}">Use the original text for this section</button></div></details>`).join('')}
        <div class="a-savebar ${B.siteDirty ? 'is-dirty' : ''}" data-region="savebar"><span class="a-savebar-msg">${B.siteDirty ? 'You have changes that aren’t saved yet.' : 'All changes saved.'}</span>
          <button type="button" class="a-btn a-btn-ghost" data-act="cancel-site" ${B.siteDirty ? '' : 'hidden'}>Cancel</button><button class="a-btn" ${B.busy ? 'disabled' : ''}>Save wording</button></div>
      </form>`;
  }

  // Preview
  function viewPreview() {
    const c = B.client;
    const opts = c.reservations.map(r => `<option value="${esc(r.token)}" ${B.previewTarget === r.token ? 'selected' : ''}>${esc(r.family)}${r.sample ? ' (example)' : ''}</option>`).join('');
    return `<div class="a-preview-bar">
        <label class="a-field a-inline"><span>Show</span><select data-bind="previewTarget"><option value="">Whole guest journey (from the Welcome screen)</option>${opts}</select></label>
        <div class="a-seg" role="group" aria-label="Screen size"><button data-act="device" data-d="desktop" aria-pressed="${B.previewDevice === 'desktop'}">Desktop</button><button data-act="device" data-d="mobile" aria-pressed="${B.previewDevice === 'mobile'}">Mobile</button></div>
        <button class="a-btn a-btn-ghost" data-act="restart-preview">Start over</button></div>
      <p class="a-muted a-small a-preview-hint">The saved look, wording and guest list. Answers picked here are <strong>not saved</strong>.</p>
      <div class="a-frame ${B.previewDevice}"><iframe title="RSVP preview" data-region="frame"></iframe></div>`;
  }
  function loadFrame() {
    const f = app.querySelector('[data-region="frame"]'); if (!f) return;
    const c = B.client;
    if (B.tab === 'design') { f.addEventListener('load', dSend); P.setFrame(f, dFrameUrl()); paintLib(); return; }
    if (B.tab === 'customize') {
      f.addEventListener('load', sendTheme);
      const r = c.reservations[0], scr = B.lookScreen || 'welcome';
      P.setFrame(f, scr === 'family' && r ? '/r/' + r.token + '?preview=1&step=reservation' : '/w/' + c.slug + '?preview=1' + (scr === 'invite' ? '&step=invite' : ''));
      paintVideoThumb(); return;
    }
    P.setFrame(f, B.previewTarget ? '/r/' + B.previewTarget + '?preview=1&step=reservation' : '/w/' + c.slug + '?preview=1');
  }

  // ---------- Design (Canva-style): place your own elements and text on each guest screen ----------
  const D_SCREENS = [['welcome', 'Welcome'], ['notice', 'Heads-up'], ['invite', 'Invitation'], ['reservation', 'Family page'], ['thanks', 'Thank you']];
  const D_HIDE = [['glow', 'Gold glow at the top'], ['icon', 'Icon and logo'], ['eyebrow', 'Small heading above the title'], ['foot', '“With Love by Pixie Craft Studio”']];
  const D_LAYERS = [['front', 'In front of everything'], ['under', 'Under the words'], ['behind', 'Behind the card']];
  const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), x => (x % 36).toString(36)).join('');
  function decor() {
    const t = B.themeDraft;
    t.decor = Object.assign({ hide: [] }, t.decor || {});
    for (const [k] of D_SCREENS) if (!Array.isArray(t.decor[k])) t.decor[k] = [];
    return t.decor;
  }
  const dList = () => decor()[B.dScreen || 'welcome'];
  const dSelected = () => dList().find(e => e.id === B.dSel) || null;
  // Undo / Redo keep copies of the design; quick changes to the same control count as one step.
  function dRemember(key) {
    const now = Date.now();
    if (key && B.dLastKey === key && now - B.dLastAt < 700) { B.dLastAt = now; return; }
    B.dLastKey = key; B.dLastAt = now;
    (B.dUndo = B.dUndo || []).push(JSON.stringify(decor())); if (B.dUndo.length > 60) B.dUndo.shift();
    B.dRedo = [];
  }
  function dChanged(full) {
    B.themeDirty = true;
    const bar = app.querySelector('[data-region="d-bar"]');
    if (bar) { bar.classList.add('is-dirty'); bar.querySelector('.a-savebar-msg').textContent = 'Your design has changes that aren’t saved yet.'; bar.querySelector('[data-act="d-cancel"]').hidden = false; }
    const u = app.querySelector('[data-act="d-undo"]'), r = app.querySelector('[data-act="d-redo"]');
    if (u) u.disabled = !(B.dUndo || []).length; if (r) r.disabled = !(B.dRedo || []).length;
    if (full) dRefresh();
    dSend();
  }
  function dSend() {
    const f = app.querySelector('[data-region="frame"]');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'pixie-theme', theme: B.themeDraft, selected: B.dSel || null }, '*');
  }
  function dRefresh() {
    const p = app.querySelector('[data-region="d-props"]'); if (p) p.innerHTML = dProps();
    const l = app.querySelector('[data-region="d-layers"]'); if (l) l.innerHTML = dLayers();
    paintLib();
  }
  const dRange = (k, label, min, max, step, v, unit) => `<label class="a-slider d-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-dprop="${k}"><output>${unit === '%' ? Math.round(v * 100) + '%' : Math.round(v) + (unit || '')}</output></label>`;
  function dProps() {
    const e = dSelected();
    if (!e) return `<h3 class="a-h3">Selected element</h3><p class="a-muted a-small">Click an element on the page to move it, resize it from the corner dot, or turn it with the top dot. Arrow keys nudge it.</p>`;
    const m = B.meta, fonts = [...new Set([...m.scriptFonts, ...m.headingFonts, ...m.bodyFonts])];
    const text = e.type === 'text' ? `
      <label class="a-field"><span>Text</span><textarea rows="3" data-dprop="text" maxlength="400">${esc(e.text)}</textarea></label>
      <label class="a-field"><span>Font</span><select data-dprop="font" class="a-font-select" style="font-family:'${esc(P.fontFamily(e.font))}'">${(B.themeDraft.customFont ? [m.customFont, ...fonts] : fonts).map(f => `<option value="${esc(f)}" style="font-family:'${esc(P.fontFamily(f))}'" ${e.font === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
      <div class="d-row"><label class="a-color"><input type="color" data-dprop="color" value="${esc(e.color)}"><span>Color</span></label>
        <button type="button" class="d-tog ${e.bold ? 'is-on' : ''}" data-act="d-toggle" data-k="bold" aria-pressed="${!!e.bold}"><b>B</b></button>
        <button type="button" class="d-tog ${e.italic ? 'is-on' : ''}" data-act="d-toggle" data-k="italic" aria-pressed="${!!e.italic}"><i>I</i></button>
        ${['left', 'center', 'right'].map(a => `<button type="button" class="d-tog ${e.align === a ? 'is-on' : ''}" data-act="d-align" data-a="${a}" aria-pressed="${e.align === a}" title="Align ${a}">${{ left: '⇤', center: '↔', right: '⇥' }[a]}</button>`).join('')}</div>
      ${dRange('size', 'Text size', 1, 30, 0.25, e.size)}` : '';
    return `<h3 class="a-h3">Selected ${e.type === 'text' ? 'text' : 'element'}</h3>${text}
      ${dRange('w', e.type === 'text' ? 'Box width' : 'Size', 2, 200, 0.5, e.w)}
      ${dRange('rot', 'Turn', -180, 180, 1, e.rot || 0, '°')}
      ${dRange('op', 'See-through', 0.1, 1, 0.05, e.op === undefined ? 1 : e.op, '%')}
      <label class="a-field a-field-sm"><span>Layer</span><select data-dprop="layer">${D_LAYERS.map(([k, l]) => `<option value="${k}" ${(e.layer || 'front') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="d-row d-actions">
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-order" data-d="1">Bring forward</button>
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-order" data-d="-1">Send backward</button>
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-flip">Flip</button>
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-center">Center</button>
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-dup">Duplicate</button>
        <button type="button" class="a-btn a-btn-danger a-btn-sm" data-act="d-del">Delete</button></div>`;
  }
  function dLayers() {
    const list = dList();
    if (!list.length) return '<p class="a-muted a-small">Nothing added to this screen yet.</p>';
    return `<ol class="d-layer-list">${list.slice().reverse().map(e => `<li><button type="button" class="${B.dSel === e.id ? 'is-on' : ''}" data-act="d-pick" data-id="${esc(e.id)}">
      ${e.type === 'text' ? `<span class="d-layer-t">T</span><span>${esc(e.text.slice(0, 30))}</span>` : `<img alt="" data-src="${esc(e.src)}"><span>${esc(((B.studio && B.studio.elements) || []).find(x => x.src === e.src)?.name || 'Element')}</span>`}
      <small>${{ front: 'front', under: 'under words', behind: 'behind card' }[e.layer || 'front']}</small></button></li>`).join('')}</ol>`;
  }
  function viewDesign() {
    const d = decor(), lib = (B.studio && B.studio.elements) || [], k = B.dScreen || 'welcome';
    return `<div class="d-wrap">
      <div class="d-side">
        <section class="a-panel a-stack">
          <h3 class="a-h3">Design your RSVP</h3>
          <p class="a-muted a-small">Like Canva: add your own elements and text, then drag, resize, turn and layer them. It’s saved per couple and looks the same on phones.</p>
          <div class="a-seg a-seg-sm d-screens" role="group" aria-label="Screen">${D_SCREENS.map(([s, l]) => `<button type="button" data-act="d-screen" data-s="${s}" aria-pressed="${k === s}">${l}${d[s].length ? ` <small>${d[s].length}</small>` : ''}</button>`).join('')}</div>
          <div class="d-row"><button type="button" class="a-btn a-btn-sm" data-act="d-text">+ Add text</button>
            <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-undo" ${(B.dUndo || []).length ? '' : 'disabled'}>↶ Undo</button>
            <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-redo" ${(B.dRedo || []).length ? '' : 'disabled'}>↷ Redo</button>
            ${dList().length ? '<button type="button" class="a-link a-small" data-act="d-clear">Clear this screen</button>' : ''}</div>
        </section>
        <section class="a-panel a-stack">
          <h3 class="a-h3">My elements</h3>
          <p class="a-muted a-small">Upload your own flowers, frames, stickers or photos (PNG with a clear background looks best). Click one to add it to this screen. They’re kept for every client.</p>
          <label class="a-btn a-btn-ghost a-btn-sm a-file-btn ${B.dBusy ? 'is-busy' : ''}"><input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" data-bind="d-upload" ${B.dBusy ? 'disabled' : ''}>${B.dBusy ? 'Uploading…' : 'Upload elements…'}</label>
          ${lib.length ? `<div class="d-lib">${lib.map(x => `<div class="d-lib-item"><button type="button" class="d-lib-add" data-act="d-add" data-id="${esc(x.id)}" title="Add ${esc(x.name)}"><img alt="${esc(x.name)}" data-src="${esc(x.src)}"></button>
            <button type="button" class="d-lib-x" data-act="d-lib-del" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.name)} from My elements">×</button></div>`).join('')}</div>` : '<p class="a-muted a-small">No elements yet.</p>'}
        </section>
        <section class="a-panel a-stack" data-region="d-props">${dProps()}</section>
        <section class="a-panel a-stack"><h3 class="a-h3">Layers on this screen</h3><div data-region="d-layers">${dLayers()}</div></section>
        <section class="a-panel a-stack"><h3 class="a-h3">Show or hide parts of the card</h3>
          ${D_HIDE.map(([h, l]) => `<label class="a-check"><input type="checkbox" data-dhide="${h}" ${d.hide.includes(h) ? '' : 'checked'}> ${l}</label>`).join('')}
          <p class="a-muted a-small">Words are changed in the Wording tab; colors and fonts of the page in Customize.</p></section>
        <div class="a-savebar ${B.themeDirty ? 'is-dirty' : ''}" data-region="d-bar">
          <span class="a-savebar-msg">${B.themeDirty ? 'Your design has changes that aren’t saved yet.' : 'This is the saved design.'}</span>
          <button type="button" class="a-btn a-btn-ghost" data-act="d-cancel" ${B.themeDirty ? '' : 'hidden'}>Cancel</button>
          <button type="button" class="a-btn" data-act="d-save" ${B.busy ? 'disabled' : ''}>Save design</button></div>
      </div>
      <div class="d-stage">
        <div class="a-seg a-seg-sm" role="group" aria-label="Screen size"><button type="button" data-act="d-device" data-d="mobile" aria-pressed="${B.dDevice !== 'desktop'}">Phone</button><button type="button" data-act="d-device" data-d="desktop" aria-pressed="${B.dDevice === 'desktop'}">Computer</button></div>
        <div class="a-frame ${B.dDevice === 'desktop' ? 'desktop' : 'mobile'} d-frame"><iframe title="Design" data-region="frame"></iframe></div>
      </div>
    </div>`;
  }
  // Thumbnails of uploaded elements (in the single file they live in this browser's storage).
  function paintLib() {
    app.querySelectorAll('.d-side img[data-src]').forEach(async img => { const s = await P.mediaUrl(img.dataset.src).catch(() => null); if (s) img.src = s; });
  }
  function dFrameUrl() {
    const c = B.client, k = B.dScreen || 'welcome', r = c.reservations[0];
    if ((k === 'reservation' || k === 'thanks') && r) return '/r/' + r.token + '?preview=1&design=1&step=' + k;
    return '/w/' + c.slug + '?preview=1&design=1' + (k === 'welcome' ? '' : '&step=' + k);
  }
  // A picture made smaller (long side up to 1600 px) before upload; GIFs are kept as they are so they still move.
  const shrinkToBlob = file => P.shrinkImage(file);
  async function dUpload(files) {
    if (!B.studio) await loadStudio();
    B.dBusy = true; dSideRedraw();
    let added = 0;
    try {
      const lib = ((B.studio && B.studio.elements) || []).slice();
      for (const file of files) {
        if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { U.toast(`${file.name} isn’t a PNG, JPG, WebP or GIF.`, 'error'); continue; }
        if (file.size > 15e6) { U.toast(`${file.name} is too big. Please use pictures under 15 MB.`, 'error'); continue; }
        const { blob, w, h } = await shrinkToBlob(file);
        const src = await P.uploadMedia(blob.type ? blob : new Blob([blob], { type: file.type }));
        lib.push({ id: newId(), name: file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 80), src, w, h }); added++;
      }
      if (added) B.studio = (await api('PUT', '/api/board/studio', { elements: lib })).studio;
      if (added) U.toast(added === 1 ? 'Element added to My elements.' : `${added} elements added to My elements.`);
    } catch (err) { U.toast(err.message, 'error'); }
    B.dBusy = false; dSideRedraw();
  }
  function dSideRedraw() {
    const side = app.querySelector('.d-side'); if (!side) return;
    const tmp = document.createElement('div'); tmp.innerHTML = viewDesign();
    side.replaceWith(tmp.querySelector('.d-side')); paintLib();
  }
  function dMutate(fn, key, full) {
    const e = dSelected(); if (!e) return;
    dRemember(key || null); fn(e); dChanged(full);
  }
  window.addEventListener('message', ev => {
    if (B.tab !== 'design' || B.view !== 'client' || !ev.data) return;
    const f = app.querySelector('[data-region="frame"]');
    if (!f || ev.source !== f.contentWindow || ev.data.screen !== (B.dScreen || 'welcome')) return;
    const m = ev.data, list = dList();
    if (m.type === 'pixie-decor-select') { B.dSel = m.id; return dRefresh(); }
    const i = list.findIndex(e => e.id === (m.item ? m.item.id : m.id)); if (i < 0) return;
    if (m.type === 'pixie-decor-change') { dRemember(); list[i] = Object.assign({}, list[i], m.item); B.dSel = m.item.id; return dChanged(true); }
    if (m.type === 'pixie-decor-nudge') { dRemember('nudge' + m.id); list[i].x = +(list[i].x + m.dx).toFixed(2); list[i].y = +(list[i].y + m.dy).toFixed(2); return dChanged(false); }
    if (m.type === 'pixie-decor-delete') { dRemember(); list.splice(i, 1); B.dSel = null; return dChanged(true); }
  });
  async function dClick(act, b) {
    const list = dList();
    switch (act) {
      case 'd-screen':
        if ((b.dataset.s === 'reservation' || b.dataset.s === 'thanks') && !B.client.reservations.length) return U.toast('Add a family to the guest list first to design the family page and thank-you screen.');
        B.dScreen = b.dataset.s; B.dSel = null; dSideRedraw(); return loadFrame();
      case 'd-device': B.dDevice = b.dataset.d; app.querySelector('.d-frame').className = 'a-frame ' + (B.dDevice === 'desktop' ? 'desktop' : 'mobile') + ' d-frame';
        app.querySelectorAll('[data-act="d-device"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === B.dDevice)); return;
      case 'd-add': {
        const x = ((B.studio && B.studio.elements) || []).find(y => y.id === b.dataset.id); if (!x) return;
        if (list.length >= 80) return U.toast('A screen can hold up to 80 elements.', 'error');
        dRemember(); const e = { id: newId(), type: 'image', src: x.src, x: 50, y: 40 + (list.length % 5) * 6, w: 34, rot: 0, op: 1, layer: 'front', flip: false };
        list.push(e); B.dSel = e.id; return dChanged(true);
      }
      case 'd-text': {
        if (list.length >= 80) return U.toast('A screen can hold up to 80 elements.', 'error');
        const t = B.themeDraft; dRemember();
        const e = { id: newId(), type: 'text', text: 'Your text', font: t.scriptFont || 'Great Vibes', color: (t.colors && t.colors.heading) || '#1f4d2c', size: 10, bold: false, italic: false, align: 'center', x: 50, y: 30, w: 80, rot: 0, op: 1, layer: 'front', flip: false };
        list.push(e); B.dSel = e.id; dChanged(true);
        const ta = app.querySelector('[data-dprop="text"]'); if (ta) { ta.focus(); ta.select(); }
        return;
      }
      case 'd-pick': B.dSel = b.dataset.id; dRefresh(); { const f = app.querySelector('[data-region="frame"]'); if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'pixie-decor-select', id: B.dSel }, '*'); } return;
      case 'd-toggle': return dMutate(e => { e[b.dataset.k] = !e[b.dataset.k]; }, null, true);
      case 'd-align': return dMutate(e => { e.align = b.dataset.a; }, null, true);
      case 'd-flip': return dMutate(e => { e.flip = !e.flip; }, null, false);
      case 'd-center': return dMutate(e => { e.x = 50; }, null, false);
      case 'd-dup': {
        const e = dSelected(); if (!e) return; if (list.length >= 80) return U.toast('A screen can hold up to 80 elements.', 'error');
        dRemember(); const copy = Object.assign({}, e, { id: newId(), x: e.x + 4, y: e.y + 4 }); list.push(copy); B.dSel = copy.id; return dChanged(true);
      }
      case 'd-del': { const i = list.findIndex(e => e.id === B.dSel); if (i < 0) return; dRemember(); list.splice(i, 1); B.dSel = null; return dChanged(true); }
      case 'd-order': {
        const i = list.findIndex(e => e.id === B.dSel), j = i + Number(b.dataset.d);
        if (i < 0 || j < 0 || j >= list.length) return;
        dRemember(); [list[i], list[j]] = [list[j], list[i]]; return dChanged(true);
      }
      case 'd-clear':
        if (!(await U.confirm({ title: 'Clear this screen?', message: 'Every element and text box on this screen will be removed. You can still press Undo or Cancel before saving.', yes: 'Clear screen', no: 'Keep', danger: true }))) return;
        dRemember(); list.splice(0, list.length); B.dSel = null; dChanged(false); return dSideRedraw();
      case 'd-undo': case 'd-redo': {
        const from = act === 'd-undo' ? (B.dUndo || []) : (B.dRedo || []), to = act === 'd-undo' ? (B.dRedo = B.dRedo || []) : (B.dUndo = B.dUndo || []);
        if (!from.length) return;
        to.push(JSON.stringify(decor())); B.themeDraft.decor = JSON.parse(from.pop()); B.dLastKey = null;
        if (!dSelected()) B.dSel = null;
        dChanged(false); return dSideRedraw();
      }
      case 'd-lib-del': {
        const lib = (B.studio.elements || []), x = lib.find(y => y.id === b.dataset.id); if (!x) return;
        if (!(await U.confirm({ title: `Remove ${x.name} from My elements?`, message: 'Copies already placed on a design stay where they are.', yes: 'Remove', no: 'Keep' }))) return;
        try { B.studio = (await api('PUT', '/api/board/studio', { elements: lib.filter(y => y.id !== x.id) })).studio; dSideRedraw(); } catch (err) { U.toast(err.message, 'error'); }
        return;
      }
      case 'd-cancel': resetDrafts(); B.dSel = null; B.dUndo = []; B.dRedo = []; return render();
      case 'd-save': {
        const out = await saveClient('PUT', '/theme', { theme: { decor: decor() } }, 'Your design is saved!');
        if (out) { B.dUndo = []; B.dRedo = []; }
        return;
      }
    }
  }
  function dInput(el) {
    const k = el.dataset.dprop;
    if (k) {
      const v = ['text', 'font', 'color', 'layer'].includes(k) ? el.value : Number(el.value);
      dMutate(e => { e[k] = v; }, 'p' + k, k === 'layer');
      const out = el.nextElementSibling;
      if (out && out.tagName === 'OUTPUT') out.textContent = k === 'op' ? Math.round(v * 100) + '%' : Math.round(v) + (k === 'rot' ? '°' : '');
      if (k === 'font') { el.style.fontFamily = `'${P.fontFamily(v)}'`; P.loadFonts([v]); }
      if (k === 'text') { const l = app.querySelector('[data-region="d-layers"]'); if (l) { l.innerHTML = dLayers(); paintLib(); } }
      return true;
    }
    if (el.dataset.dhide) {
      const d = decor(), h = el.dataset.dhide; dRemember();
      d.hide = el.checked ? d.hide.filter(x => x !== h) : [...d.hide, h];
      dChanged(false); return true;
    }
    return false;
  }

  // ---------- render & navigation ----------
  function render(withFrame) {
    if (!B.auth) return;
    if (!B.list) { app.innerHTML = viewSignIn(); document.title = 'Sign in · Pixie’s RSVP Board'; if (P.siteStart) P.siteStart({ page: 'board', root: app, canEdit: false, site: null }); return; }
    const inner = B.view === 'new' ? viewTracker() + viewNew() : B.view === 'studio' ? viewTracker() + viewStudio() : B.view === 'client' && B.client ? viewClient() : viewTracker();
    app.innerHTML = layout(inner);
    // Studio-wide website edits (words, colors, elements) and the "Edit website" button. Only the studio ever reaches this page.
    if (P.siteStart) P.siteStart({ page: 'board', root: app, canEdit: true, site: B.studio && B.studio.site });
    document.title = (B.view === 'client' && B.client ? B.client.couple + ' · ' : '') + 'Pixie’s RSVP Board';
    if (withFrame !== false && B.view === 'client' && (B.tab === 'preview' || B.tab === 'customize' || B.tab === 'design')) loadFrame();
  }
  const dirty = () => B.formDirty || B.siteDirty || B.themeDirty;
  async function leaveOk() {
    if (!dirty()) return true;
    return U.confirm({ title: 'Leave without saving?', message: 'You have changes that aren’t saved yet. If you leave now, they will be lost.', yes: 'Leave without saving', no: 'Stay here' });
  }
  function resetDrafts() {
    B.form = null; B.formDirty = B.siteDirty = B.themeDirty = false; B.error = ''; B.upload = null; B.newCode = null;
    if (B.client) { B.siteDraft = Object.assign({}, B.client.site); B.themeDraft = JSON.parse(JSON.stringify(B.client.theme)); }
  }
  async function goView(v, id) {
    if (!(await leaveOk())) return;
    if (v === 'client') { await loadClient(id); B.tab = 'guests'; B.query = ''; B.expanded.clear(); B.previewTarget = ''; }
    if (v === 'tracker') await loadList();
    if (v === 'new') B.form = null;
    if (v === 'studio' && !B.studio) await loadStudio();
    B.view = v; resetDrafts(); render();
    if (v === 'new' || v === 'studio') { const first = app.querySelector('.b-modal input:not([type=file])'); if (first) first.focus(); }
    else scrollTo(0, 0);
  }
  async function goTab(tab) {
    if (tab === B.tab && !B.form) return;
    if (!(await leaveOk())) return;
    if (B.pending) { await loadClient(B.client.id); B.pending = false; }
    if (tab === 'design' && !B.studio) await loadStudio();
    B.tab = tab; B.dSel = null; B.dUndo = []; B.dRedo = []; resetDrafts(); render(); scrollTo(0, 0);
  }
  async function saveClient(method, sub, body, okMsg) {
    B.busy = true;
    try {
      const out = await api(method, '/api/board/clients/' + B.client.id + sub, body);
      B.busy = false; useClient(out.client); resetDrafts(); render(); if (okMsg) U.toast(typeof okMsg === 'function' ? okMsg(out) : okMsg);
      return out;
    } catch (e) { B.busy = false; U.toast(e.message, 'error'); render(); return null; }
  }
  const findRes = id => B.client.reservations.find(r => r.id === id);
  const csvCell = v => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);

  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id, c = B.client;
    if (act.startsWith('d-')) return dClick(act, b);
    switch (act) {
      case 'forgot': {
        if (!P.resetStudio) {
          await U.confirm({ title: 'Reset the studio sign-in', message: P.resetHelp || 'On the hosted website, stop it and run "npm run reset-studio", then start it again and open the board. Your clients and guest lists are kept.', yes: 'OK', no: 'Close' });
          return;
        }
        const yes = await U.confirm({ title: 'Reset the studio sign-in?', message: 'You will choose a new name and password. Your clients, guest lists and answers are kept.', yes: 'Reset sign-in', no: 'Cancel' });
        if (!yes) return;
        P.resetStudio(); B.error = ''; await loadAuth(); render(); U.toast('Sign-in reset. Choose your new name and password.');
        return;
      }
      case 'logout': if (!(await leaveOk())) return; await P.api('POST', '/api/board/logout', {}).catch(() => {}); B.list = null; B.view = 'tracker'; resetDrafts(); await loadAuth(); return render();
      case 'go': e.preventDefault(); return goView(b.dataset.view);
      case 'modal-bg': if (e.target === b) return goView('tracker'); return;
      case 'backup': {
        try { const d = await api('GET', '/api/board/backup'); U.download('pixie-rsvp-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(d, null, 1)); U.toast('Backup downloaded. Keep it somewhere safe.'); }
        catch (err) { U.toast(err.message, 'error'); }
        return;
      }
      case 'studio-clear': B.studio = (await api('PUT', '/api/board/studio', { [b.dataset.k]: null })).studio; return render();
      case 'open': return goView('client', id);
      case 'track-filter': B.trackFilter = b.dataset.f; return render();
      case 'copy-guest': { const x = B.list.find(y => y.id === id); return U.copy(P.link('/w/' + x.slug), `RSVP link for ${x.couple} copied!`, 'RSVP link'); }
      case 'gen-code': app.querySelector('[name=code]').value = randomCode(); return;
      case 'tab': return goTab(b.dataset.tab);
      case 'open-guest': return U.open('/w/' + c.slug);
      case 'open-couple': return U.open('/couple/' + c.slug);
      case 'copy-text': return U.copy(b.dataset.text, b.dataset.msg || 'Copied!');
      case 'copy-family': { const r = findRes(id); return U.copy(P.link('/r/' + r.token), `RSVP link for the ${r.family} copied!`, 'Family RSVP link'); }
      case 'links-copy': return U.copy(c.reservations.filter(r => !r.sample).map(r => `${r.family}: ${P.link('/r/' + r.token)}`).join('\n'), 'All family links copied!', 'All family links');
      case 'links-csv': return U.download(c.slug + '-rsvp-links.csv', 'Family,Seats,Guests,RSVP link\n' + c.reservations.filter(r => !r.sample).map(r => [r.family, r.seats, r.guests.map(g => g.name).join('; '), P.link('/r/' + r.token)].map(csvCell).join(',')).join('\n'));
      case 'export': return U.download(c.slug + '-guest-list.csv', 'Family,Guest,Seats,Status\n' + c.reservations.filter(r => !r.sample).flatMap(r => r.guests.map(g => [r.family, g.name, r.seats, U.STATUS_TEXT[g.status]].map(csvCell).join(','))).join('\n'));
      case 'template': return U.download('rsvp-guest-list-sample.csv', 'Family,Guest,Seats,Status\nVillarin Family,John Wendren Villarin,3,\nVillarin Family,Mary Rose Villarin,3,\nVillarin Family,Jane Villarin,3,\nSantos Family,Ana Santos,2,\nSantos Family,Ben Santos,2,\n');
      case 'delete-client': {
        const yes = await U.confirm({ title: `Delete ${c.couple}?`, message: 'Their RSVP page, couple’s view, guest list and every answer will be removed. This can’t be undone.', yes: 'Yes, delete', no: 'Keep', danger: true });
        if (!yes) return;
        try { await api('DELETE', '/api/board/clients/' + c.id); B.client = null; B.view = 'tracker'; resetDrafts(); await loadList(); render(); U.toast(`${c.couple} was deleted.`); } catch (err) { U.toast(err.message, 'error'); }
        return;
      }
      // guest list
      case 'toggle': B.expanded.has(id) ? B.expanded.delete(id) : B.expanded.add(id); { const y = scrollY; render(); scrollTo(0, y); } return;
      case 'clear-search': B.query = ''; return render();
      case 'add': if (B.tab !== 'guests') B.tab = 'guests'; B.form = { family: '', seats: 1, guests: [{ name: '', status: 'awaiting' }] }; B.formDirty = false; B.error = ''; render(); app.querySelector('[data-bind="family"]').focus(); return;
      case 'edit': { const r = findRes(id); B.form = JSON.parse(JSON.stringify({ id: r.id, family: r.family, seats: r.seats, guests: r.guests })); B.formDirty = false; B.error = ''; render(); scrollTo(0, 0); return; }
      case 'cancel-form': if (!(await leaveOk())) return; B.form = null; B.formDirty = false; B.error = ''; return render();
      case 'add-guest': B.form.guests.push({ name: '', status: 'awaiting' }); B.formDirty = true; render(); { const all = app.querySelectorAll('[data-bind="gname"]'); all[all.length - 1].focus(); } return;
      case 'remove-guest': B.form.guests.splice(Number(b.dataset.i), 1); B.formDirty = true; return render();
      case 'seats': B.form.seats = Math.min(50, Math.max(1, (Number(B.form.seats) || 0) + Number(b.dataset.d))); B.formDirty = true; app.querySelector('[data-bind="seats"]').value = B.form.seats; return updateWarn();
      case 'match-seats': B.form.seats = B.form.guests.filter(g => g.name.trim()).length; B.formDirty = true; app.querySelector('[data-bind="seats"]').value = B.form.seats; return updateWarn();
      case 'preview-res': B.previewTarget = findRes(id).token; return goTab('preview');
      case 'delete-res': {
        const r = findRes(id);
        const yes = await U.confirm({ title: `Delete the ${r.family}?`, message: `This removes the reservation and its ${r.guests.length} guest${r.guests.length === 1 ? '' : 's'}, including their answers. Their RSVP link will stop working.`, yes: 'Yes, delete it', no: 'Keep it', danger: true });
        if (yes) await saveClient('DELETE', '/reservations/' + id, undefined, `The ${r.family} was deleted.`);
        return;
      }
      case 'remove-examples': if (await U.confirm({ title: 'Remove the example family?', message: 'Real guests stay as they are.', yes: 'Remove', danger: true })) await saveClient('POST', '/remove-examples', {}, 'Example removed.'); return;
      // upload
      case 'upload-clear': B.upload = null; return render();
      case 'upload-go': {
        const u = B.upload;
        if (u.mode === 'replace' && c.reservations.some(r => !r.sample) && !(await U.confirm({ title: 'Replace the whole guest list?', message: 'Current families and all their answers will be removed and replaced by this file.', yes: 'Replace list', danger: true }))) return;
        const out = await saveClient('POST', '/upload', { rows: u.rows, mode: u.mode || 'add' }, o => `Imported! ${o.added} new famil${o.added === 1 ? 'y' : 'ies'}${o.merged ? `, ${o.merged} updated` : ''}.`);
        if (out) { B.tab = 'guests'; render(); }
        return;
      }
      // customize
      case 'palette': { const p = B.meta.palettes[b.dataset.p]; B.themeDraft.palette = b.dataset.p; B.themeDraft.colors = { heading: p.heading, text: p.text, button: p.button, accent: p.accent, card: p.card }; return themeChanged(true); }
      case 'bg': if (b.dataset.bg === 'custom' && !B.themeDraft.customBg) { app.querySelector('[data-bind="bgfile"]').click(); return; } B.themeDraft.background = b.dataset.bg; return themeChanged(true);
      case 'cancel-theme': resetDrafts(); render(); return;
      case 'look-screen':
        if (b.dataset.s === 'family' && !B.client.reservations.length) return U.toast('Add a family to the guest list first to preview the family page.');
        B.lookScreen = b.dataset.s; app.querySelectorAll('[data-act="look-screen"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.s === B.lookScreen)); return loadFrame();
      case 'fmt': {
        // Wrap the selected words in the marks guests see as bold (**), italic (*) or underlined (__). Pressing again removes them.
        const f = app.querySelector(`[data-site="${b.dataset.k}"]`), mk = b.dataset.m;
        let a = f.selectionStart, z = f.selectionEnd, v = f.value;
        if (a === z) { while (a > 0 && /\S/.test(v[a - 1])) a--; while (z < v.length && /\S/.test(v[z])) z++; }
        const sel = v.slice(a, z);
        if (!sel) { U.toast('Select some words first.'); return; }
        const wrapped = v.slice(a - mk.length, a) === mk && v.slice(z, z + mk.length) === mk && !(mk === '*' && (v[a - 2] === '*' || v[z + 1] === '*'));
        if (wrapped) { f.value = v.slice(0, a - mk.length) + sel + v.slice(z + mk.length); f.setSelectionRange(a - mk.length, z - mk.length); }
        else { f.value = v.slice(0, a) + mk + sel + mk + v.slice(z); f.setSelectionRange(a + mk.length, z + mk.length); }
        f.focus(); f.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      case 'cover-remove': B.themeDraft.cover = null; return themeChanged(true);
      case 'logo-remove': B.themeDraft.logo = null; return themeChanged(true);
      case 'video-remove': B.themeDraft.video = null; return themeChanged(true);
      case 'font-remove': B.themeDraft.customFont = null; for (const k of ['headingFont', 'bodyFont', 'scriptFont']) if (B.themeDraft[k] === B.meta.customFont) B.themeDraft[k] = B.client.theme[k] === B.meta.customFont ? C.defaultTheme()[k] : B.client.theme[k]; return themeChanged(true);
      // wording
      case 'restore': for (const [k] of SECTIONS[Number(b.dataset.sec)][2]) B.siteDraft[k] = C.DEFAULT_SITE[k] !== undefined && !['couple', 'weddingDate', 'deadline'].includes(k) ? C.DEFAULT_SITE[k] : B.client.site[k];
        B.siteDirty = true; { const open = [...app.querySelectorAll('details')].map(d => d.open); render(); app.querySelectorAll('details').forEach((d, i) => { d.open = open[i]; }); } return;
      case 'cancel-site': resetDrafts(); return render();
      // preview
      case 'device': B.previewDevice = b.dataset.d; app.querySelector('.a-frame').className = 'a-frame ' + B.previewDevice; app.querySelectorAll('[data-act="device"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === B.previewDevice)); return;
      case 'restart-preview': return loadFrame();
    }
  });
  function updateWarn() { const w = app.querySelector('[data-region="warn"]'); if (w) w.innerHTML = seatWarning(); }

  app.addEventListener('input', e => {
    const el = e.target, bind = el.dataset.bind;
    if (B.tab === 'design' && B.view === 'client' && dInput(el)) return;
    if (el.dataset.nest) {
      const [a, b] = el.dataset.nest.split('.');
      B.themeDraft[a] = Object.assign({}, B.themeDraft[a], { [b]: Number(el.value) });
      el.nextElementSibling.textContent = el.value + '%';
      return themeChanged(false);
    }
    if (bind === 'trackQuery' || bind === 'query') {
      B[bind] = el.value;
      const region = bind === 'trackQuery' ? 'clients' : 'list';
      const tmp = document.createElement('div'); tmp.innerHTML = bind === 'trackQuery' ? viewTracker() : viewGuests();
      app.querySelector(`[data-region="${region}"]`).innerHTML = tmp.querySelector(`[data-region="${region}"]`).innerHTML;
      return;
    }
    if (B.form && B.tab === 'guests' && B.view === 'client') {
      if (bind === 'family') B.form.family = el.value;
      else if (bind === 'seats') B.form.seats = el.value === '' ? '' : Number(el.value);
      else if (bind === 'gname') B.form.guests[Number(el.dataset.i)].name = el.value;
      else return;
      B.formDirty = true; return updateWarn();
    }
    if (bind === 'paste') { B.upload = { rows: parseTable(el.value), pasted: el.value, mode: B.upload && B.upload.mode }; clearTimeout(B.pasteTimer); B.pasteTimer = setTimeout(() => { render(); const t = app.querySelector('[data-bind="paste"]'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 500); return; }
    if (el.dataset.site) {
      B.siteDraft[el.dataset.site] = el.value; B.siteDirty = true;
      const bar = app.querySelector('[data-region="savebar"]'); bar.classList.add('is-dirty'); bar.querySelector('.a-savebar-msg').textContent = 'You have changes that aren’t saved yet.'; bar.querySelector('[data-act="cancel-site"]').hidden = false;
      return;
    }
    if (el.dataset.color) { B.themeDraft.colors[el.dataset.color] = el.value; B.themeDraft.palette = 'custom'; app.querySelectorAll('.a-swatch').forEach(s => s.classList.remove('is-on')); return themeChanged(false); }
  });
  app.addEventListener('change', async e => {
    const el = e.target, bind = el.dataset.bind;
    if (bind === 'gstatus') { B.form.guests[Number(el.dataset.i)].status = el.value; el.className = 'a-status-select ' + el.value; B.formDirty = true; return; }
    if (bind === 'previewTarget') { B.previewTarget = el.value; return loadFrame(); }
    if (bind === 'd-upload' && el.files.length) return dUpload([...el.files]);
    if (bind === 'mode') { B.upload.mode = el.value; return; }
    if (bind === 'file' && el.files[0]) {
      const file = el.files[0];
      if (file.size > 5e6) return U.toast('That file is too big. Please use a CSV under 5 MB.', 'error');
      if (/\.xlsx?$/i.test(file.name)) return U.toast('Please save the spreadsheet as CSV first (File → Save as → CSV).', 'error');
      const text = await file.text();
      B.upload = { rows: parseTable(text), fileName: file.name, mode: 'add' }; return render();
    }
    if (bind === 'bgfile' && el.files[0]) {
      try {
        const data = await resizeImage(el.files[0]);
        if (data.length > 2.9e6) return U.toast('That picture is too big even after shrinking. Please choose a smaller one.', 'error');
        B.themeDraft.customBg = data; B.themeDraft.background = 'custom'; themeChanged(true);
      } catch (err) { U.toast(err.message, 'error'); }
      return;
    }
    if ((bind === 'studio-logo' || bind === 'studio-banner') && el.files[0]) {
      try {
        const k = bind.slice(7), data = await resizeImage(el.files[0], k === 'logo' ? 600 : 1800, k === 'logo');
        B.studio = (await api('PUT', '/api/board/studio', { [k]: data })).studio; render(); U.toast('Saved!');
      } catch (err) { U.toast(err.message, 'error'); }
      return;
    }
    if (bind === 'coverfile' && el.files[0]) {
      try {
        const data = await resizeImage(el.files[0], 1200);
        if (data.length > 1.45e6) return U.toast('That photo is too big even after shrinking. Please choose a smaller one.', 'error');
        B.themeDraft.cover = data; themeChanged(true);
      } catch (err) { U.toast(err.message, 'error'); }
      return;
    }
    if (el.dataset.nestSel) { const [a, b] = el.dataset.nestSel.split('.'); B.themeDraft[a] = Object.assign({}, B.themeDraft[a], { [b]: el.value }); return themeChanged(false); }
    if (bind === 'logofile' && el.files[0]) {
      try {
        const data = await resizeImage(el.files[0], 700, true);
        if (data.length > 1.45e6) return U.toast('That logo is too big even after shrinking. Please choose a smaller one.', 'error');
        B.themeDraft.logo = data; themeChanged(true);
      } catch (err) { U.toast(err.message, 'error'); }
      return;
    }
    if (bind === 'fontfile' && el.files[0]) {
      const file = el.files[0];
      if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) return U.toast('Please choose a WOFF2, WOFF, TTF or OTF font file.', 'error');
      if (file.size > 2.9e6) return U.toast('That font file is too big. Please use one under 3 MB.', 'error');
      const ext = file.name.split('.').pop().toLowerCase();
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const data = `data:font/${ext};base64,${b64}`;
      try { await new FontFace('PixieCheck', `url(${data})`).load(); } catch (err) { return U.toast('That font file could not be opened. Please try another one.', 'error'); }
      B.themeDraft.customFont = { name: file.name.replace(/\.[^.]+$/, '').slice(0, 60), data };
      B.themeDraft.scriptFont = B.meta.customFont; // show it right away; it can be moved to titles or text
      U.toast('Font added. It’s now used for the names; change that in the lists above.');
      return themeChanged(true);
    }
    if (bind === 'videofile' && el.files[0]) {
      const file = el.files[0];
      if (!/^video\/(mp4|webm|quicktime|x-m4v)$/.test(file.type) && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) return U.toast('Please choose an MP4, WebM or MOV video.', 'error');
      if (file.size > MAX_VIDEO_MB * 1e6) return U.toast(`That video is too big. Please use one under ${MAX_VIDEO_MB} MB.`, 'error');
      const meta = await videoInfo(file);
      if (meta && meta.duration > 61) return U.toast(`That video is ${Math.round(meta.duration)} seconds long. Please trim it to 1 minute or less.`, 'error');
      if (meta && Math.min(meta.width, meta.height) > 1080) return U.toast(`That video is ${meta.width}×${meta.height}. Please export it at 1080p (Full HD) or smaller.`, 'error');
      B.videoBusy = true; themeChanged(true);
      try { B.themeDraft.video = await P.uploadVideo(file); U.toast('Video uploaded. Press “Save look” to use it.'); }
      catch (err) { U.toast(err.message, 'error'); }
      B.videoBusy = false; return themeChanged(true);
    }
    if (el.dataset.theme) { const k = el.dataset.theme; B.themeDraft[k] = el.type === 'checkbox' ? el.checked : el.value; return themeChanged(false); }
  });
  // Drop a CSV on the upload box.
  app.addEventListener('dragover', e => { if (e.target.closest('.a-drop')) { e.preventDefault(); e.target.closest('.a-drop').classList.add('is-over'); } });
  app.addEventListener('dragleave', e => { const d = e.target.closest('.a-drop'); if (d) d.classList.remove('is-over'); });
  app.addEventListener('drop', async e => {
    if (!e.target.closest('.a-drop')) return;
    e.preventDefault();
    const file = e.dataTransfer.files[0]; if (!file) return;
    B.upload = { rows: parseTable(await file.text()), fileName: file.name, mode: 'add' }; render();
  });

  app.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, kind = f.dataset.form, v = n => (f.elements[n] ? String(f.elements[n].value).trim() : '');
    if (kind === 'setup' || kind === 'login') {
      B.busy = true; B.error = ''; render();
      try {
        await P.api('POST', '/api/board/' + kind, { setupCode: v('setupCode'), name: v('name'), password: f.elements.password.value });
        B.busy = false; await loadAuth(); await loadList(); await loadStudio(); render();
      } catch (err) { B.busy = false; B.error = err.message; render(); }
      return;
    }
    if (kind === 'studio') {
      try { B.studio = (await api('PUT', '/api/board/studio', { facebook: v('facebook'), tiktok: v('tiktok'), instagram: v('instagram'), helpNote: v('helpNote') })).studio; U.toast('Studio settings saved.'); goView('tracker'); }
      catch (err) { U.toast(err.message, 'error'); }
      return;
    }
    if (kind === 'new') {
      B.form = { couple: v('couple'), weddingDate: v('weddingDate'), deadline: v('deadline'), code: v('code'), notes: v('notes'), sample: f.elements.sample.checked };
      B.busy = true; B.error = '';
      try {
        const out = await api('POST', '/api/board/clients', B.form);
        const code = B.form.code;
        B.busy = false; await loadList(); B.client = out.client; B.view = 'client'; B.tab = 'links'; resetDrafts();
        B.newCode = code; render(); U.toast(`${out.client.couple} is ready! Their links are below.`);
      } catch (err) { B.busy = false; B.error = err.message; render(); }
      return;
    }
    if (kind === 'reservation') {
      const fm = B.form, body = { family: fm.family, seats: Number(fm.seats), guests: fm.guests.filter(g => g.name.trim()) };
      if (!body.family.trim()) { B.error = 'Please type a family or group name.'; return render(); }
      if (!body.guests.length) { B.error = 'Please add at least one guest name.'; return render(); }
      if (!Number.isInteger(body.seats) || body.seats < 1) { B.error = 'Please enter how many seats are reserved (at least 1).'; return render(); }
      await saveClient(fm.id ? 'PUT' : 'POST', '/reservations' + (fm.id ? '/' + fm.id : ''), body, fm.id ? 'Changes saved.' : `The ${body.family.trim()} was added!`);
      return;
    }
    if (kind === 'code') {
      const code = v('code');
      if (!/^\d{6}$/.test(code)) return U.toast('The code must be 6 numbers.', 'error');
      if (await saveClient('PUT', '/details', { code }, 'New couple code saved.')) { B.newCode = code; render(); }
      return;
    }
    if (kind === 'slug') {
      const yes = await U.confirm({ title: 'Change the link name?', message: 'Links you already sent with the old name will stop working.', yes: 'Change it' });
      if (yes) await saveClient('PUT', '/details', { slug: v('slug') }, 'Link name saved. Copy the new links above.');
      return;
    }
    if (kind === 'theme') return saveClient('PUT', '/theme', { theme: B.themeDraft }, 'The new look is saved!');
    if (kind === 'site') return saveClient('PUT', '/site', { site: B.siteDraft }, 'Wording saved! Guests see it right away.');
  });

  window.addEventListener('beforeunload', e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });

  // Keep numbers fresh while guests answer.
  setInterval(async () => {
    if (!B.list || document.hidden) return;
    try {
      const { version } = await api('GET', '/api/board/version');
      if (version === B.version) return;
      if (dirty() || B.form || B.upload || (B.view === 'client' && ['preview', 'customize'].includes(B.tab))) { B.pending = B.view === 'client'; B.version = version; return; }
      if (B.view === 'client') await loadClient(B.client.id); else await loadList();
      const y = scrollY; render(); scrollTo(0, y);
    } catch (err) { /* try again later */ }
  }, P.bundle ? 3000 : 8000);

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && (B.view === 'new' || B.view === 'studio') && !document.querySelector('.a-modal-bg')) goView('tracker'); });

  (async function start() {
    document.body.classList.add('is-board');
    try { await loadAuth(); if (B.auth.me) { await loadList(); await loadStudio(); } }
    catch (e) { app.innerHTML = `<div class="a-login"><div class="a-login-card"><h1>Sorry!</h1><p>${esc(e.message)}</p></div></div>`; return; }
    render();
  })();
})();
