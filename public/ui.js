// Shared pieces for the couple's view and Pixie's RSVP Board: toasts, confirm boxes, copy-to-clipboard, small formatters.
(function () {
  'use strict';
  const P = window.PIXIE, esc = P.esc;
  const U = window.PixieUI = {};
  U.STATUS_TEXT = { awaiting: 'Awaiting Response', attending: 'Attending', not_attending: 'Not Attending' };

  let toastTimer;
  U.toast = function (msg, kind) {
    const root = document.getElementById('toast');
    root.innerHTML = `<div class="a-toast ${kind === 'error' ? 'is-error' : ''}" role="status">${kind === 'error' ? '' : '<span aria-hidden="true">♡</span> '}${esc(msg)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { root.innerHTML = ''; }, 4200);
  };
  U.confirm = function ({ title, message, yes, no, danger }) {
    const root = document.getElementById('modal');
    return new Promise(resolve => {
      const last = document.activeElement;
      root.innerHTML = `<div class="a-modal-bg"><div class="a-modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
        <h2 id="m-title">${esc(title)}</h2><p>${esc(message)}</p>
        <div class="a-row-end"><button class="a-btn a-btn-ghost" data-m="no">${esc(no || 'Cancel')}</button>
        <button class="a-btn ${danger ? 'a-btn-danger' : ''}" data-m="yes">${esc(yes || 'OK')}</button></div></div></div>`;
      const close = v => { root.innerHTML = ''; document.removeEventListener('keydown', key); if (last && last.focus) last.focus(); resolve(v); };
      const key = e => { if (e.key === 'Escape') close(false); };
      document.addEventListener('keydown', key);
      root.querySelector('[data-m="no"]').onclick = () => close(false);
      root.querySelector('[data-m="yes"]').onclick = () => close(true);
      root.querySelector('.a-modal-bg').onclick = e => { if (e.target.classList.contains('a-modal-bg')) close(false); };
      root.querySelector('[data-m="yes"]').focus();
    });
  };
  U.copy = async function (text, okMsg, title) {
    try { await navigator.clipboard.writeText(text); U.toast(okMsg); }
    catch (e) {
      const root = document.getElementById('modal');
      root.innerHTML = `<div class="a-modal-bg"><div class="a-modal" role="dialog" aria-modal="true" aria-labelledby="m-title"><h2 id="m-title">${esc(title || 'Copy this')}</h2>
        <p>Select it and copy:</p><textarea class="a-copy" rows="${Math.min(10, text.split('\n').length + 1)}" readonly>${esc(text)}</textarea><div class="a-row-end"><button class="a-btn" data-m="ok">Done</button></div></div></div>`;
      const inp = root.querySelector('textarea'); inp.focus(); inp.select();
      root.querySelector('[data-m="ok"]').onclick = () => { root.innerHTML = ''; };
    }
  };
  U.download = function (name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  U.ago = function (iso) {
    if (!iso) return '';
    const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' hours ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  };
  U.counts = function (r) {
    const c = { attending: 0, not_attending: 0, awaiting: 0 };
    for (const g of r.guests) c[g.status] = (c[g.status] || 0) + 1;
    return c;
  };
  U.daysLeft = function (C, site) { return Math.ceil((C.deadlineEnd(site) - Date.now()) / 86400000); };
  U.progress = function (s, big) {
    const pct = s.invited ? Math.round((s.attending + s.notAttending) / s.invited * 100) : 0;
    const w = n => s.invited ? (n / s.invited * 100).toFixed(1) : 0;
    return `<div class="a-progress ${big ? '' : 'a-progress-sm'}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Guests who have answered">
      <span class="a-progress-yes" style="width:${w(s.attending)}%"></span><span class="a-progress-no" style="width:${w(s.notAttending)}%"></span></div>`;
  };
  U.stats = function (s) {
    const card = (label, n, cls, help) => `<div class="a-stat ${cls}"><p class="a-stat-n">${n}</p><p class="a-stat-l">${label}</p><p class="a-stat-h">${help}</p></div>`;
    return `<div class="a-stats">
      ${card('Total Guests Invited', s.invited, 'total', `in ${s.reservations} reservation${s.reservations === 1 ? '' : 's'}`)}
      ${card('Attending', s.attending, 'yes', 'said yes')}
      ${card('Not Attending', s.notAttending, 'no', 'can’t make it')}
      ${card('Awaiting Response', s.awaiting, 'wait', 'haven’t answered yet')}</div>`;
  };
  U.legend = '<p class="a-legend"><span class="a-dot yes"></span>Attending <span class="a-dot no"></span>Not attending <span class="a-dot wait"></span>Awaiting response</p>';
  // Opens a guest page in a new tab (works in the hosted site and the single-file version).
  U.open = function (path) { window.open(P.link(path), '_blank', 'noopener'); };
})();
