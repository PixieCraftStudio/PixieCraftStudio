# Publish the Pixie Craft Studio RSVP website with GitHub Pages

GitHub Pages shows the website for free. GitHub Pages can't store anything, so RSVP answers, guest lists, sign-ins and your edits are kept in **Supabase**, a free online database. You need two free accounts: **github.com** and **supabase.com**. Everything below is done in the browser.

## 1. Make the database (Supabase, about 5 minutes)
1. On supabase.com, **New project**. Give it a name (for example *pixie-rsvp*), a database password (keep it somewhere safe), and the region closest to you (Singapore for the Philippines).
2. When it is ready, open **SQL Editor > New query**, paste everything from `supabase/setup.sql`, and press **Run**. It should say *Success*.
3. Open **Project Settings > API** (or **Data API**) and keep this page open. You need:
   - the **Project URL**, like `https://abcdefghijklmnop.supabase.co`
   - the **anon public** key (or **publishable** key)

## 2. Put the files on GitHub
1. On github.com, **New repository**. Name it (for example *pixie-rsvp*), choose **Public** (needed for free GitHub Pages), and create it **without** a README.
2. On the new repository's page, click **uploading an existing file**. Unzip the zip file on your computer, open the `pixie-rsvp` folder, select **everything inside it** (including the `docs`, `supabase` and `.github` folders), and drag it into the page. Press **Commit changes**.
   - If the `.github` folder doesn't upload (it is hidden on some computers), see step 4b.
3. Open `docs/config.js` on GitHub, press the pencil (edit), and fill in the two values from step 1.3:
   ```js
   supabaseUrl: 'https://abcdefghijklmnop.supabase.co',
   supabaseKey: 'your anon public key',
   ```
   Press **Commit changes**.

## 3. Turn on GitHub Pages
**Settings > Pages > Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/docs**, **Save**. After a minute the page shows your address, like `https://yourname.github.io/pixie-rsvp/`.

## 4. Send the API to Supabase
The API is the small program that checks sign-ins and saves answers. It lives in `supabase/functions/api/index.ts`.

**4a. Automatic (recommended).** In your GitHub repository, **Settings > Secrets and variables > Actions > New repository secret**, add:
| Name | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com > your avatar > **Account preferences > Access Tokens > Generate new token** |
| `SUPABASE_PROJECT_REF` | the letters in your Project URL: `https://`**`abcdefghijklmnop`**`.supabase.co` |
| `SETUP_CODE` | any 6 numbers you choose. You type them once when creating the studio sign-in |

Then **Actions > Deploy the API to Supabase > Run workflow**. A green tick means it worked. From now on, every change to the `supabase` folder is sent automatically.

**4b. By hand (if you'd rather not use tokens).** In Supabase: **Edge Functions > Deploy a new function > Via Editor**, name it exactly `api`, replace the sample code with everything from `supabase/functions/api/index.ts`, and **Deploy**. Then open the function's **Settings** (or **Details**) and turn **off** "Enforce JWT verification" (also called "Verify JWT"). Finally, **Edge Functions > Secrets**: add `SETUP_CODE` with your 6 numbers.

## 5. Start using it
1. Open your GitHub Pages address. It opens **Pixie's RSVP Board**.
2. Type your setup code, then choose your studio name and password.
3. Add your first client. Each client's **RSVP Links** tab has the guest link and the couple's view link to send.

Links look like `https://yourname.github.io/pixie-rsvp/#/w/via-arkin` (guests) and `…/#/couple/via-arkin` (couple).

## Good to know
- **Your own address** (like `rsvp.pixiecraftstudio.com`): **Settings > Pages > Custom domain**, then follow GitHub's steps at your domain seller.
- **Only allow your website to use the API (optional):** in Supabase **Edge Functions > Secrets**, add `ALLOWED_ORIGIN` = `https://yourname.github.io`.
- **Videos** can be up to 50 MB on the free Supabase plan. Pictures up to 15 MB.
- **Backups:** the free Supabase plan doesn't keep daily copies. In the board, open **Studio settings** (click the logo) > **Download a backup of everything** now and then.
- **Free plan pause:** Supabase pauses free projects after a week with no visits. Opening the board once a week keeps it awake; if it pauses, press **Restore** in Supabase.
- **Forgot the studio password:** Supabase **SQL Editor**, run `update pixie_rows set value = '[]', rev = rev + 1 where key = 'studio:accounts';` then open the board and choose a new one. Clients and answers are kept.
- **Changing the website's code:** edit the files in `public/` or `core.js`, run `npm run build` on a computer with Node 22, and commit the updated `docs/` and `supabase/` folders.
