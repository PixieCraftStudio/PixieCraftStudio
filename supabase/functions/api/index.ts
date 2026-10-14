// @ts-nocheck
// Pixie Craft Studio RSVP: the website's API, running on Supabase. Built by build-pages.js from core.js and pages/*.js; edit those, not this file.
// Secrets it reads (Supabase > Edge Functions > Secrets): SETUP_CODE (your own 6 numbers, needed once to create the studio sign-in),
// optional ALLOWED_ORIGIN (your GitHub Pages address, e.g. https://yourname.github.io) and WEDDING_UTC_OFFSET (default +08:00).
const Core = (function () {
  const module = { exports: {} };
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

  return module.exports;
})();
// The website's API for the GitHub Pages version. It runs as a Supabase Edge Function (see build-pages.js) and only uses
// standard web features (Request, Response, crypto.subtle), so the same code is tested locally with Node.
// The data rules themselves are core.js, shared with every other version of the site.
//   store: where the data lives (Supabase in production, memory in tests). See supabase-store.js for what it must offer.
function createApi(o) {
  const C = o.Core, store = o.store;
  const SESSION_MS = 30 * 24 * 3600e3;
  const IMAGE_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
  const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov', 'video/x-m4v': '.m4v' };
  const MAX_IMAGE = 15 * 1024 * 1024, MAX_VIDEO = (o.maxVideoMB || 50) * 1024 * 1024;
  // The setup code protects the first studio sign-in. Without the SETUP_CODE secret nobody can claim the site.
  const setupCode = o.setupCode || 'not-set-' + rand(16);

  const enc = new TextEncoder();
  function rand(n) { return Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join(''); }
  function token() { return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function sha256(s) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))), b => b.toString(16).padStart(2, '0')).join(''); }
  // Passwords and couples' codes are stored scrambled (PBKDF2, 150,000 rounds).
  async function hashPin(pin, salt) {
    salt = salt || rand(16);
    const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return { salt, hash: Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('') };
  }

  // ---------- the data, kept as one row per couple plus a few rows for the studio ----------
  // A copy stays in memory between requests; only rows that changed elsewhere are read again.
  const cache = new Map(); // key -> { rev, json }
  async function loadDb() {
    const live = await store.revs(), seen = new Set(), need = [];
    for (const r of live) { seen.add(r.key); const c = cache.get(r.key); if (!c || c.rev !== r.rev) need.push(r.key); }
    for (const k of [...cache.keys()]) if (!seen.has(k)) cache.delete(k);
    for (let i = 0; i < need.length; i += 40) for (const r of await store.values(need.slice(i, i + 40))) cache.set(r.key, { rev: r.rev, json: r.value });
    if (!cache.size) return null;
    const db = { studio: {}, clients: [] }, byId = {};
    let order = [];
    for (const [k, c] of cache) {
      const v = JSON.parse(c.json);
      if (k === 'meta:order') order = v;
      else if (k.startsWith('meta:')) db[k.slice(5)] = v;
      else if (k.startsWith('studio:')) db.studio[k.slice(7)] = v;
      else if (k.startsWith('client:')) byId[k.slice(7)] = v;
    }
    db.clients = order.filter(id => byId[id]).map(id => byId[id]).concat(Object.keys(byId).filter(id => !order.includes(id)).map(id => byId[id]));
    return db;
  }
  function rowsOf(db) {
    const m = new Map();
    for (const [k, v] of Object.entries(db)) if (k !== 'clients' && k !== 'studio') m.set('meta:' + k, JSON.stringify(v));
    m.set('meta:order', JSON.stringify(db.clients.map(c => c.id)));
    for (const [k, v] of Object.entries(db.studio || {})) m.set('studio:' + k, JSON.stringify(v));
    for (const c of db.clients) m.set('client:' + c.id, JSON.stringify(c));
    return m;
  }
  // Saves only what changed, all together or not at all. If someone else saved in the meantime, the request runs again on fresh data.
  async function saveDb(db) {
    const rows = rowsOf(db), changes = [];
    for (const [key, json] of rows) { const c = cache.get(key); if (!c || c.json !== json) changes.push({ op: 'put', key, value: json, rev: c ? c.rev : 0 }); }
    for (const [key, c] of cache) if (!rows.has(key)) changes.push({ op: 'del', key, rev: c.rev });
    if (!changes.length) return;
    await store.commit(changes);
    for (const ch of changes) { if (ch.op === 'del') cache.delete(ch.key); else cache.set(ch.key, { rev: ch.rev + 1, json: ch.value }); }
  }

  // ---------- sign-ins (sent as headers, since GitHub Pages and the database live on different addresses) ----------
  const HEAD = { board: 'x-pixie-board', couple: 'x-pixie-couple' };
  async function current(req, kind) {
    const sid = req.headers.get(HEAD[kind]);
    if (!sid || sid.length > 100) return null;
    const s = await store.sessionGet(await sha256(sid));
    return s && s.kind === kind && s.expires > Date.now() ? s.value : null;
  }

  const cors = {
    'Access-Control-Allow-Origin': o.origin || '*',
    'Access-Control-Allow-Headers': 'content-type, x-pixie-board, x-pixie-couple, authorization, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'x-pixie-login, x-pixie-logout',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };
  const json = (status, body, extra) => new Response(JSON.stringify(body), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors, extra || {}) });

  return async function handle(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(req.url), at = url.pathname.indexOf('/api/');
      if (at < 0) return json(404, { error: 'Not found' });
      const path = url.pathname.slice(at);
      if (path === '/api/health') return json(200, { ok: true });
      let body = {};
      if (req.method !== 'GET') {
        const text = await req.text();
        if (text.length > 10e6) return json(413, { error: 'That is too big to save.' });
        if (text) { try { body = JSON.parse(text); } catch (e) { return json(400, { error: 'Something went wrong. Please try again.' }); } }
      }
      const boardName = await current(req, 'board'), coupleId = await current(req, 'couple');
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

      for (let attempt = 0; ; attempt++) {
        let db = await loadDb();
        db = C.upgradeData(db || C.defaultData(false));
        const board = boardName && db.studio.accounts.some(a => a.name === boardName) ? boardName : null;

        // Uploads go straight from the browser to file storage; this only hands out a one-time upload address.
        if (path === '/api/board/media-url' && req.method === 'POST') {
          if (!board) return json(401, { error: 'Please sign in again.' });
          const type = String(body.type || ''), ext = IMAGE_TYPES[type] || VIDEO_TYPES[type], size = Number(body.size) || 0;
          if (!ext) return json(415, { error: 'Please choose an MP4, WebM or MOV video, or a PNG, JPG, WebP or GIF picture.' });
          if (size > (IMAGE_TYPES[type] ? MAX_IMAGE : MAX_VIDEO)) return json(413, { error: IMAGE_TYPES[type] ? 'That picture is too big. Please use one under 15 MB.' : `That video is too big. Please use one under ${o.maxVideoMB || 50} MB.` });
          const name = rand(12) + ext;
          return json(200, { uploadUrl: await store.signUpload(name, type), ref: '/media/' + name });
        }
        const out = await C.handle(req.method, path, Object.fromEntries(url.searchParams), body,
          { db, board, couple: coupleId, now: new Date(), ip, tz: o.tz || '+08:00', hashPin, setupCode: db.studio.accounts.length ? null : setupCode });
        if (out.save) {
          try { await saveDb(db); }
          catch (e) { if (e.conflict && attempt < 5) { await new Promise(r => setTimeout(r, 40 + Math.random() * 120)); continue; } throw e; }
        }
        const headers = {};
        if (out.login) {
          const sid = token();
          await store.sessionSet(await sha256(sid), out.login.kind, String(out.login.value), Date.now() + SESSION_MS);
          headers['x-pixie-login'] = out.login.kind + ':' + sid;
        }
        if (out.logout) {
          const sid = req.headers.get(HEAD[out.logout]);
          if (sid) await store.sessionDel(await sha256(sid));
          headers['x-pixie-logout'] = out.logout;
        }
        return json(out.status, out.body, headers);
      }
    } catch (e) {
      console.error(e);
      return json(500, { error: 'Something went wrong on our side. Please try again in a minute.' });
    }
  };
}

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

const handle = createApi({
  Core,
  store: supabaseStore(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
  setupCode: Deno.env.get('SETUP_CODE') || '',
  origin: Deno.env.get('ALLOWED_ORIGIN') || '*',
  tz: Deno.env.get('WEDDING_UTC_OFFSET') || '+08:00',
  maxVideoMB: 50,
});
Deno.serve(handle);
