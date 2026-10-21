# Technex Official — Real-Time Project Hub

A dark, neon-green project directory using HTML/CSS/JavaScript and Supabase. Public visitors can browse and search projects; an allowlisted admin can sign in and publish, edit, or delete posts. Posts are stored in Postgres and remain after refresh. Supabase Realtime updates open visitor pages when a post changes.

## Files

- `index.html` — page layout and dialogs
- `styles.css` — responsive dark tech theme
- `app.js` — Supabase queries, auth, search, CRUD, realtime updates
- `config.js` — your Supabase project URL and public browser key
- `schema.sql` — database tables, Row Level Security policies, admin function, Realtime setup

## 1. Create a Supabase project

1. Open https://supabase.com/ and create a project.
2. Wait for the database to finish provisioning.
3. In the project dashboard, open **SQL Editor → New query**.
4. Paste the entire contents of `schema.sql`, then click **Run**.
5. Open **Project Settings → API** (or **Connect**, depending on dashboard layout). Copy the Project URL and the **publishable key**. The legacy `anon` key also works. Do not use the `service_role` or secret key in a browser.

## 2. Configure the website

Open `config.js` in Notepad or your editor and replace the placeholders:

```js
export const SUPABASE_URL = 'https://YOUR-REAL-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_REAL_PUBLISHABLE_OR_ANON_KEY';
```

Save the file. The URL and publishable/anon key are designed for browser use when RLS is correctly enabled. They are not admin credentials; database policies enforce permissions.

## 3. Create the admin login

1. In Supabase, open **Authentication → Users → Add user** (or **Add user → Create new user**).
2. Enter your own email and a strong password. Confirm/create the user according to the dashboard's options.
3. Copy that user's UUID from the Users table.
4. In SQL Editor, run this command, replacing the example UUID with your actual user UUID:

```sql
insert into public.admin_users (user_id)
values ('PASTE-THE-REAL-AUTH-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

Only add people you trust. The public website does not expose a signup form, and visitors cannot self-promote to admin. To remove an admin, delete their row from `public.admin_users`.

## 4. Run locally on Windows

ES modules and Supabase Auth work best from a local web server, not by double-clicking `index.html` (which uses `file://`).

**Option A — Python (if installed):**

1. Extract the project folder.
2. Open the folder in File Explorer.
3. Click the address bar, type `cmd`, and press Enter.
4. Run:

```bat
py -m http.server 5500
```

5. Open http://localhost:5500 in your browser.
6. To stop the server, return to the terminal and press `Ctrl+C`.

**Option B — VS Code:** install the Live Server extension, open the folder, right-click `index.html`, and select **Open with Live Server**.

## 5. Test the features

- Open the local site in two browser tabs.
- In tab 1, click **Admin Login**, sign in using the user added to `admin_users`, and publish a test project with a real `https://` URL.
- Tab 2 should show the post automatically after Realtime connects. If not, refresh and check Supabase Realtime is enabled for `public.posts`.
- Search by title, description, category, or tag; try the category filter.
- Edit or delete a post from the Admin panel. Refresh the page: the post remains because it is in Supabase Postgres.

## Troubleshooting

- **“Setup required”**: check `config.js`, save it, then hard-refresh the browser.
- **Invalid API key / fetch error**: verify the Project URL and publishable/anon key; do not use a service-role secret.
- **Admin sign-in works but no admin access**: the signed-in user's UUID must be in `public.admin_users`.
- **Permission denied / RLS error**: run all of `schema.sql` and confirm the admin allowlist row exists.
- **Realtime not updating**: confirm the `posts` table is listed in Database → Publications / `supabase_realtime`; the SQL file attempts to add it. Refresh the page to verify ordinary fetching still works.
- **Login confirmation**: if email confirmation is required in your Supabase Auth settings, confirm the signup email before signing in, or configure confirmation according to your preference.
- **Local auth redirect**: if Supabase redirects to an unexpected page, add `http://localhost:5500` (and your chosen local server URL) to Authentication → URL Configuration → Redirect URLs.

## Security notes

- Never put the Supabase `service_role` key, database password, or other secret in `config.js` or any client-side file.
- Keep Row Level Security enabled. The SQL intentionally gives anonymous visitors read-only access to posts.
- The browser UI is not the security boundary: PostgreSQL RLS is. Only `admin_users` members can insert, edit, or delete posts.
- This is a static frontend; the Supabase project is the hosted backend. Local testing requires internet access to reach Supabase.
