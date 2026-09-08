# SUPABASE_SETUP — one-time backend setup for Ven

~20 minutes, totally free. After this the site and admin board run off Supabase, with permissions **enforced by the database** — the public key genuinely cannot read pending requests or edit anything.

> Nothing here is needed to *develop* the site — it falls back to bundled seed data until you connect Supabase.

---

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) → Start your project → sign in with GitHub.
2. **New project** → name: `commissions` → choose a region near you (EU West for .fr audience) → set a database password (you won't need it day-to-day; store it anyway).
3. Wait ~2 min for provisioning.

## 2. Create the tables + permissions

In the Supabase dashboard: **SQL Editor** → "New query" → paste **everything** in [`supabase-schema.sql`](supabase-schema.sql) (next to this file) → **Run**.

That single script does everything:
- creates the `services`, `commissions`, `settings` tables
- seeds them with your current prices and queue
- enables **Row Level Security** with these policies:

| Who (key) | services | commissions | settings |
|---|---|---|---|
| public (`anon` key, in the site) | read active rows | read **non-Request** rows · **insert only Request rows** | read |
| admin (`service_role` key, yours) | full control | full control | full control |

The database itself rejects anything else — if someone extracts the anon key from the site, the worst they can do is read public data or file a request. No editing, no deleting, no reading other people's contact info.

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

Commit + push → done. The site reads Supabase (polls every 60 s).

## 5. Wire up the admin board

1. Open `https://venuxiio.github.io/commissions/admin.html` (never linked from the site).
2. Paste the **service_role** key → **Unlock board**.
3. Stored in that browser's `localStorage` only. "Forget token" on shared devices.

## 6. Smoke test

1. Public site → service cards + queue render from Supabase.
2. Public site → submit the request form → row appears with `status = 'request'` (check the Table Editor).
3. Public site → that request is **not visible anywhere** on the page.
4. **Permission proof**: run
   `curl "https://YOUR-PROJECT.supabase.co/rest/v1/commissions?select=*" -H "apikey: ANON_KEY" -H "Authorization: Bearer ANON_KEY"`
   → you get queue rows **without** any `request` rows, and no `contact`/`refs`/`details` columns (the script drops them for anon).
5. Same curl with `select=contact` → **error** (column not exposed to anon).
6. `admin.html` → request shows in 📥 Requests with full info → drag/click to Waiting List → public queue shows it within 60 s.
7. Admin ⚙ → toggle Commissions open → public button flips.

## 7. Editing data by hand

You don't need the admin board for bulk edits — dashboard → **Table Editor** is a nice spreadsheet view, and being logged into the dashboard uses your full-permission session. The admin board is for the day-to-day drag-drop flow.

## Troubleshooting

- **Site shows seed data** → check URL + anon key in `js/config.js`; browser devtools console shows the error.
- **"new row violates row-level security"** on form submit → the insert policy expects `status = 'request'` (all lowercase). Re-run the schema script if unsure.
- **Admin gate rejects key** → it's the `service_role` key, not the anon key.
- **Project paused** (free tier, 1 week of zero traffic) → dashboard → Restore. Any site visitor counts as activity, so it stays awake while the site is live.

## Why the keys are safe where they are

- `anon` key in public JS: every request is checked against RLS policies server-side. Public = can read public data, can submit a request. That's it.
- `service_role` in your browser only: full control. If a device is compromised, dashboard → Settings → API → rotate JWT secret (invalidates old keys).
