# SUPABASE_SETUP — one-time backend setup for Ven

~20 minutes, totally free. After this the request form and admin board run off Supabase, with permissions **enforced by the database** — the public key genuinely cannot read pending requests or edit anything.

> Nothing here is needed to *develop* the site — services, prices and the open/closed settings live in `commissions.js`, and the database is only for commission requests.

---

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → Start your project → sign in with GitHub.
2. **New project** → name: `commissions` → choose a region near you (EU West for .fr audience) → set a database password (you won't need it day-to-day; store it anyway).
3. Wait ~2 min for provisioning.

## 2. Create the table + permissions

In the Supabase dashboard: **SQL Editor** → "New query" → paste **everything** in [`supabase-schema.sql`](supabase-schema.sql) (next to this file) → **Run**.

That single script does everything:
- creates the `commissions` table (the only one)
- enables **Row Level Security** with this permission model:

| Who (key) | commissions |
|---|---|
| public (`anon` key, in the site) | **no reads** · **insert only Request rows** |
| admin (`service_role` key, yours) | full control |

The database itself rejects anything else — if someone extracts the anon key from the site, the worst they can do is file a request. No reading, no editing, no deleting, no seeing other people's contact info.

## 3. Get your two keys

Dashboard → ⚙ **Project Settings** → **API**. You need three values:

| Value | Where it goes |
|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `js/config.js` → `supabaseUrl` |
| **anon public** key | `js/config.js` → `supabaseAnonKey` |
| **service_role** key 🔒 | **nowhere in the repo** — paste it into `admin.html` in your browser |

The anon key is designed to be public (that's the whole model). The service_role key bypasses all permissions — treat it like a password.

## 4. Wire up the site

`js/config.js`:

```js
const CONFIG = {
    supabaseUrl: "https://xxxx.supabase.co",
    supabaseAnonKey: "eyJ…"
};
```

Commit + push → done. The request form posts straight to Supabase; everything else on the public site renders from `commissions.js` + `portfolio.js`.

## 5. Wire up the admin board

1. Open `https://venuxiio.github.io/commissions/admin.html` (never linked from the site).
2. Paste the **service_role** key → **Unlock board**.
3. Stored in that browser's `localStorage` only. "Forget token" on shared devices.

## 6. Smoke test

1. Public site → service cards render from `commissions.js` (edit a price there, reload, see it).
2. Public site → submit the request form → row appears with `status = 'request'` (check the Table Editor).
3. **Permission proof**: run
   `curl "https://YOUR-PROJECT.supabase.co/rest/v1/commissions?select=*" -H "apikey: ANON_KEY" -H "Authorization: Bearer ANON_KEY"`
   → **error / empty**: anon cannot read commissions at all (only the admin board reads them).
4. `admin.html` → request shows in 📥 Requests with full info → drag/click to Waiting List.

> Already set up before Sep 2026? Run in the SQL Editor, in order:
> - [`migrations/2026-09-08-drop-public-queue.sql`](migrations/2026-09-08-drop-public-queue.sql) — drop the old `commissions_public` view, lock anon out of commission reads
> - [`migrations/2026-09-11-drop-settings-services-tables.sql`](migrations/2026-09-11-drop-settings-services-tables.sql) — drop the now-unused `services` + `settings` tables (data moved to `commissions.js`)

## 7. Editing data by hand

The Table Editor is only for commission requests — dashboard → **Table Editor** is a nice spreadsheet view. Services, prices and the open/closed settings are edited in `commissions.js` and deployed like any other file change; the admin board is for the day-to-day drag-drop flow.

## Troubleshooting

- **"new row violates row-level security"** on form submit → the insert policy expects `status = 'request'` (all lowercase). Re-run the schema script if unsure.
- **Admin gate rejects key** → it's the `service_role` key, not the anon key.
- **Project paused** (free tier, 1 week of zero traffic) → dashboard → Restore. Any site visitor counts as activity, so it stays awake while the site is live.

## Why the keys are safe where they are

- `anon` key in public JS: every request is checked against RLS policies server-side. Public = can submit a request. It cannot read commissions at all.
- `service_role` in your browser only: full control. If a device is compromised, dashboard → Settings → API → rotate JWT secret (invalidates old keys).
