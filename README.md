# Pixie Craft Studio · Wedding RSVP

The wedding RSVP website of Pixie Craft Studio, ready for **GitHub Pages** with a **Supabase** database.
**To publish it, follow [PUBLISH.md](PUBLISH.md).**

| View | Address | Who |
|---|---|---|
| **Pixie's RSVP Board** | `…/#/board` (the home page) | The studio only (name + password): clients, guest lists, RSVP links, Customize, Design, Wording, Preview, **✦ Edit website** |
| **Couple's view** | `…/#/couple/<link-name>` | Each couple, with their 6-number code: who's coming, adding guests, preview |
| **Guest RSVP** | `…/#/w/<link-name>` or a family link `…/#/r/<code>` | Guests |

## Editing the website (studio only)
Sign in to the board and press **✦ Edit website** on the board or on any couple's view you open from it.
- Click anything to select it. Drag to move it, pull a corner to resize, pull a side to make it wider, and use the round knob to turn it.
- Double-click words to retype them. The toolbar above the selection changes font, size, colors, bold, italic and alignment, replaces pictures, brings parts to the front or hides them.
- **Uploads**: your own flowers, frames and stickers. **Text**: add headings and script lines. **Styles**: page colors and fonts. **Changes**: everything you changed, with a way to put each back.
- Moves are kept separately for computers and phones: make the window narrow (or open it on your phone) to arrange the phone layout.
- **Preview** lets you click around the site normally. **Save** publishes the changes; couples and guests never see the editing tools.

## What's in this folder

| Folder | What it is |
|---|---|
| `docs/` | The website GitHub Pages shows. `docs/config.js` holds your Supabase address and public key. |
| `supabase/` | The database setup (`setup.sql`) and the API (`functions/api/index.ts`) |
| `.github/workflows/` | Sends the API to Supabase when it changes |
| `public/`, `core.js`, `pages/` | The source. `npm run build` turns it into `docs/` and `supabase/` |
| `tests/` | `npm test` checks the API |

## Try it on your computer
With Node 22: `npm run preview`, then open http://localhost:4000 (setup code 123456). It uses a pretend database that forgets everything when it stops.
