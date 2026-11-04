// Pixie Craft Studio RSVP, GitHub Pages version. Built by build-pages.js from core.js and public/*.js; edit those, not this file.
// Pixie Craft Studio · Event RSVP: shared data rules and API.
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
    // 3. Event invitation
    invitationHeading: 'You’re Invited to Celebrate with',
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
    // Fairy Garden design (chosen per client in Customize)
    fairyTitle: 'Kindly RSVP!',
    fairySubtitle: 'A tiny reminder!',
    fairyMessage: 'I’m still too little to count my guests, so please let my mommy and daddy know if you’re coming to celebrate my special day! Hehe! ♡',
    fairyClosing: 'See you soon!',
    fairyNext: 'NEXT',
    fairyHello: 'Hello!',
    fairyAsk: 'What’s your name?',
    fairyAskSub: 'Let me find your special seat!',
    fairyPlaceholder: 'First Name Last Name | Ex. Maria Esther Martinez',
    fairyFind: 'FIND MY SEAT',
    fairyReserved: 'I Reserved',
    fairySeatsWord: 'Seats',
    fairyForYou: 'For You!',
    fairyCount: 'Can you help me count who’s coming? Hehe! Kindly confirm who’s joining from your family or group!',
    fairyCheck: 'Did I count everyone right?',
    fairySubmit: 'SUBMIT',
    fairyThanks: 'Thank You!',
    fairyBackLink: 'Back to my invitation',
    fairySurprise: 'Surprise!',
    fairySurpriseSub: 'No Worries',
    fairySurpriseDone: '{rep} already RSVP’d for you! Hehe!',
    fairySurpriseWait: '{rep} will RSVP for you! Hehe!',
    fairySurpriseButton: 'NEXT',
    fairyChangeMind: 'Change of Mind?',
    fairyChangeTitle: 'A Little Change of Plans?',
    fairyChangeHello: 'Hello, {name}!',
    fairyYes: 'yes, i\'ll be there!',
    fairyNo: 'sorry, i can\'t make it!',
    fairySave: 'Save My Answer',
    fairyNeedLink: 'To keep everyone’s answers safe, please open your own RSVP link to change your answer. You can ask {couple} for it.',
  };
  const DATE_KEYS = ['deadline', 'weddingDate'];
  // Earlier default texts. If a site still has them unchanged, they are swapped for the current defaults.
  const OLD_DEFAULTS = {
    invitationHeading: ['The Wedding of'],
    fairyNext: ['Next'],
    fairyFind: ['Find my seat'],
    fairySubmit: ['Submit'],
    fairySurpriseButton: ['Back to Invitation'],
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
      out = out.replace(/\{family\}/g, r.family).replace(/\{seats\}/g, String(r.seats)).replace(/\{rep\}/g, r.rep || r.family)
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
      repId: r.repId || null, rep: ((r.guests.find(g => g.id === r.repId) || {}).name) || null,
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
      const key = old.has(id) && old.get(id).key;
      guests.push(key ? { id, name, status, key } : { id, name, status });
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
  // Every font on offer, grouped the way the font lists show them. All are Google Fonts (most are in Canva's font list too), so they load on any website.
  const FONT_GROUPS = {
    'Script & calligraphy': ['Great Vibes', 'Pinyon Script', 'Italianno', 'Alex Brush', 'Allura', 'Parisienne', 'Tangerine', 'Monsieur La Doulaise', 'Petit Formal Script',
      'Mrs Saint Delafield', 'Rouge Script', 'Imperial Script', 'Ballet', 'WindSong', 'Corinthia', 'Luxurious Script', 'Herr Von Muellerhoff', 'Dancing Script',
      'Sacramento', 'Allison', 'Birthstone', 'Carattere', 'Ephesis', 'Fleur De Leah', 'Lavishly Yours', 'Meddon', 'Ms Madi', 'Qwigley', 'Rochester', 'Satisfy',
      'Style Script', 'The Nautigal', 'Vujahday Script', 'Whisper', 'Arizonia', 'Euphoria Script', 'Love Light', 'Bilbo Swash Caps', 'Mea Culpa', 'Send Flowers',
      'Lovers Quarrel', 'Hurricane', 'Water Brush', 'Yesteryear', 'Cookie', 'Grand Hotel', 'Kaushan Script', 'Clicker Script', 'League Script', 'Mr De Haviland',
      'Mrs Sheppards', 'Niconne', 'Norican', 'Playball', 'Princess Sofia', 'Seaweed Script', 'La Belle Aurore'],
    'Elegant serif & display': ['Bodoni Moda', 'Playfair Display', 'Playfair Display SC', 'Cormorant Garamond', 'Cormorant', 'Cormorant Infant', 'Cormorant SC', 'Cormorant Upright',
      'Italiana', 'Gloock', 'Prata', 'Gilda Display', 'Marcellus', 'Forum', 'Cinzel', 'Cinzel Decorative', 'Libre Caslon Display', 'DM Serif Display', 'Della Respira',
      'Bellefair', 'Lora', 'EB Garamond', 'Crimson Pro', 'Libre Baskerville', 'Libre Bodoni', 'Noto Serif Display', 'Abril Fatface', 'Yeseva One', 'Bona Nova', 'Fraunces',
      'Instrument Serif', 'Young Serif', 'Antic Didone', 'Aboreto', 'Castoro', 'Cardo', 'Spectral', 'Old Standard TT', 'Sorts Mill Goudy', 'Linden Hill', 'Rosarivo',
      'Ovo', 'Rufina', 'Gowun Batang', 'Mate', 'Lustria', 'Newsreader', 'Brygada 1918', 'Arapey', 'Alice', 'Junge', 'Fanwood Text', 'Federo', 'Rozha One', 'Kurale',
      'Amiri', 'Lancelot', 'Petrona', 'Sedan'],
    'Clean & modern': ['Montserrat', 'Poppins', 'Tenor Sans', 'Josefin Sans', 'Raleway', 'Quicksand', 'Nunito Sans', 'Poiret One', 'Jost', 'Lato', 'Lexend', 'Urbanist',
      'Questrial', 'Comfortaa', 'Didact Gothic', 'Mulish', 'Work Sans', 'Outfit', 'Kumbh Sans', 'League Spartan', 'Montserrat Alternates', 'Inter', 'DM Sans', 'Manrope',
      'Figtree', 'Karla', 'Gruppo', 'Julius Sans One', 'Antic', 'Nunito', 'Cabin'],
  };
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
  const DECOR_SCREENS = ['welcome', 'notice', 'invite', 'surprise', 'reservation', 'change', 'thanks'];
  // Fairy Garden, Design tab (jrick 2026-11-04: "customize rsvp cards literally like canva"): every part of each card can be moved, resized,
  // turned, recolored, hidden, and the card picture swapped. Nothing saved = the card exactly as in jrick's pictures.
  // [part id, label, kind]; kind 'card' = the card picture, 'btn' = a button (has a fill color), 'text' = words, 'box' = other.
  const FAIRY_PARTS = {
    notice: [['card', 'Card picture', 'card'], ['title', 'Title', 'text'], ['sub', 'Small heading', 'text'], ['msg', 'Message', 'text'], ['closing', 'Closing line', 'text'], ['btn', 'Button', 'btn']],
    invite: [['card', 'Card picture', 'card'], ['title', 'Title', 'text'], ['sub', 'Question', 'text'], ['text', 'Small words', 'text'], ['input', 'Name box', 'box'], ['btn', 'Button', 'btn']],
    surprise: [['card', 'Card picture', 'card'], ['title', 'Title', 'text'], ['sub', 'Small heading', 'text'], ['text', 'Message', 'text'], ['btn', 'Button', 'btn']],
    reservation: [['reserved', '“I reserved”', 'text'], ['num', 'Seat number', 'text'], ['seats', '“Seats”', 'text'], ['for', '“for you”', 'text'], ['count', 'Small words', 'text'], ['rows', 'Guest list', 'box'], ['check', 'Check heading', 'text'], ['yay', 'Who’s coming line', 'text'], ['recap', 'Answers list', 'box'], ['btn', 'Button', 'btn']],
    change: [['card', 'Paper picture', 'card'], ['ctitle', 'Title', 'text'], ['chello', 'Hello line', 'text'], ['opts', 'Yes / No choices', 'box'], ['btn', 'Button', 'btn']],
    thanks: [['write', 'Thank-you lettering', 'text'], ['link', 'Link below', 'text']],
  };
  function cleanParts(d, customFontOk) {
    if (d === null || d === undefined) return { parts: null };
    if (typeof d !== 'object' || Array.isArray(d)) return { error: 'The card edits could not be read. Please try again.' };
    const out = {}, num = inRange, hex = v => /^#[0-9a-fA-F]{6}$/.test(v || '');
    for (const [scr, list] of Object.entries(d)) {
      if (!FAIRY_PARTS[scr] || !list || typeof list !== 'object') return { error: 'Unknown screen in the card edits.' };
      for (const [id, p] of Object.entries(list)) {
        const def = FAIRY_PARTS[scr].find(x => x[0] === id);
        if (!def || !p || typeof p !== 'object') return { error: 'Unknown part of a card.' };
        const o = {};
        if (p.x !== undefined) { if (!num(p.x, -900, 900)) return { error: 'A part is moved too far off the card.' }; o.x = Math.round(p.x * 10) / 10; }
        if (p.y !== undefined) { if (!num(p.y, -900, 1400)) return { error: 'A part is moved too far off the card.' }; o.y = Math.round(p.y * 10) / 10; }
        if (p.s !== undefined) { if (!num(p.s, 0.2, 5)) return { error: 'A part’s size goes from 20% to 500%.' }; o.s = Math.round(p.s * 1000) / 1000; }
        if (p.rot !== undefined) { if (!num(p.rot, -180, 180)) return { error: 'A part can turn up to 180°.' }; o.rot = Math.round(p.rot); }
        if (p.op !== undefined) { if (!num(p.op, 0.05, 1)) return { error: 'See-through goes from 5% to 100%.' }; o.op = Math.round(p.op * 100) / 100; }
        if (p.hide) o.hide = true;
        if (p.color !== undefined) { if (!hex(p.color)) return { error: 'Colors must look like #c27390.' }; o.color = p.color.toLowerCase(); }
        if (p.fill !== undefined) { if (def[2] !== 'btn' || !hex(p.fill)) return { error: 'Button colors must look like #c27390.' }; o.fill = p.fill.toLowerCase(); }
        if (p.font !== undefined) { if (!(ALL_FONT_LIST.includes(p.font) || (p.font === CUSTOM_FONT && customFontOk))) return { error: 'Unknown font on a card.' }; o.font = p.font; }
        if (p.src !== undefined) { if (def[2] !== 'card' || !IMAGE_REF.test(p.src)) return { error: 'Please choose the card picture again.' }; o.src = p.src; }
        if (Object.keys(o).length) (out[scr] = out[scr] || {})[id] = o;
      }
    }
    return { parts: Object.keys(out).length ? out : null };
  }
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
  const ALL_FONT_LIST = [...new Set([...Object.values(FONT_GROUPS).flat(), ...HEADING_FONTS, ...BODY_FONTS, ...SCRIPT_FONTS])];
  const ALL_FONTS = () => ALL_FONT_LIST;
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
  // The guest RSVP pages come in different designs; the studio picks one per client.
  const RSVP_DESIGNS = { classic: 'Classic Garden', fairy: 'Fairy Garden', custom: 'My own cards' };
  // ---------- Card Maker (jrick 2026-11-04: "admin can create a rsvp card thru the website, like canva features and ui") ----------
  // theme.cards = { transition, backdrop, pages: { notice|invite|surprise|reservation|change|thanks: { w, h, bg, els: [...] } } }.
  // Sizes are design pixels of the page; guests see the page scaled to their screen, so it keeps its shape on phones.
  const CARD_PAGES = ['notice', 'invite', 'surprise', 'reservation', 'change', 'thanks'];
  // The working parts of each page (the name box, buttons, the guest list...). Required ones can't be deleted.
  const CARD_PARTS = { notice: ['next'], invite: ['namebox', 'find'], surprise: ['next'], reservation: ['guestlist', 'submit', 'recap'], change: ['choices', 'save'], thanks: ['link'] };
  const CARD_REQUIRED = { notice: ['next'], invite: ['namebox', 'find'], surprise: ['next'], reservation: ['guestlist', 'submit'], change: ['choices', 'save'], thanks: [] };
  const CARD_EXTRA_FONTS = ['Homemade Apple', 'Fuzzy Bubbles', 'Gilda Display', 'Cedarville Cursive'];
  const CARD_BUILTIN_IMG = /^fairy-[a-z0-9-]{1,40}\.(webp|png|jpg)$/;
  const CARD_ANIM_IN = ['none', 'fade', 'rise', 'drop', 'pop', 'zoom', 'left', 'right', 'spin', 'blur', 'wipe'];
  const CARD_ANIM_LOOP = ['none', 'float', 'sway', 'pulse', 'twinkle', 'spin'];
  const CARD_SHAPES = ['rect', 'circle', 'heart', 'star', 'line', 'arch', 'blob', 'frame'];
  const CARD_TRANSITIONS = ['none', 'fade', 'slide', 'zoom', 'rise', 'flip'];
  const CARD_EFFECTS = ['none', 'shadow', 'outline', 'glow', 'lift'];
  function cleanCards(d, customFontOk) {
    if (d === null) return { cards: null };
    if (!d || typeof d !== 'object' || !d.pages || typeof d.pages !== 'object') return { error: 'The cards could not be read. Please try again.' };
    const num = inRange, hex = v => /^#[0-9a-fA-F]{6}$/.test(v || ''), col = v => v === 'transparent' || hex(v), bool = v => !!v;
    const fonts = ALL_FONT_LIST.concat(CARD_EXTRA_FONTS), fontOk = f => fonts.includes(f) || (f === CUSTOM_FONT && customFontOk);
    const img = v => IMAGE_REF.test(v || '') || CARD_BUILTIN_IMG.test(v || '');
    const r1 = v => Math.round(v * 10) / 10, r3 = v => Math.round(v * 1000) / 1000;
    const bad = m => ({ error: m });
    const out = { transition: CARD_TRANSITIONS.includes(d.transition) ? d.transition : 'fade', backdrop: {}, pages: {} };
    const bd = d.backdrop || {};
    if (bd.color) { if (!col(bd.color)) return bad('The backdrop color must look like #c27390.'); out.backdrop.color = bd.color.toLowerCase(); }
    if (bd.src) { if (!img(bd.src)) return bad('Please choose the backdrop picture again.'); out.backdrop.src = bd.src; }
    if (bd.blur !== undefined) { if (!num(bd.blur, 0, 30)) return bad('Backdrop blur is out of range.'); out.backdrop.blur = r1(bd.blur); }
    for (const [key, pg] of Object.entries(d.pages)) {
      if (!CARD_PAGES.includes(key)) return bad('Unknown page in the cards.');
      if (!pg || typeof pg !== 'object' || !num(pg.w, 200, 1400) || !num(pg.h, 200, 2400)) return bad('A page size is out of range (200 to 1400 wide).');
      const bg = pg.bg || {}, o = { w: Math.round(pg.w), h: Math.round(pg.h), bg: {}, els: [] };
      if (bg.color !== undefined) { if (!col(bg.color)) return bad('Page colors must look like #c27390.'); o.bg.color = bg.color.toLowerCase(); }
      if (bg.src) { if (!img(bg.src)) return bad('Please choose the page picture again.'); o.bg.src = bg.src; o.bg.fit = bg.fit === 'contain' ? 'contain' : bg.fit === 'stretch' ? 'stretch' : 'cover'; }
      if (bg.radius !== undefined) { if (!num(bg.radius, 0, 300)) return bad('Page corners are out of range.'); o.bg.radius = Math.round(bg.radius); }
      if (bg.shadow) o.bg.shadow = true;
      if (!Array.isArray(pg.els) || pg.els.length > 150) return bad('A page can hold up to 150 elements.');
      const seen = new Set(), parts = new Set();
      for (const e of pg.els) {
        if (!e || typeof e !== 'object' || !/^[a-z0-9]{4,24}$/.test(e.id || '') || seen.has(e.id)) return bad('An element in the cards is not valid.');
        seen.add(e.id);
        if (!num(e.x, -3000, 5000) || !num(e.y, -3000, 8000) || !num(e.w, 1, 5000) || !num(e.h, 1, 8000)) return bad('An element is placed too far off the page.');
        const el = { id: e.id, type: e.type, x: r1(e.x), y: r1(e.y), w: r1(e.w), h: r1(e.h) };
        if (e.rot) { if (!num(e.rot, -360, 360)) return bad('An element is turned too far.'); el.rot = r1(e.rot); }
        if (e.op !== undefined && e.op !== 1) { if (!num(e.op, 0.02, 1)) return bad('Transparency is out of range.'); el.op = Math.round(e.op * 100) / 100; }
        for (const f of ['flipX', 'flipY', 'lock']) if (e[f]) el[f] = true;
        if (e.anim) {
          const a = e.anim, an = {};
          if (a.in && a.in !== 'none') { if (!CARD_ANIM_IN.includes(a.in)) return bad('Unknown animation.'); an.in = a.in; }
          if (a.loop && a.loop !== 'none') { if (!CARD_ANIM_LOOP.includes(a.loop)) return bad('Unknown animation.'); an.loop = a.loop; }
          if (a.delay !== undefined) { if (!num(a.delay, 0, 10)) return bad('Animation delay goes up to 10 seconds.'); an.delay = r1(a.delay); }
          if (a.dur !== undefined) { if (!num(a.dur, 0.2, 8)) return bad('Animation speed is out of range.'); an.dur = r1(a.dur); }
          if (Object.keys(an).length) el.anim = an;
        }
        if (e.type === 'text') {
          el.text = cleanText(e.text, 1000) || 'Your text';
          if (!fontOk(e.font)) return bad('Unknown font in a text box.');
          if (!num(e.size, 2, 600)) return bad('Text size is out of range.');
          if (!hex(e.color)) return bad('Text colors must look like #c27390.');
          Object.assign(el, { font: e.font, size: r1(e.size), color: e.color.toLowerCase(), align: ['left', 'center', 'right', 'justify'].includes(e.align) ? e.align : 'center' });
          for (const f of ['bold', 'italic', 'underline', 'upper']) if (e[f]) el[f] = true;
          if (e.ls) { if (!num(e.ls, -20, 200)) return bad('Letter spacing is out of range.'); el.ls = r1(e.ls); }
          if (e.lh !== undefined) { if (!num(e.lh, 0.5, 4)) return bad('Line spacing is out of range.'); el.lh = Math.round(e.lh * 100) / 100; }
          if (e.effect && e.effect !== 'none') { if (!CARD_EFFECTS.includes(e.effect)) return bad('Unknown text effect.'); el.effect = e.effect; if (e.ecolor) { if (!hex(e.ecolor)) return bad('Effect colors must look like #c27390.'); el.ecolor = e.ecolor.toLowerCase(); } }
        } else if (e.type === 'image') {
          if (!img(e.src)) return bad('Please add that picture again.');
          el.src = e.src;
          if (e.orig && img(e.orig)) el.orig = e.orig;
          if (e.crop) {
            const c = e.crop, ok = ['l', 't', 'r', 'b'].every(k => num(c[k] || 0, 0, 0.98)) && (c.l || 0) + (c.r || 0) < 0.98 && (c.t || 0) + (c.b || 0) < 0.98;
            if (!ok) return bad('The crop is out of range.');
            if (c.l || c.t || c.r || c.b) el.crop = { l: r3(c.l || 0), t: r3(c.t || 0), r: r3(c.r || 0), b: r3(c.b || 0) };
          }
          if (e.radius) { if (!num(e.radius, 0, 50)) return bad('Rounded corners are out of range.'); el.radius = r1(e.radius); }
          if (e.adj) {
            const a = e.adj, ad = {};
            for (const [k, lo, hi, def] of [['b', 0, 200, 100], ['c', 0, 200, 100], ['s', 0, 200, 100], ['bl', 0, 20, 0], ['g', 0, 100, 0]]) {
              if (a[k] === undefined || a[k] === def) continue;
              if (!num(a[k], lo, hi)) return bad('A picture adjustment is out of range.'); ad[k] = r1(a[k]);
            }
            if (Object.keys(ad).length) el.adj = ad;
          }
          if (e.shadow) el.shadow = true;
          if (e.bw) { if (!num(e.bw, 0, 60) || !hex(e.bc)) return bad('The picture border is not valid.'); el.bw = r1(e.bw); el.bc = e.bc.toLowerCase(); }
        } else if (e.type === 'shape') {
          if (!CARD_SHAPES.includes(e.shape)) return bad('Unknown shape.');
          if (!col(e.fill || 'transparent')) return bad('Shape colors must look like #c27390.');
          el.shape = e.shape; el.fill = (e.fill || 'transparent').toLowerCase();
          if (e.sw) { if (!num(e.sw, 0, 80) || !hex(e.stroke)) return bad('The shape border is not valid.'); el.sw = r1(e.sw); el.stroke = e.stroke.toLowerCase(); }
          if (e.radius) { if (!num(e.radius, 0, 1000)) return bad('Rounded corners are out of range.'); el.radius = r1(e.radius); }
        } else if (e.type === 'part') {
          if (!(CARD_PARTS[key] || []).includes(e.kind) || parts.has(e.kind)) return bad('A working part is not valid on this page.');
          parts.add(e.kind); el.kind = e.kind;
          if (e.font !== undefined) { if (!fontOk(e.font)) return bad('Unknown font on a working part.'); el.font = e.font; }
          if (e.size !== undefined) { if (!num(e.size, 2, 300)) return bad('Text size is out of range.'); el.size = r1(e.size); }
          for (const f of ['color', 'on', 'line']) if (e[f] !== undefined) { if (!hex(e[f])) return bad('Colors must look like #c27390.'); el[f] = e[f].toLowerCase(); }
          if (e.fill !== undefined) { if (!col(e.fill)) return bad('Colors must look like #c27390.'); el.fill = e.fill.toLowerCase(); }
          if (e.radius !== undefined) { if (!num(e.radius, 0, 500)) return bad('Rounded corners are out of range.'); el.radius = r1(e.radius); }
          for (const f of ['label', 'label2', 'ph', 'yes', 'no']) if (e[f] !== undefined) el[f] = cleanText(e[f], 120);
          if (e.bold) el.bold = true; if (e.italic) el.italic = true; if (e.upper) el.upper = true;
        } else return bad('An element in the cards is not valid.');
        o.els.push(el);
      }
      for (const k of CARD_REQUIRED[key]) if (!parts.has(k)) return bad(`The ${({ notice: 'Kindly RSVP', invite: 'Hello', surprise: 'Surprise', reservation: 'Seats', change: 'Change of plans', thanks: 'Thank you' })[key]} page needs its ${({ next: 'button', namebox: 'name box', find: 'Find button', guestlist: 'guest list', submit: 'Send button', choices: 'yes / no choices', save: 'Save button' })[k]}.`);
      out.pages[key] = o;
    }
    if (JSON.stringify(out).length > 400000) return bad('The cards are too big to save. Please remove some elements.');
    return { cards: out };
  }
  function defaultTheme() {
    return { palette: 'garden', colors: Object.assign({}, PALETTES.garden), headingFont: 'Italianno', headingItalic: false,
      bodyFont: 'Della Respira', scriptFont: 'Great Vibes', background: 'garden', customBg: null, blur: true, logo: null, video: null, customFont: null,
      sizes: { names: 100, titles: 100, text: 100 }, effects: { names: 'none', titles: 'none' }, cardSize: { desktop: 100, mobile: 90 }, cover: null, decor: null,
      rsvpDesign: 'classic', invitationLink: '', fairyRsvpSize: 100, fairyNameSize: 100, fairySurpriseSize: 100, fairyResSize: 100, fairyChangeSize: 100, fairyThanksSize: 100 };
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
    if (body.headingFont !== undefined) { if (!fontOk(ALL_FONTS(), body.headingFont)) return { error: 'Unknown heading font.' }; t.headingFont = body.headingFont; }
    if (body.bodyFont !== undefined) { if (!fontOk(ALL_FONTS(), body.bodyFont)) return { error: 'Unknown text font.' }; t.bodyFont = body.bodyFont; }
    if (body.scriptFont !== undefined) { if (!fontOk(ALL_FONTS(), body.scriptFont)) return { error: 'Unknown names font.' }; t.scriptFont = body.scriptFont; }
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
      if (body.cover !== null && !IMAGE_URL.test(body.cover)) return { error: 'The client photo must be a JPG, PNG or WebP picture.' };
      if (body.cover && body.cover.length > 1.5e6) return { error: 'That photo is too big. Please use a smaller one.' };
      t.cover = body.cover;
    }
    if (body.decor !== undefined) {
      const d = cleanDecor(body.decor, !!t.customFont);
      if (d.error) return d;
      t.decor = d.decor;
    }
    if (body.cards !== undefined) {
      const d = cleanCards(body.cards, !!t.customFont);
      if (d.error) return d;
      t.cards = d.cards;
    }
    if (body.parts !== undefined) {
      const d = cleanParts(body.parts, !!t.customFont);
      if (d.error) return d;
      t.parts = d.parts;
    }
    if (body.background !== undefined) { if (!BACKGROUNDS[body.background]) return { error: 'Unknown background.' }; t.background = body.background; }
    if (body.rsvpDesign !== undefined) { if (!RSVP_DESIGNS[body.rsvpDesign]) return { error: 'Unknown RSVP design.' }; t.rsvpDesign = body.rsvpDesign; }
    if (body.invitationLink !== undefined) {
      const v = String(body.invitationLink || '').trim();
      if (v && (v.length > 500 || !/^https?:\/\/[^\s<>"']+$/i.test(v))) return { error: 'The invitation link must start with https:// (copy it from your browser’s address bar).' };
      t.invitationLink = v;
    }
    // Fairy Garden: one size per card (100% = the size in the design).
    for (const [k, label] of [['fairyRsvpSize', 'Kindly RSVP'], ['fairyNameSize', 'Hello'], ['fairySurpriseSize', 'Surprise'], ['fairyResSize', 'Reserved seats'], ['fairyChangeSize', 'Change of Plans'], ['fairyThanksSize', 'Thank You']]) {
      if (body[k] === undefined) continue;
      const n = Math.round(Number(body[k]));
      if (!(n >= 60 && n <= 160)) return { error: `The ${label} card size must be between 60% and 160%.` };
      t[k] = n;
    }
    if (t.background === 'custom' && !t.customBg) return { error: 'Please upload a photo for the background first.' };
    if (t.rsvpDesign === 'custom' && !(t.cards && t.cards.pages && CARD_PAGES.every(k => t.cards.pages[k]))) return { error: 'Please make and save your cards in the Card Maker first.' };
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
    return normName(String(s).replace(/&/g, ' ')).replace(/ /g, '-').slice(0, 40) || 'event';
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
  // ---------- seat planner (couple's dashboard) ----------
  // Floor is 1000 x 700 units. assign: guest id -> table id. Tables never hold more guests than seats.
  const TABLE_SHAPES = ['round', 'square', 'rect'];
  const FLOOR_ITEMS = { stage: 'Stage', dance: 'Dance floor', dj: 'DJ / Band', bar: 'Bar', buffet: 'Buffet', cake: 'Cake table', gifts: 'Gift table', photo: 'Photo booth', entrance: 'Entrance' };
  const emptyPlanner = () => ({ tables: [], items: [], assign: {} });
  function cleanPlanner(p, client) {
    if (!p || typeof p !== 'object') return { error: 'The seat plan could not be read. Please try again.' };
    const out = emptyPlanner(), ids = new Set(), num = (v, lo, hi, d) => inRange(v, lo, hi) ? Math.round(v) : d;
    const tables = Array.isArray(p.tables) ? p.tables : [], items = Array.isArray(p.items) ? p.items : [];
    if (tables.length > 120) return { error: 'A seat plan can have up to 120 tables.' };
    if (items.length > 40) return { error: 'A seat plan can have up to 40 stages and areas.' };
    for (const t of tables) {
      if (!t || !/^[a-z0-9]{4,20}$/.test(t.id || '') || ids.has(t.id)) return { error: 'A table in the seat plan is not valid.' };
      ids.add(t.id);
      out.tables.push({ id: t.id, name: cleanText(t.name, 40) || 'Table', shape: TABLE_SHAPES.includes(t.shape) ? t.shape : 'round',
        seats: num(t.seats, 1, 30, 8), vip: !!t.vip, x: num(t.x, 0, 1000, 500), y: num(t.y, 0, 700, 350) });
    }
    for (const it of items) {
      if (!it || !/^[a-z0-9]{4,20}$/.test(it.id || '') || !FLOOR_ITEMS[it.kind]) return { error: 'A stage or area in the seat plan is not valid.' };
      out.items.push({ id: it.id, kind: it.kind, label: cleanText(it.label, 30) || FLOOR_ITEMS[it.kind], x: num(it.x, 0, 1000, 500), y: num(it.y, 0, 700, 80),
        w: num(it.w, 30, 900, 220), h: num(it.h, 20, 600, 70) });
    }
    const guests = new Set(), count = {};
    for (const r of client.reservations) for (const g of r.guests) guests.add(g.id);
    for (const [gid, tid] of Object.entries(p.assign && typeof p.assign === 'object' ? p.assign : {})) {
      const t = out.tables.find(x => x.id === tid);
      if (!guests.has(gid) || !t || (count[tid] || 0) >= t.seats) continue;
      count[tid] = (count[tid] || 0) + 1; out.assign[gid] = tid;
    }
    return { planner: out };
  }
  // The saved plan, without seats for guests who were removed since.
  function plannerOf(c) {
    const p = c.planner || emptyPlanner(), guests = new Set();
    for (const r of c.reservations) for (const g of r.guests) guests.add(g.id);
    return { tables: p.tables || [], items: p.items || [], assign: Object.fromEntries(Object.entries(p.assign || {}).filter(([g]) => guests.has(g))) };
  }

  function clientFull(c, now, tz) {
    return Object.assign(clientSummary(c, now, tz), { site: c.site, theme: c.theme, notes: c.notes || '', reservations: c.reservations, planner: plannerOf(c), closed: isClosed(c.site, now, tz) });
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
      let found = pool.find(r => r.guests.some(g => normName(g.name) === q)), who = found && found.guests.find(g => normName(g.name) === q);
      if (!found) {
        const w = q.split(' '), loose = [];
        for (const r of pool) for (const g of r.guests) {
          const gw = normName(g.name).split(' ');
          if (gw[0] === w[0] && gw[gw.length - 1] === w[w.length - 1]) loose.push([r, g]);
        }
        if (loose.length === 1) [found, who] = loose[0];
      }
      if (!found) return err(404, 'We couldn’t find that name. Please type your first name and surname exactly as written on your invitation.');
      return ok({ token: found.token, guestId: who ? who.id : null });
    }
    // A guest's own link (?g=guestId.key) proves who they are, so they may change their own answer.
    const guestFromKey = (r, gk) => {
      const [gid, key] = String(gk || '').split('.');
      const g = gid && key && r.guests.find(x => x.id === gid);
      return g && g.key && g.key === key ? g : null;
    };
    if ((m = path.match(/^\/api\/r\/([A-Za-z0-9]{6,40})$/)) && method === 'GET') {
      const { c, r } = findByToken(m[1]);
      const preview = !!c && query.preview === '1' && canSee(c);
      if (!r || (r.sample && !preview)) return err(404, 'This RSVP link is not valid. Please check the link you were sent.');
      const me = guestFromKey(r, query.g);
      return ok(Object.assign(guestSite(c, preview), { reservation: publicReservation(r), me: me ? me.id : null }));
    }
    // One guest changes only their own answer; the rest of the group stays as it is.
    if ((m = path.match(/^\/api\/r\/([A-Za-z0-9]{6,40})\/guest$/)) && method === 'POST') {
      const { c, r } = findByToken(m[1]);
      const preview = !!c && !!body.preview && canSee(c);
      if (!r || (r.sample && !preview)) return err(404, 'This RSVP link is not valid.');
      if (isClosed(c.site, now, tz)) return err(403, 'The RSVP deadline has passed, so responses can no longer be changed here.');
      if (!['attending', 'not_attending'].includes(body.status)) return err(400, 'Please choose yes or sorry.');
      // jrick chose (2026-11-03): finding your name is enough to change your own answer.
      const g = guestFromKey(r, body.key) || r.guests.find(x => x.id === body.guestId);
      if (!g) return err(404, 'We couldn’t find that guest.');
      // jrick (2026-11-03): the names under a representative view the group's answers and may change only their own.
      if (preview) return ok({ ok: true, preview: true });
      g.status = body.status; g.changedAt = now.toISOString();
      touch(db, c, 'guest');
      return ok({ ok: true }, { save: true });
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
        // Every guest gets a personal key once, for their own RSVP link.
        let keyed = false;
        for (const r of c.reservations) for (const g of r.guests) if (!g.key) { g.key = rid(8); keyed = true; }
        if (keyed) touch(db, c, 'couple');
        return ok({ couple: c.site.couple, site: c.site, slug: c.slug, closed: isClosed(c.site, now, tz), stats: stats(c), version: c.updatedAt,
          planner: plannerOf(c), reservations: c.reservations.map(r => Object.assign(publicReservation(r), { id: r.id, addedBy: r.addedBy || 'studio', createdAt: r.createdAt || null,
            links: Object.fromEntries(r.guests.map(g => [g.id, '/r/' + r.token + '?g=' + g.id + '.' + g.key])) })) }, keyed ? { save: true } : undefined);
      }
      if (sub === '/planner' && method === 'PUT') {
        const r = cleanPlanner(body.planner, c);
        if (r.error) return err(400, r.error);
        c.planner = r.planner; touch(db, c, 'couple');
        return ok({ ok: true, planner: r.planner, version: c.updatedAt }, { save: true });
      }
      // Couples can add families themselves, and remove the ones they added (even after that family answered).
      if (sub === '/reservations' && method === 'POST') {
        if (isClosed(c.site, now, tz)) return err(403, 'The RSVP deadline has passed. Please message Pixie Craft Studio to add guests.');
        if (c.reservations.filter(r => r.addedBy === 'couple').length >= 500) return err(400, 'That’s a lot of families! Please message Pixie Craft Studio to add more.');
        // "Per guest": each name becomes its own invitation with one seat.
        if (Array.isArray(body.people)) {
          const people = body.people.map(n => cleanText(n, 80)).filter(Boolean).slice(0, 100);
          if (!people.length) return err(400, 'Please add at least one guest name.');
          for (const name of people) c.reservations.push({ id: rid(8), token: rid(12), family: name, seats: 1, guests: [{ id: rid(8), name, status: 'awaiting' }],
            sample: false, addedBy: 'couple', perGuest: true, createdAt: now.toISOString(), submittedAt: null });
          touch(db, c, 'couple');
          return ok({ ok: true, added: people.length }, { save: true });
        }
        const r0 = cleanReservation(Object.assign({}, body, { guests: (body.guests || []).map(g => ({ name: g && g.name })) }));
        if (r0.error) return err(400, r0.error);
        if (r0.guests.length > r0.seats) return err(400, 'There are more guest names than reserved seats.');
        // The designated RSVP representative is the first name; only they answer for the group in the Fairy Garden design.
        c.reservations.push(Object.assign({ id: rid(8), token: rid(12) }, r0, { sample: false, addedBy: 'couple', createdAt: now.toISOString(), submittedAt: null },
          body.rep ? { repId: r0.guests[0].id } : {}));
        touch(db, c, 'couple');
        return ok({ ok: true }, { save: true });
      }
      // Couples can change the names and seats of families they added; answers already given stay with each guest.
      if ((m = sub.match(/^\/reservations\/([A-Za-z0-9]{1,20})$/)) && method === 'PUT') {
        const r = c.reservations.find(x => x.id === m[1]);
        if (!r) return err(404, 'This family was removed.');
        if (r.addedBy !== 'couple') return err(403, 'Only Pixie Craft Studio can change this family.');
        const old = new Map(r.guests.map(g => [g.id, g]));
        const r0 = cleanReservation({ family: body.family, seats: body.seats, guests: (body.guests || []).map(g => ({ id: g && g.id, name: g && g.name, status: g && old.has(g.id) ? old.get(g.id).status : 'awaiting' })) }, r);
        if (r0.error) return err(400, r0.error);
        if (r0.guests.length > r0.seats) return err(400, 'There are more guest names than reserved seats.');
        Object.assign(r, r0); touch(db, c, 'couple');
        return ok({ ok: true }, { save: true });
      }
      if ((m = sub.match(/^\/reservations\/([A-Za-z0-9]{1,20})$/)) && method === 'DELETE') {
        const r = c.reservations.find(x => x.id === m[1]);
        if (!r) return err(404, 'This family was already removed.');
        if (r.addedBy !== 'couple') return err(403, 'Only Pixie Craft Studio can remove this family.');
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
      if (ctx.setupCode && String(body.setupCode || '').trim() !== ctx.setupCode) return err(403, 'That setup code is not right. Please check it and try again.');
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
          palettes: PALETTES, fontGroups: FONT_GROUPS, headingFonts: HEADING_FONTS, bodyFonts: BODY_FONTS, scriptFonts: SCRIPT_FONTS, customFont: CUSTOM_FONT, effects: EFFECTS, backgrounds: BACKGROUNDS, rsvpDesigns: RSVP_DESIGNS });
      }
      if (method === 'POST' && path === '/api/board/clients') {
        const couple = cleanText(body.couple, 80);
        if (!couple) return err(400, 'Please type the host or celebrant name.');
        if (!validDate(body.weddingDate) || !validDate(body.deadline)) return err(400, 'Please choose the event date and the RSVP deadline.');
        if (body.deadline > body.weddingDate) return err(400, 'The RSVP deadline should be before the event date.');
        let coupleCode = null;
        if (body.code) { if (!/^\d{6}$/.test(body.code)) return err(400, 'The client’s code must be 6 numbers.'); coupleCode = await ctx.hashPin(String(body.code)); }
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
            if (!/^\d{6}$/.test(String(body.code))) return err(400, 'The client’s code must be 6 numbers.');
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
    DEFAULT_SITE, STATUSES, PALETTES, RSVP_DESIGNS, FLOOR_ITEMS, TABLE_SHAPES, cleanPlanner, HEADING_FONTS, BODY_FONTS, SCRIPT_FONTS, FONT_GROUPS, CUSTOM_FONT, BACKGROUNDS, VIDEO_REF, IMAGE_REF, DECOR_SCREENS, DECOR_HIDE, FAIRY_PARTS, cleanParts, CARD_PAGES, CARD_PARTS, CARD_REQUIRED, CARD_EXTRA_FONTS, CARD_ANIM_IN, CARD_ANIM_LOOP, CARD_SHAPES, CARD_TRANSITIONS, CARD_EFFECTS, cleanCards, SITE_PAGES, SITE_COLORS, cleanSite, EFFECTS, defaultData, upgradeData, upgradeSite, defaultTheme, groupRows,
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
  // Pictures of the Fairy Garden RSVP design (cut from the studio's design files).
  P.fairy = P.fairy || (n => (P.fairyAssets && P.fairyAssets[n]) || ((P.pages ? '' : '/') + n));
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
    'Poppins': 'wght@400;500;600;700', 'Homemade Apple': '', 'Cedarville Cursive': '', 'Fuzzy Bubbles': 'wght@400;700', 'Thasadith': 'wght@400;700', 'La Belle Aurore': '', 'Ballet': '', 'WindSong': '', 'Corinthia': '', 'Luxurious Script': '', 'Herr Von Muellerhoff': '',
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
  const loadedFonts = new Set();
  P.loadFonts = function (names) {
    const core = window.PixieCore, known = n => n in AXES || !!(core && core.FONT_GROUPS && Object.values(core.FONT_GROUPS).some(g => g.includes(n)));
    const fams = [...new Set(names)].filter(n => known(n) && !loadedFonts.has(n));
    // A few fonts per request, so one font Google can't find never stops the others from loading.
    for (let i = 0; i < fams.length; i += 12) {
      const part = fams.slice(i, i + 12);
      part.forEach(n => loadedFonts.add(n));
      const l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?' + part.map(n => 'family=' + n.replace(/ /g, '+') + (AXES[n] ? ':' + AXES[n] : '')).join('&') + '&display=swap';
      document.head.appendChild(l);
    }
  };
  // Font list options, grouped, each name written in its own font so the studio can see it before choosing.
  //   first: the group to show at the top. extra: [value, label] options above the groups (e.g. "Design font", an uploaded font).
  P.fontGroups = () => (window.PixieCore && window.PixieCore.FONT_GROUPS) || {};
  P.allFonts = () => Object.values(P.fontGroups()).flat();
  P.fontOptions = function (selected, first, extra) {
    const groups = Object.entries(P.fontGroups()).sort((a, b) => (b[0] === first) - (a[0] === first));
    const opt = (v, l) => `<option value="${P.esc(v)}" style="font-family:'${P.esc(P.fontFamily(v))}', serif;font-size:17px" ${selected === v ? 'selected' : ''}>${P.esc(l)}</option>`;
    return (extra || []).map(([v, l]) => v ? opt(v, l) : `<option value="" ${!selected ? 'selected' : ''}>${P.esc(l)}</option>`).join('')
      + groups.map(([g, list]) => `<optgroup label="${P.esc(g)}">${list.map(f => opt(f, f)).join('')}</optgroup>`).join('');
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

  // ---------- motion: entrance animations, scroll reveals and counting numbers ----------
  // Call P.motion(root, key) after each render. A new key (another page or tab) plays the entrance; the same key only
  // animates numbers that changed. Uses data attributes, never classes, so the "Edit website" selectors stay the same.
  const calmMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ENTER = ['.c-welcome', '.c-when', '.c-panel', '.c-tile', '.c-fam', '.a-login-card', '.b-client', '.a-stat', '.a-panel', '.a-tabs ~ * > section',
    '.b-hero', '.b-head', '.a-head', '.c-help'].join(',');
  const NUMBERS = '.c-tile > b, .a-stat-n';
  const lastKey = new WeakMap(), lastNums = new Map();
  let seen = null;
  function countTo(el, from, to) {
    if (from === to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = Math.min(1400, 500 + Math.abs(to - from) * 25);
    el.dataset.counting = '';
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else delete el.dataset.counting;
    };
    requestAnimationFrame(step);
  }
  P.motion = function (root, key) {
    if (!root || document.body.classList.contains('x-editing')) return;
    const fresh = lastKey.get(root) !== key;
    lastKey.set(root, key);
    const calm = calmMotion();
    // Numbers count up the first time, then roll from the old value to the new one when an RSVP comes in.
    root.querySelectorAll(NUMBERS).forEach((el, i) => {
      const to = parseInt(el.textContent, 10);
      if (isNaN(to)) return;
      const id = key + '#' + i, from = fresh ? 0 : (lastNums.has(id) ? lastNums.get(id) : to);
      lastNums.set(id, to);
      if (calm || from === to) return;
      el.textContent = from; countTo(el, from, to);
      if (!fresh) { el.dataset.bump = ''; setTimeout(() => delete el.dataset.bump, 900); }
    });
    if (!fresh || calm) return;
    root.dataset.mIn = '';
    setTimeout(() => { if (root.dataset.mIn === '') delete root.dataset.mIn; }, 1800);
    // Parts on screen rise in one after another; parts further down wait until they are scrolled to.
    if (seen) seen.disconnect();
    seen = window.IntersectionObserver ? new IntersectionObserver(list => list.forEach(en => {
      if (!en.isIntersecting) return;
      seen.unobserve(en.target); en.target.style.setProperty('--m-i', 0); en.target.dataset.anim = 'go';
      setTimeout(() => delete en.target.dataset.anim, 1200);
    }), { rootMargin: '0px 0px -8% 0px' }) : null;
    let n = 0;
    root.querySelectorAll(ENTER).forEach(el => {
      if (el.parentElement && el.parentElement.closest('[data-anim]') && !el.matches('.c-tile, .c-fam, .b-client, .a-stat')) return;
      const below = el.getBoundingClientRect().top > innerHeight * .92;
      if (below && seen) { el.dataset.anim = 'wait'; seen.observe(el); return; }
      el.style.setProperty('--m-i', Math.min(n++, 10)); el.dataset.anim = 'go';
      setTimeout(() => delete el.dataset.anim, 1200 + n * 70);
    });
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
  const PAGE_NAMES = { couple: 'Client’s view · all clients', board: 'Pixie’s RSVP Board' };
  const COLORS = [['pink', '--b-pink', 'Pink'], ['pinkDark', '--b-pink-dark', 'Deep pink'], ['cream', '--b-cream', 'Cream'],
    ['olive', '--b-olive', 'Olive'], ['sage', '--b-sage', 'Sage'], ['sand', '--b-sand', 'Sand'], ['yellow', '--b-yellow', 'Butter'], ['text', '', 'Text']];
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
    P.loadFonts(P.allFonts()); // so every name in the font lists shows in its own font
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
      if (!node) { U.toast(E.sel.el && E.sel.el.closest(NO_TEXT) ? 'These words come from each client’s guest list, so they can’t be retyped.' : 'Click right on the words you want to change.'); return; }
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
    const fontSel = (name, val) => `<select data-x="${name}" class="x-font-pick" style="${val ? `font-family:'${P.esc(val)}'` : ''}">${P.fontOptions(val || '', 'Elegant serif & display', [['', 'Design font']])}</select>`;
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
    const fontSel = (x, val, design) => `<select class="x-font" data-x="${x}" title="Font" style="${val ? `font-family:'${P.esc(val)}'` : ''}">${P.fontOptions(val || '', 'Script & calligraphy', design ? [['', 'Design font']] : [])}</select>`;
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
      U.toast(E.page === 'couple' ? 'Saved! Every client’s view now shows your changes.' : 'Saved!');
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

// Card Maker cards: draws a page the studio designed (text, pictures, shapes and the working parts) for guests,
// for the editor and for the small page thumbnails. The same drawing is used everywhere, so what the studio sees is what guests get.
(function () {
  'use strict';
  const P = window.PIXIE = window.PIXIE || {}, C = window.PixieCore;
  const esc = s => P.esc ? P.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const K = {};
  K.PAGES = [['notice', 'Kindly RSVP'], ['invite', 'Hello'], ['surprise', 'Surprise'], ['reservation', 'Seats'], ['change', 'Change of plans'], ['thanks', 'Thank you']];
  K.PAGE_HELP = {
    notice: 'The first card guests see.',
    invite: 'Guests type their name here to find their seats.',
    surprise: 'Shown to people in a group who aren’t the representative.',
    reservation: 'The representative switches each name on or off and sends the answer. Afterwards everyone sees it here.',
    change: 'Opens from “Change of Mind?”. A guest changes only their own answer.',
    thanks: 'Shown after an answer is sent.',
  };
  K.PART_LABELS = { next: 'Next button', namebox: 'Name box', find: 'Find button', guestlist: 'Guest list with switches', submit: 'Send button', recap: 'Answers summary', choices: 'Yes / No choices', save: 'Save button', link: 'Link button' };
  K.newId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), x => (x % 36).toString(36)).join('');
  const BTN = { font: 'Gilda Display', size: 13, color: '#fef9f5', fill: '#c79293', radius: 99 };
  K.partDefaults = function (kind, page) {
    const d = {
      next: Object.assign({ label: 'NEXT', w: 110, h: 28 }, BTN),
      find: Object.assign({ label: 'FIND MY SEAT', w: 130, h: 28 }, BTN),
      submit: Object.assign({ label: 'SUBMIT', label2: 'Change of Mind?', w: 150, h: 30 }, BTN),
      save: Object.assign({ label: 'Save My Answer', w: 160, h: 32 }, BTN),
      link: { label: 'Back to Invitation', font: 'Gilda Display', size: 14, color: '#4a5232', fill: 'transparent', radius: 99, w: 200, h: 26 },
      namebox: { ph: 'First Name Last Name', font: 'Gilda Display', size: 11, color: '#4a5232', fill: '#e6e1cf', radius: 8, w: 230, h: 28 },
      guestlist: { font: 'Fuzzy Bubbles', size: 16, color: '#4a5232', on: '#c79293', line: '#d9d2bd', w: 280, h: 170 },
      recap: { font: 'Gilda Display', size: 12.5, color: '#c4898b', line: '#d9d2bd', w: 290, h: 110 },
      choices: { yes: 'yes, i’ll be there!', no: 'sorry, i can’t make it!', font: 'Gilda Display', size: 16, color: '#4a5232', on: '#fef9f5', fill: '#e6e1cf', w: 240, h: 60 },
    }[kind];
    if (kind === 'next' && page === 'surprise') d.label = 'NEXT';
    return Object.assign({ type: 'part', kind }, d);
  };

  // {couple} {deadline} {date} {family} {seats} {rep} {name} {first} {coming} {total}
  K.fill = function (text, ctx) {
    const site = (ctx && ctx.site) || C.DEFAULT_SITE, r = ctx && ctx.r;
    let out = C.fill(text, Object.assign({ couple: '', deadline: '', weddingDate: '' }, site), r);
    const me = r && (r.guests.find(g => g.id === (ctx.who || r.repId)) || r.guests[0]);
    const going = r ? r.guests.filter(g => (ctx.answers || {})[g.id] === 'attending').length : 0;
    return out.replace(/\{name\}/g, me ? me.name : '').replace(/\{first\}/g, me ? (me.name || '').trim().split(/\s+/)[0] : '')
      .replace(/\{coming\}/g, String(going)).replace(/\{total\}/g, r ? String(r.guests.length) : '');
  };
  // Sample group for the editor and thumbnails.
  K.sample = () => ({ token: 'sample', family: 'The Martinez Family', seats: 3, repId: 'g1', rep: 'Maria Martinez', submittedAt: null,
    guests: [{ id: 'g1', name: 'Maria Martinez', status: 'attending' }, { id: 'g2', name: 'John Cua', status: 'attending' }, { id: 'g3', name: 'Coby Martinez', status: 'not_attending' }] });

  const u = v => `calc(${+v || 0} * var(--u))`;
  const FONT = f => `'${esc(P.fontFamily ? P.fontFamily(f) : f)}'`;
  const imgSrc = s => /^fairy-/.test(s) ? (P.fairy ? P.fairy(s) : '/' + s) : '';
  const SHAPE_PATH = {
    heart: 'M50 92 C20 70 2 52 2 30 C2 14 14 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C86 4 98 14 98 30 C98 52 80 70 50 92Z',
    star: 'M50 3 L61.8 36.6 L97.6 37.6 L69.1 59.4 L79.4 93.4 L50 73.2 L20.6 93.4 L30.9 59.4 L2.4 37.6 L38.2 36.6Z',
    arch: 'M1 99 V48 A49 47 0 0 1 99 48 V99 Z',
    blob: 'M50 3 C75 2 97 19 96 46 C95 73 78 97 50 97 C23 97 4 77 4 50 C4 23 25 4 50 3Z',
  };
  function textStyle(e) {
    const ec = e.ecolor || (e.effect === 'glow' ? '#fff3c4' : e.effect === 'outline' ? '#ffffff' : '#000000');
    const fx = { shadow: `text-shadow:${u(e.size * .05)} ${u(e.size * .05)} ${u(e.size * .12)} ${ec}66;`, glow: `text-shadow:0 0 ${u(e.size * .25)} ${ec},0 0 ${u(e.size * .5)} ${ec};`,
      outline: `-webkit-text-stroke:${u(Math.max(.6, e.size * .045))} ${ec};paint-order:stroke fill;`, lift: `text-shadow:0 ${u(e.size * .08)} ${u(e.size * .3)} rgba(0,0,0,.28);` }[e.effect] || '';
    return `font-family:${FONT(e.font)};font-size:${u(e.size)};color:${e.color};text-align:${e.align || 'center'};line-height:${e.lh || 1.25};`
      + (e.bold ? 'font-weight:700;' : '') + (e.italic ? 'font-style:italic;' : '') + (e.underline ? 'text-decoration:underline;' : '') + (e.upper ? 'text-transform:uppercase;' : '')
      + (e.ls ? `letter-spacing:${e.ls / 1000}em;` : '') + fx;
  }
  function partFont(e) {
    return `font-family:${FONT(e.font || 'Gilda Display')};font-size:${u(e.size || 13)};color:${e.color || '#4a5232'};` + (e.bold ? 'font-weight:700;' : '') + (e.italic ? 'font-style:italic;' : '') + (e.upper ? 'text-transform:uppercase;' : '');
  }
  function shapeHtml(e) {
    const stroke = e.sw ? `${u(e.sw)} solid ${e.stroke}` : '0';
    if (e.shape === 'rect' || e.shape === 'frame') return `<div class="c-shape" style="background:${e.shape === 'frame' ? 'transparent' : e.fill};border:${e.shape === 'frame' && !e.sw ? `${u(4)} solid ${e.stroke || '#4a5232'}` : stroke};border-radius:${u(e.radius || 0)}"></div>`;
    if (e.shape === 'circle') return `<div class="c-shape" style="background:${e.fill};border:${stroke};border-radius:50%"></div>`;
    if (e.shape === 'line') return `<div class="c-shape" style="background:${e.fill === 'transparent' ? (e.stroke || '#4a5232') : e.fill};border-radius:${u(e.radius || 0)}"></div>`;
    return `<svg class="c-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${SHAPE_PATH[e.shape]}" fill="${e.fill}" ${e.sw ? `stroke="${e.stroke}" vector-effect="non-scaling-stroke" style="stroke-width:${u(e.sw)}"` : ''}/></svg>`;
  }
  function imageHtml(e) {
    const c = e.crop || {}, fw = 1 - (c.l || 0) - (c.r || 0), fh = 1 - (c.t || 0) - (c.b || 0), a = e.adj || {};
    const filt = [a.b !== undefined && `brightness(${a.b}%)`, a.c !== undefined && `contrast(${a.c}%)`, a.s !== undefined && `saturate(${a.s}%)`, a.g && `grayscale(${a.g}%)`, a.bl && `blur(${u(a.bl)})`].filter(Boolean).join(' ');
    return `<div class="c-img" style="border-radius:${e.radius || 0}%;${e.bw ? `border:${u(e.bw)} solid ${e.bc};` : ''}${e.shadow ? 'box-shadow:0 6px 18px rgba(40,40,20,.28);' : ''}">`
      + `<img alt="" draggable="false" ${imgSrc(e.src) ? `src="${esc(imgSrc(e.src))}"` : `data-csrc="${esc(e.src)}"`} style="width:${100 / fw}%;height:${100 / fh}%;left:${-(c.l || 0) / fw * 100}%;top:${-(c.t || 0) / fh * 100}%;${filt ? `filter:${filt};` : ''}"></div>`;
  }
  function btn(e, label, act, ctx, extra) {
    const dis = ctx.mode !== 'guest' ? 'tabindex="-1"' : '';
    return `<button type="${extra === 'form' ? 'submit' : 'button'}" class="c-btn" ${extra === 'form' ? 'form="c-search"' : ''} ${act ? `data-act="${act}"` : ''} ${dis} ${ctx.busy && ctx.mode === 'guest' ? 'disabled' : ''}
      style="${partFont(e)}background:${e.fill || 'transparent'};border-radius:${u(e.radius || 0)}">${esc(K.fill(label, ctx))}</button>`;
  }
  function partHtml(e, page, ctx) {
    const r = ctx.r, live = ctx.mode === 'guest';
    switch (e.kind) {
      case 'next': {
        const act = page === 'surprise' ? (r && r.submittedAt ? 'f-viewonly' : 'f-again') : 'f-next';
        return btn(e, e.label || 'NEXT', live ? act : '', ctx);
      }
      case 'find': return btn(e, ctx.busy ? 'Finding…' : e.label || 'FIND MY SEAT', '', ctx, 'form');
      case 'namebox':
        return `<input class="c-input" ${live ? 'id="g-name" name="name" form="c-search" autocomplete="name" required' : 'tabindex="-1" readonly'} aria-label="Your first name and last name" placeholder="${esc(e.ph || '')}"
          style="${partFont(e)}background:${e.fill || '#fff'};border-radius:${u(e.radius || 0)}">`;
      case 'save':
        if (ctx.closed) return '';
        return btn(e, ctx.busy ? 'Saving…' : e.label || 'Save My Answer', live ? 'f-save' : '', ctx);
      case 'submit': {
        if (ctx.closed) return '';
        if (ctx.view) return btn(e, e.label2 || 'Change of Mind?', live ? 'f-mind' : '', ctx);
        return btn(e, ctx.busy ? 'Sending…' : e.label || 'SUBMIT', live ? 'f-submit' : '', ctx);
      }
      case 'link': {
        const link = ctx.theme && ctx.theme.invitationLink, label = esc(K.fill(e.label || 'Back to Invitation', ctx));
        const st = `style="${partFont(e)}background:${e.fill || 'transparent'};border-radius:${u(e.radius || 0)}"`;
        if (live && link) return `<a class="c-btn c-linkbtn" href="${esc(link)}" target="_top" rel="noopener" ${st}>${label}</a>`;
        return `<button type="button" class="c-btn c-linkbtn" ${live ? 'data-act="f-again"' : 'tabindex="-1"'} ${st}>${label}</button>`;
      }
      case 'guestlist': {
        const me = ctx.who || (r && r.repId), rows = (r ? r.guests : []).map(g => {
          const on = (ctx.answers || {})[g.id] === 'attending';
          return `<li class="c-row ${g.id === ctx.justAnswered ? 'is-just' : ''}"><span class="c-row-name">${g.id === me && live ? '<span class="c-you">You</span>' : ''}${esc(g.name)}</span>
            <button type="button" class="c-switch ${on ? 'is-on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(g.name)} is coming" ${live ? `data-act="f-toggle" data-g="${g.id}"` : 'tabindex="-1"'} ${ctx.closed || ctx.view ? 'disabled' : ''}><i></i></button></li>`;
        }).join('');
        const note = ctx.closed && live ? `<li class="c-note">The RSVP deadline (${esc(C.formatDeadline(ctx.site.deadline))}) has passed, so answers can no longer be changed here.</li>` : '';
        return `<ul class="c-list" style="${partFont(e)}--on:${e.on || '#c79293'};--line:${e.line || '#d9d2bd'}">${note}${rows}</ul>`;
      }
      case 'recap': {
        const gs = r ? r.guests : [], yes = gs.filter(g => (ctx.answers || {})[g.id] === 'attending'), no = gs.filter(g => (ctx.answers || {})[g.id] !== 'attending');
        const site = ctx.site || C.DEFAULT_SITE, item = (g, y) => `<li class="${y ? 'yes' : 'no'}"><span>${y ? '✓' : '✕'}</span><span>${esc(g.name)}</span><span>${esc(C.fill(y ? site.attendingLabel || 'Attending' : site.notAttendingLabel || 'Not attending', site))}</span></li>`;
        return `<div class="c-recap" style="${partFont(e)}--line:${e.line || '#d9d2bd'}"><p class="c-yay">${yes.length ? `Yay! ${yes.length} out of ${gs.length} ${yes.length === 1 ? 'is' : 'are'} coming!` : 'No one is coming? We’ll miss you!'}</p>
          <ul>${yes.map(g => item(g, true)).join('')}${no.map(g => item(g, false)).join('')}</ul></div>`;
      }
      case 'choices': {
        const me = r && (r.guests.find(g => g.id === (ctx.who || r.repId)) || r.guests[0]);
        const v = ctx.mine || (me && me.status === 'not_attending' ? 'not_attending' : 'attending');
        const opt = (val, label) => `<button type="button" class="c-opt" role="radio" aria-checked="${v === val}" ${live ? `data-act="f-pick" data-v="${val}"` : 'tabindex="-1"'} ${ctx.closed ? 'disabled' : ''}>
          <span class="c-tog ${v === val ? 'is-on' : ''}"><i></i></span><span>${esc(K.fill(label, ctx))}</span></button>`;
        return `<div class="c-opts" role="radiogroup" aria-label="${esc(me ? me.name : 'Your answer')}" style="${partFont(e)}--on:${e.on || '#fef9f5'};--off:${e.fill || '#e6e1cf'}">${opt('attending', e.yes || 'Yes')}${opt('not_attending', e.no || 'No')}</div>`;
      }
    }
    return '';
  }
  function elHtml(e, i, page, ctx) {
    const a = e.anim || {}, anim = ctx.mode !== 'thumb' && !ctx.still;
    const style = `left:${u(e.x)};top:${u(e.y)};width:${u(e.w)};${e.type === 'text' ? '' : `height:${u(e.h)};`}${e.rot ? `rotate:${e.rot}deg;` : ''}${e.op !== undefined && e.op !== 1 ? `opacity:${e.op};` : ''}z-index:${i + 1};`
      + (anim && (a.in || a.loop) ? `--ad:${a.delay || 0}s;--at:${a.dur || (a.in === 'wipe' ? 1.6 : 0.8)}s;` : '');
    const flip = e.flipX || e.flipY ? ` style="scale:${e.flipX ? -1 : 1} ${e.flipY ? -1 : 1}"` : '';
    let inner = '';
    if (e.type === 'text') inner = `<div class="c-text" style="${textStyle(e)}">${esc(K.fill(e.text, ctx))}</div>`;
    else if (e.type === 'image') inner = imageHtml(e);
    else if (e.type === 'shape') inner = shapeHtml(e);
    else if (e.type === 'part') inner = partHtml(e, page, ctx);
    return `<div class="c-el c-t-${e.type}${e.type === 'part' ? ' c-p-' + e.kind : ''}" data-el="${esc(e.id)}"${anim && a.in ? ` data-in="${a.in}"` : ''} style="${style}">`
      + `<div class="c-loop"${anim && a.loop ? ` data-loop="${a.loop}"` : ''}><div class="c-flip"${flip}>${inner}</div></div></div>`;
  }
  // One page. ctx: { mode: 'guest' | 'edit' | 'thumb', site, theme, r, answers, who, view, closed, busy, mine, still }
  K.page = function (cards, key, ctx) {
    const pg = cards && cards.pages && cards.pages[key];
    if (!pg) return '';
    const bg = pg.bg || {}, fit = bg.fit === 'stretch' ? '100% 100%' : bg.fit || 'cover';
    const bgi = bg.src ? (imgSrc(bg.src) ? `background-image:url('${esc(imgSrc(bg.src))}');` : '') : '';
    const style = `aspect-ratio:${pg.w} / ${pg.h};background-color:${bg.color || 'transparent'};${bgi}background-size:${fit};border-radius:${u(bg.radius || 0)};`;
    const form = key === 'invite' && ctx.mode === 'guest' ? '<form id="c-search" data-form="search" novalidate hidden></form>' : '';
    // The stage is the size box (a container), the page fills it: every size inside is design pixels × --u.
    return `<div class="c-stage${ctx.mode === 'guest' ? ' c-guest' : ''}" data-tr="${esc((cards.transition) || 'fade')}" style="--pw:${pg.w};--ph:${pg.h};${ctx.width ? `width:${ctx.width};` : ''}"><main class="c-page${bg.shadow ? ' c-shadow' : ''}${ctx.mode === 'edit' ? ' c-edit' : ''}${ctx.mode === 'thumb' ? ' c-thumb' : ''}" data-page="${key}" ${bg.src && !bgi ? `data-cbg="${esc(bg.src)}"` : ''} style="${style}">`
      + `${form}${pg.els.map((e, i) => thumbSafe(elHtml(e, i, key, ctx), ctx)).join('')}</main></div>`;
  };
  // Thumbnails sit inside buttons, and a button can't hold buttons, boxes or links: draw those as plain spans there.
  function thumbSafe(html, ctx) {
    if (ctx.mode !== 'thumb') return html;
    return html.replace(/<input ([^>]*?)placeholder="([^"]*)"([^>]*)>/g, '<span $1$3>$2</span>').replace(/<input [^>]*>/g, '<span class="c-input"></span>')
      .replace(/<(button|a)(\s)/g, '<span$2').replace(/<\/(button|a)>/g, '</span>');
  }
  // Pictures uploaded by the studio are fetched after the page is drawn.
  K.paint = function (root) {
    root.querySelectorAll('img[data-csrc]').forEach(async img => {
      const ref = img.dataset.csrc; img.removeAttribute('data-csrc');
      const s = await P.mediaUrl(ref).catch(() => null); if (s) img.src = s;
    });
    root.querySelectorAll('[data-cbg]').forEach(async el => {
      const ref = el.dataset.cbg; el.removeAttribute('data-cbg');
      const s = await P.mediaUrl(ref).catch(() => null); if (s) el.style.backgroundImage = `url("${s}")`;
    });
  };
  K.backdrop = function (cards) {
    const b = (cards && cards.backdrop) || {};
    return { color: b.color || '#f4efe2', src: b.src || null, blur: b.blur || 0 };
  };
  K.fonts = function (cards) {
    const out = new Set();
    for (const pg of Object.values((cards && cards.pages) || {})) for (const e of pg.els) if (e.font) out.add(e.font);
    for (const pg of Object.values((cards && cards.pages) || {})) for (const e of pg.els) if (e.type === 'part' && !e.font) out.add('Gilda Display');
    return [...out];
  };

  // ---------- ready-made starting points (Templates) ----------
  const T = (o, extra) => Object.assign({ id: K.newId(), rot: 0 }, o, extra || {});
  const tx = (text, x, y, w, size, font, color, more) => T(Object.assign({ type: 'text', text, x, y, w, h: size * 1.4, size, font, color, align: 'center' }, more || {}));
  const im = (src, x, y, w, h, more) => T(Object.assign({ type: 'image', src, x, y, w, h }, more || {}));
  const pt = (kind, page, x, y, more) => { const d = K.partDefaults(kind, page); return T(Object.assign(d, { x, y }, more || {})); };
  const ink = '#4a5232', text = '#4a5232', F = { script: 'Homemade Apple', hand: 'Fuzzy Bubbles', serif: 'Gilda Display', num: 'Cedarville Cursive' };
const D = k => C.DEFAULT_SITE[k] || '';
  K.templates = [
    { id: 'fairy', name: 'Fairy Garden', note: 'Your Fairy Garden pictures, ready to change.', make() {
      return { transition: 'fade', backdrop: { src: 'fairy-bg.jpg' }, pages: {
        notice: { w: 403, h: 536, bg: { src: 'fairy-card-rsvp.webp', fit: 'stretch' }, els: [
          im('fairy-t-kindly.webp', 132, 118, 155, 86, { anim: { in: 'wipe', dur: 1.4 } }),
          tx(D('fairySubtitle'), 114, 228, 187, 21.5, F.hand, ink, { anim: { in: 'rise', delay: .3 } }),
          tx(D('fairyMessage'), 114, 268, 187, 13.3, F.serif, text, { lh: 1.33, anim: { in: 'rise', delay: .45 } }),
          tx(D('fairyClosing'), 114, 372, 187, 13.3, F.serif, text, { anim: { in: 'rise', delay: .55 } }),
          pt('next', 'notice', 152, 405, { w: 100, h: 25, anim: { in: 'pop', delay: .7 } })] },
        invite: { w: 419, h: 556, bg: { src: 'fairy-card-name.webp', fit: 'stretch' }, els: [
          tx(D('fairyHello'), 90, 182, 233, 28, F.script, ink, { anim: { in: 'rise' } }),
          tx(D('fairyAsk'), 90, 228, 233, 19.9, F.hand, ink, { anim: { in: 'rise', delay: .1 } }),
          tx(D('fairyAskSub'), 90, 254, 233, 12.65, F.serif, text, { anim: { in: 'rise', delay: .2 } }),
          pt('namebox', 'invite', 90, 293, { ph: D('fairyPlaceholder'), size: 9.6, w: 233, h: 26, anim: { in: 'rise', delay: .3 } }),
          pt('find', 'invite', 144, 334, { w: 124, h: 25, size: 12.2, anim: { in: 'pop', delay: .45 } })] },
        surprise: { w: 448, h: 570, bg: { src: 'fairy-card-surprise.webp', fit: 'stretch' }, els: [
          tx(D('fairySurprise'), 168, 190, 220, 37, F.script, ink, { h: 60, anim: { in: 'pop' } }),
          tx(D('fairySurpriseSub'), 168, 254, 220, 19.4, F.hand, ink, { anim: { in: 'rise', delay: .15 } }),
          tx(D('fairySurpriseWait'), 186, 300, 185, 12.4, F.serif, text, { lh: 1.37, anim: { in: 'rise', delay: .3 } }),
          pt('next', 'surprise', 242, 390, { w: 72, h: 25.5, anim: { in: 'pop', delay: .45 } })] },
        reservation: { w: 520, h: 900, bg: { color: '#fff9f4', radius: 24, shadow: true }, els: [
          im('fairy-res-l1.webp', -6, -6, 190, 260), im('fairy-res-r1.webp', 336, -6, 190, 260),
          im('fairy-res-l3.webp', -6, 640, 190, 266), im('fairy-res-r3.webp', 336, 640, 190, 266),
          tx(D('fairyReserved'), 120, 120, 280, 27, F.hand, ink, { anim: { in: 'rise' } }),
          tx('{seats}', 120, 156, 280, 80, F.num, ink, { h: 100, anim: { in: 'pop', delay: .3 } }),
          tx(D('fairySeatsWord'), 120, 256, 280, 26.5, F.hand, ink, { anim: { in: 'rise', delay: .4 } }),
          tx(D('fairyForYou'), 120, 292, 280, 17, F.serif, ink, { anim: { in: 'rise', delay: .45 } }),
          tx(D('fairyCount'), 110, 326, 300, 12.7, F.serif, ink, { lh: 1.4 }),
          pt('guestlist', 'reservation', 120, 370, { w: 280, h: 170 }),
          tx(D('fairyCheck'), 110, 560, 300, 19.3, F.serif, ink),
          pt('recap', 'reservation', 115, 600, { w: 290, h: 120 }),
          pt('submit', 'reservation', 186, 742, { w: 150, h: 28 })] },
        change: { w: 406, h: 460, bg: { color: 'transparent' }, els: [
          im('fairy-env-back.webp', 0, 0, 406, 460),
          im('fairy-paper.webp', 25, -24, 356, 404, { anim: { in: 'rise', dur: 1.4, delay: .3 } }),
          tx(D('fairyChangeTitle'), 80, 14, 246, 26, F.script, ink, { h: 74, lh: 1.42, anim: { in: 'fade', delay: .8 } }),
          tx(D('fairyChangeHello').replace('{name}', '{first}'), 25, 92, 356, 19, F.serif, ink, { anim: { in: 'fade', delay: .9 } }),
          pt('choices', 'change', 102, 138, { w: 230, h: 56, anim: { in: 'fade', delay: 1 } }),
          pt('save', 'change', 126, 216, { w: 157, h: 32, size: 16.6, anim: { in: 'pop', delay: 1.1 } }),
          im('fairy-env-front.webp', 0, 0, 406, 460)] },
        thanks: { w: 520, h: 300, bg: { color: 'transparent' }, els: [
          im('fairy-t-thanks.webp', 75, 40, 370, 140, { anim: { in: 'wipe', dur: 2.6 } }),
          im('fairy-butterfly.webp', 40, 20, 40, 34, { op: .5, anim: { loop: 'float' } }), im('fairy-butterfly.webp', 440, 140, 32, 27, { op: .5, flipX: true, anim: { loop: 'float', delay: 1 } }),
          pt('link', 'thanks', 160, 200, { label: D('fairyBackLink'), w: 200, h: 26, anim: { in: 'fade', delay: 2.4 } })] },
      } };
    } },
    { id: 'blank', name: 'Simple cream', note: 'A plain card to start from scratch.', make() {
      const card = (h, els) => ({ w: 420, h, bg: { color: '#fffaf1', radius: 22, shadow: true }, els });
      const s = 'Cormorant Garamond', g = '#3f4a2e';
      return { transition: 'fade', backdrop: { color: '#efe8d8' }, pages: {
        notice: card(560, [tx('Kindly RSVP', 40, 120, 340, 40, 'Great Vibes', g, { anim: { in: 'fade' } }), tx('{couple}', 40, 200, 340, 20, s, g, { upper: true, ls: 120 }), tx('Please let us know if you can celebrate with us by {deadline}.', 60, 260, 300, 16, s, g, { lh: 1.4 }), pt('next', 'notice', 155, 400, { fill: g })]),
        invite: card(560, [tx('Hello!', 40, 140, 340, 44, 'Great Vibes', g), tx('What’s your name?', 40, 220, 340, 20, s, g), pt('namebox', 'invite', 95, 280, { fill: '#f1ebdc' }), pt('find', 'invite', 145, 330, { fill: g })]),
        surprise: card(560, [tx('Surprise!', 40, 150, 340, 44, 'Great Vibes', g), tx('{rep} is answering for your group. You can see the answer once it’s sent.', 60, 240, 300, 16, s, g, { lh: 1.4 }), pt('next', 'surprise', 155, 360, { fill: g })]),
        reservation: card(820, [tx('We saved', 40, 70, 340, 22, s, g, { upper: true, ls: 150 }), tx('{seats}', 40, 100, 340, 80, 'Great Vibes', g, { h: 100 }), tx('seats for {family}', 40, 200, 340, 18, s, g), pt('guestlist', 'reservation', 70, 250, { font: s, color: g, on: g }), pt('recap', 'reservation', 65, 450, { w: 290 }), pt('submit', 'reservation', 135, 650, { fill: g })]),
        change: card(480, [tx('A little change of plans?', 40, 70, 340, 34, 'Great Vibes', g), tx('Hello, {first}!', 40, 150, 340, 18, s, g), pt('choices', 'change', 90, 200, { color: g }), pt('save', 'change', 130, 300, { fill: g })]),
        thanks: card(360, [tx('Thank you!', 40, 110, 340, 54, 'Great Vibes', g, { anim: { in: 'wipe', dur: 1.8 } }), pt('link', 'thanks', 110, 230, { color: g })]),
      } };
    } },
  ];
  K.blankPage = key => K.templates[1].make().pages[key];

  window.PIXIE.cards = K;
})();

// Card Maker: the studio makes its own RSVP cards, Canva-style (jrick 2026-11-04).
// Pages (one per guest screen) → elements: text, pictures, shapes and the working parts (name box, buttons, guest list...).
// Opened full-screen from the board; the board saves what comes back. Studio only: couples and guests never get here.
(function () {
  'use strict';
  const P = window.PIXIE, C = window.PixieCore, esc = P.esc;
  const K = () => P.cards;
  const U = () => window.PixieUI;
  const SWATCHES = ['#ffffff', '#fffaf1', '#f4efe2', '#e6e1cf', '#fef9f5', '#f6d9e4', '#e8b4c0', '#c79293', '#c27390', '#a2454f', '#4a5232', '#3f4a2e', '#7f8f5a', '#b9c49a',
    '#d8c08a', '#b08d57', '#8b6f4e', '#5b5547', '#2d2a26', '#000000', '#cfe0f0', '#9fb7d6', '#b7a3d0', 'transparent'];
  const ANIM_IN = [['none', 'None'], ['fade', 'Fade'], ['rise', 'Rise'], ['drop', 'Drop'], ['pop', 'Pop'], ['zoom', 'Zoom out'], ['left', 'Slide from left'], ['right', 'Slide from right'], ['spin', 'Spin in'], ['blur', 'Soft focus'], ['wipe', 'Write on']];
  const ANIM_LOOP = [['none', 'None'], ['float', 'Float'], ['sway', 'Sway'], ['pulse', 'Pulse'], ['twinkle', 'Twinkle'], ['spin', 'Turn around']];
  const TRANSITIONS = [['fade', 'Fade'], ['slide', 'Slide'], ['zoom', 'Zoom'], ['rise', 'Rise'], ['flip', 'Flip'], ['none', 'None']];
  const EFFECTS = [['none', 'None'], ['shadow', 'Shadow'], ['lift', 'Lift'], ['glow', 'Glow'], ['outline', 'Outline']];
  const SHAPES = [['rect', 'Square'], ['rrect', 'Rounded'], ['circle', 'Circle'], ['line', 'Line'], ['heart', 'Heart'], ['star', 'Star'], ['arch', 'Arch'], ['blob', 'Blob'], ['frame', 'Frame']];
  const BUILTIN = [['fairy-butterfly.webp', 'Butterfly'], ['fairy-tulip.webp', 'Tulip'], ['fairy-res-l1.webp', 'Flowers left'], ['fairy-res-r1.webp', 'Flowers right'], ['fairy-res-l3.webp', 'Flowers low left'],
    ['fairy-res-r3.webp', 'Flowers low right'], ['fairy-t-kindly.webp', '“Kindly RSVP!” lettering'], ['fairy-t-change.webp', '“Change of Plans” lettering'], ['fairy-t-thanks.webp', '“Thank You!” lettering'],
    ['fairy-card-rsvp.webp', 'Lily card'], ['fairy-card-name.webp', 'Curtain card'], ['fairy-card-surprise.webp', 'Surprise card'], ['fairy-paper.webp', 'Pink paper'], ['fairy-env-back.webp', 'Envelope back'], ['fairy-env-front.webp', 'Envelope front']];
  const PAGE_SIZES = [['Card (portrait)', 420, 560], ['Tall card', 420, 640], ['Square', 500, 500], ['Phone story', 360, 640], ['Wide card', 640, 460], ['Long page', 520, 900]];
  const TEXT_PRESETS = [
    ['Add a heading', { text: 'Add a heading', size: 40, font: 'Great Vibes', w: 320 }],
    ['Add a subheading', { text: 'Add a subheading', size: 22, font: 'Cormorant Garamond', w: 300, bold: true }],
    ['Add a little bit of body text', { text: 'Add a little bit of body text', size: 14, font: 'Gilda Display', w: 260 }],
  ];
  const COMBOS = [
    ['Kindly RSVP!', { size: 36, font: 'Homemade Apple', w: 300 }], ['Save the Date', { size: 44, font: 'Great Vibes', w: 320 }],
    ['YOU’RE INVITED', { size: 20, font: 'Cinzel', w: 300, ls: 200 }], ['with love', { size: 30, font: 'Parisienne', w: 220 }],
    ['Hello, {first}!', { size: 22, font: 'Fuzzy Bubbles', w: 260 }], ['{seats} seats for you', { size: 24, font: 'Cormorant Garamond', w: 300, italic: true }],
  ];
  const PLACEHOLDERS = [['{couple}', 'Client name'], ['{date}', 'Event date'], ['{deadline}', 'RSVP deadline'], ['{family}', 'Group name'], ['{seats}', 'Number of seats'],
    ['{rep}', 'Representative'], ['{name}', 'Guest’s full name'], ['{first}', 'Guest’s first name'], ['{coming}', 'How many are coming'], ['{total}', 'How many in the group']];

  let S = null; // the open editor
  const clone = o => JSON.parse(JSON.stringify(o));
  const pg = () => S.cards.pages[S.page];
  const byId = id => pg().els.find(e => e.id === id);
  const sel = () => S.sel.map(byId).filter(Boolean);
  const one = () => S.sel.length === 1 ? byId(S.sel[0]) : null;
  const required = (e) => e && e.type === 'part' && (C.CARD_REQUIRED[S.page] || []).includes(e.kind);
  const r1 = v => Math.round(v * 10) / 10;

  // ---------- history ----------
  function remember(key) {
    const now = Date.now();
    if (key && S.lastKey === key && now - S.lastAt < 800) { S.lastAt = now; return; }
    S.lastKey = key; S.lastAt = now;
    S.undo.push(JSON.stringify(S.cards)); if (S.undo.length > 80) S.undo.shift();
    S.redo = []; S.dirty = true;
  }
  function undo(back) {
    const from = back ? S.undo : S.redo, to = back ? S.redo : S.undo;
    if (!from.length) return;
    to.push(JSON.stringify(S.cards)); S.cards = JSON.parse(from.pop()); S.lastKey = null; S.dirty = true;
    S.sel = S.sel.filter(id => byId(id)); S.crop = null;
    draw();
  }

  // ---------- open / close ----------
  P.cardMaker = {
    open(opts) {
      if (S) return;
      const cards = opts.cards && opts.cards.pages ? clone(opts.cards) : null;
      S = { opts, cards: cards || K().templates[0].make(), page: K().PAGES.some(x => x[0] === opts.page) ? opts.page : 'notice', sel: [], zoom: null, panel: cards ? 'elements' : 'templates', undo: [], redo: [], dirty: !cards,
        use: opts.theme.rsvpDesign === 'custom' || !cards, fontQuery: '', clip: null, crop: null, preview: null };
      for (const [k] of K().PAGES) if (!S.cards.pages[k]) S.cards.pages[k] = K().blankPage(k);
      const root = document.createElement('div');
      root.className = 'cm'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Card Maker');
      document.body.appendChild(root); document.body.classList.add('cm-open');
      S.root = root;
      root.addEventListener('pointerdown', onPointerDown);
      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      root.addEventListener('change', onInput);
      root.addEventListener('dblclick', onDblClick);
      root.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKey);
      window.addEventListener('resize', fitZoom);
      window.addEventListener('beforeunload', onLeave);
      P.loadFonts(K().fonts(S.cards));
      layout(); fitZoom();
      if (!cards) U().toast('Started from your Fairy Garden pictures. Pick another template on the left, or change anything you like.');
    },
    isOpen: () => !!S,
  };
  // Ctrl + mouse wheel (or a pinch on a touchpad) zooms the card.
  function onWheel(ev) {
    if (!S || !(ev.ctrlKey || ev.metaKey) || !$('wrap').contains(ev.target)) return;
    ev.preventDefault();
    S.zoomSet = true; S.zoom = Math.max(0.15, Math.min(4, (S.zoom || 1) * Math.exp(-ev.deltaY * 0.0025)));
    paintCanvas(); paintTop();
  }
  function onLeave(e) { if (S && S.dirty) { e.preventDefault(); e.returnValue = ''; } }
  async function close(force) {
    if (!force && S.dirty && !(await U().confirm({ title: 'Leave without saving?', message: 'Your card changes aren’t saved yet. If you leave now, they will be lost.', yes: 'Leave without saving', no: 'Stay here' }))) return;
    window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fitZoom); window.removeEventListener('beforeunload', onLeave);
    S.root.remove(); document.body.classList.remove('cm-open');
    const done = S.opts.onClose; S = null;
    if (done) done();
  }
  async function save() {
    if (S.busy) return;
    if (S.editing) stopTextEdit();
    S.busy = true; paintTop();
    const ok = await S.opts.onSave(clone(S.cards), S.use).catch(err => { U().toast(err.message, 'error'); return false; });
    if (!S) return;
    S.busy = false;
    if (ok) { S.dirty = false; U().toast(S.use ? 'Your cards are saved! Guests see them now.' : 'Your cards are saved.'); }
    paintTop();
  }

  // ---------- layout ----------
  function layout() {
    S.root.innerHTML = `
      <header class="cm-top" data-region="top"></header>
      <div class="cm-body">
        <nav class="cm-rail" aria-label="Tools">${[['templates', 'Templates', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'], ['elements', 'Elements', 'M12 3l3 6 6 .9-4.5 4.3 1 6.3L12 17.6 6.5 20.5l1-6.3L3 9.9 9 9z'],
          ['text', 'Text', 'M5 5h14v3h-2V7h-4v11h2v2H9v-2h2V7H7v1H5z'], ['uploads', 'Uploads', 'M12 4l5 5h-3v6h-4V9H7zM5 18h14v2H5z'], ['background', 'Background', 'M4 5h16v14H4zM6 15l4-4 3 3 2-2 3 3'],
          ['parts', 'Working parts', 'M4 6h16v4H4zM4 14h10v4H4z'], ['layers', 'Layers', 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5']].map(([k, l, d]) =>
          `<button type="button" data-cm="panel" data-k="${k}" aria-pressed="${S.panel === k}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg><span>${l}</span></button>`).join('')}</nav>
        <aside class="cm-panel" data-region="panel"></aside>
        <section class="cm-main">
          <div class="cm-toolbar" data-region="toolbar"></div>
          <div class="cm-canvas-wrap" data-region="wrap"><div class="cm-canvas" data-region="canvas"></div></div>
          <footer class="cm-pages" data-region="pages"></footer>
        </section>
      </div>
      <div class="cm-pop" data-region="pop" hidden></div>`;
    draw();
  }
  const $ = r => S.root.querySelector(`[data-region="${r}"]`);
  function draw() { paintTop(); paintPanel(); paintCanvas(); paintToolbar(); paintPages(); }
  function changed(key, opts) {
    // After any edit: redraw the canvas, the toolbar values and the page thumbnail.
    S.dirty = true;
    paintCanvas(); paintTop();
    if (!opts || opts.toolbar !== false) paintToolbar();
    if (S.panel === 'layers' || S.panel === 'parts') paintPanel();
    clearTimeout(S.thumbT); S.thumbT = setTimeout(() => { if (S) paintPages(); }, 250);
  }
  function paintTop() {
    const t = $('top'); if (!t) return;
    t.innerHTML = `<button type="button" class="cm-tbtn" data-cm="close">‹ Board</button>
      <span class="cm-name">Card Maker <small>${esc(S.opts.client.couple)}</small></span>
      <span class="cm-sp"></span>
      <span class="cm-seg"><button type="button" data-cm="undo" ${S.undo.length ? '' : 'disabled'} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button><button type="button" data-cm="redo" ${S.redo.length ? '' : 'disabled'} title="Redo (Ctrl+Y)" aria-label="Redo">↷</button></span>
      <span class="cm-seg cm-zoom"><button type="button" data-cm="zoom" data-d="-1" aria-label="Zoom out">−</button><span>${Math.round((S.zoom || 1) * 100)}%</span><button type="button" data-cm="zoom" data-d="1" aria-label="Zoom in">+</button><button type="button" data-cm="zoom" data-d="0">Fit</button></span>
      <span class="cm-sp"></span>
      <label class="cm-use" title="When on, guests see these cards instead of the Classic or Fairy Garden design."><input type="checkbox" data-cm="use" ${S.use ? 'checked' : ''}><span>Guests see these cards</span></label>
      <button type="button" class="cm-tbtn is-icon" data-cm="help" data-pop="1" title="Keyboard shortcuts" aria-label="Keyboard shortcuts">⌨</button>
      <button type="button" class="cm-tbtn" data-cm="preview">▶ Preview</button>
      <button type="button" class="cm-save ${S.busy ? '' : S.dirty ? 'is-dirty' : 'is-saved'}" data-cm="save" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Saving…' : S.dirty ? 'Save' : 'Saved ✓'}</button>`;
  }

  // ---------- canvas ----------
  function fitZoom() {
    if (!S) return;
    const w = $('wrap'); if (!w) return;
    const p = pg(), aw = w.clientWidth - 100, ah = w.clientHeight - 140;
    S.fit = Math.max(0.15, Math.min(2, aw / p.w, ah / p.h));
    if (!S.zoomSet) S.zoom = S.fit;
    paintCanvas(); paintTop();
  }
  function ctx(mode) {
    const r = K().sample();
    return { mode: mode || 'edit', site: S.opts.site, theme: Object.assign({}, S.opts.theme, { cards: S.cards }), r, answers: { g1: 'attending', g2: 'attending', g3: 'not_attending' }, who: 'g1', view: false };
  }
  function paintCanvas() {
    const cv = $('canvas'); if (!cv) return;
    const p = pg(), z = S.zoom || 1;
    const editing = S.editing && byId(S.editing);
    cv.style.width = p.w * z + 'px'; cv.style.height = p.h * z + 'px'; cv.style.background = K().backdrop(S.cards).color || '';
    const c = Object.assign(ctx('edit'), { width: p.w * z + 'px' });
    cv.innerHTML = K().page(S.cards, S.page, c) + '<div class="cm-over" data-region="over"></div>';
    if (editing) startTextEdit(editing.id, true);
    K().paint(cv);
    paintOver();
  }
  // Selection boxes, handles, snap guides, crop frame.
  function paintOver(guides) {
    const o = $('over'); if (!o) return;
    const z = S.zoom || 1;
    if (S.crop) return paintCrop(o, z);
    const items = sel();
    const box = (e, cls) => `<div class="cm-box ${cls}" data-box="${esc(e.id)}" style="left:${e.x * z}px;top:${e.y * z}px;width:${e.w * z}px;height:${boxH(e) * z}px;rotate:${e.rot || 0}deg">`;
    let html = '';
    if (items.length === 1 && !S.editing) {
      const e = items[0];
      html += box(e, 'is-one' + (e.lock ? ' is-locked' : '')) + (e.lock ? '' : handlesFor(e).map(h => `<span class="cm-h cm-h-${h}" data-h="${h}"></span>`).join('') + '<span class="cm-h cm-h-rot" data-h="rot" title="Turn">⟳</span>') + '</div>';
    } else if (items.length > 1) {
      html += items.map(e => box(e, 'is-multi') + '</div>').join('');
    }
    if (S.marquee) { const m = S.marquee; html += `<div class="cm-marquee" style="left:${Math.min(m.x0, m.x1) * z}px;top:${Math.min(m.y0, m.y1) * z}px;width:${Math.abs(m.x1 - m.x0) * z}px;height:${Math.abs(m.y1 - m.y0) * z}px"></div>`; }
    if (S.badge && items.length) {
      const l = Math.min(...items.map(e => e.x)), r = Math.max(...items.map(e => e.x + e.w)), b = Math.max(...items.map(e => e.y + boxH(e)));
      html += `<div class="cm-badge" style="left:${(l + r) / 2 * z}px;top:${b * z + (S.badge.rot ? 52 : 12)}px">${esc(S.badge.text)}</div>`;
    }
    if (guides) html += guides.map(g => g.v !== undefined ? `<div class="cm-guide cm-gv" style="left:${g.v * z}px"></div>` : `<div class="cm-guide cm-gh" style="top:${g.h * z}px"></div>`).join('');
    o.innerHTML = html;
  }
  function handlesFor(e) {
    if (e.type === 'text') return ['nw', 'ne', 'sw', 'se', 'w', 'e'];
    if (e.type === 'image') return ['nw', 'ne', 'sw', 'se'];
    return ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
  }
  // Text boxes grow with their words: their height is measured on the canvas.
  function boxH(e) {
    if (e.type !== 'text') return e.h;
    const n = S.root.querySelector(`.cm-canvas .c-el[data-el="${CSS.escape(e.id)}"]`);
    if (n) { const h = n.offsetHeight / (S.zoom || 1); if (h > 0) { e.h = r1(h); return h; } }
    return e.h;
  }
  // Pointer position in page pixels.
  function pagePt(ev) {
    const r = $('canvas').getBoundingClientRect(), z = S.zoom || 1;
    return { x: (ev.clientX - r.left) / z, y: (ev.clientY - r.top) / z };
  }

  function onPointerDown(ev) {
    if (!S || ev.button > 0) return;
    if (!ev.target.closest('[data-region="pop"]') && !ev.target.closest('[data-pop]')) hidePop();
    if (S.preview) return;
    const cv = $('canvas'), wrap = $('wrap');
    if (!wrap.contains(ev.target)) return;
    if (S.editing) { if (ev.target.closest(`.c-el[data-el="${CSS.escape(S.editing)}"]`)) return; stopTextEdit(); }
    if (S.crop) return cropDown(ev);
    const h = ev.target.closest('[data-h]');
    if (h) { ev.preventDefault(); return handleDrag(ev, h.dataset.h); }
    const n = ev.target.closest('.c-el');
    let id = n ? n.dataset.el : null;
    // Clicking inside the selected element's box keeps it (even where it has see-through parts).
    if (S.sel.length === 1 && cv.contains(ev.target)) {
      const e = one(), p = pagePt(ev);
      if (e && p.x >= e.x && p.x <= e.x + e.w && p.y >= e.y && p.y <= e.y + boxH(e) && !(n && n.dataset.el !== e.id && byId(n.dataset.el) && pg().els.indexOf(byId(n.dataset.el)) > pg().els.indexOf(e))) id = e.id;
    }
    if (!id) {
      if (!ev.shiftKey) S.sel = [];
      const p = pagePt(ev);
      S.marquee = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      const move = m => { const q = pagePt(m); S.marquee.x1 = q.x; S.marquee.y1 = q.y; paintOver(); };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        if (!S) return;
        const m = S.marquee; S.marquee = null;
        const l = Math.min(m.x0, m.x1), r = Math.max(m.x0, m.x1), t = Math.min(m.y0, m.y1), b = Math.max(m.y0, m.y1);
        if (r - l > 4 || b - t > 4) S.sel = pg().els.filter(e => e.x < r && e.x + e.w > l && e.y < b && e.y + boxH(e) > t && !e.lock).map(e => e.id);
        paintOver(); paintToolbar(); if (S.panel === 'layers') paintPanel();
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
      paintOver(); paintToolbar(); if (S.panel === 'layers') paintPanel();
      return;
    }
    ev.preventDefault();
    if (ev.shiftKey) { S.sel = S.sel.includes(id) ? S.sel.filter(x => x !== id) : S.sel.concat(id); paintOver(); paintToolbar(); return; }
    if (!S.sel.includes(id)) { S.sel = [id]; paintOver(); paintToolbar(); if (S.panel === 'layers') paintPanel(); }
    moveDrag(ev);
  }
  // Drag to move, with snapping to the page middle and edges and to other elements (hold Alt to move freely).
  function moveDrag(ev) {
    const items = sel().filter(e => !e.lock); if (!items.length) return;
    const p0 = pagePt(ev), start = items.map(e => ({ e, x: e.x, y: e.y, h: boxH(e) })), z = S.zoom || 1;
    const others = pg().els.filter(e => !S.sel.includes(e.id));
    const p = pg(), xs = [0, p.w / 2, p.w], ys = [0, p.h / 2, p.h];
    for (const o of others) { const h = boxH(o); xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + h / 2, o.y + h); }
    let moved = false;
    const move = m => {
      const q = pagePt(m); let dx = q.x - p0.x, dy = q.y - p0.y;
      if (!moved && Math.hypot(dx * z, dy * z) < 3) return;
      if (!moved) { remember(); moved = true; }
      const l = Math.min(...start.map(s => s.x)) + dx, t = Math.min(...start.map(s => s.y)) + dy;
      const r = Math.max(...start.map(s => s.x + s.e.w)) + dx, b = Math.max(...start.map(s => s.y + s.h)) + dy;
      const guides = [], snap = 6 / z;
      if (!m.altKey) {
        let bx = null, by = null;
        for (const gx of xs) for (const v of [l, (l + r) / 2, r]) { const d = gx - v; if (Math.abs(d) < snap && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, g: gx }; }
        for (const gy of ys) for (const v of [t, (t + b) / 2, b]) { const d = gy - v; if (Math.abs(d) < snap && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, g: gy }; }
        if (bx) { dx += bx.d; guides.push({ v: bx.g }); }
        if (by) { dy += by.d; guides.push({ h: by.g }); }
      }
      S.badge = { text: `X ${Math.round(l + dx)}  ·  Y ${Math.round(t + dy)}` };
      for (const s of start) {
        s.e.x = r1(s.x + dx); s.e.y = r1(s.y + dy);
        const n = S.root.querySelector(`.cm-canvas .c-el[data-el="${CSS.escape(s.e.id)}"]`);
        if (n) { n.style.left = `calc(${s.e.x} * var(--u))`; n.style.top = `calc(${s.e.y} * var(--u))`; }
      }
      paintOver(guides);
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      if (!S) return;
      S.badge = null;
      if (moved) changed(); else paintOver();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  // Corner dots resize (pictures keep their shape; text grows its letters), side dots stretch, the round dot turns.
  function handleDrag(ev, h) {
    const e = one(); if (!e || e.lock) return;
    remember();
    const o = { x: e.x, y: e.y, w: e.w, h: boxH(e), size: e.size, rot: e.rot || 0 };
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, rad = o.rot * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    const p0 = pagePt(ev);
    const move = m => {
      const q = pagePt(m);
      if (h === 'rot') {
        let a = Math.atan2(q.y - cy, q.x - cx) * 180 / Math.PI + 90;
        while (a > 180) a -= 360; while (a < -180) a += 360;
        if (!m.shiftKey) for (const s of [-180, -135, -90, -45, 0, 45, 90, 135, 180]) if (Math.abs(a - s) < 5) a = s;
        e.rot = Math.round(a) || undefined;
        S.badge = { text: `${e.rot || 0}°`, rot: true };
      } else {
        // pointer movement in the element's own (unturned) directions
        const dxs = q.x - p0.x, dys = q.y - p0.y, dx = dxs * cos + dys * sin, dy = -dxs * sin + dys * cos;
        let w = o.w, hh = o.h;
        if (h.includes('e')) w = o.w + dx; if (h.includes('w')) w = o.w - dx;
        if (h.includes('s')) hh = o.h + dy; if (h.includes('n')) hh = o.h - dy;
        const corner = h.length === 2;
        const keep = corner && (e.type === 'image' || e.type === 'text' || m.shiftKey);
        if (keep) { const k = Math.max(w / o.w, hh / o.h); w = o.w * k; hh = o.h * k; }
        w = Math.max(8, w); hh = Math.max(3, hh);
        if (e.type === 'text') { if (corner) e.size = r1(Math.max(2, o.size * w / o.w)); hh = o.h * (corner ? w / o.w : 1); }
        // keep the opposite corner or side where it was (in turned space)
        const ax = h.includes('w') ? 1 : h.includes('e') ? -1 : 0, ay = h.includes('n') ? 1 : h.includes('s') ? -1 : 0;
        const sx = -ax * (w - o.w) / 2, sy = -ay * (hh - o.h) / 2;
        const ncx = cx + sx * cos - sy * sin, ncy = cy + sx * sin + sy * cos;
        e.w = r1(w); e.h = r1(hh); e.x = r1(ncx - w / 2); e.y = r1(ncy - hh / 2);
        S.badge = { text: e.type === 'text' && corner ? `${Math.round(e.w)} wide  ·  text ${r1(e.size)}` : `${Math.round(e.w)} × ${Math.round(hh)}` };
      }
      paintCanvas();
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (S) { S.badge = null; changed(); } };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }

  // ---------- text editing on the canvas ----------
  function onDblClick(ev) {
    if (!S || S.preview) return;
    const n = ev.target.closest('.cm-canvas .c-el'); if (!n) return;
    const e = byId(n.dataset.el);
    if (e && e.type === 'text' && !e.lock) { S.sel = [e.id]; startTextEdit(e.id); }
    if (e && e.type === 'image') { S.sel = [e.id]; startCrop(); }
  }
  function startTextEdit(id, again) {
    const e = byId(id), n = S.root.querySelector(`.cm-canvas .c-el[data-el="${CSS.escape(id)}"] .c-text`); if (!e || !n) return;
    if (!again) remember();
    S.editing = id;
    n.textContent = e.text;
    n.contentEditable = 'plaintext-only';
    if (n.contentEditable !== 'plaintext-only') n.contentEditable = 'true';
    n.classList.add('cm-editing');
    n.addEventListener('input', () => { e.text = n.innerText.replace(/\n$/, ''); });
    n.addEventListener('keydown', k => { if (k.key === 'Escape') { k.preventDefault(); stopTextEdit(); } k.stopPropagation(); });
    if (!again) {
      n.focus();
      const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      paintOver(); paintToolbar();
    }
  }
  function stopTextEdit() {
    if (!S.editing) return;
    const e = byId(S.editing); S.editing = null;
    if (e && !e.text.trim()) { pg().els = pg().els.filter(x => x !== e); S.sel = []; }
    changed();
  }

  // ---------- crop ----------
  function startCrop() {
    const e = one(); if (!e || e.type !== 'image' || e.lock) return;
    hidePop();
    const c = Object.assign({ l: 0, t: 0, r: 0, b: 0 }, e.crop), fw = 1 - c.l - c.r, fh = 1 - c.t - c.b, W = e.w / fw, H = e.h / fh;
    remember();
    S.crop = { id: e.id, full: { x: e.x - c.l * W, y: e.y - c.t * H, w: W, h: H }, box: { l: e.x, t: e.y, r: e.x + e.w, b: e.y + e.h }, rot: e.rot || 0 };
    e.rot = undefined; paintCanvas(); paintToolbar();
  }
  function paintCrop(o, z) {
    const c = S.crop, f = c.full, b = c.box;
    const src = S.root.querySelector(`.cm-canvas .c-el[data-el="${CSS.escape(c.id)}"] img`);
    o.innerHTML = `<div class="cm-crop-ghost" style="left:${f.x * z}px;top:${f.y * z}px;width:${f.w * z}px;height:${f.h * z}px">${src && src.src ? `<img alt="" src="${esc(src.src)}">` : ''}</div>
      <div class="cm-crop" data-crop="move" style="left:${b.l * z}px;top:${b.t * z}px;width:${(b.r - b.l) * z}px;height:${(b.b - b.t) * z}px">
        ${src && src.src ? `<span class="cm-crop-in"><img alt="" src="${esc(src.src)}" style="left:${(f.x - b.l) * z}px;top:${(f.y - b.t) * z}px;width:${f.w * z}px;height:${f.h * z}px"></span>` : ''}
        ${['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map(h => `<span class="cm-ch cm-h-${h}" data-crop="${h}"></span>`).join('')}</div>`;
    const el = S.root.querySelector(`.cm-canvas .c-el[data-el="${CSS.escape(c.id)}"]`); if (el) el.style.visibility = 'hidden';
  }
  function cropDown(ev) {
    const hnd = ev.target.closest('[data-crop]');
    if (!hnd) { finishCrop(true); return; }
    ev.preventDefault();
    const c = S.crop, f = c.full, b0 = Object.assign({}, c.box), p0 = pagePt(ev), k = hnd.dataset.crop, min = 10;
    const move = m => {
      const q = pagePt(m), dx = q.x - p0.x, dy = q.y - p0.y, b = c.box;
      if (k === 'move') {
        const w = b0.r - b0.l, h = b0.b - b0.t;
        b.l = Math.min(Math.max(f.x, b0.l + dx), f.x + f.w - w); b.t = Math.min(Math.max(f.y, b0.t + dy), f.y + f.h - h); b.r = b.l + w; b.b = b.t + h;
      } else {
        if (k.includes('w')) b.l = Math.min(Math.max(f.x, b0.l + dx), b.r - min);
        if (k.includes('e')) b.r = Math.max(Math.min(f.x + f.w, b0.r + dx), b.l + min);
        if (k.includes('n')) b.t = Math.min(Math.max(f.y, b0.t + dy), b.b - min);
        if (k.includes('s')) b.b = Math.max(Math.min(f.y + f.h, b0.b + dy), b.t + min);
      }
      paintOver();
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  function finishCrop(apply) {
    const c = S.crop; if (!c) return;
    const e = byId(c.id); S.crop = null;
    if (e && apply) {
      const f = c.full, b = c.box;
      const crop = { l: (b.l - f.x) / f.w, t: (b.t - f.y) / f.h, r: (f.x + f.w - b.r) / f.w, b: (f.y + f.h - b.b) / f.h };
      for (const k in crop) crop[k] = Math.max(0, Math.round(crop[k] * 1000) / 1000);
      if (crop.l || crop.t || crop.r || crop.b) e.crop = crop; else delete e.crop;
      e.x = r1(b.l); e.y = r1(b.t); e.w = r1(b.r - b.l); e.h = r1(b.b - b.t);
    }
    if (e) e.rot = c.rot || undefined;
    if (!apply) S.undo.pop();
    changed();
  }

  // ---------- remove background (for pictures on a plain or soft background, done right here in the browser) ----------
  async function loadImg(e) {
    const src = /^fairy-/.test(e.src) ? P.fairy(e.src) : await P.mediaUrl(e.src);
    return new Promise((res, rej) => { const i = new Image(); if (/^https?:/.test(src) && !src.startsWith(location.origin)) i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('That picture could not be opened.')); i.src = src; });
  }
  function cutBackground(img, tol, everywhere, maxSide) {
    const sc = Math.min(1, (maxSide || 1600) / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    // The background color: the most common color around the edge.
    const counts = new Map(), edge = [], key = i => (d[i * 4] >> 4) << 8 | (d[i * 4 + 1] >> 4) << 4 | (d[i * 4 + 2] >> 4);
    const pushEdge = i => { if (d[i * 4 + 3] < 10) return; edge.push(i); const k = key(i); counts.set(k, (counts.get(k) || 0) + 1); };
    for (let x = 0; x < w; x++) { pushEdge(x); pushEdge((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { pushEdge(y * w); pushEdge(y * w + w - 1); }
    let bestK = 0, bestN = -1; for (const [k, n] of counts) if (n > bestN) { bestN = n; bestK = k; }
    let br = 0, bg = 0, bb = 0, bn = 0;
    for (const i of edge) if (key(i) === bestK) { br += d[i * 4]; bg += d[i * 4 + 1]; bb += d[i * 4 + 2]; bn++; }
    if (!bn) return null;
    br /= bn; bg /= bn; bb /= bn;
    const T = tol * 4.42; // tol is a percent of the biggest color difference
    const dist = i => Math.hypot(d[i * 4] - br, d[i * 4 + 1] - bg, d[i * 4 + 2] - bb);
    const mask = new Uint8Array(w * h); // 1 = background
    if (everywhere) { for (let i = 0; i < w * h; i++) if (dist(i) <= T) mask[i] = 1; }
    else {
      const q = new Int32Array(w * h); let qh = 0, qt = 0;
      for (const i of edge) if (!mask[i] && dist(i) <= T) { mask[i] = 1; q[qt++] = i; }
      while (qh < qt) {
        const i = q[qh++], x = i % w;
        if (x > 0 && !mask[i - 1] && dist(i - 1) <= T) { mask[i - 1] = 1; q[qt++] = i - 1; }
        if (x < w - 1 && !mask[i + 1] && dist(i + 1) <= T) { mask[i + 1] = 1; q[qt++] = i + 1; }
        if (i >= w && !mask[i - w] && dist(i - w) <= T) { mask[i - w] = 1; q[qt++] = i - w; }
        if (i < w * (h - 1) && !mask[i + w] && dist(i + w) <= T) { mask[i + w] = 1; q[qt++] = i + w; }
      }
    }
    // Soft edge: pixels next to the removed part fade by how close their color is to the background.
    for (let i = 0; i < w * h; i++) {
      if (mask[i]) { d[i * 4 + 3] = 0; continue; }
      const x = i % w;
      const near = (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (i >= w && mask[i - w]) || (i < w * (h - 1) && mask[i + w]);
      if (near) { const a = Math.min(1, Math.max(0.15, (dist(i) - T) / (T * 0.9 + 12))); d[i * 4 + 3] = Math.round(d[i * 4 + 3] * a); }
    }
    g.putImageData(im, 0, 0);
    return cv;
  }
  function bgPreview() {
    const pop = $('pop'); if (!pop || !S.bgImg) return;
    const box = pop.querySelector('.cm-bg-prev'); if (!box) return;
    let cv = null;
    try { cv = cutBackground(S.bgImg, S.bgTol, S.bgAll, 420); } catch (err) { box.textContent = 'This picture can’t be changed here (it comes from another website).'; return; }
    box.innerHTML = ''; if (cv) box.appendChild(cv); else box.textContent = 'No plain background found around the edges.';
  }
  async function openRemoveBg(anchor) {
    const e = one(); if (!e || e.type !== 'image') return;
    S.bgTol = S.bgTol || 14; S.bgAll = !!S.bgAll; S.bgImg = null;
    showPop(anchor, `<h4>Remove background</h4>
      <p class="cm-hint">Best for pictures on a plain or soft background, like your watercolor elements. The checkered parts become see-through.</p>
      <div class="cm-bg-prev">Loading…</div>
      ${slider('bgtol', 'Strength', 2, 45, 1, S.bgTol, v => v + '%')}
      <label class="cm-check"><input type="checkbox" data-cm="bgall" ${S.bgAll ? 'checked' : ''}> Also remove that color inside the picture</label>
      <div class="cm-row"><button type="button" class="cm-btn" data-cm="bg-apply">Remove background</button>${e.orig ? '<button type="button" class="cm-btn cm-ghost" data-cm="bg-restore">Restore original</button>' : ''}</div>`, 'wide');
    S.popFor = 'pop-rmbg';
    try { S.bgImg = await loadImg(e); bgPreview(); } catch (err) { const b = $('pop').querySelector('.cm-bg-prev'); if (b) b.textContent = err.message; }
  }
  async function applyRemoveBg() {
    const e = one(); if (!e || !S.bgImg) return;
    const btn = $('pop').querySelector('[data-cm="bg-apply"]'); if (btn) { btn.disabled = true; btn.textContent = 'Removing…'; }
    try {
      const cv = cutBackground(S.bgImg, S.bgTol, S.bgAll, 1600); if (!cv) throw new Error('No plain background found around the edges of this picture.');
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      const ref = await P.uploadMedia(blob);
      remember(); e.orig = e.orig || e.src; e.src = ref;
      if (S.opts.onLibAdd) S.opts.onLibAdd([{ src: ref, name: 'No background', w: cv.width, h: cv.height }]).then(lib => { if (lib && S) S.lib = lib; }).catch(() => {});
      hidePop(); changed(); U().toast('Background removed.');
    } catch (err) { U().toast(err.message, 'error'); if (btn) { btn.disabled = false; btn.textContent = 'Remove background'; } }
  }

  // ---------- adding things ----------
  function addEl(el, opts) {
    remember();
    const p = pg();
    if (el.x === undefined) { el.x = r1((p.w - el.w) / 2); el.y = r1(Math.max(0, (p.h - (el.h || 40)) / 2 + (p.els.length % 6) * 8 - 24)); }
    el.id = el.id || K().newId();
    p.els.push(el); S.sel = [el.id];
    if (el.font) P.loadFonts([el.font]);
    changed();
    if (opts && opts.edit) setTimeout(() => S && startTextEdit(el.id), 30);
  }
  function addText(preset, raw) {
    const p = pg(), o = Object.assign({ type: 'text', color: '#4a5232', align: 'center' }, preset);
    o.w = Math.min(o.w || 300, p.w - 20); o.h = o.size * 1.4;
    if (raw) o.text = raw;
    addEl(o, { edit: !raw && /^Add /.test(o.text) });
  }
  function addShape(kind) {
    const base = { type: 'shape', shape: kind === 'rrect' ? 'rect' : kind, fill: '#e8b4c0', w: 140, h: 140 };
    if (kind === 'rrect') base.radius = 24;
    if (kind === 'line') Object.assign(base, { fill: '#4a5232', w: 220, h: 3 });
    if (kind === 'frame') Object.assign(base, { fill: 'transparent', stroke: '#4a5232', sw: 3, w: 220, h: 280 });
    if (kind === 'arch') Object.assign(base, { w: 180, h: 240, fill: '#f6d9e4' });
    addEl(base);
  }
  async function addImage(src, w0, h0) {
    let w = w0, h = h0;
    if (!w || !h) { try { const i = await loadImg({ src }); w = i.naturalWidth; h = i.naturalHeight; } catch (e) { w = 200; h = 200; } }
    const p = pg(), k = Math.min(1, (p.w * 0.6) / w, (p.h * 0.6) / h);
    addEl({ type: 'image', src, w: r1(w * k), h: r1(h * k) });
  }
  function addPart(kind) {
    const p = pg(), on = p.els.find(e => e.type === 'part' && e.kind === kind);
    if (on) { S.sel = [on.id]; paintOver(); paintToolbar(); return paintPanel(); }
    const d = K().partDefaults(kind, S.page);
    addEl(Object.assign(d, { x: r1((p.w - d.w) / 2), y: r1(Math.min(p.h - d.h - 10, p.h * 0.7)) }));
  }

  // ---------- left panels ----------
  function paintPanel() {
    const el = $('panel'); if (!el) return;
    S.root.querySelectorAll('[data-cm="panel"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.panel));
    el.innerHTML = ({ templates: panelTemplates, elements: panelElements, text: panelText, uploads: panelUploads, background: panelBackground, parts: panelParts, layers: panelLayers, fonts: panelFonts }[S.panel] || panelElements)();
    K().paint(el);
    if (S.panel === 'fonts') { P.loadFonts(fontList()); const q = el.querySelector('[data-cm="fontq"]'); if (q && S.fontFocus) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  }
  function panelTemplates() {
    return `<h3>Templates</h3><p class="cm-hint">Start from a ready-made set of all six pages, then change anything.</p>
      <div class="cm-tpls">${K().templates.map(t => {
        const c = t.make(), p = c.pages.notice, z = 200 / p.w;
        return `<button type="button" class="cm-tpl" data-cm="tpl" data-id="${t.id}"><span class="cm-tpl-pic" style="background:${esc(K().backdrop(c).color)}${c.backdrop && c.backdrop.src ? `;background-image:url('${esc(P.fairy(c.backdrop.src))}');background-size:cover` : ''}">${K().page(c, 'notice', Object.assign(ctx('thumb'), { width: Math.round(p.w * z * 0.8) + 'px' }))}</span><b>${esc(t.name)}</b><small>${esc(t.note)}</small></button>`;
      }).join('')}</div>
      <p class="cm-hint">Using a template replaces all six pages. You can press Undo.</p>`;
  }
  function panelElements() {
    const lib = libList();
    return `<h3>Shapes</h3><div class="cm-grid cm-shapes">${SHAPES.map(([k, l]) => `<button type="button" data-cm="shape" data-k="${k}" title="${l}" aria-label="${l}">${shapeIcon(k)}</button>`).join('')}</div>
      <h3>Fairy Garden pictures</h3><div class="cm-grid">${BUILTIN.map(([s, l]) => `<button type="button" data-cm="img" data-src="${s}" title="${esc(l)}"><img alt="${esc(l)}" src="${esc(P.fairy(s))}"></button>`).join('')}</div>
      <h3>My elements</h3>${lib.length ? `<div class="cm-grid">${lib.map(x => `<button type="button" data-cm="img" data-src="${esc(x.src)}" data-w="${x.w || ''}" data-h="${x.h || ''}" title="${esc(x.name)}"><img alt="${esc(x.name)}" data-csrc="${esc(x.src)}"></button>`).join('')}</div>` : '<p class="cm-hint">Your uploads show here. Use Uploads to add flowers, frames or photos.</p>'}`;
  }
  function shapeIcon(k) {
    const st = 'fill="#e8b4c0" stroke="#c27390" stroke-width="2"';
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${{ rect: `<rect x="6" y="6" width="28" height="28" ${st}/>`, rrect: `<rect x="6" y="6" width="28" height="28" rx="8" ${st}/>`, circle: `<circle cx="20" cy="20" r="14" ${st}/>`,
      line: '<rect x="4" y="19" width="32" height="2" fill="#4a5232"/>', heart: `<path transform="translate(4 4) scale(.32)" d="M50 92 C20 70 2 52 2 30 C2 14 14 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C86 4 98 14 98 30 C98 52 80 70 50 92Z" ${st}/>`,
      star: `<path transform="translate(4 4) scale(.32)" d="M50 3 L61.8 36.6 L97.6 37.6 L69.1 59.4 L79.4 93.4 L50 73.2 L20.6 93.4 L30.9 59.4 L2.4 37.6 L38.2 36.6Z" ${st}/>`, arch: `<path d="M8 36V19A12 12 0 0 1 32 19V36Z" ${st}/>`,
      blob: `<path transform="translate(4 4) scale(.32)" d="M50 3 C75 2 97 19 96 46 C95 73 78 97 50 97 C23 97 4 77 4 50 C4 23 25 4 50 3Z" ${st}/>`, frame: '<rect x="7" y="5" width="26" height="30" fill="none" stroke="#4a5232" stroke-width="2"/>' }[k]}</svg>`;
  }
  function panelText() {
    return `<h3>Text</h3><div class="cm-stack">${TEXT_PRESETS.map(([l, o], i) => `<button type="button" class="cm-textbtn cm-tb-${i}" data-cm="text" data-i="${i}" style="font-family:'${esc(o.font)}'">${esc(l)}</button>`).join('')}</div>
      <h3>Font combinations</h3><div class="cm-stack">${COMBOS.map(([t, o], i) => `<button type="button" class="cm-combo" data-cm="combo" data-i="${i}" style="font-family:'${esc(o.font)}';${o.italic ? 'font-style:italic;' : ''}${o.ls ? `letter-spacing:${o.ls / 1000}em;` : ''}">${esc(t)}</button>`).join('')}</div>
      <h3>Words that fill in by themselves</h3><p class="cm-hint">Type these in any text and each guest sees their own details. Click one to add it to the selected text.</p>
      <div class="cm-chips">${PLACEHOLDERS.map(([k, l]) => `<button type="button" class="cm-chip" data-cm="ph" data-k="${k}" title="${esc(l)}">${k}<small>${esc(l)}</small></button>`).join('')}</div>`;
  }
  function panelUploads() {
    const lib = libList();
    return `<h3>Uploads</h3><label class="cm-btn cm-upload ${S.uploading ? 'is-busy' : ''}"><input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" data-cm="upload" ${S.uploading ? 'disabled' : ''}>${S.uploading ? 'Uploading…' : 'Upload pictures'}</label>
      <p class="cm-hint">PNG, JPG, WebP or GIF. They’re kept in My elements for every client. To remove a background, select the picture on the card and click Remove background.</p>
      ${lib.length ? `<div class="cm-grid cm-grid-2">${lib.map(x => `<div class="cm-up"><button type="button" data-cm="img" data-src="${esc(x.src)}" data-w="${x.w || ''}" data-h="${x.h || ''}" title="Add ${esc(x.name)}"><img alt="${esc(x.name)}" data-csrc="${esc(x.src)}"></button>
        <button type="button" class="cm-x" data-cm="lib-del" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.name)} from My elements">×</button></div>`).join('')}</div>` : ''}`;
  }
  function panelBackground() {
    const p = pg(), bg = p.bg || {}, bd = S.cards.backdrop || {}, lib = libList();
    const pics = (cmd, cur) => `<div class="cm-grid">${[['', 'None']].concat(BUILTIN.slice(9), [['fairy-bg.jpg', 'Garden']]).map(([s, l]) => `<button type="button" class="${(cur || '') === s ? 'is-on' : ''}" data-cm="${cmd}" data-src="${s}" title="${esc(l)}">${s ? `<img alt="${esc(l)}" src="${esc(P.fairy(s))}">` : '<span class="cm-none">None</span>'}</button>`).join('')}
      ${lib.map(x => `<button type="button" class="${cur === x.src ? 'is-on' : ''}" data-cm="${cmd}" data-src="${esc(x.src)}" title="${esc(x.name)}"><img alt="${esc(x.name)}" data-csrc="${esc(x.src)}"></button>`).join('')}</div>`;
    return `<h3>This page</h3>
      <div class="cm-field"><span>Color</span>${swatches('page-color', bg.color || 'transparent')}</div>
      <div class="cm-field"><span>Picture</span>${pics('page-pic', bg.src)}</div>
      ${bg.src ? `<label class="cm-field"><span>Picture fit</span><select data-cm="page-fit">${[['cover', 'Fill the page'], ['contain', 'Show all of it'], ['stretch', 'Stretch to the page']].map(([k, l]) => `<option value="${k}" ${(bg.fit || 'cover') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
      ${slider('page-radius', 'Rounded corners', 0, 120, 1, bg.radius || 0, v => v)}
      <label class="cm-check"><input type="checkbox" data-cm="page-shadow" ${bg.shadow ? 'checked' : ''}> Soft shadow under the page</label>
      <div class="cm-field"><span>Page size</span><div class="cm-row"><input type="number" min="200" max="1400" value="${p.w}" data-cm="page-w" aria-label="Width"> × <input type="number" min="200" max="2400" value="${p.h}" data-cm="page-h" aria-label="Height"></div>
        <div class="cm-chips">${PAGE_SIZES.map(([l, w, h]) => `<button type="button" class="cm-chip" data-cm="page-size" data-w="${w}" data-h="${h}">${esc(l)}<small>${w}×${h}</small></button>`).join('')}</div></div>
      <h3>Behind the card (whole screen)</h3>
      <div class="cm-field"><span>Color</span>${swatches('bd-color', bd.color || '#f4efe2', true)}</div>
      <div class="cm-field"><span>Picture</span>${pics('bd-pic', bd.src)}</div>
      ${slider('bd-blur', 'Blur', 0, 30, 1, bd.blur || 0, v => v)}`;
  }
  function panelParts() {
    const p = pg(), kinds = C.CARD_PARTS[S.page] || [], req = C.CARD_REQUIRED[S.page] || [];
    return `<h3>Working parts</h3><p class="cm-hint">${esc(K().PAGE_HELP[S.page])} These are the pieces guests click or type in. Place and style them like any element.</p>
      <div class="cm-stack">${kinds.map(k => {
        const on = p.els.find(e => e.type === 'part' && e.kind === k);
        return `<button type="button" class="cm-part ${on ? 'is-on' : ''}" data-cm="part" data-k="${k}"><b>${esc(K().PART_LABELS[k])}</b><small>${on ? 'On the page · click to select' : 'Click to add'}${req.includes(k) ? ' · needed' : ''}</small></button>`;
      }).join('') || '<p class="cm-hint">This page has no working parts.</p>'}</div>`;
  }
  function elName(e) {
    if (e.type === 'text') return e.text.slice(0, 28);
    if (e.type === 'part') return K().PART_LABELS[e.kind];
    if (e.type === 'shape') return (SHAPES.find(s => s[0] === e.shape) || [, 'Shape'])[1];
    const b = BUILTIN.find(x => x[0] === e.src); if (b) return b[1];
    const l = libList().find(x => x.src === e.src); return l ? l.name : 'Picture';
  }
  function panelLayers() {
    const els = pg().els.slice().reverse();
    return `<h3>Layers</h3><p class="cm-hint">The top of the list is in front. Use ▲ ▼ to move a layer.</p><ol class="cm-layers">${els.map(e => `<li class="${S.sel.includes(e.id) ? 'is-on' : ''}">
      <button type="button" class="cm-layer" data-cm="layer" data-id="${esc(e.id)}"><span class="cm-ltype">${{ text: 'T', image: '▣', shape: '◆', part: '⚙' }[e.type]}</span><span>${esc(elName(e))}</span></button>
      <button type="button" data-cm="lmove" data-id="${esc(e.id)}" data-d="1" aria-label="Move up">▲</button><button type="button" data-cm="lmove" data-id="${esc(e.id)}" data-d="-1" aria-label="Move down">▼</button>
      <button type="button" data-cm="llock" data-id="${esc(e.id)}" aria-pressed="${!!e.lock}" title="${e.lock ? 'Unlock' : 'Lock'}">${e.lock ? '🔒' : '🔓'}</button></li>`).join('')}</ol>`;
  }
  const fontList = () => [...new Set(C.CARD_EXTRA_FONTS.concat(P.allFonts()))];
  function panelFonts() {
    const e = one(), cur = e && (e.font || (e.type === 'part' ? 'Gilda Display' : '')), q = S.fontQuery.toLowerCase();
    const groups = [['Fairy Garden fonts', C.CARD_EXTRA_FONTS]].concat(Object.entries(P.fontGroups()));
    const custom = S.opts.theme.customFont ? [[C.CUSTOM_FONT, S.opts.customFontLabel || 'My uploaded font']] : [];
    if (custom.length) P.loadCustomFont(S.opts.theme.customFont);
    return `<h3>Font</h3><input type="search" class="cm-search" placeholder="Search fonts" value="${esc(S.fontQuery)}" data-cm="fontq">
      ${custom.map(([v, l]) => `<button type="button" class="cm-font ${cur === v ? 'is-on' : ''}" data-cm="font" data-f="${esc(v)}" style="font-family:'${esc(P.fontFamily(v))}'">${esc(l)}</button>`).join('')}
      ${groups.map(([g, list]) => { const f = list.filter(n => n.toLowerCase().includes(q)); return f.length ? `<h4>${esc(g)}</h4>${f.map(n => `<button type="button" class="cm-font ${cur === n ? 'is-on' : ''}" data-cm="font" data-f="${esc(n)}" style="font-family:'${esc(n)}'">${esc(n)}</button>`).join('')}` : ''; }).join('')}`;
  }
  const libList = () => S.lib || S.opts.lib || [];

  // ---------- top toolbar (changes with what is selected) ----------
  function swatches(cmd, cur, noClear) {
    return `<div class="cm-sw">${[...new Set(docColors().concat(SWATCHES))].filter(c => !(noClear && c === 'transparent')).slice(0, 34).map(c => `<button type="button" class="${c === cur ? 'is-on' : ''} ${c === 'transparent' ? 'is-clear' : ''}" data-cm="${cmd}" data-c="${c}" style="background:${c === 'transparent' ? '#fff' : c}" title="${c === 'transparent' ? 'No color' : c}" aria-label="${c === 'transparent' ? 'No color' : c}"></button>`).join('')}
      <label class="cm-sw-more" title="Any color"><input type="color" data-cm="${cmd}" value="${/^#/.test(cur || '') ? cur : '#c79293'}"><span>+</span></label></div>`;
  }
  function docColors() {
    const out = new Set();
    for (const p of Object.values(S.cards.pages)) { if (p.bg && /^#/.test(p.bg.color || '')) out.add(p.bg.color); for (const e of p.els) for (const k of ['color', 'fill', 'stroke', 'on']) if (/^#/.test(e[k] || '')) out.add(e[k]); }
    return [...out].slice(0, 10);
  }
  function slider(cmd, label, min, max, step, v, fmt) {
    return `<label class="cm-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-cm="${cmd}"><output>${fmt ? fmt(v) : v}</output></label>`;
  }
  const tb = (cmd, label, extra, on) => `<button type="button" class="cm-t ${on ? 'is-on' : ''}" data-cm="${cmd}" ${extra || ''}>${label}</button>`;
  function paintToolbar() {
    const t = $('toolbar'); if (!t) return;
    if (S.crop) { t.innerHTML = `<span class="cm-tlabel">Drag the corners or the picture to crop</span>${tb('crop-reset', 'Reset')}${tb('crop-cancel', 'Cancel')}<button type="button" class="cm-save" data-cm="crop-done">Done</button>`; return; }
    const items = sel(), e = one();
    if (!items.length) {
      const p = pg(), bg = p.bg || {};
      t.innerHTML = `<span class="cm-tlabel">${esc(K().PAGES.find(x => x[0] === S.page)[1])} page</span>
        ${tb('pop-pagecolor', `<i class="cm-dot" style="background:${bg.color && bg.color !== 'transparent' ? bg.color : '#fff'}"></i>Page color`, 'data-pop="1"')}
        ${tb('panel', 'Page picture & size', 'data-k="background"')}
        ${tb('pop-transition', `Page transition: ${esc((TRANSITIONS.find(x => x[0] === (S.cards.transition || 'fade')) || [])[1])}`, 'data-pop="1"')}
        ${tb('play', '▶ Play animations')}
        <span class="cm-tlabel cm-muted">Click anything on the card to change it. Double-click text to type.</span>`;
      return;
    }
    if (items.length > 1) {
      t.innerHTML = `<span class="cm-tlabel">${items.length} selected</span>${tb('pop-align', 'Position', 'data-pop="1"')}${tb('pop-anim', '✦ Animate', 'data-pop="1"')}${tb('dup', 'Duplicate')}${tb('del', 'Delete')}`;
      return;
    }
    const common = `${tb('pop-anim', `✦ Animate${e.anim && (e.anim.in || e.anim.loop) ? ' •' : ''}`, 'data-pop="1"')}${tb('pop-op', 'Transparency', 'data-pop="1"')}${tb('pop-align', 'Position', 'data-pop="1"')}
      ${tb('lock', e.lock ? '🔒' : '🔓', `title="${e.lock ? 'Unlock' : 'Lock'}" aria-label="${e.lock ? 'Unlock' : 'Lock'}"`, e.lock)}${e.type === 'part' ? '' : tb('dup', '⧉', 'title="Duplicate (Ctrl+D)" aria-label="Duplicate"')}${required(e) ? '' : tb('del', '🗑', 'title="Delete" aria-label="Delete"')}`;
    if (e.type === 'text') {
      t.innerHTML = `${tb('panel', `<span style="font-family:'${esc(P.fontFamily(e.font))}'">${esc(e.font)}</span> ▾`, 'data-k="fonts" title="Font"')}
        <span class="cm-size"><button type="button" data-cm="size" data-d="-1" aria-label="Smaller">−</button><input type="number" min="2" max="600" step="0.5" value="${e.size}" data-cm="size-in" aria-label="Text size"><button type="button" data-cm="size" data-d="1" aria-label="Bigger">+</button></span>
        ${tb('pop-color', `<i class="cm-tcolor" style="border-bottom-color:${e.color}">A</i>`, 'data-pop="1" title="Text color"')}
        ${tb('bold', '<b>B</b>', 'title="Bold"', e.bold)}${tb('italic', '<i>I</i>', 'title="Italic"', e.italic)}${tb('underline', '<u>U</u>', 'title="Underline"', e.underline)}${tb('upper', 'aA', 'title="Capitals"', e.upper)}
        ${tb('align', { left: '⇤', center: '↔', right: '⇥', justify: '☰' }[e.align || 'center'], 'title="Align"')}
        ${tb('pop-spacing', 'Spacing', 'data-pop="1"')}${tb('pop-effects', 'Effects', 'data-pop="1"')}${common}`;
    } else if (e.type === 'image') {
      t.innerHTML = `${tb('crop', '✂ Crop')}${tb('pop-rmbg', '✨ Remove background', 'data-pop="1"')}${tb('pop-adjust', 'Adjust', 'data-pop="1"')}${tb('pop-flip', 'Flip', 'data-pop="1"')}${tb('pop-corners', 'Corners & border', 'data-pop="1"')}${tb('as-bg', 'Use as page background')}${common}`;
    } else if (e.type === 'shape') {
      t.innerHTML = `${tb('pop-fill', `<i class="cm-dot" style="background:${e.fill === 'transparent' ? '#fff' : e.fill}"></i>Color`, 'data-pop="1"')}${tb('pop-stroke', 'Border', 'data-pop="1"')}${['rect', 'frame', 'line'].includes(e.shape) ? tb('pop-corners', 'Corners', 'data-pop="1"') : ''}${tb('pop-flip', 'Flip', 'data-pop="1"')}${common}`;
    } else if (e.type === 'part') {
      const labels = { next: [['label', 'Words']], find: [['label', 'Words']], save: [['label', 'Words']], link: [['label', 'Words']], submit: [['label', 'Words'], ['label2', 'After sending']], namebox: [['ph', 'Hint in the box']], choices: [['yes', 'Yes'], ['no', 'No']] }[e.kind] || [];
      t.innerHTML = `<span class="cm-tlabel">${esc(K().PART_LABELS[e.kind])}</span>
        ${labels.map(([k, l]) => `<label class="cm-tinput"><span>${l}</span><input type="text" maxlength="120" value="${esc(e[k] != null ? e[k] : '')}" data-cm="pprop" data-k="${k}"></label>`).join('')}
        ${tb('panel', `<span style="font-family:'${esc(P.fontFamily(e.font || 'Gilda Display'))}'">${esc(e.font || 'Gilda Display')}</span> ▾`, 'data-k="fonts" title="Font"')}
        <span class="cm-size"><button type="button" data-cm="size" data-d="-1" aria-label="Smaller">−</button><input type="number" min="2" max="300" step="0.5" value="${e.size || 13}" data-cm="size-in" aria-label="Text size"><button type="button" data-cm="size" data-d="1" aria-label="Bigger">+</button></span>
        ${tb('pop-color', `<i class="cm-tcolor" style="border-bottom-color:${e.color || '#4a5232'}">A</i>`, 'data-pop="1" title="Words color"')}
        ${['guestlist', 'recap'].includes(e.kind) ? '' : tb('pop-fill', `<i class="cm-dot" style="background:${!e.fill || e.fill === 'transparent' ? '#fff' : e.fill}"></i>${e.kind === 'choices' ? 'Switch off' : 'Fill'}`, 'data-pop="1"')}
        ${['guestlist', 'choices'].includes(e.kind) ? tb('pop-on', `<i class="cm-dot" style="background:${e.on || '#c79293'}"></i>Switch on`, 'data-pop="1"') : ''}
        ${['guestlist', 'recap'].includes(e.kind) ? tb('pop-line', `<i class="cm-dot" style="background:${e.line || '#d9d2bd'}"></i>Lines`, 'data-pop="1"') : ''}
        ${['next', 'find', 'save', 'submit', 'namebox', 'link'].includes(e.kind) ? tb('pop-corners', 'Corners', 'data-pop="1"') : ''}
        ${tb('bold', '<b>B</b>', 'title="Bold"', e.bold)}${tb('italic', '<i>I</i>', 'title="Italic"', e.italic)}${tb('upper', 'aA', 'title="Capitals"', e.upper)}${common}`;
    }
  }

  // ---------- popovers ----------
  function showPop(anchor, html, wide) {
    const p = $('pop'); p.innerHTML = html; p.hidden = false; p.classList.toggle('is-wide', wide === 'wide');
    const r = anchor.getBoundingClientRect(), pw = p.offsetWidth;
    p.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left)) + 'px'; p.style.top = r.bottom + 6 + 'px';
    S.popFor = anchor.dataset.cm;
  }
  function hidePop() { const p = S && $('pop'); if (p && !p.hidden) { p.hidden = true; p.innerHTML = ''; } if (S) S.popFor = null; }
  function openPop(cmd, anchor, refresh) {
    if (S.popFor === cmd && !refresh) return hidePop();
    const e = one();
    const anim = (e && e.anim) || {};
    const body = {
      'pop-pagecolor': () => `<h4>Page color</h4>${swatches('page-color', pg().bg && pg().bg.color)}`,
      'pop-transition': () => `<h4>Page transition</h4><p class="cm-hint">How one page changes to the next for guests.</p><div class="cm-chips">${TRANSITIONS.map(([k, l]) => `<button type="button" class="cm-chip ${(S.cards.transition || 'fade') === k ? 'is-on' : ''}" data-cm="transition" data-k="${k}">${l}</button>`).join('')}</div>`,
      'pop-color': () => `<h4>Color</h4>${swatches('el-color', e.color, true)}`,
      'pop-fill': () => `<h4>${e.type === 'part' && e.kind === 'choices' ? 'Switch color when off' : 'Color'}</h4>${swatches('el-fill', e.fill)}`,
      'pop-on': () => `<h4>Switch color when on</h4>${swatches('el-on', e.on, true)}`,
      'pop-line': () => `<h4>Line color</h4>${swatches('el-line', e.line, true)}`,
      'pop-stroke': () => `<h4>Border</h4>${slider('el-sw', 'Thickness', 0, 40, 0.5, e.sw || 0, v => v)}${swatches('el-stroke', e.stroke || '#4a5232', true)}`,
      'pop-spacing': () => `<h4>Spacing</h4>${slider('el-ls', 'Letter spacing', -20, 200, 1, e.ls || 0, v => v)}${slider('el-lh', 'Line spacing', 0.6, 3, 0.05, e.lh || 1.25, v => (+v).toFixed(2))}`,
      'pop-effects': () => `<h4>Effects</h4><div class="cm-chips">${EFFECTS.map(([k, l]) => `<button type="button" class="cm-chip ${(e.effect || 'none') === k ? 'is-on' : ''}" data-cm="effect" data-k="${k}">${l}</button>`).join('')}</div>${e.effect && e.effect !== 'lift' ? `<h4>Effect color</h4>${swatches('el-ecolor', e.ecolor, true)}` : ''}`,
      'pop-op': () => `<h4>Transparency</h4>${slider('el-op', 'See-through', 5, 100, 1, Math.round((e.op === undefined ? 1 : e.op) * 100), v => v + '%')}`,
      'pop-anim': () => `<h4>Animate when the page opens</h4><div class="cm-chips">${ANIM_IN.map(([k, l]) => `<button type="button" class="cm-chip ${(anim.in || 'none') === k ? 'is-on' : ''}" data-cm="anim-in" data-k="${k}">${l}</button>`).join('')}</div>
        <h4>Keep moving</h4><div class="cm-chips">${ANIM_LOOP.map(([k, l]) => `<button type="button" class="cm-chip ${(anim.loop || 'none') === k ? 'is-on' : ''}" data-cm="anim-loop" data-k="${k}">${l}</button>`).join('')}</div>
        ${slider('anim-delay', 'Starts after', 0, 5, 0.1, anim.delay || 0, v => (+v).toFixed(1) + ' s')}${slider('anim-dur', 'Length', 0.2, 4, 0.1, anim.dur || 0.8, v => (+v).toFixed(1) + ' s')}
        <div class="cm-row"><button type="button" class="cm-btn cm-ghost" data-cm="play">▶ Play this page</button></div>`,
      'pop-align': () => `<h4>Arrange</h4><div class="cm-chips">${[['front', 'To front'], ['forward', 'Forward'], ['backward', 'Backward'], ['back', 'To back']].map(([k, l]) => `<button type="button" class="cm-chip" data-cm="order" data-k="${k}">${l}</button>`).join('')}</div>
        <h4>Line up with the page</h4><div class="cm-chips">${[['left', 'Left'], ['hcenter', 'Center'], ['right', 'Right'], ['top', 'Top'], ['vcenter', 'Middle'], ['bottom', 'Bottom']].map(([k, l]) => `<button type="button" class="cm-chip" data-cm="align-to" data-k="${k}">${l}</button>`).join('')}</div>
        ${e ? `<h4>Size and place</h4><div class="cm-xywh">${[['x', 'X'], ['y', 'Y'], ['w', 'W'], ['h', 'H'], ['rot', 'Turn']].filter(([k]) => !(k === 'h' && e.type === 'text')).map(([k, l]) => `<label><span>${l}</span><input type="number" step="1" value="${Math.round(k === 'rot' ? e.rot || 0 : e[k])}" data-cm="xywh" data-k="${k}"></label>`).join('')}</div>` : ''}`,
      'pop-flip': () => `<h4>Flip</h4><div class="cm-chips"><button type="button" class="cm-chip ${e.flipX ? 'is-on' : ''}" data-cm="flip" data-k="flipX">Left ↔ right</button><button type="button" class="cm-chip ${e.flipY ? 'is-on' : ''}" data-cm="flip" data-k="flipY">Upside down</button></div>`,
      'pop-corners': () => e.type === 'image' ? `<h4>Corners</h4>${slider('el-radius-pct', 'Rounded corners', 0, 50, 1, e.radius || 0, v => (+v === 50 ? 'Circle' : v + '%'))}
          <h4>Border</h4>${slider('el-bw', 'Thickness', 0, 30, 0.5, e.bw || 0, v => v)}${swatches('el-bc', e.bc || '#ffffff', true)}<label class="cm-check"><input type="checkbox" data-cm="el-shadow" ${e.shadow ? 'checked' : ''}> Soft shadow</label>`
        : `<h4>Corners</h4>${slider('el-radius', 'Rounded corners', 0, e.type === 'part' ? 60 : 200, 1, e.radius || 0, v => v)}`,
      'pop-adjust': () => { const a = e.adj || {}; return `<h4>Adjust</h4>${slider('adj-b', 'Brightness', 0, 200, 1, a.b !== undefined ? a.b : 100, v => v + '%')}${slider('adj-c', 'Contrast', 0, 200, 1, a.c !== undefined ? a.c : 100, v => v + '%')}${slider('adj-s', 'Color strength', 0, 200, 1, a.s !== undefined ? a.s : 100, v => v + '%')}${slider('adj-g', 'Black & white', 0, 100, 1, a.g || 0, v => v + '%')}${slider('adj-bl', 'Blur', 0, 20, 0.5, a.bl || 0, v => v)}<div class="cm-row"><button type="button" class="cm-btn cm-ghost" data-cm="adj-reset">Reset</button></div>`; },
    };
    if (cmd === 'pop-rmbg') return openRemoveBg(anchor);
    if (cmd === 'help') return showPop(anchor, `<h4>Shortcuts</h4><div class="cm-keys">${[['Undo / Redo', 'Ctrl Z · Ctrl Y'], ['Save', 'Ctrl S'], ['Copy / Paste', 'Ctrl C · Ctrl V'], ['Duplicate', 'Ctrl D'], ['Select all', 'Ctrl A'],
      ['Nudge', '← ↑ → ↓ (Shift = 10)'], ['Type in text', 'Double-click · Enter'], ['Crop a picture', 'Double-click'], ['Select several', 'Shift + click · drag a box'], ['Move without snapping', 'hold Alt'], ['Keep the shape', 'hold Shift on a corner'], ['Zoom', 'Ctrl + wheel'], ['Fold the side panel', 'click the open tool again'], ['Deselect', 'Esc'], ['Delete', 'Delete']].map(([a, k]) => `<span>${a}</span><kbd>${k}</kbd>`).join('')}</div>`, 'wide');
    if (body[cmd]) showPop(anchor, body[cmd]());
  }
  // Refresh an open popover after a change made in it.
  function refreshPop() {
    if (!S.popFor) return;
    const a = S.root.querySelector(`.cm-toolbar [data-cm="${S.popFor}"]`);
    if (a) openPop(S.popFor, a, true); else hidePop();
  }

  // ---------- bottom page strip ----------
  function paintPages() {
    const el = $('pages'); if (!el || !S) return;
    el.innerHTML = `<div class="cm-pagelist">${K().PAGES.map(([k, l], i) => {
      const p = S.cards.pages[k], z = Math.min(84 / p.h, 120 / p.w);
      return `<button type="button" class="cm-pagebtn ${S.page === k ? 'is-on' : ''}" data-cm="page" data-k="${k}" title="${esc(K().PAGE_HELP[k])}">
        <span class="cm-thumb" style="width:${Math.round(p.w * z)}px;height:${Math.round(p.h * z)}px">${K().page(S.cards, k, Object.assign(ctx('thumb'), { width: Math.round(p.w * z) + 'px' }))}</span><span>${i + 1}. ${esc(l)}</span></button>`;
    }).join('')}</div>`;
    K().paint(el);
  }

  // ---------- preview (plays the pages the way guests see them) ----------
  function openPreview() {
    hidePop(); if (S.editing) stopTextEdit();
    S.preview = { i: K().PAGES.findIndex(p => p[0] === S.page) };
    const bd = K().backdrop(S.cards);
    const box = document.createElement('div'); box.className = 'cm-preview'; S.previewEl = box;
    box.innerHTML = `<div class="cm-pv-bg" style="background-color:${esc(bd.color)};${bd.blur ? `filter:blur(${bd.blur}px);` : ''}${bd.src && /^fairy-/.test(bd.src) ? `background-image:url('${esc(P.fairy(bd.src))}');` : ''}" ${bd.src && !/^fairy-/.test(bd.src) ? `data-cbg="${esc(bd.src)}"` : ''}></div>
      <div class="cm-pv-stage" data-pv="stage"></div>
      <div class="cm-pv-bar"><button type="button" data-cm="pv" data-d="-1">‹ Back</button><span class="cm-pv-dots" data-pv="dots"></span><span data-pv="name"></span><button type="button" data-cm="pv" data-d="1">Next ›</button><button type="button" data-cm="pv-close">Close preview</button></div>`;
    S.root.appendChild(box); K().paint(box);
    showPreviewPage('first');
  }
  function showPreviewPage(dir) {
    const st = S.previewEl.querySelector('[data-pv="stage"]'), [k, l] = K().PAGES[S.preview.i];
    const put = () => {
      if (!S || !S.preview) return;
      st.innerHTML = K().page(S.cards, k, Object.assign(ctx('guest'), { mode: 'guest' }));
      st.querySelectorAll('button, input, a').forEach(b => { b.tabIndex = -1; b.removeAttribute('data-act'); if (b.tagName === 'A') b.removeAttribute('href'); });
      K().paint(st);
      const s = st.querySelector('.c-stage'); if (s) s.classList.add('g-enter-' + (dir === 'back' ? 'back' : 'fwd'));
      S.previewEl.querySelector('[data-pv="name"]').textContent = `${S.preview.i + 1} of 6 · ${l}`;
      S.previewEl.querySelector('[data-pv="dots"]').innerHTML = K().PAGES.map((x, i) => `<i class="${i === S.preview.i ? 'is-on' : ''}"></i>`).join('');
    };
    const old = st.querySelector('.c-stage');
    if (old && dir !== 'first') { old.classList.add('g-leave-' + (dir === 'back' ? 'back' : 'fwd')); setTimeout(put, 260); } else put();
  }
  function closePreview() { if (S.previewEl) S.previewEl.remove(); S.preview = null; S.previewEl = null; }

  // ---------- commands ----------
  function setSel(fn, key, opts) { const items = sel(); if (!items.length) return; remember(key); items.forEach(fn); changed(key, opts); }
  async function onClick(ev) {
    if (!S) return;
    const b = ev.target.closest('[data-cm]'); if (!b) return;
    if ((b.tagName === 'INPUT' && b.type !== 'checkbox') || b.tagName === 'SELECT' || (b.tagName === 'INPUT' && b.type === 'checkbox')) return;
    const cmd = b.dataset.cm, e = one();
    if (cmd.startsWith('pop-') || cmd === 'help') return openPop(cmd, b);
    if (b.dataset.c !== undefined) return colorCmd(cmd, b.dataset.c);
    switch (cmd) {
      case 'close': return close();
      case 'save': return save();
      case 'undo': return undo(true);
      case 'redo': return undo(false);
      case 'zoom': {
        const d = +b.dataset.d; S.zoomSet = d !== 0;
        S.zoom = d === 0 ? S.fit : Math.max(0.15, Math.min(4, (S.zoom || 1) * (d > 0 ? 1.2 : 1 / 1.2)));
        paintCanvas(); return paintTop();
      }
      case 'preview': return openPreview();
      case 'pv': { const n = S.preview.i + +b.dataset.d; if (n < 0 || n > 5) return; S.preview.i = n; return showPreviewPage(+b.dataset.d < 0 ? 'back' : 'fwd'); }
      case 'pv-close': return closePreview();
      case 'panel':
        // Clicking the open tool on the left rail folds its panel away (more room for the card); clicking again opens it.
        if (b.closest('.cm-rail') && S.panel === b.dataset.k) { S.root.classList.toggle('is-collapsed'); setTimeout(fitZoom, 360); return; }
        if (S.root.classList.contains('is-collapsed')) { S.root.classList.remove('is-collapsed'); setTimeout(fitZoom, 360); }
        S.panel = b.dataset.k; S.fontFocus = false; if (S.panel !== 'fonts') S.fontQuery = ''; return paintPanel();
      case 'page': if (S.editing) stopTextEdit(); S.page = b.dataset.k; S.sel = []; S.crop = null; S.zoomSet = false; hidePop(); fitZoom(); paintPages(); paintPanel(); return paintToolbar();
      case 'tpl': {
        const t = K().templates.find(x => x.id === b.dataset.id); if (!t) return;
        if (!(await U().confirm({ title: `Use the ${t.name} template?`, message: 'All six pages are replaced with this template. You can press Undo to get your pages back.', yes: 'Use template', no: 'Cancel' }))) return;
        remember(); S.cards = t.make(); S.sel = []; P.loadFonts(K().fonts(S.cards)); S.zoomSet = false; fitZoom(); return draw();
      }
      case 'shape': return addShape(b.dataset.k);
      case 'img': return addImage(b.dataset.src, +b.dataset.w || 0, +b.dataset.h || 0);
      case 'text': return addText(Object.assign({}, TEXT_PRESETS[+b.dataset.i][1]));
      case 'combo': { const [t, o] = COMBOS[+b.dataset.i]; return addText(Object.assign({ text: t }, o), t); }
      case 'ph': {
        if (e && e.type === 'text') { remember(); e.text = (e.text + ' ' + b.dataset.k).trim(); return changed(); }
        return addText({ text: b.dataset.k, size: 20, font: 'Gilda Display', w: 260 }, b.dataset.k);
      }
      case 'part': return addPart(b.dataset.k);
      case 'font': { const f = b.dataset.f; P.loadFonts([f]); setSel(x => { if (x.type === 'text' || x.type === 'part') x.font = f; }); return paintPanel(); }
      case 'layer': S.sel = [b.dataset.id]; paintOver(); paintToolbar(); return paintPanel();
      case 'lmove': { const els = pg().els, i = els.findIndex(x => x.id === b.dataset.id), j = i + +b.dataset.d; if (i < 0 || j < 0 || j >= els.length) return; remember(); [els[i], els[j]] = [els[j], els[i]]; return changed(); }
      case 'llock': { const x = byId(b.dataset.id); if (!x) return; remember(); x.lock = !x.lock || undefined; return changed(); }
      case 'lock': return setSel(x => { x.lock = !x.lock || undefined; });
      case 'dup': return duplicate();
      case 'del': return removeSel();
      case 'bold': case 'italic': case 'underline': case 'upper': return setSel(x => { x[cmd] = !x[cmd] || undefined; });
      case 'align': { const order = ['center', 'left', 'right', 'justify']; return setSel(x => { x.align = order[(order.indexOf(x.align || 'center') + 1) % 4]; }); }
      case 'size': return setSel(x => { const s = x.size || 13; x.size = r1(Math.max(2, s + +b.dataset.d * (s >= 40 ? 2 : 1))); }, 'size');
      case 'effect': setSel(x => { x.effect = b.dataset.k === 'none' ? undefined : b.dataset.k; }); return refreshPop();
      case 'transition': remember(); S.cards.transition = b.dataset.k; changed(); return refreshPop();
      case 'anim-in': case 'anim-loop': setSel(x => { x.anim = Object.assign({}, x.anim, { [cmd === 'anim-in' ? 'in' : 'loop']: b.dataset.k === 'none' ? undefined : b.dataset.k }); }); playPage(); return refreshPop();
      case 'play': return playPage();
      case 'order': return arrange(b.dataset.k);
      case 'align-to': return alignTo(b.dataset.k);
      case 'flip': setSel(x => { x[b.dataset.k] = !x[b.dataset.k] || undefined; }); return refreshPop();
      case 'crop': return startCrop();
      case 'crop-done': return finishCrop(true);
      case 'crop-cancel': return finishCrop(false);
      case 'crop-reset': { const c = S.crop; c.box = { l: c.full.x, t: c.full.y, r: c.full.x + c.full.w, b: c.full.y + c.full.h }; return paintOver(); }
      case 'bg-apply': return applyRemoveBg();
      case 'bg-restore': if (e && e.orig) { remember(); e.src = e.orig; delete e.orig; hidePop(); changed(); } return;
      case 'as-bg': if (e && e.type === 'image') { remember(); pg().bg = Object.assign({}, pg().bg, { src: e.src, fit: 'cover' }); pg().els = pg().els.filter(x => x !== e); S.sel = []; changed(); } return;
      case 'adj-reset': setSel(x => { delete x.adj; }); return refreshPop();
      case 'page-size': return pageSize(+b.dataset.w, +b.dataset.h);
      case 'page-pic': { remember(); const bg = Object.assign({}, pg().bg); if (b.dataset.src) { bg.src = b.dataset.src; bg.fit = bg.fit || 'cover'; } else { delete bg.src; delete bg.fit; } pg().bg = bg; changed(); return paintPanel(); }
      case 'bd-pic': { remember(); const bd = Object.assign({}, S.cards.backdrop); if (b.dataset.src) bd.src = b.dataset.src; else delete bd.src; S.cards.backdrop = bd; changed(); return paintPanel(); }
      case 'lib-del': {
        const lib = libList(), x = lib.find(y => y.id === b.dataset.id); if (!x || !S.opts.onLibSet) return;
        if (!(await U().confirm({ title: `Remove ${x.name} from My elements?`, message: 'Copies already placed on cards stay where they are.', yes: 'Remove', no: 'Keep' }))) return;
        S.lib = await S.opts.onLibSet(lib.filter(y => y.id !== x.id)).catch(err => { U().toast(err.message, 'error'); return lib; }); return paintPanel();
      }
    }
  }
  function colorCmd(cmd, c) {
    if (cmd === 'page-color') { remember(cmd); pg().bg = Object.assign({}, pg().bg, { color: c }); changed(cmd); }
    else if (cmd === 'bd-color') { remember(cmd); S.cards.backdrop = Object.assign({}, S.cards.backdrop, { color: c }); changed(cmd); }
    else {
      const f = { 'el-color': 'color', 'el-fill': 'fill', 'el-on': 'on', 'el-line': 'line', 'el-stroke': 'stroke', 'el-ecolor': 'ecolor', 'el-bc': 'bc' }[cmd]; if (!f) return;
      setSel(x => { x[f] = c; if (f === 'stroke' && !x.sw) x.sw = 2; if (f === 'bc' && !x.bw) x.bw = 4; }, cmd);
    }
    if (S.panel === 'background') paintPanel();
    if (S.popFor) refreshPop();
  }
  function onInput(ev) {
    if (!S) return;
    const el = ev.target, cmd = el.dataset.cm; if (!cmd) return;
    const v = el.type === 'range' || el.type === 'number' ? Number(el.value) : el.value;
    const out = el.nextElementSibling;
    if (out && out.tagName === 'OUTPUT') out.textContent = ({ 'el-op': x => x + '%', 'anim-delay': x => (+x).toFixed(1) + ' s', 'anim-dur': x => (+x).toFixed(1) + ' s', 'el-lh': x => (+x).toFixed(2), bgtol: x => x + '%', 'el-radius-pct': x => (+x === 50 ? 'Circle' : x + '%'), 'adj-b': x => x + '%', 'adj-c': x => x + '%', 'adj-s': x => x + '%', 'adj-g': x => x + '%' }[cmd] || (x => x))(v);
    if (el.type === 'color') { if (ev.type === 'input' || ev.type === 'change') colorCmd(cmd, el.value.toLowerCase()); return; }
    const quiet = { toolbar: false };
    switch (cmd) {
      case 'use': if (ev.type === 'change') { S.use = el.checked; S.dirty = true; paintTop(); } return;
      case 'fontq': if (ev.type === 'input') { S.fontQuery = el.value; S.fontFocus = true; paintPanel(); } return;
      case 'size-in': if (ev.type === 'change' && v >= 2) setSel(x => { x.size = r1(v); }, 'size', quiet); return;
      case 'pprop': if (ev.type === 'input') setSel(x => { x[el.dataset.k] = el.value; }, 'pp' + el.dataset.k, quiet); return;
      case 'el-ls': return setSel(x => { x.ls = v || undefined; }, cmd, quiet);
      case 'el-lh': return setSel(x => { x.lh = v; }, cmd, quiet);
      case 'el-op': return setSel(x => { x.op = v >= 100 ? undefined : v / 100; }, cmd, quiet);
      case 'el-sw': return setSel(x => { x.sw = v || undefined; if (v && !x.stroke) x.stroke = '#4a5232'; }, cmd, quiet);
      case 'el-bw': return setSel(x => { x.bw = v || undefined; if (v && !x.bc) x.bc = '#ffffff'; }, cmd, quiet);
      case 'el-radius': case 'el-radius-pct': return setSel(x => { x.radius = v || undefined; }, cmd, quiet);
      case 'el-shadow': if (ev.type === 'change') setSel(x => { x.shadow = el.checked || undefined; }, cmd, quiet); return;
      case 'anim-delay': return setSel(x => { x.anim = Object.assign({}, x.anim, { delay: v || undefined }); }, cmd, quiet);
      case 'anim-dur': return setSel(x => { x.anim = Object.assign({}, x.anim, { dur: v }); }, cmd, quiet);
      case 'adj-b': case 'adj-c': case 'adj-s': case 'adj-g': case 'adj-bl': return setSel(x => { x.adj = Object.assign({}, x.adj, { [cmd.slice(4)]: v }); }, cmd, quiet);
      case 'xywh': if (ev.type === 'change') { const k = el.dataset.k; setSel(x => { x[k] = k === 'w' || k === 'h' ? Math.max(4, v) : k === 'rot' ? (v || undefined) : v; }, null, quiet); } return;
      case 'bgtol': S.bgTol = v; return bgPreview();
      case 'bgall': if (ev.type === 'change') { S.bgAll = el.checked; bgPreview(); } return;
      case 'page-fit': if (ev.type === 'change') { remember(); pg().bg.fit = v; changed(); } return;
      case 'page-radius': remember(cmd); pg().bg = Object.assign({}, pg().bg, { radius: v || undefined }); return changed(cmd, quiet);
      case 'page-shadow': if (ev.type === 'change') { remember(); pg().bg = Object.assign({}, pg().bg, { shadow: el.checked || undefined }); changed(); } return;
      case 'page-w': case 'page-h': if (ev.type === 'change') pageSize(cmd === 'page-w' ? v : pg().w, cmd === 'page-h' ? v : pg().h); return;
      case 'bd-blur': remember(cmd); S.cards.backdrop = Object.assign({}, S.cards.backdrop, { blur: v || undefined }); return changed(cmd, quiet);
      case 'upload': if (ev.type === 'change') upload(el.files); return;
    }
  }
  function pageSize(w, h) {
    w = Math.max(200, Math.min(1400, Math.round(w || 420))); h = Math.max(200, Math.min(2400, Math.round(h || 560)));
    remember(); const p = pg();
    // Things on the page keep their place relative to the middle.
    for (const e of p.els) { e.x = r1(e.x + (w - p.w) / 2); e.y = r1(e.y + (h - p.h) / 2); }
    p.w = w; p.h = h; S.zoomSet = false; fitZoom(); changed(); paintPanel();
  }
  function playPage() {
    const s = S.root.querySelector('.cm-canvas .c-stage'); if (!s) return;
    S.root.querySelector('[data-region="over"]').style.visibility = 'hidden';
    s.classList.remove('c-play'); void s.offsetWidth; s.classList.add('c-play');
    clearTimeout(S.playT); S.playT = setTimeout(() => { if (!S) return; const n = S.root.querySelector('.cm-canvas .c-stage'); if (n) n.classList.remove('c-play'); const o = $('over'); if (o) o.style.visibility = ''; }, 4500);
  }
  function duplicate() {
    const items = sel(); if (!items.length) return;
    if (items.every(e => e.type === 'part')) return U().toast('Working parts can only be on a page once.');
    remember(); const copies = items.filter(e => e.type !== 'part').map(e => Object.assign(clone(e), { id: K().newId(), x: e.x + 14, y: e.y + 14, lock: undefined }));
    pg().els.push(...copies); S.sel = copies.map(c => c.id); changed();
  }
  function removeSel() {
    const items = sel(); if (!items.length) return;
    const keep = items.filter(required);
    if (keep.length === items.length) return U().toast(`Guests need the ${K().PART_LABELS[keep[0].kind].toLowerCase()} on this page, so it can’t be deleted. You can move it, resize it or make it see-through.`);
    remember(); pg().els = pg().els.filter(e => !S.sel.includes(e.id) || required(e)); S.sel = keep.map(e => e.id); changed();
    if (keep.length) U().toast('Working parts guests need were kept.');
  }
  function arrange(k) {
    const els = pg().els, ids = S.sel; if (!ids.length) return;
    remember();
    const picked = els.filter(e => ids.includes(e.id)), rest = els.filter(e => !ids.includes(e.id));
    if (k === 'front') pg().els = rest.concat(picked);
    else if (k === 'back') pg().els = picked.concat(rest);
    else {
      const d = k === 'forward' ? 1 : -1, arr = els.slice(), idx = arr.map((e, i) => i);
      for (const i of d > 0 ? idx.reverse() : idx) { const j = i + d; if (ids.includes(arr[i].id) && j >= 0 && j < arr.length && !ids.includes(arr[j].id)) [arr[i], arr[j]] = [arr[j], arr[i]]; }
      pg().els = arr;
    }
    changed();
  }
  function alignTo(k) {
    const p = pg();
    setSel(e => {
      const h = boxH(e);
      if (k === 'left') e.x = 0; if (k === 'right') e.x = r1(p.w - e.w); if (k === 'hcenter') e.x = r1((p.w - e.w) / 2);
      if (k === 'top') e.y = 0; if (k === 'bottom') e.y = r1(p.h - h); if (k === 'vcenter') e.y = r1((p.h - h) / 2);
    });
  }
  async function upload(files) {
    if (!files || !files.length || !S.opts.onLibAdd) return;
    S.uploading = true; paintPanel();
    const added = [];
    try {
      for (const file of files) {
        if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { U().toast(`${file.name} isn’t a PNG, JPG, WebP or GIF.`, 'error'); continue; }
        if (file.size > 15e6) { U().toast(`${file.name} is too big. Please use pictures under 15 MB.`, 'error'); continue; }
        const { blob, w, h } = await P.shrinkImage(file);
        const src = await P.uploadMedia(blob.type ? blob : new Blob([blob], { type: file.type }));
        added.push({ src, name: file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 80), w, h });
      }
      if (added.length) { S.lib = await S.opts.onLibAdd(added); U().toast(added.length === 1 ? 'Picture added. Click it to put it on the card.' : `${added.length} pictures added.`); }
    } catch (err) { U().toast(err.message, 'error'); }
    if (!S) return;
    S.uploading = false; paintPanel();
  }
  function onKey(ev) {
    if (!S) return;
    const a = document.activeElement, typing = a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable);
    const mod = ev.ctrlKey || ev.metaKey, k = (ev.key || '').toLowerCase();
    if (document.querySelector('.a-modal-bg')) return;
    if (S.preview) {
      if (ev.key === 'Escape') closePreview();
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') S.root.querySelector(`[data-cm="pv"][data-d="${ev.key === 'ArrowRight' ? 1 : -1}"]`).click();
      return;
    }
    if (mod && k === 's') { ev.preventDefault(); return save(); }
    if (typing) return;
    if (S.crop) { if (ev.key === 'Enter') finishCrop(true); if (ev.key === 'Escape') finishCrop(false); return; }
    if (mod && k === 'z') { ev.preventDefault(); return undo(!ev.shiftKey); }
    if (mod && k === 'y') { ev.preventDefault(); return undo(false); }
    if (mod && k === 'd') { ev.preventDefault(); return duplicate(); }
    if (mod && k === 'c') { S.clip = sel().filter(e => e.type !== 'part').map(clone); return; }
    if (mod && k === 'v' && S.clip && S.clip.length) { ev.preventDefault(); remember(); const c = S.clip.map(e => Object.assign(clone(e), { id: K().newId(), x: e.x + 10, y: e.y + 10 })); pg().els.push(...c); S.sel = c.map(e => e.id); return changed(); }
    if (mod && k === 'a') { ev.preventDefault(); S.sel = pg().els.filter(e => !e.lock).map(e => e.id); paintOver(); return paintToolbar(); }
    if (ev.key === 'Escape') { hidePop(); S.sel = []; paintOver(); return paintToolbar(); }
    if (!S.sel.length) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); return removeSel(); }
    const st = ev.shiftKey ? 10 : 1, d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[ev.key];
    if (d) { ev.preventDefault(); setSel(e => { if (!e.lock) { e.x = r1(e.x + d[0]); e.y = r1(e.y + d[1]); } }, 'nudge', { toolbar: false }); }
    if (ev.key === 'Enter') { const e = one(); if (e && e.type === 'text') { ev.preventDefault(); startTextEdit(e.id); } }
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
  // iPhone/iPad zoom into small text boxes when tapped (the name box). Stop that zoom there only; people can still pinch to zoom.
  if (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && !/maximum-scale/.test(vp.content)) vp.content += ', maximum-scale=1';
  }
  // jrick (2026-11-04): guest pages are portrait only on phones. Browsers can't lock rotation, so a sideways phone sees a "turn upright" screen.
  if (!preview && !document.querySelector('.g-rotate')) {
    const rot = document.createElement('div');
    rot.className = 'g-rotate'; rot.setAttribute('role', 'alert');
    rot.innerHTML = '<div class="g-rotate-in"><div class="g-rotate-phone" aria-hidden="true"></div><p>Please turn your phone upright</p></div>';
    document.body.appendChild(rot);
    try { screen.orientation && screen.orientation.lock && screen.orientation.lock('portrait').catch(() => {}); } catch (e) {}
  }
  // A guest's own link: /r/<family>?g=<guest>.<key>. Only it may change that guest's answer later.
  const gk = /^[A-Za-z0-9]{1,20}\.[A-Za-z0-9]{1,20}$/.test(route.query.get('g') || '') ? route.query.get('g') : '';

  const G = { site: null, closed: false, step: 'welcome', token: tokenFromLink, r: null, answers: {}, error: '', busy: false, previewMode: false, history: [] };

  const t = (key, r) => esc(C.fill(G.site[key] != null ? G.site[key] : C.DEFAULT_SITE[key], G.site, r));
  // Text the couple wrote: **bold** words and blank lines between paragraphs are kept.
  // Formatting the studio adds in Wording: **bold**, *italic*, __underline__.
  const rich = (key, r) => t(key, r).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, '$1<em>$2</em>');
  const paras = (key, r, cls) => rich(key, r).split(/\n\s*\n/).map(x => `<p class="${cls || 'g-text'}">${x.replace(/\n/g, '<br>')}</p>`).join('');

  const ICONS = {
    person: '<circle cx="24" cy="15" r="7.5"/><path d="M9 41c0-8.5 6.7-14 15-14s15 5.5 15 14"/>',
    calendar: '<rect x="8" y="11" width="32" height="28" rx="5"/><path d="M8 19.5h32M16 7v8M32 7v8"/><path d="M24 34.5s-5-3-5-6.2a2.6 2.6 0 0 1 5-1.2 2.6 2.6 0 0 1 5 1.2c0 3.2-5 6.2-5 6.2z"/>',
    check: '<path d="M10 25l9 9 19-20"/>',
    back: '<path d="M29 11L16 24l13 13"/>',
    cross: '<path d="M12 12l24 24M36 12L12 36" stroke-width="5"/>',
  };
  // Pinyon Script's own "&" is hard to read, so names borrow a classic script ampersand.
  const names = n => esc(n).replace(/&amp;/g, '<span class="g-amp">&amp;</span>');
  const icon = (name, cls) => `<svg class="${cls || 'g-icon'}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  // Small dots at the top of every card showing which step the guest is on, in the couple's colors.
  const STEPS = ['welcome', 'notice', 'invite', 'reservation', 'thanks'];
  const steps = () => { const at = STEPS.indexOf(G.step); return at < 0 ? '' : `<span class="g-glow g-steps" aria-hidden="true">${STEPS.map((s, i) => `<i class="${i === at ? 'is-on' : ''}"></i>`).join('')}</span>`; };
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
    const card = app.querySelector('.g-card, .f-stage, .c-stage');
    const show = () => {
      change();
      window.scrollTo(0, 0);
      const next = app.querySelector('.g-card, .f-stage, .c-stage');
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
    transition(() => { G.step = G.history.pop() || (fairy() ? 'notice' : 'welcome'); G.error = ''; render(); }, 'back');
  }

  const banner = () => G.previewMode ? '<div class="g-preview-banner">Preview · This is what your guests see. Nothing you choose here is saved.</div>' : '';
  const foot = '<p class="g-foot">With Love by Pixie Craft Studio</p>';
  // Lets guests go back to a screen they skipped past too quickly.
  const backBtn = () => G.history.length && G.step !== 'thanks' ? `<button type="button" class="g-back" data-act="back" aria-label="Go back to the previous screen">${icon('back', 'g-back-ic')}<span>Back</span></button>` : '';
  function shell(inner, cls) {
    return `<div class="g-page">
      <div class="g-bg" aria-hidden="true"></div>
      ${banner()}
      <main class="g-card ${cls || ''}">${backBtn()}${steps()}${inner}</main>
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
        <div class="g-hero" data-region="hero" aria-hidden="true"></div>
        ${banner()}
        <main class="g-card g-card-res">
          ${backBtn()}${steps()}
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
      // A few petals drift down once to celebrate the answer.
      const petals = `<div class="g-petals" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<i style="--x:${(i * 61) % 100}%;--w:${(i % 8) * .35}s;--d:${5 + (i % 5)}s;--px:${(i % 2 ? 1 : -1) * (30 + (i * 17) % 60)}px;--pr:${200 + (i * 47) % 300}deg"></i>`).join('')}</div>`;
      return petals + shell(`
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

  // ---------- Fairy Garden design ----------
  // Kindly RSVP -> Hello, what's your name? -> I reserved N seats for you -> Thank you. Guests who aren't the
  // Designated RSVP Representative see a "Surprise! No worries" card instead of the answers.
  // Fairy Garden and the studio's own cards (Card Maker) share one guest flow; fairyLook() is the Fairy Garden pictures only.
  const fairyLook = () => !!(G.theme && G.theme.rsvpDesign === 'fairy');
  const custom = () => !!(G.theme && G.theme.rsvpDesign === 'custom' && G.theme.cards && G.theme.cards.pages);
  const fairy = () => fairyLook() || custom();
  const F = P.fairy;
  const invite = () => (G.theme && G.theme.invitationLink) || '';
  const fBack = () => G.history.length && !['thanks', 'surprise'].includes(G.step) ? `<button type="button" class="f-back" data-act="back" aria-label="Go back to the previous screen">${icon('back', 'g-back-ic')}<span>Back</span></button>` : '';
  const fPage = (inner, cls) => `<div class="f-page ${cls || ''}"><div class="f-bg" aria-hidden="true" style="background-image:url('${esc(F('fairy-bg.jpg'))}')"></div>${banner()}${inner}</div>`;
  const fSize = k => `--fs:${(Number(G.theme && G.theme[k]) || 100) / 100};`;
  const fCard = (img, cls, inner, css) => `<main class="f-stage f-card ${cls}" style="background-image:url('${esc(F(img))}');${css || ''}"><div class="f-in">${inner}</div></main>`;
  // Runs of capitals (like RSVP) get a little air, as in the design.
  const fcaps = html => html.replace(/(^|>)([^<]+)/g, (m, a, txt) => a + txt.replace(/[A-Z]{2,}/g, w => `<span class="f-caps">${w}</span>`));
  // A card part the Design tab can edit: its saved look (move, size, turn, colors, font, hidden) goes on it inline.
  const partOf = id => (G.theme && G.theme.parts && G.theme.parts[G.step] && G.theme.parts[G.step][id]) || null;
  function partStyle(p) {
    let st = '';
    if (!p) return st;
    if (p.x || p.y) st += `--px:${p.x || 0};--py:${p.y || 0};`;
    if (p.s && p.s !== 1) st += `scale:${p.s};`;
    if (p.rot) st += `rotate:${p.rot}deg;`;
    if (p.op !== undefined && p.op !== 1) st += `opacity:${p.op};`;
    if (p.color) st += `color:${p.color};--f-ink:${p.color};--f-text:${p.color};`;
    if (p.fill) st += `background:${p.fill};`;
    if (p.font) st += `font-family:'${esc(P.fontFamily(p.font))}';`;
    return st;
  }
  const fp = (id, key) => {
    const p = partOf(id), st = partStyle(p);
    return `data-part="${id}"${key ? ` data-key="${key}"` : ''}${p && p.hide ? ' data-hide' : ''}${st ? ` style="${st}"` : ''}`;
  };
  // Live edits from the Design tab: restyle the parts in place, so nothing replays.
  function restyleParts() {
    if (!fairyLook()) return;
    app.querySelectorAll('[data-part]').forEach(el => {
      const p = partOf(el.dataset.part), st = partStyle(p);
      if (st) el.setAttribute('style', st); else el.removeAttribute('style');
      el.toggleAttribute('data-hide', !!(p && p.hide));
    });
    const fonts = Object.values((G.theme.parts && G.theme.parts[G.step]) || {}).map(p => p.font).filter(Boolean);
    if (fonts.length) P.loadFonts(fonts);
    paintCardPicture();
  }
  // The admin's own card picture (from My elements) in place of the painted card.
  let picToken = 0;
  async function paintCardPicture() {
    const p = partOf('card'), el = app.querySelector(G.step === 'change' ? '.f-paper' : '.f-stage.f-card');
    if (!el) return;
    const mine = ++picToken;
    if (!p || !p.src) { if (el.dataset.pic) { el.style.backgroundImage = el.dataset.pic; delete el.dataset.pic; } return; }
    const src = await P.mediaUrl(p.src).catch(() => null);
    if (mine !== picToken || !src) return;
    if (!el.dataset.pic) el.dataset.pic = el.style.backgroundImage;
    el.style.backgroundImage = `url("${src}")`;
  }
  const fparas = (key, r) => rich(key, r).split(/\n\s*\n/).map(x => `<p class="f-text">${x.replace(/\n/g, '<br>')}</p>`).join('');
  const fviews = {
    notice() {
      return fPage(fCard('fairy-card-rsvp.webp', 'f-card-rsvp', `
        ${G.site.fairyTitle === C.DEFAULT_SITE.fairyTitle ? `<h1 class="f-title f-title-img" ${fp('title', 'fairyTitle')}><img src="${esc(F('fairy-t-kindly.webp'))}" alt="${esc(G.site.fairyTitle)}"></h1>` : `<h1 class="f-script f-title" ${fp('title', 'fairyTitle')}>${fcaps(rich('fairyTitle'))}</h1>`}
        <p class="f-hand f-sub" ${fp('sub', 'fairySubtitle')}>${rich('fairySubtitle')}</p>
        ${fparas('fairyMessage').replace(/<p class="f-text">/g, `<p class="f-text" ${fp('msg', 'fairyMessage')}>`)}
        <p class="f-text f-closing" ${fp('closing', 'fairyClosing')}>${rich('fairyClosing')}</p>
        <button class="f-btn" data-act="f-next" ${fp('btn', 'fairyNext')}>${rich('fairyNext')}</button>`, fSize('fairyRsvpSize')));
    },
    invite() {
      return fPage(fCard('fairy-card-name.webp', 'f-card-name', `
        <h1 class="f-script f-title" ${fp('title', 'fairyHello')}>${rich('fairyHello')}</h1>
        <p class="f-hand f-sub" ${fp('sub', 'fairyAsk')}>${rich('fairyAsk')}</p>
        <p class="f-text" ${fp('text', 'fairyAskSub')}>${rich('fairyAskSub')}</p>
        <form class="f-search" data-form="search" novalidate>
          <label for="g-name" class="g-sr">Your first name and last name</label>
          <input id="g-name" name="name" autocomplete="name" placeholder="${t('fairyPlaceholder')}" required ${fp('input', 'fairyPlaceholder')}>
          ${G.error ? `<p class="f-error" role="alert">${esc(G.error)}</p>` : ''}
          <button class="f-btn" ${G.busy ? 'disabled' : ''} ${fp('btn', 'fairyFind')}>${G.busy ? 'Finding…' : t('fairyFind')}</button>
        </form>`, fSize('fairyNameSize')));
    },
    surprise() {
      const r = G.r;
      return fPage(fCard('fairy-card-surprise.webp', 'f-card-surprise', `
        <h1 class="f-script f-title" ${fp('title', 'fairySurprise')}>${rich('fairySurprise', r)}</h1>
        <p class="f-hand f-sub" ${fp('sub', 'fairySurpriseSub')}>${rich('fairySurpriseSub', r)}</p>
        <p class="f-text" ${fp('text', r.submittedAt ? 'fairySurpriseDone' : 'fairySurpriseWait')}>${rich(r.submittedAt ? 'fairySurpriseDone' : 'fairySurpriseWait', r)}</p>
        <button class="f-btn" data-act="${r.submittedAt ? 'f-viewonly' : 'f-again'}" ${fp('btn', 'fairySurpriseButton')}>${rich('fairySurpriseButton', r)}</button>`, fSize('fairySurpriseSize')));
    },
    reservation() {
      const r = G.r, me = G.who || r.repId;
      // Fairy Garden: after the first answer this page is for viewing only; each guest changes their own answer with "Change of Mind?".
      const repHere = r.repId && r.guests.some(g => g.id === r.repId), isRep = !repHere || (G.who || r.repId) === r.repId;
      const view = fairy() && (!!r.submittedAt || !isRep);
      const going = r.guests.filter(g => G.answers[g.id] === 'attending'), notGoing = r.guests.filter(g => G.answers[g.id] !== 'attending');
      const rows = r.guests.map(g => {
        const on = G.answers[g.id] === 'attending';
        return `<li class="f-row ${g.id === G.justAnswered ? 'is-just' : ''}">
          <span class="f-row-name">${esc(g.name)}</span>
          <button type="button" class="f-switch ${on ? 'is-on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(g.name)} is coming" data-act="f-toggle" data-g="${g.id}" ${G.closed || view ? 'disabled' : ''}><i></i></button></li>`;
      }).join('');
      const recap = (arr, yes) => arr.map(g => `<li class="${yes ? 'yes' : 'no'}${g.id === G.justAnswered ? ' is-new' : ''}"><span>${yes ? '✓' : '✕'}</span><span class="f-recap-name">${esc(g.name)}</span><span class="f-recap-st">${yes ? esc(C.fill(G.site.attendingLabel, G.site)) : esc(C.fill(G.site.notAttendingLabel, G.site))}</span></li>`).join('');
      const note = G.closed ? `<p class="f-note">The RSVP deadline (${esc(C.formatDeadline(G.site.deadline))}) has passed, so answers can no longer be changed here.</p>`
        : r.submittedAt && !view ? `<p class="f-note">You already sent your RSVP. You can change it until ${esc(C.formatDeadline(G.site.deadline))}.</p>` : '';
      return fPage(`<main class="f-stage f-res" style="${fSize('fairyResSize')}">
          <div class="f-res-body" style="--rt:url('${esc(F('fairy-res3-top.webp'))}');--rm:url('${esc(F('fairy-res3-mid.png'))}');--rb:url('${esc(F('fairy-res3-bot.webp'))}')">
            <div class="f-res-in">
              <p class="f-hand f-reserved" ${fp('reserved', 'fairyReserved')}>${rich('fairyReserved', r)}</p>
              <p class="f-script f-num" ${fp('num')}>${r.seats}</p>
              <p class="f-hand f-seats" ${fp('seats', 'fairySeatsWord')}>${r.seats === 1 ? esc(C.fill(G.site.fairySeatsWord, G.site, r)).replace(/s$/i, '') : rich('fairySeatsWord', r)}</p>
              <p class="f-text f-for" ${fp('for', 'fairyForYou')}>${rich('fairyForYou', r)}</p>
              <p class="f-text f-small" ${fp('count', 'fairyCount')}>${rich('fairyCount', r)}</p>
              ${note}
              <ul class="f-rows" ${fp('rows')}>${rows}</ul>
              <h2 class="f-check" ${fp('check', 'fairyCheck')}>${rich('fairyCheck', r)}</h2>
              <p class="f-text f-small f-yay" ${fp('yay')}>${going.length ? `Yay! ${going.length} out of ${r.guests.length} ${going.length === 1 ? 'is' : 'are'} coming!` : `No one is coming? We’ll miss you!`}</p>
              <ul class="f-recap" ${fp('recap')}>${recap(going, true)}${notGoing.length && going.length ? '<li class="f-gap"></li>' : ''}${recap(notGoing, false)}</ul>
              ${G.error ? `<p class="f-error" role="alert">${esc(G.error)}</p>` : ''}
              ${G.closed ? '' : view ? `<button class="f-btn f-mind" data-act="f-mind" ${fp('btn', 'fairyChangeMind')}>${rich('fairyChangeMind', r)}</button>` : `<button class="f-btn" data-act="f-submit" ${G.busy ? 'disabled' : ''} ${fp('btn', 'fairySubmit')}>${G.busy ? 'Sending…' : t('fairySubmit')}</button>`}
            </div>
          </div>
        </main>`, 'f-page-res');
    },
    // A Little Change of Plans? The pink paper rises out of the envelope; the guest changes only their own answer.
    change() {
      const r = G.r, me = r.guests.find(g => g.id === (G.who || r.repId)) || r.guests[0];
      const first = (me.name || '').trim().split(/\s+/)[0] || '';
      const v = G.mine || (me.status === 'not_attending' ? 'not_attending' : 'attending');
      const opt = (val, key, extra) => `<button type="button" class="f-opt" role="radio" aria-checked="${v === val}" data-act="f-pick" data-v="${val}" ${G.closed ? 'disabled' : ''}>
          <span class="f-tog ${v === val ? 'is-on' : ''}"><i></i></span><span class="f-opt-t">${rich(key, r)}${extra || ''}</span></button>`;
      return fPage(`<main class="f-stage f-env" style="${fSize('fairyChangeSize')}--eb:url('${esc(F('fairy-env-back.webp'))}');--ef:url('${esc(F('fairy-env-front.webp'))}')">
          <div class="f-env-back" aria-hidden="true"></div>
          <div class="f-env-slot"><div class="f-paper" style="background-image:url('${esc(F('fairy-paper.webp'))}')">
            ${G.site.fairyChangeTitle == null || G.site.fairyChangeTitle === C.DEFAULT_SITE.fairyChangeTitle ? `<h1 class="f-ctitle-img" ${fp('ctitle', 'fairyChangeTitle')}><img src="${esc(F('fairy-t-change.webp'))}" alt="${esc(C.DEFAULT_SITE.fairyChangeTitle)}"></h1>` : `<h1 class="f-script f-ctitle" ${fp('ctitle', 'fairyChangeTitle')}>${rich('fairyChangeTitle', r)}</h1>`}
            <p class="f-chello" ${fp('chello', 'fairyChangeHello')}>${esc(C.fill(G.site.fairyChangeHello != null ? G.site.fairyChangeHello : C.DEFAULT_SITE.fairyChangeHello, G.site, r).replace(/\{name\}/g, first))}</p>
            <div class="f-opts" ${fp('opts')} role="radiogroup" aria-label="${esc(me.name)}">${opt('attending', 'fairyYes', `<img class="f-tulip" src="${esc(F('fairy-tulip.webp'))}" alt="">`)}${opt('not_attending', 'fairyNo')}</div>
            ${G.error ? `<p class="f-error" role="alert">${esc(G.error)}</p>` : ''}
            ${G.closed ? `<p class="f-error">The RSVP deadline has passed, so answers can no longer be changed here.</p>` : `<button class="f-btn f-save" data-act="f-save" ${G.busy ? 'disabled' : ''} ${fp('btn', 'fairySave')}>${G.busy ? 'Saving…' : rich('fairySave', r)}</button>`}
          </div></div>
          <div class="f-env-front" aria-hidden="true"></div>
        </main>`, 'f-page-env');
    },
    thanks() {
      const link = invite(), word = C.fill(G.site.fairyThanks, G.site, G.r);
      // Small butterflies at half opacity drift around the words.
      const flies = Array.from({ length: 7 }, (_, i) => `<img class="f-fly" src="${esc(F('fairy-butterfly.webp'))}" alt="" style="--i:${i};--s:${[34, 26, 40, 22, 30, 24, 36][i]}px;--d:${[13, 16, 11, 18, 14, 17, 12][i]}s;--w:${-i * 1.7}s">`).join('');
      return fPage(`<main class="f-stage f-thanks" style="${fSize('fairyThanksSize')}">
          <div class="f-flies" aria-hidden="true">${flies}</div>
          <h1 class="g-sr">${esc(word)}</h1>
          ${G.site.fairyThanks === C.DEFAULT_SITE.fairyThanks ? `<span class="f-write-img" aria-hidden="true" ${fp('write', 'fairyThanks')}><span class="f-pen-mask"><img src="${esc(F('fairy-t-thanks.webp'))}" alt=""></span></span>` : `<svg class="f-write" ${fp('write', 'fairyThanks')} viewBox="0 0 700 170" aria-hidden="true"><defs><clipPath id="f-wipe"><rect class="f-wipe" x="0" y="0" width="700" height="170"/></clipPath></defs>
            <text x="350" y="118" text-anchor="middle" class="f-write-fill" clip-path="url(#f-wipe)">${esc(word)}</text>
            <text x="350" y="118" text-anchor="middle" class="f-write-line">${esc(word)}</text></svg>`}
          ${G.previewMode ? '<p class="f-note">Preview only: this answer was not saved.</p>' : ''}
          ${link ? `<a class="f-link" ${fp('link', 'fairyBackLink')} href="${esc(link)}" target="_top" rel="noopener">${rich('fairyBackLink', G.r)}</a>` : `<button type="button" class="f-link" data-act="f-again" ${fp('link', 'fairyBackLink')}>${rich('fairyBackLink', G.r)}</button>`}
        </main>`, 'f-page-thanks');
    },
    error() { return views.error(); },
  };
  // ---------- the studio's own cards (Card Maker) ----------
  function cview() {
    const K = P.cards, cards = G.theme.cards, key = cards.pages[G.step] ? G.step : 'notice', r = G.r || null;
    const repHere = r && r.repId && r.guests.some(g => g.id === r.repId), isRep = !repHere || (G.who || r.repId) === r.repId;
    const view = !!(r && (r.submittedAt || !isRep));
    const ctx = { mode: 'guest', site: G.site, theme: G.theme, r, answers: G.answers, who: G.who, view, closed: G.closed, busy: G.busy, mine: G.mine, justAnswered: G.justAnswered };
    const bd = K.backdrop(cards), builtIn = bd.src && /^fairy-/.test(bd.src);
    const back = G.history.length && !['thanks', 'surprise'].includes(G.step) ? `<button type="button" class="c-back" data-act="back" aria-label="Go back to the previous screen">${icon('back', 'g-back-ic')}<span>Back</span></button>` : '';
    const msgs = [
      G.error && `<p class="c-msg" role="alert">${esc(G.error)}</p>`,
      key === 'reservation' && r && r.submittedAt && !view && !G.closed && `<p class="c-msg is-info">You already sent your RSVP. You can change it until ${esc(C.formatDeadline(G.site.deadline))}.</p>`,
      key === 'change' && G.closed && `<p class="c-msg">The RSVP deadline has passed, so answers can no longer be changed here.</p>`,
      key === 'thanks' && G.previewMode && '<p class="c-msg is-info">Preview only: this answer was not saved.</p>',
    ].filter(Boolean).join('');
    return `<div class="c-wrap"><div class="c-backdrop" aria-hidden="true" ${bd.src && !builtIn ? `data-cbg="${esc(bd.src)}"` : ''}
        style="background-color:${esc(bd.color)};${builtIn ? `background-image:url('${esc(F(bd.src))}');` : ''}${bd.blur ? `filter:blur(${bd.blur}px);` : ''}"></div>
      ${banner()}${back}${K.page(cards, key, ctx)}${msgs}</div>`;
  }
  // The handwriting starts once its font is ready, so the pen draws the real letters.
  function startWriting() {
    const svg = app.querySelector('.f-write'); if (!svg) return;
    const go = () => {
      const line = svg.querySelector('.f-write-line'); let len = 2400;
      try { len = Math.ceil(line.getComputedTextLength() * 4); } catch (e) { /* keep the default */ }
      svg.style.setProperty('--len', len);
      svg.classList.add('is-writing');
    };
    const f = document.fonts && document.fonts.load ? document.fonts.load('60px "Homemade Apple"') : Promise.resolve();
    Promise.race([f, new Promise(r => setTimeout(r, 2500))]).then(go, go);
  }

  // Top of the reservation page: the uploaded video, else the background photo shown clearly.
  let heroToken = 0;
  async function paintHero() {
    const el = app.querySelector('[data-region="hero"]'), th = G.theme;
    if (!el || !th) return;
    const mine = ++heroToken;
    el.dataset.bg = th.background;
    el.classList.toggle('is-soft', th.blur !== false);
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
    if (custom()) {
      app.innerHTML = cview();
      document.body.classList.remove('is-fairy');
      P.loadFonts(P.cards.fonts(G.theme.cards)); P.cards.paint(app);
      return;
    }
    const V = fairy() ? fviews : views;
    app.innerHTML = (V[G.step] || V[fairy() ? 'notice' : 'welcome'])();
    document.body.classList.toggle('is-fairy', fairy());
    if (fairy()) { P.loadFonts(['Homemade Apple', 'Cedarville Cursive', 'Fuzzy Bubbles', 'Gilda Display', 'Thasadith', 'La Belle Aurore']); startWriting(); }
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
  // Design tab, Fairy Garden: the card itself is an element you can click and resize from its corner dot.
  const F_SIZE_KEY = { notice: 'fairyRsvpSize', invite: 'fairyNameSize', surprise: 'fairySurpriseSize', reservation: 'fairyResSize', change: 'fairyChangeSize', thanks: 'fairyThanksSize' };
  function paintFairyHandle() {
    const st = design && fairyLook() && F_SIZE_KEY[screenKey()] && app.querySelector('.f-stage'); if (!st) return;
    st.classList.add('f-design'); st.classList.toggle('is-sel', D.sel === 'fairy-card');
    if (!st.querySelector(':scope > .f-size-h')) st.insertAdjacentHTML('beforeend', '<span class="f-size-h" data-h="fsize" title="Drag to resize"></span>');
  }
  function paintDecor() {
    paintFairyHandle(); restyleParts(); paintSelBox();
    const card = app.querySelector(fairyLook() ? '.f-stage' : '.g-card'), k = screenKey();
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
  // ---------- Design tab, Fairy Garden: the parts of the card ----------
  const partEls = id => [...app.querySelectorAll(`[data-part="${id}"]`)];
  const selPart = () => D.sel && D.sel.startsWith('p:') ? D.sel.slice(2) : null;
  // One design pixel (the card drawn at 100%) in screen pixels.
  function kPx(el) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:calc(100 * var(--k));height:0';
    el.appendChild(probe); const v = probe.getBoundingClientRect().width / 100; probe.remove();
    return v || 1;
  }
  function paintSelBox() {
    let box = document.querySelector('.f-selbox');
    const id = selPart(), els = design && id ? partEls(id) : [];
    if (!els.length) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div'); box.className = 'f-selbox';
      box.innerHTML = '<span class="f-sb-size" data-h="size" title="Drag to resize"></span><span class="f-sb-turn" data-h="turn" title="Drag to turn"></span>';
      document.body.appendChild(box); box.addEventListener('pointerdown', partDrag);
    }
    const rs = els.map(e => e.getBoundingClientRect()), l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top));
    Object.assign(box.style, { left: l + 'px', top: t + 'px', width: Math.max(...rs.map(r => r.right)) - l + 'px', height: Math.max(...rs.map(r => r.bottom)) - t + 'px' });
  }
  if (design) { addEventListener('scroll', paintSelBox, { passive: true }); addEventListener('resize', paintSelBox); }
  // Drag a part to move it; the corner dot resizes it, the top dot turns it. The board keeps the change (so Undo works).
  function partDrag(e) {
    const id = selPart(); if (!id) return;
    const els = partEls(id); if (!els.length) return;
    e.preventDefault(); e.stopPropagation();
    const p0 = Object.assign({ x: 0, y: 0, s: 1, rot: 0 }, partOf(id)), k = kPx(els[0].closest('.f-stage') || app);
    const rs = els.map(x => x.getBoundingClientRect()), cx = (Math.min(...rs.map(r => r.left)) + Math.max(...rs.map(r => r.right))) / 2, cy = (Math.min(...rs.map(r => r.top)) + Math.max(...rs.map(r => r.bottom))) / 2;
    const mode = e.target.dataset.h || 'move', sx = e.clientX, sy = e.clientY, d0 = Math.hypot(sx - cx, sy - cy) || 1;
    const next = Object.assign({}, p0), cap = e.target; cap.setPointerCapture(e.pointerId);
    const move = ev => {
      if (mode === 'move') { next.x = Math.round((p0.x + (ev.clientX - sx) / k) * 10) / 10; next.y = Math.round((p0.y + (ev.clientY - sy) / k) * 10) / 10; }
      if (mode === 'size') next.s = Math.round(Math.min(5, Math.max(0.2, p0.s * Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0)) * 1000) / 1000;
      if (mode === 'turn') {
        let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90;
        if (a > 180) a -= 360;
        for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(a - snap) < 4) a = snap;
        next.rot = Math.round(a);
      }
      els.forEach(x => { x.style.setProperty('--px', next.x); x.style.setProperty('--py', next.y); x.style.scale = next.s; x.style.rotate = next.rot + 'deg'; });
      paintSelBox();
    };
    const up = () => {
      cap.removeEventListener('pointermove', move); cap.removeEventListener('pointerup', up); cap.removeEventListener('pointercancel', up);
      const patch = {};
      for (const f of ['x', 'y', 's', 'rot']) if (next[f] !== p0[f]) patch[f] = next[f];
      if (Object.keys(patch).length) tell({ type: 'pixie-part-change', id, patch });
    };
    cap.addEventListener('pointermove', move); cap.addEventListener('pointerup', up); cap.addEventListener('pointercancel', up);
  }
  function select(id) {
    D.sel = id; paintSelBox();
    app.querySelectorAll('.g-el').forEach(x => x.classList.toggle('is-sel', x.dataset.el === id));
    const st = app.querySelector('.f-stage.f-design'); if (st) st.classList.toggle('is-sel', id === 'fairy-card');
  }
  if (design) {
    document.body.classList.add('g-designing');
    app.addEventListener('pointerdown', e => {
      const node = e.target.closest('.g-el'), part = !node && fairyLook() && e.target.closest('[data-part]'), fst = !node && !part && e.target.closest('.f-stage.f-design');
      if (part) {
        const id = part.dataset.part;
        if (D.sel !== 'p:' + id) { select('p:' + id); tell({ type: 'pixie-part-select', id, key: part.dataset.key || '' }); }
        return partDrag(e);
      }
      if (fst) {
        e.preventDefault();
        if (D.sel !== 'fairy-card') { select('fairy-card'); window.parent.postMessage({ type: 'pixie-fairy-select', on: true }, '*'); }
        if (e.target.dataset.h !== 'fsize') return;
        const key = F_SIZE_KEY[screenKey()], v0 = Number(G.theme[key]) || 100, r = fst.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
        let v = v0; const h = e.target; h.setPointerCapture(e.pointerId);
        const move = ev => { v = Math.round(Math.min(160, Math.max(60, v0 * Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0))); fst.style.setProperty('--fs', v / 100); };
        const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); if (v !== v0) window.parent.postMessage({ type: 'pixie-fairy-size', key, value: v }, '*'); };
        h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
        return;
      }
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
      const pid = selPart();
      if (pid) {
        const pd = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key], m = e.shiftKey ? 5 : 1;
        if (pd) { e.preventDefault(); tell({ type: 'pixie-part-nudge', id: pid, dx: pd[0] * m, dy: pd[1] * m }); }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); tell({ type: 'pixie-part-change', id: pid, patch: { hide: true } }); }
        return;
      }
      if (d) { e.preventDefault(); tell({ type: 'pixie-decor-nudge', id: D.sel, dx: d[0], dy: d[1] }); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); tell({ type: 'pixie-decor-delete', id: D.sel }); }
    });
  }
  // The board's Customize page sends unsaved looks here so the preview updates live.
  window.addEventListener('message', e => {
    if (!preview || e.source !== window.parent || !e.data) return;
    if (e.data.type === 'pixie-decor-select') {
      select(e.data.id);
      const pid = selPart(), el = pid && partEls(pid)[0];
      if (el) tell({ type: 'pixie-part-select', id: pid, key: el.dataset.key || '' });
      return;
    }
    if (e.data.type !== 'pixie-theme') return;
    if (design && e.data.selected !== undefined) D.sel = e.data.selected;
    // The look can arrive before this page has finished loading; keep it and use it once ready.
    if (!G.site) { G.pendingTheme = e.data.theme; return; }
    if (!G.previewMode) return;
    const logoChanged = !G.theme || G.theme.logo !== e.data.theme.logo || G.theme.rsvpDesign !== e.data.theme.rsvpDesign || G.theme.invitationLink !== e.data.theme.invitationLink || ['fairyRsvpSize', 'fairyNameSize', 'fairySurpriseSize', 'fairyResSize', 'fairyChangeSize', 'fairyThanksSize'].some(k => G.theme[k] !== e.data.theme[k])
      || JSON.stringify(G.theme.cards || null) !== JSON.stringify(e.data.theme.cards || null);
    if (G.theme && G.theme.rsvpDesign !== e.data.theme.rsvpDesign) {
      const map = ['fairy', 'custom'].includes(e.data.theme.rsvpDesign) ? { welcome: 'notice' } : { notice: 'welcome', surprise: 'invite' };
      if (map[G.step]) G.step = map[G.step];
    }
    // Design tab: words typed into a selected part come with the look.
    let wordsChanged = false;
    if (e.data.site && typeof e.data.site === 'object') {
      wordsChanged = Object.keys(e.data.site).some(k => G.site[k] !== e.data.site[k]);
      if (wordsChanged) G.site = Object.assign({}, G.site, e.data.site);
    }
    G.theme = e.data.theme; P.applyTheme(document.body, G.theme); P.paintBackground(app.querySelector('.g-bg'), G.theme);
    if ((logoChanged || wordsChanged) && !moving) { const y = scrollY; render(); scrollTo(0, y); } else { paintHero(); paintDecor(); }
  });

  async function openReservation(token) {
    const data = await P.api('GET', '/api/r/' + token + pq + (gk ? (pq ? '&' : '?') + 'g=' + encodeURIComponent(gk) : ''));
    G.r = data.reservation; G.closed = data.closed; G.token = token;
    if (data.me) { G.who = data.me; G.verified = true; }
    if (!G.site) { G.site = data.site; G.theme = data.theme; slug = data.slug; G.previewMode = data.preview; }
    G.answers = {};
    for (const g of G.r.guests) if (g.status !== 'awaiting') G.answers[g.id] = g.status;
    // Fairy Garden uses on/off switches, so everyone starts as coming until the guest switches them off.
    if (fairy()) for (const g of G.r.guests) if (!G.answers[g.id]) G.answers[g.id] = 'attending';
  }

  // Fairy Garden: the representative answers for everyone (once); anyone else in the group gets the Surprise card.
  function fairyStep() {
    const r = G.r, repHere = r && r.repId && r.guests.some(g => g.id === r.repId);
    return fairy() && repHere && G.who && G.who !== r.repId ? 'surprise' : 'reservation';
  }
  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b || design) return;
    const act = b.dataset.act;
    if (act === 'back') return back();
    if (act === 'f-viewonly') { G.error = ''; return go('reservation'); }
    if (act === 'f-mind') { G.mine = null; G.error = ''; return go('change'); }
    if (act === 'f-pick') {
      G.mine = b.dataset.v;
      app.querySelectorAll('[data-act="f-pick"]').forEach(x => { const on = x.dataset.v === G.mine; x.setAttribute('aria-checked', on); x.querySelector('.f-tog, .c-tog').classList.toggle('is-on', on); });
      return;
    }
    if (act === 'f-save') {
      const r = G.r, who = G.who || r.repId, status = G.mine || ((r.guests.find(g => g.id === who) || {}).status === 'not_attending' ? 'not_attending' : 'attending');
      G.busy = true; G.error = ''; render();
      try { await P.api('POST', '/api/r/' + G.token + '/guest', { guestId: who, key: gk, status, preview }); G.busy = false; G.history = []; go('thanks'); }
      catch (err) { G.busy = false; G.error = err.message; if (err.status === 403) G.closed = true; render(); }
      return;
    }
    if (act === 'f-next') {
      if (!G.token) return go('invite');
      try { await openReservation(G.token); go(fairyStep()); }
      catch (err) { G.token = null; G.pendingError = err.message; go('invite'); }
      return;
    }
    if (act === 'f-again') { G.history = ['notice']; return transition(() => { G.step = 'invite'; G.error = ''; G.token = tokenFromLink; render(); }, 'back'); }
    if (act === 'f-toggle') {
      const id = b.dataset.g; G.answers[id] = G.answers[id] === 'attending' ? 'not_attending' : 'attending'; G.justAnswered = id;
      const y = window.scrollY; render(); window.scrollTo(0, y);
      const again = app.querySelector(`[data-act="f-toggle"][data-g="${id}"]`);
      // Slide the knob from where it was to where it is now.
      if (again) { again.classList.toggle('is-on'); void again.offsetWidth; again.classList.toggle('is-on'); again.focus({ preventScroll: true }); }
      return;
    }
    if (act === 'f-submit') {
      for (const g of G.r.guests) if (!G.answers[g.id]) G.answers[g.id] = 'attending';
      G.busy = true; G.error = ''; render();
      try { await P.api('POST', '/api/r/' + G.token + '/rsvp', { answers: G.answers, preview }); G.busy = false; G.history = []; go('thanks'); }
      catch (err) { G.busy = false; G.error = err.message; if (err.status === 403) G.closed = true; render(); }
      return;
    }
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
      const { token, guestId } = await P.api('POST', '/api/w/' + slug + '/find', { name, preview });
      await openReservation(token);
      // Typing a name finds the seat, but only the guest's own link can change their answer later.
      if (guestId !== G.who) G.verified = false;
      G.who = guestId || null;
      G.busy = false; go(fairyStep());
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
      let step = route.query.get('step');
      if (fairy()) { G.step = 'notice'; if (step === 'welcome') step = null; if (step === 'notice') step = null; if (G.token) for (const g of G.r.guests) if (!G.answers[g.id]) G.answers[g.id] = 'attending'; }
      if (step === 'reservation' && G.token) { G.history = ['welcome', 'notice']; G.step = 'reservation'; }
      else if (step === 'thanks' && G.token) { G.history = []; G.step = 'thanks'; }
      else if (step === 'invite') { G.history = fairy() ? ['notice'] : ['welcome', 'notice']; G.step = 'invite'; }
      else if (step === 'notice') { G.history = ['welcome']; G.step = 'notice'; }
      else if (step === 'surprise' && G.token && fairy()) { G.history = []; G.step = 'surprise'; }
      else if (step === 'change' && G.token && fairy()) { G.history = []; G.step = 'change'; }
      render();
      const first = app.querySelector('.g-card, .f-stage, .c-stage');
      if (!calm() && !design && first) first.classList.add('g-enter-first');
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
      <p class="a-brand-name">Pixie Craft Studio</p><p class="a-brand-label">Client's RSVP View</p>
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
            <p class="c-when-label">Your Event:</p>
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
        <p class="c-sub">Add the person who will RSVP for their family or group, then everyone invited with them. They can find their invitation by typing their name on your RSVP page.</p>
        ${d.closed ? '<p class="c-note">Your RSVP deadline has passed, so new guests can’t be added here. Please message Pixie Craft Studio.</p>' : `
        <form class="c-form" data-form="add" novalidate>
          <div class="c-two">
            <label class="b-field"><span>Designated RSVP Representative</span><input data-add="family" value="${esc(a.family)}" placeholder="eg. Maria Esther Martinez" maxlength="80"></label>
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
        ${mine.length ? `<ul class="c-fams">${mine.map(r => V.edit && V.edit.id === r.id ? editRow(r) : `<li class="c-fam"><div class="c-fam-head c-fam-static">
            <span class="c-fam-name">${esc(r.family)}</span>
            <span class="c-fam-meta">${r.seats} seat${r.seats === 1 ? '' : 's'} <span class="c-dot">•</span> ${r.guests.map(g => esc(g.name)).join(', ')}</span>
            <span class="c-fam-end">${r.submittedAt ? '<span class="c-fam-done">Replied</span>' : ''}<button class="a-link" data-act="edit-open" data-id="${r.id}">Edit</button><button class="a-link" data-act="add-delete" data-id="${r.id}">Remove</button></span>
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
    if (!V.data) { app.innerHTML = signIn(); document.title = V.info.couple + ' · RSVP tracker'; P.motion(app, 'signin'); return; }
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
    P.motion(app, 'couple:' + V.tab);
  }

  // Edit a family or group: add or remove names. Answers already given stay with each guest.
  function editRow(r) {
    const e = V.edit;
    return `<li class="c-fam c-fam-edit"><form class="c-form" data-form="edit" novalidate>
      <div class="c-two">
        <label class="b-field"><span>Designated RSVP Representative</span><input data-edit="family" value="${esc(e.family)}" maxlength="80"></label>
        <label class="b-field"><span>Reserved seats</span><input data-edit="seats" value="${esc(e.seats)}" inputmode="numeric" maxlength="2"></label>
      </div>
      <div class="b-field"><span>Guest names</span>
        ${e.guests.map((g, i) => `<span class="c-guest-row"><input data-edit="guest" data-i="${i}" value="${esc(g.name)}" placeholder="First name and surname" maxlength="80" aria-label="Guest ${i + 1}">
          ${e.guests.length > 1 ? `<button type="button" class="c-x" data-act="edit-remove" data-i="${i}" aria-label="Remove guest ${i + 1}">×</button>` : ''}</span>`).join('')}
        <button type="button" class="a-link c-more" data-act="edit-more">+ Add another name</button>
      </div>
      ${V.editError ? `<p class="a-error" role="alert">${esc(V.editError)}</p>` : ''}
      <div class="c-actions"><button type="button" class="a-btn a-btn-ghost" data-act="edit-cancel">Cancel</button><button class="b-btn" ${V.busy ? 'disabled' : ''}>${V.busy ? 'Saving…' : 'Save changes'}</button></div>
    </form></li>`;
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
    if (act === 'edit-open') {
      const r = V.data.reservations.find(x => x.id === b.dataset.id); if (!r) return;
      // The representative stays first; the other names follow.
      const rep = r.guests.find(g => g.id === r.repId) || r.guests[0];
      V.edit = { id: r.id, family: rep ? rep.name : r.family, seats: String(r.seats), guests: r.guests.filter(g => g !== rep).map(g => ({ id: g.id, name: g.name })), repId: rep && rep.id };
      if (!V.edit.guests.length) V.edit.guests.push({ id: null, name: '' });
      V.editError = ''; const y = scrollY; render(); scrollTo(0, y); return;
    }
    if (act === 'edit-cancel') { V.edit = null; const y = scrollY; render(); scrollTo(0, y); return; }
    if (act === 'edit-more') { V.edit.guests.push({ id: null, name: '' }); const y = scrollY; render(); scrollTo(0, y); const ins = app.querySelectorAll('[data-edit="guest"]'); ins[ins.length - 1].focus(); return; }
    if (act === 'edit-remove') { V.edit.guests.splice(Number(b.dataset.i), 1); const y = scrollY; render(); scrollTo(0, y); return; }
    if (act === 'edit-link') {
      const r = V.data.reservations.find(x => x.id === V.edit.id), l = r && r.links && r.links[b.dataset.g];
      if (l) U.copy(P.link(l), 'Guest link copied!', 'Guest link');
      return;
    }
    if (act === 'add-remove') { V.add.guests.splice(Number(b.dataset.i), 1); render(); }
    if (act === 'add-delete') {
      const r = V.data.reservations.find(x => x.id === b.dataset.id);
      const msg = r.submittedAt ? 'They already replied. Their answers will be removed from your RSVP Tracker, and they won’t be able to find their invitation anymore.' : 'They won’t be able to find their invitation anymore.';
      if (!(await U.confirm({ title: `Remove the ${r.family}?`, message: msg, yes: 'Remove', danger: true }))) return;
      try { await P.api('DELETE', base + '/reservations/' + r.id); await load(); render(); U.toast(`${r.family} was removed.`); }
      catch (err) { U.toast(err.message, 'error'); }
    }
    if (act === 'logout') { await P.api('POST', base + '/logout', {}).catch(() => {}); V.data = null; render(); }
  });
  app.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.edit && V.edit) {
      if (el.dataset.edit === 'guest') V.edit.guests[Number(el.dataset.i)].name = el.value; else V.edit[el.dataset.edit] = el.value;
      return;
    }
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
    if (e.target.dataset.form === 'edit') {
      const ed = V.edit, repName = ed.family.trim(), others = ed.guests.map(g => ({ id: g.id, name: g.name.trim() })).filter(g => g.name);
      const guests = [{ id: ed.repId, name: repName }, ...others], seats = Number(ed.seats || guests.length);
      V.editError = !repName ? 'Please type the name of the Designated RSVP Representative.'
        : !Number.isInteger(seats) || seats < 1 ? 'Reserved seats must be a number, like 3.' : guests.length > seats ? 'There are more names than reserved seats.' : '';
      if (V.editError) { const y = scrollY; render(); scrollTo(0, y); return; }
      V.busy = true; render();
      try {
        await P.api('PUT', base + '/reservations/' + ed.id, { family: repName, seats, guests });
        V.edit = null; V.busy = false; await load(); const y = scrollY; render(); scrollTo(0, y); U.toast('Your changes are saved!');
      } catch (err) { V.busy = false; V.editError = err.message; render(); }
      return;
    }
    if (e.target.dataset.form === 'add') {
      // The representative is the first guest on the list; the other names follow.
      const a = V.add, repName = a.family.trim(), others = a.guests.map(x => x.trim()).filter(x => x && x.toLowerCase() !== repName.toLowerCase());
      const guests = repName ? [repName, ...others] : others, seats = Number(a.seats || guests.length);
      V.addError = !repName ? 'Please type the name of the Designated RSVP Representative.'
        : !Number.isInteger(seats) || seats < 1 ? 'Reserved seats must be a number, like 3.' : guests.length > seats ? 'There are more names than reserved seats.' : '';
      if (V.addError) return render();
      V.busy = true; render();
      try {
        await P.api('POST', base + '/reservations', { family: repName, seats, guests: guests.map(name => ({ name })), rep: true });
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
    // Counts stay live on every tab, but never while someone is typing or editing.
    const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.dataset.bind !== 'query';
    if (!V.data || document.hidden || V.edit || typing) return;
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
  const PHASE = { open: ['Collecting RSVPs', ''], closed: ['RSVP closed', 'a-pill-closed'], done: ['Event done', 'a-pill-done'] };
  const TABS = [['guests', 'Guest List'], ['upload', 'Upload RSVP'], ['links', 'RSVP Links'], ['customize', 'Customize'], ['wording', 'Wording'], ['preview', 'Preview']];
  const bundleNote = () => P.bundle ? '<div class="a-banner a-banner-info"><span><strong>Try-out version.</strong> This file keeps everything in this browser only. Links you copy here only open on this computer, and nothing syncs to clients or guests. Host the full site for real clients.</span></div>' : '';
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
        <p class="a-muted">This board is only for Pixie Craft Studio. Clients and guests never see it.</p>
        ${bundleNote()}
        <form data-form="setup" class="a-stack" novalidate>
          ${au.needsSetupCode ? '<label class="a-field"><span>Setup code</span><input name="setupCode" inputmode="numeric" autocomplete="off" required><small>' + (P.pages ? 'The 6 numbers you saved as SETUP_CODE in Supabase.' : 'Shown in the window where the website was started.') + '</small></label>' : ''}
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
    return `<div class="b-head"><div><h1 class="b-title">Client Tracker</h1><p>Every client’s RSVPs, all in one place. Select a client to manage their guests, invitation links, and event theme with ease.</p></div>
        <button class="b-btn b-btn-big" data-act="go" data-view="new">+ New Client</button></div>
      <div class="b-toolbar"><div class="a-chips" role="group" aria-label="Show">${chip('all', 'All', all.length)}${chip('open', 'Collecting RSVPs', count('open'))}${chip('closed', 'RSVP Closed', count('closed'))}${chip('done', 'Event Done', count('done'))}</div>
        ${all.length > 6 ? `<label class="a-search a-search-inline"><span class="a-sr">Search clients</span><input type="search" data-bind="trackQuery" value="${esc(B.trackQuery)}" placeholder="Search clients..."></label>` : ''}</div>
      <div data-region="clients">${list.length ? `<div class="b-clients">${list.map(clientCard).join('')}</div>`
        : all.length ? '<p class="a-muted a-center">No clients match.</p>'
        : `<div class="a-empty">${P.floral('a-floral a-floral-empty')}<h2>No clients yet</h2><p>Add your first client to create their RSVP page.</p><button class="b-btn b-btn-big" data-act="go" data-view="new">+ New Client</button></div>`}</div>`;
  }
  function clientCard(c) {
    const s = c.stats, [label, cls] = PHASE[c.phase];
    const days = U.daysLeft(C, { deadline: c.deadline });
    return `<article class="b-client">
      <button class="b-client-open" data-act="open" data-id="${c.id}" aria-label="Open ${esc(c.couple)}"></button>
      <div class="b-cover">${c.cover ? `<img src="${esc(c.cover)}" alt="">` : P.monogram(c.couple, 'b-cover-mono')}</div>
      <div class="b-client-top"><span class="b-pill ${cls}">${label}</span>${c.phase === 'open' ? `<span>${days} day${days === 1 ? '' : 's'} to deadline</span>` : ''}</div>
      <h2 class="b-client-name">${esc(c.couple)}</h2>
      <p class="b-client-dates">Event: ${esc(C.formatPadded(c.weddingDate))} | RSVP by ${esc(C.formatPadded(c.deadline))}</p>
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
        <label class="b-field"><span>Host or Celebrant Name(s)</span><input name="couple" value="${esc(f.couple || '')}" placeholder="eg. Mia Santos, or Jennie & Taehyung" required maxlength="80"></label>
        <div class="b-two"><label class="b-field"><span>Event Date</span><input name="weddingDate" type="date" value="${esc(f.weddingDate || '')}" required></label>
        <label class="b-field"><span>RSVP Deadline</span><input name="deadline" type="date" value="${esc(f.deadline || '')}" required><small>Guests can’t answer after this date.</small></label></div>
        <label class="b-field"><span>Client’s 6-Number Code</span><span class="b-inline"><input name="code" inputmode="numeric" maxlength="6" value="${esc(f.code || randomCode())}" required><button type="button" class="b-btn b-btn-soft" data-act="gen-code">New Code</button></span>
          <small>The client uses this to open their RSVP tracker. A special date (like 120825) works well.</small></label>
        <label class="b-field"><span>Notes</span><small class="b-under">Only you can see this.</small><textarea name="notes" rows="4">${esc(f.notes || '')}</textarea></label>
        <label class="b-check"><input type="checkbox" name="sample" ${f.sample === false ? '' : 'checked'}> Add an example family so the client can try the RSVP</label>
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
        ${pic('logo', 'Studio logo', 'Shown at the top of this board and in every client’s view.', 'a-logo-thumb')}
        ${pic('banner', 'Client’s view banner', 'The picture behind “Welcome!” in every client’s view. Without one, the Pixie Craft storefront is shown.', 'a-cover-thumb')}
        <label class="b-field"><span>Facebook page</span><input name="facebook" type="url" value="${esc(st.facebook || '')}" placeholder="https://facebook.com/pixiecraftstudio"></label>
        <label class="b-field"><span>TikTok</span><input name="tiktok" type="url" value="${esc(st.tiktok || '')}" placeholder="https://tiktok.com/@pixiecraftstudio"></label>
        <label class="b-field"><span>Instagram</span><input name="instagram" type="url" value="${esc(st.instagram || '')}" placeholder="https://instagram.com/pixiecraftstudio"></label>
        <label class="b-field"><span>Help note in the client’s view</span><textarea name="helpNote" rows="2">${esc(st.helpNote || '')}</textarea></label>
        <div class="b-actions b-actions-split"><button type="button" class="a-link" data-act="backup">Download a backup of everything</button><button class="b-btn b-btn-create" ${B.busy ? 'disabled' : ''}>Save</button></div>
      </form></div></div>`;
  }

  // ---------- client workspace ----------
  function viewClient() {
    const c = B.client, [label, cls] = PHASE[c.phase];
    const body = { guests: B.form ? viewForm : viewGuests, upload: viewUpload, links: viewLinks, customize: viewCustomize, design: viewDesign, wording: viewWording, preview: viewPreview }[B.tab]();
    return `<button class="a-back" data-act="go" data-view="tracker">← All clients</button>
      <div class="a-client-head"><div><h1 class="a-script a-client-title">${esc(c.couple)}</h1>
        <p class="a-muted">Event ${esc(C.formatLong(c.weddingDate))} · RSVP by ${esc(C.formatLong(c.deadline))} <span class="a-pill ${cls}">${label}</span></p></div>
        <div class="a-row"><button class="a-btn a-btn-sm a-btn-ghost" data-act="open-guest">Open RSVP page</button><button class="a-btn a-btn-sm a-btn-ghost" data-act="open-couple">Open client’s view</button></div></div>
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
        ${r.sample ? '<span class="a-pill a-pill-example">Example</span>' : ''}${r.addedBy === 'couple' ? '<span class="a-pill">Added by the client</span>' : ''}${over ? `<span class="a-pill a-pill-warn">${r.guests.length} guests for ${r.seats} seat${r.seats === 1 ? '' : 's'}</span>` : ''}</td>
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
      <p class="a-muted">Upload the client’s guest list and every family gets its own reservation and RSVP link. Use a spreadsheet saved as <strong>CSV</strong> (in Excel or Google Sheets: File → Download / Save as → CSV). One row per guest.</p>
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
        ${linkRow('Client’s view', 'Private tracker for the client. They sign in with their 6-number code.', coupleLink, 'open-couple')}
        <div class="a-link-row a-link-code"><div><p class="a-link-label">Client’s code</p>
          <p class="a-muted a-small">${B.newCode ? `New code: <strong class="a-code">${esc(B.newCode)}</strong>. Send it to the client now. For safety it won’t be shown again.` : c.hasCode ? 'A code is set. You can give the client a new one any time.' : 'No code yet, so the cliene can’t sign in.'}</p></div>
          <form class="a-inline-row" data-form="code" novalidate><input name="code" inputmode="numeric" maxlength="6" placeholder="New 6-number code" aria-label="New client code"><button class="a-btn a-btn-sm">Set code</button></form></div>
        <form class="a-link-row" data-form="slug" novalidate><div><p class="a-link-label">Link name</p><p class="a-muted a-small">The part after /w/ and /couple/ in the links. Changing it stops old links from working.</p></div>
          <div class="a-inline-row"><input name="slug" value="${esc(c.slug)}" aria-label="Link name" maxlength="40"><button class="a-btn a-btn-sm a-btn-ghost">Save</button></div></form>
      </div>
      <div class="a-page-head a-mt"><div><h2 class="a-h2">Family links</h2><p class="a-muted">Personal links skip the name search and open the family’s reservation directly.</p></div>
        ${real.length ? '<div class="a-row"><button class="a-btn a-btn-ghost" data-act="links-csv">Download all (CSV)</button><button class="a-btn" data-act="links-copy">Copy all links</button></div>' : ''}</div>
      ${real.length ? `<div class="a-panel"><ul class="a-family-links">${real.map(r => `<li><span><strong>${esc(r.family)}</strong><code class="a-url">${esc(P.link('/r/' + r.token))}</code></span>
        <button class="a-btn a-btn-sm a-btn-ghost" data-act="copy-family" data-id="${r.id}">Copy</button></li>`).join('')}</ul></div>` : '<p class="a-muted">Add or upload guests to generate family links.</p>'}
      <div class="a-panel a-mt a-danger-zone"><div><p class="a-link-label">Delete this client</p><p class="a-muted a-small">Removes the RSVP page, client’s view, guest list and every answer.</p></div>
        <button class="a-btn a-btn-danger a-btn-sm" data-act="delete-client">Delete client</button></div>`;
  }

  // Customize (quick look)
  const fontVars = t => `--fs-h:'${esc(P.fontFamily(t.headingFont))}';--fs-b:'${esc(P.fontFamily(t.bodyFont))}';--fs-s:'${esc(P.fontFamily(t.scriptFont))}';--fs-st:${t.headingItalic ? 'italic' : 'normal'}`;
  function fontSelect(key, label, first) {
    const t = B.themeDraft, mine = t.customFont ? [[B.meta.customFont, B.meta.customFont + ' (' + t.customFont.name + ')']] : [];
    return `<label class="a-field"><span>${label}</span><select data-theme="${key}" class="a-font-select" style="font-family:'${esc(P.fontFamily(t[key]))}'">${P.fontOptions(t[key], first, mine)}</select></label>`;
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
    P.loadFonts(P.allFonts()); P.loadCustomFont(t.customFont);
    const sw = (k, p) => `<button type="button" class="a-swatch ${t.palette === k ? 'is-on' : ''}" data-act="palette" data-p="${k}" aria-pressed="${t.palette === k}">
      <span class="a-swatch-dots">${['card', 'accent', 'button', 'text', 'heading'].map(x => `<i style="background:${p[x]}"></i>`).join('')}</span><span>${esc(p.name)}</span></button>`;
    const COLOR_LABELS = [['heading', 'Headings'], ['text', 'Text'], ['button', 'Buttons'], ['accent', 'Icons & accents'], ['card', 'Card']];
    const bgTile = (k, label) => `<button type="button" class="a-bg-tile ${t.background === k ? 'is-on' : ''}" data-act="bg" data-bg="${k}" aria-pressed="${t.background === k}">
      <span class="a-bg-thumb" data-bg="${k}" style="${k === 'garden' ? `background-image:url('${esc(P.bg)}')` : k === 'custom' && t.customBg ? `background-image:url('${t.customBg}')` : ''}"></span><span>${esc(label)}</span></button>`;
    return `<div class="a-customize">
      <form class="a-stack" data-form="theme" novalidate>
        <section class="a-panel a-stack"><h3 class="a-h3">RSVP design</h3>
          <p class="a-muted a-small">Choose which RSVP pages this client’s guests see.</p>
          <div class="a-designs">${Object.entries(m.rsvpDesigns || { classic: 'Classic Garden', fairy: 'Fairy Garden' }).map(([k, l]) => `<button type="button" class="a-design-tile ${(t.rsvpDesign || 'classic') === k ? 'is-on' : ''}" data-act="rsvp-design" data-d="${k}" aria-pressed="${(t.rsvpDesign || 'classic') === k}">
            <span class="a-design-thumb" data-d="${k}" style="background-image:url('${esc(k === 'fairy' ? P.fairy('fairy-card-rsvp.webp') : k === 'custom' ? P.fairy('fairy-tulip.webp') : P.bg)}')"></span><span>${esc(l)}</span></button>`).join('')}</div>
          ${cardsBlock()}
          <label class="a-field"><span>Invitation link (for the “Back to Invitation” buttons)</span><input data-theme="invitationLink" type="url" value="${esc(t.invitationLink || '')}" placeholder="https://… link to the client’s e-invitation" maxlength="500"></label>
          <p class="a-muted a-small">Used in the Fairy Garden design. Leave it empty to hide those buttons.</p>
          <h4 class="a-h4">Fairy Garden card sizes</h4>
          ${FAIRY_SIZES.map(([k, l]) => `<label class="a-field"><span>${l}: <strong class="a-range-val">${esc(String(t[k] || 100))}%</strong></span><input data-theme="${k}" type="range" min="60" max="160" step="5" value="${esc(String(t[k] || 100))}"></label>`).join('')}
          <p class="a-muted a-small">100% is the size in your design. Each card grows or shrinks with all its text and pictures; on phones it never gets wider than the screen.</p>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Color palette</h3>
          <div class="a-swatches">${Object.entries(m.palettes).map(([k, p]) => sw(k, p)).join('')}</div>
          <details class="a-more"><summary>Fine-tune colors</summary><div class="a-colors">${COLOR_LABELS.map(([k, l]) => `<label class="a-color"><input type="color" data-color="${k}" value="${esc(t.colors[k])}"><span>${l}</span></label>`).join('')}</div></details>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Fonts</h3>
          <p class="a-muted a-small">Elegant fonts, the same families you’ll find in Canva. Have a font file of your own? Upload it below and pick “${esc(m.customFont)}”.</p>
          <div class="a-font-group">${fontSelect('scriptFont', 'Names (host, family, “See you soon!”)', 'Script & calligraphy')}
            <div class="a-font-adjust">${slider('sizes.names', 'Size', 60, 160)}${effectSelect('names', 'Effect')}</div></div>
          <div class="a-font-group">${fontSelect('headingFont', 'Titles', 'Elegant serif & display')}
            <div class="a-font-adjust">${slider('sizes.titles', 'Size', 60, 160)}${effectSelect('titles', 'Effect')}</div>
            <label class="a-check"><input type="checkbox" data-theme="headingItalic" ${t.headingItalic ? 'checked' : ''}> Italic titles</label></div>
          <div class="a-font-group">${fontSelect('bodyFont', 'Text', 'Elegant serif & display')}
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
          ${(t.rsvpDesign || 'classic') === 'fairy' ? '<p class="a-muted a-small">Fairy Garden: 100% on computers and 90% on phones are the sizes in your design. Every card shrinks or grows with all its text and pictures.</p>' : ''}
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Client photo</h3>
          <p class="a-muted a-small">Shown on this client’s card in the Client Tracker and at the top of their client’s view. Guests don’t see it.</p>
          <div class="a-media-row">
            <span class="a-cover-thumb">${t.cover ? `<img src="${esc(t.cover)}" alt="">` : '<span class="a-muted a-small">No photo</span>'}</span>
            <div class="a-stack">
              <label class="a-btn a-btn-ghost a-btn-sm a-file-btn"><input type="file" accept="image/png,image/jpeg,image/webp" data-bind="coverfile">${t.cover ? 'Replace photo…' : 'Upload a photo…'}</label>
              ${t.cover ? '<button type="button" class="a-link" data-act="cover-remove">Remove photo</button>' : ''}
            </div>
          </div>
        </section>
        <section class="a-panel a-stack"><h3 class="a-h3">Logo</h3>
          <p class="a-muted a-small">Shown on the invitation and thank-you cards. Without one, a flower wreath with the client’s initials is used.</p>
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
      <div class="a-customize-preview"><div class="a-seg a-seg-sm" role="group" aria-label="Preview screen">${[['welcome', 'Welcome'], ['invite', 'Invitation'], ['family', 'Family page']].concat((t.rsvpDesign || 'classic') === 'fairy' ? [['surprise', 'Surprise'], ['change', 'Change of plans'], ['thanks', 'Thank you']] : []).map(([k, l]) => `<button type="button" data-act="look-screen" data-s="${k}" aria-pressed="${(B.lookScreen || 'welcome') === k}">${l}</button>`).join('')}</div>
        <div class="a-seg a-seg-sm a-look-device" role="group" aria-label="Screen size"><button type="button" data-act="look-device" data-d="mobile" aria-pressed="${B.lookDevice !== 'desktop'}">Phone</button><button type="button" data-act="look-device" data-d="desktop" aria-pressed="${B.lookDevice === 'desktop'}">Computer</button></div>
        <div class="a-frame ${B.lookDevice === 'desktop' ? 'a-frame-pc' : 'mobile'}" data-region="look-frame"><iframe title="Look preview" data-region="frame"></iframe></div></div>
    </div>`;
  }
  // "Computer" preview: a full 1366 × 768 screen, shrunk to fit the preview column.
  function fitLookFrame() {
    const box = app.querySelector('[data-region="look-frame"]'); if (!box) return;
    const f = box.querySelector('iframe');
    if (!box.classList.contains('a-frame-pc')) { f.style.transform = ''; box.style.height = ''; return; }
    const sc = box.clientWidth / 1366; f.style.transform = `scale(${sc})`; box.style.height = Math.round(768 * sc + 16) + 'px';
  }
  window.addEventListener('resize', () => fitLookFrame());
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
    ['Event Invitation', 'Names, date, and the name search.', [['couple', 'Host or celebrant name(s)'], ['weddingDate', 'Event date', 'date'], ['invitationHeading', 'Small heading above the names'], ['inviteQuestion', 'Question under the date'], ['searchInstructions', 'Guest search instructions', 'area'], ['searchPlaceholder', 'Example inside the search box'], ['searchButton', 'Search button label']]],
    ['Family Page', 'Family name and seats are filled in automatically.', [['greeting', 'Greeting (above the family name)', 'area'], ['seatsLabel', 'Label under the seat number'], ['onlyListedNote', 'Note about who is included', 'area']]],
    ['Guest Answers', 'The answer and recap part.', [['confirmTitle', 'Title above the guest names'], ['responseInstructions', 'Response instructions', 'area'], ['attendingLabel', 'Attending button'], ['notAttendingLabel', 'Not Attending button'], ['reviewTitle', 'Recap title'], ['reviewSubtitle', 'Recap note'], ['attendingGroupLabel', 'Heading for guests attending'], ['notAttendingGroupLabel', 'Heading for guests not attending'], ['submitButton', 'Submit button'], ['adultsOnly', 'Adults-only notice', 'area']]],
    ['Thank-You Screen', 'Shown after a guest sends their RSVP.', [['thanksEyebrow', 'Small line above the heading'], ['thanksHeading', 'Heading'], ['thanksMessage', 'Message', 'area'], ['thanksClosing', 'Closing']]],
    ['Fairy Garden Design', 'Only used when Customize › RSVP design is “Fairy Garden”. {rep} is the Designated RSVP Representative.', [['fairyTitle', 'Card 1 title'], ['fairySubtitle', 'Card 1 small heading'], ['fairyMessage', 'Card 1 message', 'area'], ['fairyClosing', 'Card 1 closing'], ['fairyNext', 'Card 1 button'],
      ['fairyHello', 'Name card title'], ['fairyAsk', 'Name card question'], ['fairyAskSub', 'Name card line'], ['fairyPlaceholder', 'Name box hint'], ['fairyFind', 'Name card button'],
      ['fairyReserved', 'Above the seat number'], ['fairySeatsWord', 'Below the seat number'], ['fairyForYou', 'Line below “Seats”'], ['fairyCount', 'Instructions', 'area'], ['fairyCheck', 'Recap title'], ['fairySubmit', 'Submit button'],
      ['fairyThanks', 'Thank-you words'], ['fairyBackLink', 'Thank-you link text'], ['fairySurprise', 'Surprise title'], ['fairySurpriseSub', 'Surprise small heading'], ['fairySurpriseDone', 'Surprise message (after they answered)', 'area'], ['fairySurpriseWait', 'Surprise message (not answered yet)', 'area'], ['fairySurpriseButton', 'Surprise button'], ['fairyChangeMind', 'Button on the answered seats page'],
      ['fairyChangeTitle', 'Change of plans title'], ['fairyChangeHello', 'Change of plans greeting ({name} is the guest’s first name)'], ['fairyYes', 'Yes answer'], ['fairyNo', 'No answer'], ['fairySave', 'Save button']]],
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
  // Fairy Garden size sliders: theme key, label, preview screen it shows.
  const FAIRY_SIZES = [['fairyRsvpSize', '“Kindly RSVP!” card', 'welcome'], ['fairyNameSize', '“Hello! What’s your name?” card', 'invite'], ['fairyResSize', '“I Reserved … Seats” card', 'family'], ['fairySurpriseSize', '“Surprise! No Worries” card', 'surprise'], ['fairyChangeSize', '“A Little Change of Plans?” envelope', 'change'], ['fairyThanksSize', '“Thank You!” page', 'thanks']];
  function loadFrame() {
    const f = app.querySelector('[data-region="frame"]'); if (!f) return;
    const c = B.client;
    if (B.tab === 'design') { f.addEventListener('load', dSend); P.setFrame(f, dFrameUrl()); paintLib(); return; }
    if (B.tab === 'customize') {
      f.addEventListener('load', sendTheme);
      const r = c.reservations[0], scr = B.lookScreen || 'welcome';
      P.setFrame(f, ['family', 'surprise', 'change', 'thanks'].includes(scr) && r ? '/r/' + r.token + '?preview=1&step=' + (scr === 'family' ? 'reservation' : scr) : '/w/' + c.slug + '?preview=1' + (scr === 'invite' ? '&step=invite' : ''));
      paintVideoThumb(); fitLookFrame(); return;
    }
    P.setFrame(f, B.previewTarget ? '/r/' + B.previewTarget + '?preview=1&step=reservation' : '/w/' + c.slug + '?preview=1');
  }

  // ---------- Card Maker: the studio makes this client's own RSVP cards (opens full screen, see cardmaker.js) ----------
  // The client's own cards, inside Customize › RSVP design: see them, edit them, or make new ones.
  function cardsBlock() {
    const t = B.client.theme, cards = t.cards && t.cards.pages ? t.cards : null, on = B.themeDraft.rsvpDesign === 'custom', K = P.cards;
    if (!K) return '';
    const ctx = w => ({ mode: 'thumb', site: B.client.site, theme: t, r: K.sample(), answers: { g1: 'attending', g2: 'attending', g3: 'not_attending' }, who: 'g1', view: false, width: w + 'px' });
    return `<div class="b-cards ${on ? 'is-on' : ''}">
        <div class="b-cards-head"><div><h4 class="a-h4">My own cards · Card Maker</h4>
          <p class="a-muted a-small">${cards ? (on ? 'Guests see these cards. Click a page to edit it.' : 'Pick “My own cards” above to show these to guests. Click a page to edit it.') : 'Make this client’s cards like in Canva: fonts, sizes, your elements, crop, remove background, animations.'}</p></div>
          <div class="a-row">${cards ? '<button type="button" class="a-btn a-btn-sm" data-act="open-cards">Edit my cards</button>' : ''}<button type="button" class="a-btn a-btn-sm ${cards ? 'a-btn-ghost' : ''}" data-act="new-cards">${cards ? 'Make new cards' : 'Make cards'}</button></div></div>
        ${cards ? `<div class="b-cards-pages">${K.PAGES.map(([k, l], i) => { const p = cards.pages[k], w = Math.round(Math.min(78, 100 * p.w / p.h)); return `<button type="button" class="b-cards-page" data-act="open-cards" data-page="${k}" title="Edit ${esc(l)}"><span class="b-cards-thumb" style="background:${esc(K.backdrop(cards).color)}">${K.page(cards, k, ctx(w))}</span><span>${i + 1}. ${esc(l)}</span></button>`; }).join('')}</div>` : ''}
      </div>`;
  }
  async function openCardMaker(page, fresh) {
    if (!(await leaveOk())) return;
    resetDrafts();
    if (fresh && B.client.theme.cards && !(await U.confirm({ title: 'Make new cards?', message: 'You start from a template. Your current cards stay as they are until you press Save in the Card Maker.', yes: 'Make new cards', no: 'Cancel' }))) return;
    if (!B.studio) await loadStudio();
    const c = B.client, t = fresh ? Object.assign({}, c.theme, { cards: null }) : c.theme, lib = () => (B.studio && B.studio.elements) || [];
    const putLib = async list => { B.studio = (await api('PUT', '/api/board/studio', { elements: list })).studio; return lib(); };
    P.cardMaker.open({ client: c, cards: t.cards, theme: t, site: c.site, lib: lib(), page,
      customFontLabel: t.customFont ? B.meta.customFont + ' (' + t.customFont.name + ')' : '',
      onLibAdd: items => putLib(lib().concat(items.map(x => Object.assign({ id: newId() }, x)))),
      onLibSet: putLib,
      onSave: async (cards, use) => {
        const theme = { cards };
        if (use) theme.rsvpDesign = 'custom'; else if (B.client.theme.rsvpDesign === 'custom') theme.rsvpDesign = 'fairy';
        const out = await api('PUT', '/api/board/clients/' + B.client.id + '/theme', { theme });
        useClient(out.client); resetDrafts(); return true;
      },
      onClose: () => render() });
  }

  // ---------- Design (Canva-style): place your own elements and text on each guest screen ----------
  const D_FAIRY_KEY = { welcome: 'fairyRsvpSize', notice: 'fairyRsvpSize', invite: 'fairyNameSize', surprise: 'fairySurpriseSize', reservation: 'fairyResSize', change: 'fairyChangeSize', thanks: 'fairyThanksSize' };
  const D_SCREENS_CLASSIC = [['welcome', 'Welcome'], ['notice', 'Heads-up'], ['invite', 'Invitation'], ['reservation', 'Family page'], ['thanks', 'Thank you']];
  const D_SCREENS_FAIRY = [['notice', 'Kindly RSVP'], ['invite', 'Hello'], ['surprise', 'Surprise'], ['reservation', 'Seats page'], ['change', 'Change of plans'], ['thanks', 'Thank you']];
  const dFairy = () => !!(B.themeDraft && B.themeDraft.rsvpDesign === 'fairy');
  const dScreens = () => dFairy() ? D_SCREENS_FAIRY : D_SCREENS_CLASSIC;
  const D_SCREENS = [...D_SCREENS_CLASSIC, ...D_SCREENS_FAIRY.filter(x => !D_SCREENS_CLASSIC.some(y => y[0] === x[0]))];
  // The screen being designed, always one the chosen RSVP design has.
  const dScr = () => dScreens().some(x => x[0] === B.dScreen) ? B.dScreen : dScreens()[0][0];
  // Fairy Garden card parts (title, words, buttons...): what the admin changed; nothing = exactly as in the design pictures.
  const dPartId = () => B.dSel && B.dSel.startsWith('p:') ? B.dSel.slice(2) : null;
  function partsOf() { const t = B.themeDraft; t.parts = t.parts || {}; return (t.parts[dScr()] = t.parts[dScr()] || {}); }
  function partSet(id, patch) {
    const ps = partsOf(), p = Object.assign({}, ps[id], patch);
    const plain = { x: 0, y: 0, s: 1, rot: 0, op: 1, hide: false };
    for (const k of Object.keys(p)) if (p[k] === undefined || p[k] === null || p[k] === '' || plain[k] === p[k]) delete p[k];
    if (Object.keys(p).length) ps[id] = p; else delete ps[id];
  }
  function partsClean() {
    const t = B.themeDraft.parts || {}, out = {};
    for (const [k, v] of Object.entries(t)) if (v && Object.keys(v).length) out[k] = v;
    return Object.keys(out).length ? out : null;
  }
  const dSnap = () => JSON.stringify({ decor: decor(), parts: B.themeDraft.parts || null, site: B.siteDraft });
  function dRestore(str) {
    const o = JSON.parse(str);
    if (o && o.decor && 'parts' in o) { B.themeDraft.decor = o.decor; B.themeDraft.parts = o.parts; if (o.site) { B.siteDraft = o.site; B.siteDirty = true; } }
    else B.themeDraft.decor = o;
  }
  const D_HIDE = [['glow', 'Step dots at the top'], ['icon', 'Icon and logo'], ['eyebrow', 'Small heading above the title'], ['foot', '“With Love by Pixie Craft Studio”']];
  const D_LAYERS = [['front', 'In front of everything'], ['under', 'Under the words'], ['behind', 'Behind the card']];
  const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), x => (x % 36).toString(36)).join('');
  function decor() {
    const t = B.themeDraft;
    t.decor = Object.assign({ hide: [] }, t.decor || {});
    for (const [k] of D_SCREENS) if (!Array.isArray(t.decor[k])) t.decor[k] = [];
    return t.decor;
  }
  const dList = () => decor()[dScr()];
  const dSelected = () => dList().find(e => e.id === B.dSel) || null;
  // Undo / Redo keep copies of the design; quick changes to the same control count as one step.
  function dRemember(key) {
    const now = Date.now();
    if (key && B.dLastKey === key && now - B.dLastAt < 700) { B.dLastAt = now; return; }
    B.dLastKey = key; B.dLastAt = now;
    (B.dUndo = B.dUndo || []).push(dSnap()); if (B.dUndo.length > 60) B.dUndo.shift();
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
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'pixie-theme', theme: B.themeDraft, site: B.siteDraft, selected: B.dSel || null }, '*');
  }
  function dRefresh() {
    const p = app.querySelector('[data-region="d-props"]'); if (p) p.innerHTML = dProps();
    const l = app.querySelector('[data-region="d-layers"]'); if (l) l.innerHTML = dLayers();
    const pl = app.querySelector('[data-region="d-parts"]'); if (pl) pl.innerHTML = dPartsList();
    paintLib();
  }
  const dRange = (k, label, min, max, step, v, unit) => `<label class="a-slider d-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-dprop="${k}"><output>${unit === '%' ? Math.round(v * 100) + '%' : Math.round(v) + (unit || '')}</output></label>`;
  function dProps() {
    const e = dSelected();
    if (e && e.type === 'text') P.loadFonts(P.allFonts());
    if (B.dSel === 'fairy-card') {
      const k = D_FAIRY_KEY[dScr()], v = B.themeDraft[k] || 100, l = (FAIRY_SIZES.find(x => x[0] === k) || [])[1] || 'Card';
      return `<h3 class="a-h3">Selected: ${l}</h3><p class="a-muted a-small">Drag the corner dot on the card, or use the slider. 100% is the size in your design.</p>
        <label class="a-slider d-slider"><span>Size</span><input type="range" min="60" max="160" step="1" value="${v}" data-fsize="${k}"><output>${v}%</output></label>${dCardPic()}`;
    }
    if (dPartId()) return dPartProps();
    if (!e) return `<h3 class="a-h3">Selected element</h3><p class="a-muted a-small">Click an element on the page to move it, resize it from the corner dot, or turn it with the top dot. Arrow keys nudge it.</p>`;
    const m = B.meta;
    const text = e.type === 'text' ? `
      <label class="a-field"><span>Text</span><textarea rows="3" data-dprop="text" maxlength="400">${esc(e.text)}</textarea></label>
      <label class="a-field"><span>Font</span><select data-dprop="font" class="a-font-select" style="font-family:'${esc(P.fontFamily(e.font))}'">${P.fontOptions(e.font, 'Script & calligraphy', B.themeDraft.customFont ? [[m.customFont, m.customFont]] : [])}</select></label>
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
  function dPartsList() {
    const ps = partsOf(), sel = dPartId();
    return `<ul class="d-part-list">${(C.FAIRY_PARTS[dScr()] || []).filter(x => x[2] !== 'card').map(([id, label]) => {
      const p = ps[id] || {}, changed = Object.keys(p).some(k => k !== 'hide');
      return `<li><button type="button" class="${sel === id ? 'is-on' : ''}" data-act="d-ppick" data-id="${id}"><span>${esc(label)}</span>${changed ? '<small>changed</small>' : ''}</button>
        <button type="button" class="d-part-eye ${p.hide ? 'is-off' : ''}" data-act="d-phide" data-id="${id}" aria-pressed="${!p.hide}" title="${p.hide ? 'Show' : 'Hide'} ${esc(label)}">${p.hide ? 'Hidden' : 'Shown'}</button></li>`;
    }).join('')}</ul>`;
  }
  // The card picture: the painted card from the design, or one of My elements.
  function dCardPic() {
    if (!(C.FAIRY_PARTS[dScr()] || []).some(x => x[2] === 'card')) return '';
    const lib = (B.studio && B.studio.elements) || [], cur = (partsOf().card || {}).src || '';
    return `<h3 class="a-h3">${dScr() === 'change' ? 'Paper picture' : 'Card picture'}</h3>
      <p class="a-muted a-small">Pick one of My elements to use instead of the painted ${dScr() === 'change' ? 'paper' : 'card'}. The words stay where they are.</p>
      <div class="d-lib"><div class="d-lib-item"><button type="button" class="d-lib-add d-orig ${cur ? '' : 'is-on'}" data-act="d-pcard" data-src="" title="The original picture">Original</button></div>
      ${lib.map(x => `<div class="d-lib-item"><button type="button" class="d-lib-add ${cur === x.src ? 'is-on' : ''}" data-act="d-pcard" data-src="${esc(x.src)}" title="Use ${esc(x.name)}"><img alt="${esc(x.name)}" data-src="${esc(x.src)}"></button></div>`).join('')}</div>
      ${lib.length ? '' : '<p class="a-muted a-small">Upload a picture in My elements first.</p>'}`;
  }
  const LETTERING = { fairyTitle: 1, fairyChangeTitle: 1, fairyThanks: 1 };
  const dWordNotes = (key, word) => `${/\{/.test(C.DEFAULT_SITE[key] || '') ? '<p class="a-muted a-small">Words in { } fill in by themselves, like the number of seats.</p>' : ''}
    ${LETTERING[key] ? `<p class="a-muted a-small">${word === C.DEFAULT_SITE[key] ? 'This is painted lettering. Changing the words switches it to typed letters, which can take any font and color.' : 'Typed letters are used because the words were changed.'}</p>` : ''}
    ${word !== C.DEFAULT_SITE[key] && C.DEFAULT_SITE[key] != null ? `<button type="button" class="a-link a-small" data-act="d-pword-reset" data-k="${esc(key)}">Use the original words</button>` : ''}`;
  function dPartProps() {
    const id = dPartId(), def = (C.FAIRY_PARTS[dScr()] || []).find(x => x[0] === id); if (!def) return '';
    const p = partsOf()[id] || {}, key = B.dPartKey, kind = def[2], m = B.meta;
    const word = key && B.siteDraft[key] != null ? B.siteDraft[key] : key ? C.DEFAULT_SITE[key] : '';
    const range = (f, label, min, max, step, v, unit) => `<label class="a-slider d-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-pprop="${f}"><output>${unit === '°' ? Math.round(v) + '°' : Math.round(v * 100) + '%'}</output></label>`;
    const color = (f, label, v) => `<label class="a-color"><input type="color" data-pprop="${f}" value="${esc(v || '#4a5232')}"><span>${label}</span></label>${v ? `<button type="button" class="a-link a-small" data-act="d-pclear" data-f="${f}">as designed</button>` : ''}`;
    const fonts = kind === 'text' || kind === 'btn' || id === 'input' ? `<label class="a-field"><span>Font</span><select data-pprop="font" class="a-font-select" ${p.font ? `style="font-family:'${esc(P.fontFamily(p.font))}'"` : ''}><option value="" ${p.font ? '' : 'selected'}>As in the design</option>${P.fontOptions(p.font || '', 'Script & calligraphy', B.themeDraft.customFont ? [[m.customFont, m.customFont]] : [])}</select></label>` : '';
    if (p.font) P.loadFonts([p.font]);
    return `<h3 class="a-h3">Selected: ${esc(def[1])}</h3>
      <p class="a-muted a-small">Drag it on the card to move it. The corner dot resizes it and the top dot turns it. Arrow keys nudge it.</p>
      ${key ? `<label class="a-field"><span>${id === 'input' ? 'Hint inside the box' : 'Words'}</span><textarea rows="3" data-pword="${esc(key)}" maxlength="600">${esc(word)}</textarea></label>
<div data-region="d-pword-notes">${dWordNotes(key, word)}</div>` : ''}
      ${fonts}
      ${kind === 'text' || kind === 'btn' || id === 'input' || id === 'rows' || id === 'recap' || id === 'opts' ? `<div class="d-row">${color('color', kind === 'btn' ? 'Words color' : 'Color', p.color)}${kind === 'btn' ? color('fill', 'Button color', p.fill) : ''}</div>` : ''}
      ${range('s', 'Size', 0.2, 3, 0.01, p.s || 1)}
      ${range('rot', 'Turn', -180, 180, 1, p.rot || 0, '°')}
      ${range('op', 'See-through', 0.1, 1, 0.05, p.op === undefined ? 1 : p.op)}
      <div class="d-row d-actions">
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-phide">${p.hide ? 'Show it' : 'Hide it'}</button>
        <button type="button" class="a-btn a-btn-ghost a-btn-sm" data-act="d-preset">Back to the design</button></div>`;
  }
  function dLayers() {
    const list = dList();
    if (!list.length) return '<p class="a-muted a-small">Nothing added to this screen yet.</p>';
    return `<ol class="d-layer-list">${list.slice().reverse().map(e => `<li><button type="button" class="${B.dSel === e.id ? 'is-on' : ''}" data-act="d-pick" data-id="${esc(e.id)}">
      ${e.type === 'text' ? `<span class="d-layer-t">T</span><span>${esc(e.text.slice(0, 30))}</span>` : `<img alt="" data-src="${esc(e.src)}"><span>${esc(((B.studio && B.studio.elements) || []).find(x => x.src === e.src)?.name || 'Element')}</span>`}
      <small>${{ front: 'front', under: 'under words', behind: 'behind card' }[e.layer || 'front']}</small></button></li>`).join('')}</ol>`;
  }
  function viewDesign() {
    const d = decor(), lib = (B.studio && B.studio.elements) || [], k = dScr();
    return `<div class="d-wrap">
      <div class="d-side">
        <section class="a-panel a-stack">
          <h3 class="a-h3">Design your RSVP</h3>
          <p class="a-muted a-small">Like Canva: add your own elements and text, then drag, resize, turn and layer them. It’s saved per client and looks the same on phones.</p>
          <div class="a-seg a-seg-sm d-screens" role="group" aria-label="Screen">${dScreens().map(([s, l]) => `<button type="button" data-act="d-screen" data-s="${s}" aria-pressed="${k === s}">${l}${d[s].length ? ` <small>${d[s].length}</small>` : ''}</button>`).join('')}</div>
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
        ${dFairy() && C.FAIRY_PARTS[k] ? `<section class="a-panel a-stack"><h3 class="a-h3">Parts of this card</h3><p class="a-muted a-small">Click a part here or on the card to move, resize, turn, recolor or retype it. Anything you don’t touch stays exactly as designed.</p><div data-region="d-parts">${dPartsList()}</div></section>` : ''}
        <section class="a-panel a-stack"><h3 class="a-h3">Layers on this screen</h3><div data-region="d-layers">${dLayers()}</div></section>
        ${dFairy() ? '' : `<section class="a-panel a-stack"><h3 class="a-h3">Show or hide parts of the card</h3>
          ${D_HIDE.map(([h, l]) => `<label class="a-check"><input type="checkbox" data-dhide="${h}" ${d.hide.includes(h) ? '' : 'checked'}> ${l}</label>`).join('')}
          <p class="a-muted a-small">Words are changed in the Wording tab; colors and fonts of the page in Customize.</p></section>`}
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
    const c = B.client, k = dScr(), r = c.reservations[0];
    if (['reservation', 'thanks', 'surprise', 'change'].includes(k) && r) return '/r/' + r.token + '?preview=1&design=1&step=' + k;
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
    if (!f || ev.source !== f.contentWindow) return;
    // Fairy Garden: the card itself was clicked or resized in the preview.
    if (ev.data.type === 'pixie-fairy-select') { B.dSel = ev.data.on ? 'fairy-card' : null; return dRefresh(); }
    if (ev.data.type === 'pixie-fairy-size' && FAIRY_SIZES.some(x => x[0] === ev.data.key)) { B.themeDraft[ev.data.key] = Math.min(160, Math.max(60, Math.round(Number(ev.data.value) || 100))); B.dSel = 'fairy-card'; return dChanged(true); }
    if (ev.data.type === 'pixie-decor-select' && !ev.data.id && B.dSel === 'fairy-card') { B.dSel = null; return dRefresh(); }
    if (ev.data.screen !== dScr()) return;
    const m = ev.data, list = dList();
    if (m.type === 'pixie-part-select') { B.dSel = 'p:' + m.id; B.dPartKey = m.key || ''; return dRefresh(); }
    if (m.type === 'pixie-part-change' && m.id && m.patch) { dRemember(); partSet(m.id, m.patch); B.dSel = 'p:' + m.id; return dChanged(true); }
    if (m.type === 'pixie-part-nudge' && m.id) { dRemember('pn' + m.id); const p = partsOf()[m.id] || {}; partSet(m.id, { x: Math.round(((p.x || 0) + m.dx) * 10) / 10, y: Math.round(((p.y || 0) + m.dy) * 10) / 10 }); return dChanged(false); }
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
        if (['reservation', 'thanks', 'surprise', 'change'].includes(b.dataset.s) && !B.client.reservations.length) return U.toast('Add a family to the guest list first to design the family page and thank-you screen.');
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
        to.push(dSnap()); dRestore(from.pop()); B.dLastKey = null;
        if (!dSelected() && !dPartId() && B.dSel !== 'fairy-card') B.dSel = null;
        dChanged(false); return dSideRedraw();
      }
      case 'd-lib-del': {
        const lib = (B.studio.elements || []), x = lib.find(y => y.id === b.dataset.id); if (!x) return;
        if (!(await U.confirm({ title: `Remove ${x.name} from My elements?`, message: 'Copies already placed on a design stay where they are.', yes: 'Remove', no: 'Keep' }))) return;
        try { B.studio = (await api('PUT', '/api/board/studio', { elements: lib.filter(y => y.id !== x.id) })).studio; dSideRedraw(); } catch (err) { U.toast(err.message, 'error'); }
        return;
      }
      case 'd-cancel': resetDrafts(); B.dSel = null; B.dUndo = []; B.dRedo = []; return render();
      case 'd-ppick': B.dSel = 'p:' + b.dataset.id; B.dPartKey = ''; dRefresh(); { const f = app.querySelector('[data-region="frame"]'); if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'pixie-decor-select', id: B.dSel }, '*'); } return;
      case 'd-phide': { const id = b.dataset.id || dPartId(); if (!id) return; dRemember(); partSet(id, { hide: !(partsOf()[id] || {}).hide }); return dChanged(true); }
      case 'd-preset': { const id = dPartId(); if (!id) return; dRemember(); partSet(id, { x: 0, y: 0, s: 1, rot: 0, op: 1, hide: false, color: '', fill: '', font: '' }); return dChanged(true); }
      case 'd-pclear': { const id = dPartId(); if (!id) return; dRemember(); partSet(id, { [b.dataset.f]: '' }); return dChanged(true); }
      case 'd-pword-reset': { const k = b.dataset.k; dRemember(); B.siteDraft[k] = C.DEFAULT_SITE[k]; B.siteDirty = true; return dChanged(true); }
      case 'd-pcard': { dRemember(); partSet('card', { src: b.dataset.src || '' }); return dChanged(true); }
      case 'd-save': {
        if (B.siteDirty) { try { await api('PUT', '/api/board/clients/' + B.client.id + '/site', { site: B.siteDraft }); } catch (err) { return U.toast(err.message, 'error'); } }
        const out = await saveClient('PUT', '/theme', { theme: Object.assign({ decor: decor(), parts: partsClean() }, Object.fromEntries(FAIRY_SIZES.map(([k]) => [k, B.themeDraft[k] || 100]))) }, 'Your design is saved!');
        if (out) { B.dUndo = []; B.dRedo = []; }
        return;
      }
    }
  }
  function dInput(el) {
    if (el.dataset.pprop && dPartId()) {
      const f = el.dataset.pprop, v = ['color', 'fill', 'font'].includes(f) ? el.value : Number(el.value);
      dRemember('pp' + f); partSet(dPartId(), { [f]: v });
      const out = el.nextElementSibling;
      if (out && out.tagName === 'OUTPUT') out.textContent = f === 'rot' ? Math.round(v) + '°' : Math.round(v * 100) + '%';
      if (f === 'font') { el.style.fontFamily = v ? `'${P.fontFamily(v)}'` : ''; if (v) P.loadFonts([v]); }
      dChanged(false); return true;
    }
    if (el.dataset.pword) {
      dRemember('pw' + el.dataset.pword); B.siteDraft[el.dataset.pword] = el.value; B.siteDirty = true;
      const n = app.querySelector('[data-region="d-pword-notes"]'); if (n) n.innerHTML = dWordNotes(el.dataset.pword, el.value);
      dChanged(false); return true;
    }
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
    if (!B.list) { app.innerHTML = viewSignIn(); document.title = 'Sign in · Pixie’s RSVP Board'; if (P.siteStart) P.siteStart({ page: 'board', root: app, canEdit: false, site: null }); P.motion(app, 'signin'); return; }
    const inner = B.view === 'new' ? viewTracker() + viewNew() : B.view === 'studio' ? viewTracker() + viewStudio() : B.view === 'client' && B.client ? viewClient() : viewTracker();
    app.innerHTML = layout(inner);
    // Studio-wide website edits (words, colors, elements) and the "Edit website" button. Only the studio ever reaches this page.
    if (P.siteStart) P.siteStart({ page: 'board', root: app, canEdit: true, site: B.studio && B.studio.site });
    document.title = (B.view === 'client' && B.client ? B.client.couple + ' · ' : '') + 'Pixie’s RSVP Board';
    if (B.view === 'client' && B.tab === 'customize' && P.cards) { P.cards.paint(app); if (B.client.theme.cards) P.loadFonts(P.cards.fonts(B.client.theme.cards)); }
    if (withFrame !== false && B.view === 'client' && (B.tab === 'preview' || B.tab === 'customize' || B.tab === 'design')) loadFrame();
    P.motion(app, B.view === 'client' && B.client ? 'client:' + B.client.id + ':' + B.tab : 'tracker');
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
    if ((tab === 'design' || tab === 'cards') && !B.studio) await loadStudio();
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
      case 'open-cards': return openCardMaker(b.dataset.page);
      case 'new-cards': return openCardMaker(null, true);
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
        const yes = await U.confirm({ title: `Delete ${c.couple}?`, message: 'Their RSVP page, client’s view, guest list and every answer will be removed. This can’t be undone.', yes: 'Yes, delete', no: 'Keep', danger: true });
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
      case 'rsvp-design': if (b.dataset.d === 'custom' && !(B.client.theme.cards && B.client.theme.cards.pages)) return openCardMaker(null, true);
        B.themeDraft.rsvpDesign = b.dataset.d; return themeChanged(true);
      case 'bg': if (b.dataset.bg === 'custom' && !B.themeDraft.customBg) { app.querySelector('[data-bind="bgfile"]').click(); return; } B.themeDraft.background = b.dataset.bg; return themeChanged(true);
      case 'cancel-theme': resetDrafts(); render(); return;
      case 'look-device': {
        B.lookDevice = b.dataset.d; app.querySelectorAll('[data-act="look-device"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.d === B.lookDevice));
        app.querySelector('[data-region="look-frame"]').className = 'a-frame ' + (B.lookDevice === 'desktop' ? 'a-frame-pc' : 'mobile'); fitLookFrame(); return;
      }
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
    if (el.dataset.fsize) { B.themeDraft[el.dataset.fsize] = Number(el.value); el.nextElementSibling.textContent = el.value + '%'; B.themeDirty = true; return dChanged(false); }
    if (B.tab === 'design' && B.view === 'client' && dInput(el)) return;
    // The Hello card size slider: show the Hello card in the preview and resize it while sliding.
    const sizeScreen = (FAIRY_SIZES.find(x => x[0] === el.dataset.theme) || [])[2];
    if (sizeScreen) {
      B.themeDraft[el.dataset.theme] = Number(el.value);
      const out = el.closest('label').querySelector('.a-range-val'); if (out) out.textContent = el.value + '%';
      if (B.lookScreen !== sizeScreen) { B.lookScreen = sizeScreen; app.querySelectorAll('[data-act="look-screen"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.s === sizeScreen)); loadFrame(); }
      return themeChanged(false);
    }
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
    if (el.dataset.theme) { const k = el.dataset.theme; B.themeDraft[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value; const out = el.type === 'range' && el.closest('label').querySelector('.a-range-val'); if (out) out.textContent = el.value + '%'; return themeChanged(false); }
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
      if (await saveClient('PUT', '/details', { code }, 'New client code saved.')) { B.newCode = code; render(); }
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
