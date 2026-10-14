// Pixie Craft Studio RSVP, GitHub Pages version. Built by build-pages.js from core.js and public/*.js; edit those, not this file.
// Pixie Craft Studio · Wedding RSVP: shared data rules and API.
// Runs inside server.js (Node) and inside the single-file version (browser), so both behave the same.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PixieCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STATUSES = ['awaiting', 'attending', 'not_attending'];

  // Every guest-facing text the couple can edit. Keys are grouped by the editor section they belong to.
  const DEFAULT_SITE = {
    // 1. Welcome screen
    welcomeEyebrow: 'Before You RSVP ♡',
    welcomeTitle: 'A Little Note!',
    welcomeMessage: 'Your seat has been lovingly reserved just for you!\n\nThis invitation was sent to a **specific family member to confirm** their attendance, so please coordinate with your family if you’ll be joining us or sitting this one out.\n\nWe can’t wait to celebrate this special day with you! Thank you for helping us make every seat count. ˚‧₊♡ ₊˚',
    welcomeButton: 'Let’s Begin!',
    // 2. RSVP deadline notice
    deadline: '2034-11-09',
    noticeEyebrow: 'A Little Heads-Up!',
    noticeTitle: 'Mark Your Calendars!',
    noticeMessage: 'Please send in your RSVP by **{deadline}** so we can prepare your seats and make sure everything is ready for our special day! ♡',
    noticeContact: 'Once the deadline passes, this RSVP page will close, and responses can no longer be submitted or edited here. Need to make a last-minute change? Just reach out to {couple} directly, and we’ll do our best to help!',
    noticeClosing: 'Your presence would mean so much! ˚ ༘♡ ⋆｡˚',
    noticeButton: 'Got It!',
    // 3. Wedding invitation
    invitationHeading: 'The Wedding of',
    couple: 'Marione & Janrick',
    weddingDate: '2034-12-08',
    inviteQuestion: 'Ready to join our celebration?',
    searchInstructions: 'Type your full name below to find your personal invitation and check your reserved seat.',
    searchPlaceholder: 'First Name · Surname · ex. John Wendren Villarin',
    searchButton: 'Find my Invitation',
    // 4. Reservation message
    greeting: '{couple} can’t wait to celebrate this special day with you!',
    seatsMessage: 'We have reserved {seats} seats in your honor.',
    seatsLabel: 'reserved seats',
    onlyListedNote: 'Your reservation is exclusively for the guests listed below. Kindly coordinate with your family before submitting your responses.',
    // 5. Guest instructions
    confirmTitle: 'Confirm Each Guest',
    responseInstructions: 'Choose Attending or Not Attending for every name below',
    attendingLabel: 'Attending',
    notAttendingLabel: 'Not Attending',
    reviewTitle: 'Your RSVP at a Glance',
    reviewSubtitle: 'Here’s a little recap before you send your answers!',
    attendingGroupLabel: 'Happily Attending',
    notAttendingGroupLabel: 'Sending Their Love',
    sentToNote: 'Your RSVP will be sent to {couple}',
    submitButton: 'Submit',
    adultsOnly: 'To keep our celebration intimate and relaxing, we kindly request an adults-only celebration. Please arrange childcare in advance, and thank you so much for understanding!',
    // 6. Thank-you screen
    thanksEyebrow: 'With Love,',
    thanksHeading: 'Thank You!',
    thanksMessage: 'Thank you for confirming and being part of our special day! ♡ Your presence will make this celebration even more meaningful to us.',
    thanksClosing: 'See you soon!',
  };
  const DATE_KEYS = ['deadline', 'weddingDate'];
  // Earlier default texts. If a site still has them unchanged, they are swapped for the current defaults.
  const OLD_DEFAULTS = {
    welcomeEyebrow: ['Before You Begin'],
    welcomeTitle: ['Seats are Personally Reserved for You'],
    welcomeMessage: ['We have sent this RSVP invitation to a specific family member only to confirm the family member’s attendance. Kindly coordinate with one another if attending or not. Thank you!'],
    welcomeButton: ['Next'],
    noticeEyebrow: ['Please Note'],
    noticeTitle: ['RSVP Deadline'],
    noticeMessage: ['Kindly RSVP by {deadline} so we may finalize our guest count and seating arrangements. After this date, you will no longer be able to submit or edit your response through this page.'],
    noticeContact: ['If you need to make any changes after the deadline, please feel free to reach out directly to {couple}. We truly hope you’ll be able to join us on our special day!'],
    noticeButton: ['I Understand'],
    searchInstructions: ['Please search your name to view your reservation'],
    searchPlaceholder: ['First Name Surname  |  ex. John Wendren Villarin'],
    greeting: ['{couple} are excited to celebrate with'],
    seatsLabel: ['Reserved Seats'],
    onlyListedNote: ['Only guest/s listed below are included in the reservation.'],
    confirmTitle: ['Confirm each guest'],
    reviewTitle: ['Review your RSVP'],
    submitButton: ['Submit RSVP'],
    adultsOnly: ['We kindly request an adults-only celebration, so please make childcare arrangements in advance. Thank you for understanding!'],
  };
  function upgradeSite(site) {
    const out = Object.assign({}, DEFAULT_SITE, site);
    for (const k of Object.keys(OLD_DEFAULTS)) if (OLD_DEFAULTS[k].includes(out[k])) out[k] = DEFAULT_SITE[k];
    return out;
  }
  const MAX_TEXT = 1200;

  // ---------- helpers ----------
  function rid(n) {
    const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const a = new Uint8Array(n);
    globalThis.crypto.getRandomValues(a);
    let s = '';
    for (let i = 0; i < n; i++) s += abc[a[i] % abc.length];
    return s;
  }
  function normName(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function cleanText(v, max) {
    return String(v == null ? '' : v).replace(/\r\n/g, '\n').trim().slice(0, max || 120);
  }
  function validDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function parts(s) { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; }
  // "November 9, 2034" (as written in the guest flow design)
  function formatDeadline(s) {
    if (!validDate(s)) return s || '';
    const { y, m, d } = parts(s);
    return MONTHS[m - 1] + ' ' + d + ', ' + y;
  }
  // "8th of December, 2034"
  function formatWeddingDate(s) {
    if (!validDate(s)) return s || '';
    const { y, m, d } = parts(s);
    const sfx = d % 100 >= 11 && d % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[d % 10] || 'th';
    return d + sfx + ' of ' + MONTHS[m - 1] + ', ' + y;
  }
  // "December 8, 2034"
  function formatLong(s) {
    if (!validDate(s)) return s || '';
    const { y, m, d } = parts(s);
    return MONTHS[m - 1] + ' ' + d + ', ' + y;
  }
  // "November 09, 2026" (as written in the admin and couple designs)
  function formatPadded(s) {
    if (!validDate(s)) return s || '';
    const { y, m, d } = parts(s);
    return MONTHS[m - 1] + ' ' + String(d).padStart(2, '0') + ', ' + y;
  }
  // Fills {couple}, {deadline}, {family} and {seats} in a text. Returns plain text (escape before putting in HTML).
  function fill(text, site, r) {
    let out = String(text || '')
      .replace(/\{couple\}/g, site.couple)
      .replace(/\{deadline\}/g, formatDeadline(site.deadline))
      .replace(/\{date\}/g, formatWeddingDate(site.weddingDate));
    if (r) {
      out = out.replace(/\{family\}/g, r.family).replace(/\{seats\}/g, String(r.seats))
        .replace(/\b1 seats\b/g, '1 seat');
    }
    return out;
  }

  // The RSVP closes at the end of the deadline day, in the wedding's time zone (UTC offset, default Philippines +08:00).
  function deadlineEnd(site, tz) {
    return new Date(site.deadline + 'T23:59:59.999' + (tz || '+08:00'));
  }
  function isClosed(site, now, tz) {
    return validDate(site.deadline) && now > deadlineEnd(site, tz);
  }

  // What a guest is allowed to see about their own reservation. Nothing about other families.
  function publicReservation(r) {
    return {
      token: r.token, family: r.family, seats: r.seats, sample: !!r.sample, submittedAt: r.submittedAt || null,
      guests: r.guests.map(g => ({ id: g.id, name: g.name, status: g.status })),
    };
  }

  // Simple in-memory attempt limiter (wrong codes, name searches).
  const hits = new Map();
  function limited(key, max, windowMs, now) {
    const t = now.getTime();
    // Forget visitors who have been quiet for an hour, so the list doesn't grow forever on a busy site.
    if (hits.size > 5000) for (const [k, l] of hits) if (!l.length || t - l[l.length - 1] > 3600e3) hits.delete(k);
    const list = (hits.get(key) || []).filter(x => t - x < windowMs);
    hits.set(key, list);
    return list.length >= max;
  }
  function hit(key, now) { const l = hits.get(key) || []; l.push(now.getTime()); hits.set(key, l); }
  function clearHits(key) { hits.delete(key); }

  function cleanReservation(body, existing) {
    const family = cleanText(body.family, 80);
    if (!family) return { error: 'Please type a family or group name.' };
    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) return { error: 'Reserved seats must be a whole number from 1 to 50.' };
    const list = Array.isArray(body.guests) ? body.guests : [];
    const old = new Map(((existing && existing.guests) || []).map(g => [g.id, g]));
    const guests = [];
    for (const g of list.slice(0, 60)) {
      const name = cleanText(g && g.name, 80);
      if (!name) continue;
      const status = STATUSES.includes(g.status) ? g.status : 'awaiting';
      const id = g.id && old.has(g.id) ? g.id : rid(8);
      guests.push({ id, name, status });
    }
    if (!guests.length) return { error: 'Please add at least one guest name.' };
    return { family, seats, guests };
  }

  // ---------- look (quick customization) ----------
  const PALETTES = {
    garden: { name: 'Garden Romance', heading: '#1f4d2c', text: '#9a5868', button: '#d38da9', accent: '#e2aac0', card: '#f5f1ea' },
    rose: { name: 'Rose Garden', heading: '#4d4337', text: '#9a5868', button: '#c27390', accent: '#d99fb3', card: '#f8f3eb' },
    sage: { name: 'Sage Meadow', heading: '#3d4739', text: '#5b6f54', button: '#78906f', accent: '#a9bf9f', card: '#f6f5ee' },
    blue: { name: 'Dusty Blue', heading: '#333d4a', text: '#566a80', button: '#6f86a1', accent: '#a9b8cc', card: '#f5f6f8' },
    gold: { name: 'Champagne Gold', heading: '#463b28', text: '#86663a', button: '#b08a52', accent: '#d8bf8f', card: '#fbf7ef' },
    lavender: { name: 'Lavender Mist', heading: '#41364c', text: '#76608b', button: '#9580ad', accent: '#c6b5d8', card: '#f7f4fa' },
    terracotta: { name: 'Terracotta', heading: '#4a3229', text: '#9f573f', button: '#bd6e4c', accent: '#e0a68a', card: '#fbf4ee' },
  };
  const COLOR_KEYS = ['heading', 'text', 'button', 'accent', 'card'];
  // Elegant Google Fonts (the same families Canva offers), grouped by where they look best.
  const HEADING_FONTS = ['Italianno', 'Bodoni Moda', 'Playfair Display', 'Cormorant Garamond', 'Italiana', 'Gloock', 'Prata', 'Gilda Display', 'Marcellus', 'Forum', 'Cinzel', 'Cinzel Decorative',
    'Libre Caslon Display', 'DM Serif Display', 'Della Respira', 'Bellefair', 'Great Vibes', 'Parisienne', 'Dancing Script'];
  const BODY_FONTS = ['Della Respira', 'Italiana', 'Gilda Display', 'Bellefair', 'Cormorant Garamond', 'Marcellus', 'Forum', 'Tenor Sans', 'Lora', 'EB Garamond', 'Crimson Pro',
    'Libre Baskerville', 'Josefin Sans', 'Raleway', 'Quicksand', 'Nunito Sans', 'Montserrat'];
  const SCRIPT_FONTS = ['Great Vibes', 'Pinyon Script', 'Alex Brush', 'Allura', 'Parisienne', 'Tangerine', 'Italianno', 'Monsieur La Doulaise', 'Petit Formal Script',
    'Mrs Saint Delafield', 'Rouge Script', 'Imperial Script', 'Ballet', 'WindSong', 'Corinthia', 'Luxurious Script', 'Herr Von Muellerhoff', 'Dancing Script', 'Playfair Display'];
  // A font file the studio uploads (for example one they own from Canva Pro) can be used for any of the three.
  const CUSTOM_FONT = 'My uploaded font';
  const FONT_URL = /^data:(font\/(woff2?|ttf|otf)|application\/(font-woff|x-font-ttf|x-font-otf|octet-stream|vnd\.ms-opentype));base64,[A-Za-z0-9+/=]+$/;
  const BACKGROUNDS = { garden: 'Garden photo', blush: 'Soft blush', sage: 'Sage wash', ivory: 'Plain ivory', dusk: 'Golden dusk', custom: 'My own photo' };
  // Text effects for the couple/family names and the titles.
  const EFFECTS = { none: 'None', shadow: 'Soft shadow', glow: 'Glow', emboss: 'Embossed', outline: 'Outline', gold: 'Gold foil' };
  const IMAGE_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
  // A video lives in the server's media folder ("/media/…") or, in the single-file version, in this browser ("idb:…").
  const VIDEO_REF = /^(\/media\/[A-Za-z0-9_-]{1,80}\.(mp4|webm|mov|m4v)|idb:[A-Za-z0-9]{6,40})$/;
  // Pictures the studio uploads as design elements (stickers, flowers, frames...): a file on the server, or kept in this browser in the single file.
  const IMAGE_REF = /^(\/media\/[A-Za-z0-9_-]{1,80}\.(png|jpg|webp|gif)|idb:[A-Za-z0-9]{6,40})$/;
  // Design (Canva-style) layer on each guest screen. Positions are in hundredths of the card's width, so a design keeps its shape on phones.
  const DECOR_SCREENS = ['welcome', 'notice', 'invite', 'reservation', 'thanks'];
  const DECOR_HIDE = ['glow', 'icon', 'eyebrow', 'foot'];
  const DECOR_LAYERS = ['front', 'under', 'behind'];
  function cleanDecor(d, customFontOk) {
    if (d === null) return { decor: null };
    if (!d || typeof d !== 'object') return { error: 'The design could not be read. Please try again.' };
    const out = { hide: [] };
    if (d.hide !== undefined) {
      if (!Array.isArray(d.hide) || d.hide.some(h => !DECOR_HIDE.includes(h))) return { error: 'Unknown part to hide.' };
      out.hide = [...new Set(d.hide)];
    }
    for (const k of DECOR_SCREENS) {
      const r = cleanElements(d[k] === undefined ? [] : d[k], customFontOk, 80);
      if (r.error) return r;
      out[k] = r.list;
    }
    return { decor: out };
  }
  const inRange = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  const ALL_FONTS = () => [...HEADING_FONTS, ...BODY_FONTS, ...SCRIPT_FONTS, 'Montserrat', 'Poppins', 'Gloock'];
  // Pictures and text boxes the studio places freely on a page (guest screens, couple's view, board).
  function cleanElements(list, customFontOk, max) {
    if (!Array.isArray(list) || list.length > max) return { error: `A page can hold up to ${max} elements.` };
    const num = inRange, fonts = ALL_FONTS(), out = [];
    for (const e of list) {
      if (!e || typeof e !== 'object' || !/^[a-z0-9]{4,20}$/.test(e.id || '')) return { error: 'An element in the design is not valid.' };
      if (!num(e.x, -200, 300) || !num(e.y, -400, 3000) || !num(e.w, 1, 400) || !num(e.rot || 0, -360, 360) || !num(e.op === undefined ? 1 : e.op, 0.05, 1))
        return { error: 'An element is placed too far off the page.' };
      const el = { id: e.id, type: e.type, x: Math.round(e.x * 100) / 100, y: Math.round(e.y * 100) / 100, w: Math.round(e.w * 100) / 100,
        rot: Math.round((e.rot || 0) * 10) / 10, op: e.op === undefined ? 1 : Math.round(e.op * 100) / 100, layer: DECOR_LAYERS.includes(e.layer) ? e.layer : 'front', flip: !!e.flip };
      if (e.phone === false) el.phone = false;
      if (e.type === 'image') {
        if (!IMAGE_REF.test(e.src || '')) return { error: 'Please upload that element again.' };
        el.src = e.src;
      } else if (e.type === 'text') {
        el.text = cleanText(e.text, 400) || 'Your text';
        if (!(fonts.includes(e.font) || (e.font === CUSTOM_FONT && customFontOk))) return { error: 'Unknown font in a text box.' };
        if (!/^#[0-9a-fA-F]{6}$/.test(e.color || '')) return { error: 'Text colors must look like #c27390.' };
        if (!num(e.size, 1, 60)) return { error: 'Text size is out of range.' };
        Object.assign(el, { font: e.font, color: e.color.toLowerCase(), size: Math.round(e.size * 100) / 100, bold: !!e.bold, italic: !!e.italic,
          align: ['left', 'center', 'right'].includes(e.align) ? e.align : 'center' });
      } else return { error: 'An element in the design is not valid.' };
      out.push(el);
    }
    return { list: out };
  }
  // Studio-wide edits of the couple's view and the board, made in the "Edit website" mode (studio only).
  // texts: original wording -> new wording. styles: a part of the page (CSS selector built from its classes) -> its look.
  const SITE_PAGES = ['board', 'couple'];
  const SITE_COLORS = ['pink', 'pinkDark', 'cream', 'olive', 'sage', 'sand', 'yellow', 'text'];
  const SITE_SELECTOR = /^[a-zA-Z0-9 .>_():-]{1,240}$/;
  function cleanSite(s) {
    if (s === null) return { site: null };
    if (!s || typeof s !== 'object' || !s.pages || typeof s.pages !== 'object') return { error: 'The website changes could not be read. Please try again.' };
    const hex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
    const fonts = ALL_FONTS(), out = { pages: {} };
    for (const k of SITE_PAGES) {
      const p = s.pages[k] || {}, o = { colors: {}, fonts: {}, texts: {}, styles: {}, decor: [] };
      for (const c of SITE_COLORS) if (p.colors && p.colors[c] !== undefined) { if (!hex(p.colors[c])) return { error: 'Colors must look like #c27390.' }; o.colors[c] = p.colors[c].toLowerCase(); }
      for (const f of ['display', 'sans']) if (p.fonts && p.fonts[f]) { if (!fonts.includes(p.fonts[f])) return { error: 'Unknown font.' }; o.fonts[f] = p.fonts[f]; }
      const texts = Object.entries(p.texts || {});
      if (texts.length > 400) return { error: 'Too many wording changes on one page.' };
      for (const [from, to] of texts) {
        const a = cleanText(from, 600), b = typeof to === 'string' ? to.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 600) : '';
        if (a) o.texts[a] = b;
      }
      const styles = Object.entries(p.styles || {});
      if (styles.length > 300) return { error: 'Too many changed parts on one page.' };
      for (const [sel, v] of styles) {
        if (!SITE_SELECTOR.test(sel) || !v || typeof v !== 'object') return { error: 'A changed part of the page could not be saved.' };
        const st = {};
        if (v.hide) st.hide = true;
        if (v.color !== undefined) { if (!hex(v.color)) return { error: 'Colors must look like #c27390.' }; st.color = v.color.toLowerCase(); }
        if (v.bg !== undefined) { if (!hex(v.bg)) return { error: 'Colors must look like #c27390.' }; st.bg = v.bg.toLowerCase(); }
        if (v.size !== undefined) { if (!inRange(v.size, 6, 160)) return { error: 'Text size is out of range.' }; st.size = Math.round(v.size); }
        if (v.font !== undefined) { if (!fonts.includes(v.font)) return { error: 'Unknown font.' }; st.font = v.font; }
        if (v.bold !== undefined) st.bold = !!v.bold;
        if (v.italic !== undefined) st.italic = !!v.italic;
        if (v.align !== undefined && ['left', 'center', 'right'].includes(v.align)) st.align = v.align;
        if (v.img !== undefined) { if (!IMAGE_REF.test(v.img)) return { error: 'Please upload that picture again.' }; st.img = v.img; }
        if (v.z) { st.z = true; if (v.zr) st.zr = true; }
        // Moves made on the page, kept separately for computers (d) and phones (m): offset in pixels, scale, turn, width.
        for (const dv of ['d', 'm']) {
          if (v[dv] === undefined) continue;
          const b = v[dv], o = {};
          if (!b || typeof b !== 'object') return { error: 'A moved part could not be saved.' };
          if (b.x !== undefined) { if (!inRange(b.x, -4000, 4000)) return { error: 'A part was moved too far.' }; o.x = Math.round(b.x); }
          if (b.y !== undefined) { if (!inRange(b.y, -4000, 4000)) return { error: 'A part was moved too far.' }; o.y = Math.round(b.y); }
          if (b.s !== undefined) { if (!inRange(b.s, 0.1, 6)) return { error: 'A part was made too big or too small.' }; o.s = Math.round(b.s * 100) / 100; }
          if (b.r !== undefined) { if (!inRange(b.r, -360, 360)) return { error: 'A part was turned too far.' }; o.r = Math.round(b.r * 10) / 10; }
          if (b.w !== undefined) { if (!inRange(b.w, 10, 4000)) return { error: 'A part was made too wide.' }; o.w = Math.round(b.w); }
          if (Object.keys(o).length) st[dv] = o;
        }
        if (Object.keys(st).length) o.styles[sel] = st;
      }
      const d = cleanElements(p.decor || [], false, 120);
      if (d.error) return d;
      o.decor = d.list;
      out.pages[k] = o;
    }
    return { site: out };
  }
  function defaultTheme() {
    return { palette: 'garden', colors: Object.assign({}, PALETTES.garden), headingFont: 'Italianno', headingItalic: false,
      bodyFont: 'Della Respira', scriptFont: 'Great Vibes', background: 'garden', customBg: null, blur: true, logo: null, video: null, customFont: null,
      sizes: { names: 100, titles: 100, text: 100 }, effects: { names: 'none', titles: 'none' }, cardSize: { desktop: 100, mobile: 90 }, cover: null, decor: null };
  }
  function cleanTheme(body, old) {
    const t = Object.assign(defaultTheme(), old || {});
    if (body.palette !== undefined) { if (!PALETTES[body.palette] && body.palette !== 'custom') return { error: 'Unknown color palette.' }; t.palette = body.palette; }
    if (body.colors) {
      t.colors = Object.assign({}, t.colors);
      for (const k of COLOR_KEYS) {
        if (body.colors[k] === undefined) continue;
        if (!/^#[0-9a-fA-F]{6}$/.test(body.colors[k])) return { error: 'Colors must look like #c27390.' };
        t.colors[k] = body.colors[k].toLowerCase();
      }
      delete t.colors.name;
    }
    if (body.customFont !== undefined) {
      if (body.customFont !== null) {
        const f = body.customFont;
        if (!f || typeof f !== 'object' || !FONT_URL.test(f.data || '')) return { error: 'The font must be a WOFF, WOFF2, TTF or OTF file.' };
        if (f.data.length > 4e6) return { error: 'That font file is too big. Please use one under 3 MB.' };
        t.customFont = { name: cleanText(f.name, 60) || 'Uploaded font', data: f.data };
      } else t.customFont = null;
    }
    const fontOk = (list, v) => list.includes(v) || (v === CUSTOM_FONT && !!t.customFont);
    if (body.headingFont !== undefined) { if (!fontOk(HEADING_FONTS, body.headingFont)) return { error: 'Unknown heading font.' }; t.headingFont = body.headingFont; }
    if (body.bodyFont !== undefined) { if (!fontOk(BODY_FONTS, body.bodyFont)) return { error: 'Unknown text font.' }; t.bodyFont = body.bodyFont; }
    if (body.scriptFont !== undefined) { if (!fontOk(SCRIPT_FONTS, body.scriptFont)) return { error: 'Unknown names font.' }; t.scriptFont = body.scriptFont; }
    if (!t.customFont) for (const k of ['headingFont', 'bodyFont', 'scriptFont']) if (t[k] === CUSTOM_FONT) t[k] = defaultTheme()[k];
    if (body.headingItalic !== undefined) t.headingItalic = !!body.headingItalic;
    if (body.blur !== undefined) t.blur = !!body.blur;
    if (body.customBg !== undefined) {
      if (body.customBg !== null && !IMAGE_URL.test(body.customBg)) return { error: 'The background must be a JPG, PNG or WebP picture.' };
      if (body.customBg && body.customBg.length > 3e6) return { error: 'That picture is too big. Please use one under 2 MB.' };
      t.customBg = body.customBg;
    }
    if (body.logo !== undefined) {
      if (body.logo !== null && !IMAGE_URL.test(body.logo)) return { error: 'The logo must be a JPG, PNG or WebP picture.' };
      if (body.logo && body.logo.length > 1.5e6) return { error: 'That logo is too big. Please use one under 1 MB.' };
      t.logo = body.logo;
    }
    if (body.video !== undefined) {
      if (body.video !== null && !VIDEO_REF.test(body.video)) return { error: 'Please upload the video again.' };
      t.video = body.video;
    }
    const pct = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    if (body.sizes) {
      t.sizes = Object.assign({}, t.sizes);
      for (const k of ['names', 'titles', 'text']) if (body.sizes[k] !== undefined) { if (!pct(body.sizes[k], 60, 160)) return { error: 'Font sizes go from 60% to 160%.' }; t.sizes[k] = body.sizes[k]; }
    }
    if (body.effects) {
      t.effects = Object.assign({}, t.effects);
      for (const k of ['names', 'titles']) if (body.effects[k] !== undefined) { if (!EFFECTS[body.effects[k]]) return { error: 'Unknown text effect.' }; t.effects[k] = body.effects[k]; }
    }
    if (body.cardSize) {
      t.cardSize = Object.assign({}, t.cardSize);
      for (const k of ['desktop', 'mobile']) if (body.cardSize[k] !== undefined) { if (!pct(body.cardSize[k], 70, 120)) return { error: 'Card size goes from 70% to 120%.' }; t.cardSize[k] = body.cardSize[k]; }
    }
    if (body.cover !== undefined) {
      if (body.cover !== null && !IMAGE_URL.test(body.cover)) return { error: 'The couple photo must be a JPG, PNG or WebP picture.' };
      if (body.cover && body.cover.length > 1.5e6) return { error: 'That photo is too big. Please use a smaller one.' };
      t.cover = body.cover;
    }
    if (body.decor !== undefined) {
      const d = cleanDecor(body.decor, !!t.customFont);
      if (d.error) return d;
      t.decor = d.decor;
    }
    if (body.background !== undefined) { if (!BACKGROUNDS[body.background]) return { error: 'Unknown background.' }; t.background = body.background; }
    if (t.background === 'custom' && !t.customBg) return { error: 'Please upload a photo for the background first.' };
    return { theme: t };
  }
  // Clients still on the first default look move to the current main design (their background and uploads are kept).
  function upgradeTheme(theme) {
    const d0 = defaultTheme(), t = Object.assign(d0, theme || {});
    for (const k of ['sizes', 'effects', 'cardSize']) t[k] = Object.assign({}, defaultTheme()[k], (theme && theme[k]) || {});
    if (theme && !('scriptFont' in theme) && theme.palette === 'rose' && theme.headingFont === 'Playfair Display' && theme.bodyFont === 'Cormorant Garamond') {
      const d = defaultTheme();
      Object.assign(t, { palette: d.palette, colors: d.colors, headingFont: d.headingFont, headingItalic: d.headingItalic, bodyFont: d.bodyFont, scriptFont: d.scriptFont });
    }
    // 2026-10-14: the first garden look (Bodoni Moda italic, Italiana, Pinyon Script) moves to the fonts in RSVP.zip.
    if (t.headingFont === 'Bodoni Moda' && t.headingItalic && t.bodyFont === 'Italiana' && t.scriptFont === 'Pinyon Script') {
      const d = defaultTheme();
      Object.assign(t, { headingFont: d.headingFont, headingItalic: d.headingItalic, bodyFont: d.bodyFont, scriptFont: d.scriptFont });
    }
    return t;
  }

  // ---------- data ----------
  function sampleReservations() {
    return [
      {
        id: rid(8), token: rid(12), family: 'Villarin Family', seats: 3, sample: true,
        guests: [
          { id: rid(8), name: 'John Wendren Villarin', status: 'awaiting' },
          { id: rid(8), name: 'Mary Rose Villarin', status: 'awaiting' },
          { id: rid(8), name: 'Jane Villarin', status: 'awaiting' },
        ],
        createdAt: new Date().toISOString(), submittedAt: null,
      },
    ];
  }
  function slugify(s) {
    return normName(String(s).replace(/&/g, ' ')).replace(/ /g, '-').slice(0, 40) || 'wedding';
  }
  function uniqueSlug(db, base, exceptId) {
    let slug = base, n = 2;
    while (db.clients.some(c => c.slug === slug && c.id !== exceptId)) slug = base + '-' + n++;
    return slug;
  }
  function newClient(db, opts) {
    const site = Object.assign({}, DEFAULT_SITE, { couple: opts.couple, weddingDate: opts.weddingDate, deadline: opts.deadline });
    return {
      id: rid(8), slug: uniqueSlug(db, slugify(opts.couple)), createdAt: new Date().toISOString(),
      site, theme: defaultTheme(), coupleCode: opts.coupleCode || null, notes: opts.notes || '',
      reservations: opts.sample ? sampleReservations() : [], updatedAt: new Date().toISOString(), updatedBy: null,
    };
  }
  // A real website starts empty; the offline preview file (and the tests) start with one example couple.
  function defaultData(withExample) {
    const db = { version: 1, studio: { accounts: [] }, clients: [] };
    if (withExample !== false) db.clients.push(newClient(db, { couple: 'Marione & Janrick', weddingDate: '2034-12-08', deadline: '2034-11-09', sample: true }));
    return db;
  }
  // Brings older saved data (one couple only) up to date, and fills in anything new.
  function upgradeData(db) {
    if (!db.clients) {
      const old = db;
      db = { version: (old.version || 1) + 1, studio: { accounts: [] }, clients: [] };
      const c = newClient(db, { couple: (old.site && old.site.couple) || 'Marione & Janrick', weddingDate: '2034-12-08', deadline: '2034-11-09' });
      c.site = old.site || c.site; c.reservations = old.reservations || [];
      db.clients.push(c);
    }
    db.studio = db.studio || { accounts: [] };
    db.studio.settings = Object.assign(defaultStudio(), db.studio.settings || {});
    for (const c of db.clients) {
      c.site = upgradeSite(c.site);
      c.theme = upgradeTheme(c.theme);
      c.reservations = c.reservations || [];
    }
    return db;
  }

  // Studio-wide look and links: the board header logo, the couple's view banner, and social links in the couple's view footer.
  function defaultStudio() { return { logo: null, banner: null, facebook: '', tiktok: '', instagram: '', elements: [], site: null, helpNote: 'Message Pixie Craft Studio if you need further help. We’ll be happy to help you! (˶ᵔ ᵕ ᵔ˶) <3' }; }
  function publicStudio(st) {
    // Only the couple's-view part of the studio's website edits goes out to couples.
    return { logo: st.logo, banner: st.banner, facebook: st.facebook, tiktok: st.tiktok, instagram: st.instagram, helpNote: st.helpNote, site: st.site && st.site.pages ? { pages: { couple: st.site.pages.couple } } : null };
  }

  function stats(client) {
    const s = { reservations: 0, seats: 0, invited: 0, attending: 0, notAttending: 0, awaiting: 0, examples: 0, families: 0, familiesAnswered: 0 };
    for (const r of client.reservations) {
      if (r.sample) { s.examples++; continue; }
      s.reservations++;
      s.seats += r.seats;
      if (r.submittedAt) s.familiesAnswered++;
      for (const g of r.guests) {
        s.invited++;
        if (g.status === 'attending') s.attending++;
        else if (g.status === 'not_attending') s.notAttending++;
        else s.awaiting++;
      }
    }
    return s;
  }
  function phase(client, now, tz) {
    if (validDate(client.site.weddingDate) && now > deadlineEnd({ deadline: client.site.weddingDate }, tz)) return 'done';
    return isClosed(client.site, now, tz) ? 'closed' : 'open';
  }
  function clientSummary(c, now, tz) {
    return { id: c.id, slug: c.slug, couple: c.site.couple, weddingDate: c.site.weddingDate, deadline: c.site.deadline,
      phase: phase(c, now, tz), stats: stats(c), hasCode: !!c.coupleCode, cover: (c.theme && c.theme.cover) || null, updatedAt: c.updatedAt, updatedBy: c.updatedBy, createdAt: c.createdAt };
  }
  function clientFull(c, now, tz) {
    return Object.assign(clientSummary(c, now, tz), { site: c.site, theme: c.theme, notes: c.notes || '', reservations: c.reservations, closed: isClosed(c.site, now, tz) });
  }
  // The look a guest page needs.
  function publicTheme(t) { return Object.assign({}, t, { customBg: t.background === 'custom' ? t.customBg : null, cover: null }); }

  function touch(db, client, who) {
    db.version = (db.version || 0) + 1;
    if (client) { client.updatedAt = new Date().toISOString(); client.updatedBy = who || null; }
  }

  // Turns uploaded guest-list rows into reservations. rows: [{ family, guest, seats?, status? }]
  function groupRows(rows) {
    const map = new Map();
    for (const row of rows.slice(0, 3000)) {
      const family = cleanText(row.family, 80), name = cleanText(row.guest, 80);
      if (!family || !name) continue;
      const key = normName(family);
      if (!map.has(key)) map.set(key, { family, seats: 0, guests: [] });
      const f = map.get(key);
      const seats = parseInt(row.seats, 10);
      if (seats > 0) f.seats = Math.max(f.seats, Math.min(seats, 50));
      const st = normName(row.status || '');
      const status = /^(yes|attending|going|accept)/.test(st) ? 'attending' : /^(no|not|declin|regret)/.test(st) ? 'not_attending' : 'awaiting';
      if (!f.guests.some(g => normName(g.name) === normName(name))) f.guests.push({ name, status });
    }
    return [...map.values()].map(f => Object.assign(f, { seats: f.seats || f.guests.length }));
  }

  // ---------- API ----------
  // ctx: { db, board (studio account name or null), couple (client id signed in to the couple view, or null), now, ip, tz,
  //        hashPin(pin, salt?) -> {salt, hash}, setupCode (string|null) }
  // Returns { status, body, save?, login?: { kind: 'board'|'couple', value }, logout?: 'board'|'couple' }
  async function handle(method, path, query, body, ctx) {
    const db = ctx.db, now = ctx.now || new Date(), tz = ctx.tz;
    body = body || {};
    const ok = (b, extra) => Object.assign({ status: 200, body: b }, extra || {});
    const err = (status, msg) => ({ status, body: { error: msg } });
    const canSee = c => !!(ctx.board || (ctx.couple && ctx.couple === c.id));
    let m;

    // ----- guest website -----
    const findByToken = token => {
      for (const c of db.clients) { const r = c.reservations.find(x => x.token === token); if (r) return { c, r }; }
      return {};
    };
    const guestSite = (c, preview) => ({ site: c.site, theme: publicTheme(c.theme), slug: c.slug, closed: isClosed(c.site, now, tz), preview });
    if ((m = path.match(/^\/api\/w\/([a-z0-9-]{1,60})$/)) && method === 'GET') {
      const c = db.clients.find(x => x.slug === m[1]);
      if (!c) return err(404, 'This RSVP page doesn’t exist. Please check the link you were sent.');
      return ok(guestSite(c, query.preview === '1' && canSee(c)));
    }
    if ((m = path.match(/^\/api\/w\/([a-z0-9-]{1,60})\/find$/)) && method === 'POST') {
      const c = db.clients.find(x => x.slug === m[1]);
      if (!c) return err(404, 'This RSVP page doesn’t exist.');
      const preview = !!body.preview && canSee(c);
      const key = 'find:' + (ctx.ip || '?');
      if (!preview && limited(key, 30, 10 * 60e3, now)) return err(429, 'Too many searches. Please wait a few minutes and try again.');
      if (!preview) hit(key, now);
      const q = normName(body.name);
      if (q.split(' ').length < 2) return err(400, 'Please type your first name and surname.');
      const pool = c.reservations.filter(r => !r.sample || preview);
      let found = pool.find(r => r.guests.some(g => normName(g.name) === q));
      if (!found) {
        const w = q.split(' '), loose = [];
        for (const r of pool) for (const g of r.guests) {
          const gw = normName(g.name).split(' ');
          if (gw[0] === w[0] && gw[gw.length - 1] === w[w.length - 1]) loose.push(r);
        }
        if (loose.length === 1) found = loose[0];
      }
      if (!found) return err(404, 'We couldn’t find that name. Please type your first name and surname exactly as written on your invitation.');
      return ok({ token: found.token });
    }
    if ((m = path.match(/^\/api\/r\/([A-Za-z0-9]{6,40})$/)) && method === 'GET') {
      const { c, r } = findByToken(m[1]);
      const preview = !!c && query.preview === '1' && canSee(c);
      if (!r || (r.sample && !preview)) return err(404, 'This RSVP link is not valid. Please check the link you were sent.');
      return ok(Object.assign(guestSite(c, preview), { reservation: publicReservation(r) }));
    }
    if ((m = path.match(/^\/api\/r\/([A-Za-z0-9]{6,40})\/rsvp$/)) && method === 'POST') {
      const { c, r } = findByToken(m[1]);
      const preview = !!c && !!body.preview && canSee(c);
      if (!r || (r.sample && !preview)) return err(404, 'This RSVP link is not valid.');
      if (isClosed(c.site, now, tz)) return err(403, 'The RSVP deadline has passed, so responses can no longer be changed here.');
      const answers = body.answers || {};
      for (const g of r.guests) if (!['attending', 'not_attending'].includes(answers[g.id])) return err(400, 'Please choose Attending or Not Attending for every guest.');
      if (preview) return ok({ ok: true, preview: true });
      for (const g of r.guests) g.status = answers[g.id];
      r.submittedAt = now.toISOString();
      touch(db, c, 'guest');
      return ok({ ok: true }, { save: true });
    }

    // ----- couple's view (read-only tracking + preview) -----
    if ((m = path.match(/^\/api\/couple\/([a-z0-9-]{1,60})(\/[a-z]+(?:\/[A-Za-z0-9]{1,20})?)?$/))) {
      const c = db.clients.find(x => x.slug === m[1]);
      if (!c) return err(404, 'This page doesn’t exist. Please check the link from Pixie Craft Studio.');
      const sub = m[2] || '';
      if (sub === '' && method === 'GET') return ok({ couple: c.site.couple, signedIn: canSee(c), canEdit: !!ctx.board, hasCode: !!c.coupleCode, theme: publicTheme(c.theme), cover: c.theme.cover || null, studio: publicStudio(db.studio.settings) });
      if (sub === '/login' && method === 'POST') {
        if (!c.coupleCode) return err(400, 'Your sign-in code isn’t ready yet. Please ask Pixie Craft Studio.');
        const key = 'couple:' + c.id;
        if (limited(key, 5, 10 * 60e3, now)) return err(429, 'Too many wrong codes. Please wait 10 minutes and try again.');
        const h = await ctx.hashPin(String(body.code || ''), c.coupleCode.salt);
        if (h.hash !== c.coupleCode.hash) { hit(key, now); return err(401, 'That code doesn’t match. Please try again.'); }
        clearHits(key);
        return ok({ ok: true }, { login: { kind: 'couple', value: c.id } });
      }
      if (sub === '/logout' && method === 'POST') return ok({ ok: true }, { logout: 'couple' });
      if (!canSee(c)) return err(401, 'Please sign in again.');
      if (sub === '/version' && method === 'GET') return ok({ version: c.updatedAt });
      if (sub === '/state' && method === 'GET') {
        return ok({ couple: c.site.couple, site: c.site, slug: c.slug, closed: isClosed(c.site, now, tz), stats: stats(c), version: c.updatedAt,
          reservations: c.reservations.map(r => Object.assign(publicReservation(r), { id: r.id, addedBy: r.addedBy || 'studio', createdAt: r.createdAt || null })) });
      }
      // Couples can add families themselves, and remove the ones they added until that family has answered.
      if (sub === '/reservations' && method === 'POST') {
        if (isClosed(c.site, now, tz)) return err(403, 'The RSVP deadline has passed. Please message Pixie Craft Studio to add guests.');
        if (c.reservations.filter(r => r.addedBy === 'couple').length >= 500) return err(400, 'That’s a lot of families! Please message Pixie Craft Studio to add more.');
        const r0 = cleanReservation(Object.assign({}, body, { guests: (body.guests || []).map(g => ({ name: g && g.name })) }));
        if (r0.error) return err(400, r0.error);
        if (r0.guests.length > r0.seats) return err(400, 'There are more guest names than reserved seats.');
        c.reservations.push(Object.assign({ id: rid(8), token: rid(12) }, r0, { sample: false, addedBy: 'couple', createdAt: now.toISOString(), submittedAt: null }));
        touch(db, c, 'couple');
        return ok({ ok: true }, { save: true });
      }
      if ((m = sub.match(/^\/reservations\/([A-Za-z0-9]{1,20})$/)) && method === 'DELETE') {
        const r = c.reservations.find(x => x.id === m[1]);
        if (!r) return err(404, 'This family was already removed.');
        if (r.addedBy !== 'couple') return err(403, 'Only Pixie Craft Studio can remove this family.');
        if (r.submittedAt) return err(403, 'This family already answered, so it can’t be removed here. Please message Pixie Craft Studio.');
        c.reservations = c.reservations.filter(x => x !== r); touch(db, c, 'couple');
        return ok({ ok: true }, { save: true });
      }
      return err(404, 'Not found');
    }

    // ----- Pixie's RSVP Board (studio only) -----
    const accounts = db.studio.accounts;
    if (method === 'GET' && path === '/api/board/auth') {
      return ok({ setupNeeded: accounts.length === 0, needsSetupCode: !!ctx.setupCode, me: ctx.board || null });
    }
    if (method === 'POST' && path === '/api/board/setup') {
      if (accounts.length) return err(400, 'The studio sign-in is already set up.');
      if (ctx.setupCode && String(body.setupCode || '').trim() !== ctx.setupCode) return err(403, 'That setup code is not right. It is shown where the website was started.');
      const name = cleanText(body.name, 40);
      if (!name) return err(400, 'Please type your name.');
      if (String(body.password || '').length < 8) return err(400, 'Please choose a password with at least 8 characters.');
      accounts.push(Object.assign({ id: rid(8), name }, await ctx.hashPin(String(body.password))));
      touch(db);
      return ok({ ok: true, me: name }, { save: true, login: { kind: 'board', value: name } });
    }
    if (method === 'POST' && path === '/api/board/login') {
      const acc = accounts.find(a => normName(a.name) === normName(body.name));
      const key = 'board:' + (acc ? acc.id : 'x');
      if (limited(key, 8, 10 * 60e3, now)) return err(429, 'Too many tries. Please wait 10 minutes.');
      const h = acc && await ctx.hashPin(String(body.password || ''), acc.salt);
      if (!acc || h.hash !== acc.hash) { hit(key, now); return err(401, 'Name or password is not right.'); }
      clearHits(key);
      return ok({ ok: true, me: acc.name }, { login: { kind: 'board', value: acc.name } });
    }
    if (method === 'POST' && path === '/api/board/logout') return ok({ ok: true }, { logout: 'board' });
    if (path.startsWith('/api/board/')) {
      if (!ctx.board || !accounts.some(a => a.name === ctx.board)) return err(401, 'Please sign in again.');
      const who = ctx.board;
      if (method === 'GET' && path === '/api/board/version') return ok({ version: db.version });
      // A full copy of everything, for the studio to keep somewhere safe.
      if (method === 'GET' && path === '/api/board/backup') return ok(JSON.parse(JSON.stringify(db)));
      if (path === '/api/board/studio') {
        const st = db.studio.settings;
        if (method === 'GET') return ok({ studio: st });
        if (method === 'PUT') {
          for (const k of ['logo', 'banner']) if (body[k] !== undefined) {
            if (body[k] !== null && !IMAGE_URL.test(body[k])) return err(400, 'Pictures must be JPG, PNG or WebP.');
            if (body[k] && body[k].length > 3e6) return err(400, 'That picture is too big. Please use a smaller one.');
            st[k] = body[k];
          }
          for (const k of ['facebook', 'tiktok', 'instagram']) if (body[k] !== undefined) {
            const v = cleanText(body[k], 300);
            if (v && !/^https:\/\/[^\s<>"']+$/.test(v)) return err(400, 'Links must start with https://');
            st[k] = v;
          }
          if (body.helpNote !== undefined) st.helpNote = cleanText(body.helpNote, 300);
          if (body.elements !== undefined) {
            if (!Array.isArray(body.elements) || body.elements.length > 300) return err(400, 'You can keep up to 300 elements.');
            const list = [];
            for (const e of body.elements) {
              if (!e || !/^[a-z0-9]{4,20}$/.test(e.id || '') || !IMAGE_REF.test(e.src || '')) return err(400, 'An element could not be saved. Please upload it again.');
              list.push({ id: e.id, name: cleanText(e.name, 80) || 'Element', src: e.src, w: Number.isInteger(e.w) ? e.w : 0, h: Number.isInteger(e.h) ? e.h : 0 });
            }
            st.elements = list;
          }
          if (body.site !== undefined) {
            const r = cleanSite(body.site);
            if (r.error) return err(400, r.error);
            st.site = r.site;
          }
          touch(db);
          return ok({ studio: st }, { save: true });
        }
      }
      if (method === 'GET' && path === '/api/board/clients') {
        return ok({ me: who, version: db.version, clients: db.clients.map(c => clientSummary(c, now, tz)),
          palettes: PALETTES, headingFonts: HEADING_FONTS, bodyFonts: BODY_FONTS, scriptFonts: SCRIPT_FONTS, customFont: CUSTOM_FONT, effects: EFFECTS, backgrounds: BACKGROUNDS });
      }
      if (method === 'POST' && path === '/api/board/clients') {
        const couple = cleanText(body.couple, 80);
        if (!couple) return err(400, 'Please type the couple’s names.');
        if (!validDate(body.weddingDate) || !validDate(body.deadline)) return err(400, 'Please choose the wedding date and the RSVP deadline.');
        if (body.deadline > body.weddingDate) return err(400, 'The RSVP deadline should be before the wedding date.');
        let coupleCode = null;
        if (body.code) { if (!/^\d{6}$/.test(body.code)) return err(400, 'The couple’s code must be 6 numbers.'); coupleCode = await ctx.hashPin(String(body.code)); }
        const c = newClient(db, { couple, weddingDate: body.weddingDate, deadline: body.deadline, coupleCode, notes: cleanText(body.notes, 500), sample: !!body.sample });
        db.clients.push(c);
        touch(db, c, who);
        return ok({ client: clientFull(c, now, tz) }, { save: true });
      }
      if ((m = path.match(/^\/api\/board\/clients\/([A-Za-z0-9]+)(\/.*)?$/))) {
        const c = db.clients.find(x => x.id === m[1]);
        if (!c) return err(404, 'This client was removed. The list has been refreshed.');
        const sub = m[2] || '';
        if (sub === '' && method === 'GET') return ok({ client: clientFull(c, now, tz), version: db.version });
        if (sub === '' && method === 'DELETE') { db.clients = db.clients.filter(x => x !== c); touch(db); return ok({ ok: true }, { save: true }); }
        if (sub === '/site' && method === 'PUT') {
          const next = Object.assign({}, c.site);
          for (const k of Object.keys(DEFAULT_SITE)) {
            if (!(k in (body.site || {}))) continue;
            const v = cleanText(body.site[k], MAX_TEXT);
            if (DATE_KEYS.includes(k)) { if (!validDate(v)) return err(400, 'Please choose a valid date.'); }
            else if (!v) return err(400, 'Some boxes are empty. Please fill in every box (or press “Use the original text”).');
            next[k] = v;
          }
          c.site = next; touch(db, c, who);
          return ok({ client: clientFull(c, now, tz) }, { save: true });
        }
        if (sub === '/theme' && method === 'PUT') {
          const t = cleanTheme(body.theme || {}, c.theme);
          if (t.error) return err(400, t.error);
          c.theme = t.theme; touch(db, c, who);
          return ok({ client: clientFull(c, now, tz) }, { save: true });
        }
        if (sub === '/details' && method === 'PUT') {
          if (body.slug !== undefined) {
            const slug = slugify(body.slug);
            if (db.clients.some(x => x.slug === slug && x !== c)) return err(400, 'That link name is already used by another client.');
            c.slug = slug;
          }
          if (body.notes !== undefined) c.notes = cleanText(body.notes, 500);
          if (body.code !== undefined) {
            if (!/^\d{6}$/.test(String(body.code))) return err(400, 'The couple’s code must be 6 numbers.');
            c.coupleCode = await ctx.hashPin(String(body.code));
          }
          touch(db, c, who);
          return ok({ client: clientFull(c, now, tz) }, { save: true });
        }
        if (sub === '/reservations' && method === 'POST') {
          const r0 = cleanReservation(body);
          if (r0.error) return err(400, r0.error);
          c.reservations.push(Object.assign({ id: rid(8), token: rid(12) }, r0, { sample: false, createdAt: now.toISOString(), submittedAt: null }));
          touch(db, c, who);
          return ok({ client: clientFull(c, now, tz) }, { save: true });
        }
        if (sub === '/upload' && method === 'POST') {
          const groups = groupRows(Array.isArray(body.rows) ? body.rows : []);
          if (!groups.length) return err(400, 'No guests were found in that file. Each row needs a family name and a guest name.');
          if (body.mode === 'replace') c.reservations = [];
          let added = 0, merged = 0;
          for (const g of groups) {
            const same = c.reservations.find(r => !r.sample && normName(r.family) === normName(g.family));
            if (same) {
              for (const guest of g.guests) if (!same.guests.some(x => normName(x.name) === normName(guest.name))) same.guests.push({ id: rid(8), name: guest.name, status: guest.status });
              same.seats = Math.max(same.seats, g.seats); merged++;
            } else {
              c.reservations.push({ id: rid(8), token: rid(12), family: g.family, seats: g.seats, sample: false,
                guests: g.guests.map(x => ({ id: rid(8), name: x.name, status: x.status })), createdAt: now.toISOString(), submittedAt: null });
              added++;
            }
          }
          touch(db, c, who);
          return ok({ client: clientFull(c, now, tz), added, merged }, { save: true });
        }
        if (sub === '/remove-examples' && method === 'POST') {
          c.reservations = c.reservations.filter(r => !r.sample); touch(db, c, who);
          return ok({ client: clientFull(c, now, tz) }, { save: true });
        }
        if ((m = sub.match(/^\/reservations\/([A-Za-z0-9]+)$/))) {
          const r = c.reservations.find(x => x.id === m[1]);
          if (!r) return err(404, 'This reservation was already removed.');
          if (method === 'PUT') {
            const r0 = cleanReservation(body, r);
            if (r0.error) return err(400, r0.error);
            Object.assign(r, r0); touch(db, c, who);
            return ok({ client: clientFull(c, now, tz) }, { save: true });
          }
          if (method === 'DELETE') {
            c.reservations = c.reservations.filter(x => x !== r); touch(db, c, who);
            return ok({ client: clientFull(c, now, tz) }, { save: true });
          }
        }
      }
    }
    return err(404, 'Not found');
  }

  return {
    DEFAULT_SITE, STATUSES, PALETTES, HEADING_FONTS, BODY_FONTS, SCRIPT_FONTS, CUSTOM_FONT, BACKGROUNDS, VIDEO_REF, IMAGE_REF, DECOR_SCREENS, DECOR_HIDE, SITE_PAGES, SITE_COLORS, cleanSite, EFFECTS, defaultData, upgradeData, upgradeSite, defaultTheme, groupRows,
    handle, stats, fill, isClosed, deadlineEnd, formatDeadline, formatWeddingDate, formatLong, formatPadded, validDate, normName,
  };
});


(function () {
  'use strict';
  // Settings come from config.js (the Supabase address and its public key).
  var cfg = window.PIXIE_CONFIG || {}, base = String(cfg.supabaseUrl || '').trim().replace(/\/+$/, ''), anon = String(cfg.supabaseKey || '').trim();
  var ROUTE = location.hash.slice(1) || '/';
  var P = window.PIXIE = { pages: true, logo: 'studio-logo.png', bg: 'bg.jpg', storefront: 'storefront.jpg', maxVideoMB: 50 };
  P.resetHelp = 'In Supabase, open SQL Editor and run: update pixie_rows set value = \'[]\', rev = rev + 1 where key = \'studio:accounts\'; Then open the board again and set up a new name and password. Clients and guest lists are kept.';
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
      if (res.status === 401 && /\/api\/board\//.test(url)) localStorage.removeItem(SKEY.board);
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
    var kind = /^\/(w|r)\//.test(p) ? 'guest' : /^\/couple\//.test(p) ? 'couple' : 'board';
    document.body.className = kind === 'guest' ? 'guest' : 'admin';
    apps[kind]();
  };
})();

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

window.__startPixie({
guest: function () {
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

}, couple: function () {
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

}, board: function () {
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

} });
