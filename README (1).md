<div align="center">

# Technex Official — Project Hub

**A real-time, dark neon-green project directory built with HTML, CSS, JavaScript and Supabase.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Realtime-3ECF8E?logo=supabase&logoColor=white)
![Status](https://img.shields.io/badge/status-active-42d98a)

[Discord](https://discord.gg/DzrXTfEmYC) · [YouTube](https://www.youtube.com/@TechnexOfficial12) · [Donate](#-support--donate)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Quick Start (A–Z)](#quick-start-a-z)
   - [1. Create a Supabase project](#1-create-a-supabase-project)
   - [2. Run the database schema](#2-run-the-database-schema)
   - [3. Configure the website](#3-configure-the-website)
   - [4. Create the admin login](#4-create-the-admin-login)
   - [5. Run locally](#5-run-locally)
   - [6. Test everything](#6-test-everything)
6. [Deploy to the Internet](#deploy-to-the-internet)
7. [Using the Admin Panel](#using-the-admin-panel)
8. [Database Design](#database-design)
9. [Security Model](#security-model)
10. [Customization](#customization)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)
13. [Contributing](#contributing)
14. [Support & Donate](#-support--donate)
15. [License](#license)

---

## Overview

Technex Official is a community project directory. Visitors can browse and search projects, tools and releases without logging in. A single allowlisted admin can sign in to publish, edit and delete posts. Everything is stored in Supabase Postgres, so posts survive refreshes, and Supabase Realtime pushes changes to every open visitor page instantly — **no refresh needed**.

It is a static frontend: there is no build step, no Node.js server and no framework to install.

## Features

- **Live feed** — new, edited and deleted posts appear on all open tabs in real time.
- **Search** — filter by title, description, category or tag.
- **Category filter** — Tools, Discord, Web, AI, Utilities, Other.
- **Admin panel** — publish, edit and delete projects from a modal control room.
- **Secure by design** — Row Level Security (RLS) enforces permissions in the database, not in the browser.
- **XSS-safe rendering** — all user content is HTML-escaped; only `http(s)` links are accepted.
- **Donation section** — copy-to-clipboard crypto wallet card.
- **Responsive** — desktop, tablet and mobile layouts.
- **Status indicators** — live connection / reconnecting / setup-required states.
- **Accessible** — focus outlines, ARIA live regions, keyboard-closable dialogs.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup / Style | HTML5, CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES modules) |
| Backend | [Supabase](https://supabase.com/) — Postgres, Auth, Realtime |
| Client library | `@supabase/supabase-js` v2 (loaded from jsDelivr CDN) |
| Fonts | Inter, DM Mono (Google Fonts) |

## Project Structure

```
technex/
├── index.html     # Page layout, dialogs, donation section
├── styles.css     # Responsive dark tech theme
├── app.js         # Supabase queries, auth, search, CRUD, realtime, copy button
├── config.js      # Your Supabase Project URL + publishable key
├── schema.sql     # Tables, RLS policies, admin function, Realtime setup
├── .gitignore     # Files excluded from Git
└── README.md      # This file
```

## Quick Start (A–Z)

### 1. Create a Supabase project

1. Go to <https://supabase.com/> and create a free project.
2. Wait until the database finishes provisioning.

### 2. Run the database schema

1. In the dashboard open **SQL Editor → New query**.
2. Paste the **entire** contents of `schema.sql`.
3. Click **Run**. The script is safe to run more than once.

It creates the `posts` and `admin_users` tables, enables RLS, installs the `is_admin()` function and policies, and adds `posts` to the `supabase_realtime` publication.

### 3. Configure the website

Open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **publishable key** (the legacy `anon` key also works). Put them in `config.js`:

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_PUBLISHABLE_OR_ANON_KEY';
```

> ⚠️ **Never** put the `service_role` / secret key or your database password in this file. The publishable key is safe in the browser **only** because RLS is enabled.

### 4. Create the admin login

1. In Supabase go to **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password (tick *Auto Confirm User* if available).
3. Copy the new user's **UUID** from the Users table.
4. In **SQL Editor** run:

```sql
insert into public.admin_users (user_id)
values ('PASTE-THE-REAL-AUTH-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

There is no public signup form and visitors cannot promote themselves. To remove an admin, delete their row from `public.admin_users`.

### 5. Run locally

ES modules and Supabase Auth need a local web server — do **not** double-click `index.html` (`file://` will not work).

**Option A — Python**

```bash
# Windows
py -m http.server 5500
# macOS / Linux
python3 -m http.server 5500
```

Open <http://localhost:5500>. Stop with `Ctrl+C`.

**Option B — VS Code:** install the *Live Server* extension, right-click `index.html` → **Open with Live Server**.

**Option C — Node:** `npx serve .`

### 6. Test everything

1. Open the site in **two browser tabs**.
2. In tab 1 click **Admin Login**, sign in and publish a test project with a real `https://` URL.
3. Tab 2 should show it automatically (Realtime). The top-right label should read **Live updates connected**.
4. Try the search box and category filter.
5. Edit and delete the post from the admin panel, then refresh — data persists in Postgres.
6. Click **Copy address** in the Donate section and paste it somewhere to verify.

## Deploy to the Internet

Because the site is fully static, any static host works.

### GitHub Pages

1. Push the project to a GitHub repository.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

### Netlify / Vercel / Cloudflare Pages

Import the repo, leave the build command empty and set the output directory to the project root.

### After deploying — important

In Supabase go to **Authentication → URL Configuration** and add your live site URL (and `http://localhost:5500`) to **Site URL / Redirect URLs**.

## Using the Admin Panel

| Action | How |
| --- | --- |
| Sign in | Click **Admin Login**, enter admin email + password |
| Publish | Fill title, category, URL, description, optional tags → **Publish project** |
| Edit | Click **Edit** on a post, change fields → **Save changes** |
| Delete | Click **Delete** and confirm (cannot be undone) |
| Sign out | Click **Sign out** in the panel header |

Limits: title ≤ 120 chars, description ≤ 700 chars, up to 10 tags, URL must start with `http://` or `https://`.

## Database Design

**`public.posts`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, auto-generated |
| `title` | text | 1–120 chars |
| `description` | text | 1–700 chars |
| `project_url` | text | Must match `^https?://` |
| `category` | text | Tools, Discord, Web, AI, Utilities, Other |
| `tags` | text[] | Optional |
| `created_by` | uuid | References `auth.users` |
| `created_at` / `updated_at` | timestamptz | Default `now()` |

**`public.admin_users`** — allowlist of admin user UUIDs. Not readable or writable by clients.

## Security Model

- **RLS is the security boundary**, not the UI. Hiding a button protects nothing; database policies do.
- Anonymous visitors: **read-only** access to `posts`.
- Only users in `admin_users` can insert, update or delete (checked by the `SECURITY DEFINER` function `is_admin()`).
- No policy exists to write `admin_users`, so nobody can add themselves.
- User content is escaped before rendering, and links open with `rel="noopener noreferrer"`.
- Keep RLS **enabled** and never expose secret keys in client code.

## Customization

- **Colors / theme:** edit the CSS variables at the top of `styles.css` (`--green`, `--bg`, `--panel` …).
- **Categories:** update the `<option>` lists in `index.html` **and** the `check (category in (...))` constraint in `schema.sql`, plus a `.cat-yourname` style if you want a custom pill color.
- **Social links:** edit the nav links in `index.html`.
- **Donation address:** edit the `<code id="wallet-address">` value in `index.html`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Setup required" | Check `config.js`, save, hard-refresh (`Ctrl+Shift+R`) |
| Invalid API key / fetch error | Verify URL and publishable key; never use the secret key |
| Signed in but no admin access | The user UUID must exist in `public.admin_users` |
| Permission denied / RLS error | Re-run all of `schema.sql` and confirm the admin row |
| Realtime not updating | Check **Database → Publications → supabase_realtime** lists `posts`; refresh to confirm normal fetching works |
| Can't sign in | Confirm the user's email, or enable *Auto Confirm* in Auth settings |
| Redirect to wrong page | Add your site URL to **Authentication → URL Configuration** |
| Blank page locally | Use a local server, not `file://` |
| Copy button does nothing | Needs HTTPS or `localhost`; otherwise select the address and press `Ctrl+C` |

## FAQ

**Is it safe that my Supabase URL and key are public?**
Yes. They are designed for browsers when RLS is enabled. Only the `service_role` key is secret.

**Can I have multiple admins?**
Yes — add each user's UUID to `admin_users`.

**Does it cost anything?**
The Supabase free tier and any static host (e.g. GitHub Pages) are enough to start.

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m "Add my feature"`.
4. Push and open a Pull Request.

Bug reports and ideas are welcome — open an Issue or join the [Discord](https://discord.gg/DzrXTfEmYC).

## 💚 Support & Donate

If this project helps you, consider supporting its development. Every contribution keeps Technex free and online. Thank you!

| | |
| --- | --- |
| **Wallet address** | `0xf69883d8804753fF730631C52AEf669016fB45b0` |
| **Type** | EVM-compatible (Ethereum, BNB Chain, Polygon, and other EVM networks) |

> ⚠️ Always verify the address and select the correct network before sending. Crypto transfers are irreversible.

Other ways to help: ⭐ star the repo, subscribe on [YouTube](https://www.youtube.com/@TechnexOfficial12), join the [Discord](https://discord.gg/DzrXTfEmYC), and share the project.

## License

Add a license of your choice (for example [MIT](https://choosealicense.com/licenses/mit/)) by creating a `LICENSE` file.

---

<div align="center">Built for creators, makers &amp; curious minds — <b>Technex Official</b></div>
