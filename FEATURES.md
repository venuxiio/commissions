# FEATURES — Venuxiio Commission Site

> Feature spec + roadmap. Written **before** implementation (approved plan, Sep 7 2026).
> Status legend: ✅ shipped · 🚧 in progress · 📋 planned · 💡 future idea

> **Update (2026-09-11):** services, prices and the open/closed settings no
> longer live in the database — `commissions.js` is their single source of
> truth, hand-edited like `portfolio.js`. Supabase stores **commission
> requests only**; the `services` + `settings` tables are dropped
> (migration `2026-09-11-drop-settings-services-tables.sql`), the admin
> ⚙ settings panel is gone, and the public site no longer polls Supabase.
> Sections below are kept as written for history; lines that would mislead
> as a build guide are corrected in place.

---

## 1. Overview

Turn the static commission portfolio into a VGen-inspired, self-managed commission system:

- **Visitors** browse VGen-style **service cards**, and submit a **Commission Request** form (no account, guest by default).
- **Ven** manages everything from a private, unlisted **drag-and-drop board** (`admin.html`): requests → waiting list → in progress → finished, paid toggles, open/close commissions, slot count.
- **Supabase** (free Postgres) is the backend. The public site reads it live — dragging a card on the admin board updates the public queue within a minute. Permissions are **enforced by the database** (Row Level Security), not by front-end convention.

Everything stays **static hosting** (GitHub Pages). No server of your own, no build step, vanilla JS.

---

## 2. Current features (inventory, before this project)

| # | Feature | Where | Notes |
|---|---------|-------|-------|
| C1 | Hash navigation sections (Home / Examples / Prices / Terms) | `index.html` nav | Toggle-style, collapsible banner |
| C2 | Status indicators (COMMS / ART TRADES / REQUESTS) | Home | Date-string driven — has `Invalid Date` bug |
| C3 | Smart commission button | Home | Open / full / closed states + slot count |
| C4 | Closed-state gating | Home | Comms closed → "Request this" buttons disabled, request modal unreachable |
| C5 | Queue board (read-only) | Home | 3 columns, built from `commissions.js` |
| C6 | Price table + sketch prices + add-ons | Prices | Hand-written HTML |
| C7 | Will draw / Won't draw lists | Prices | |
| C8 | Examples gallery + lightbox modal | Examples | 7 groups, click to zoom |
| C9 | T.O.S + F.A.Q | Terms | |
| C10 | Google Analytics | all pages | No consent banner (see STUDY.md §6) |
| C11 | Footer with socials | all pages | |

**Known bugs fixed by this project:** C2/C3 `Invalid Date` when closed (STUDY.md bugs #1–2) — replaced by explicit open/closed flags in the DB settings row.

---

## 3. New features

### F1 — Service cards (replaces Prices table) 🚧

**User story:** As a visitor, I see each commission type as a card with an example image, price and description — like a VGen listing — and can jump straight into requesting it.

- VGen-style card grid: example image, service name, price (e.g. `€40` / `€100+`), extra-character / option notes.
- Example image is a **carousel** of that service's portfolio pieces (matched by category), with wrap-around ‹ › arrows, blurred edge peeks, swipe on mobile, and lightbox on click (Sep 11 2026).
- Two groups: **Full render** and **Sketch** (matching current pricing).
- Each card has a **Request this →** button that opens the F2 form with the service pre-selected.
- Data from `commissions.js` (since Sep 11 2026 — was the `services` table).
- Kept as-is below the cards: Will draw / Won't draw lists, reference-sheet price image, "no shading = −15%" callout.

**Acceptance criteria**
- [ ] All 12 current services render as cards (7 full render + 5 sketch)
- [ ] Clicking Request this opens the form with that service selected
- [ ] Cards render from Supabase when available, seed data otherwise
- [ ] Nav tab renamed Prices → Services; all `#prices` links updated

### F2 — In-site Commission Request form (guest, VGen-style) 🚧

**User story:** As a visitor, I fill one form on the site — who I am, how to reach me, what I want, my references — see a live price estimate, and submit. No Google Form, no account.

Modeled on VGen's request form (the reference the user provided):

- **Your name** (required)
- **Contact** — email and/or Discord / Instagram username (required, at least one)
- **Service** select (from F1 data, required)
- **# of characters** (min 1; extra characters priced per service)
- **Options:** simple background (+€10), armor/weapons/robotic parts (+€5–10, select) — labels/prices from `siteData.addons`
- **Reference images** (up to 3, required ≥1 — uploaded to the private `commission-refs` Storage bucket; replaced the old links textarea, Sep 11 2026)
- **Details** (free text)
- **Quick math**: live estimate breakdown, base + extras, with "final price confirmed by Ven" note
- **T.O.S agreement checkbox** (required), hidden honeypot field (anti-spam)
- On submit → row in `commissions` with status `request` → appears on the admin board's Requests column. The DB's `commissions_public` view excludes request rows and contact columns from the anon key — they never render or download publicly.
- When commissions are **closed**: the service-card "Request this →" buttons are disabled and the request modal can't be opened (card clicks and `#request` deep links both blocked); the form stays hidden inside the modal as a safety net

**Acceptance criteria**
- [ ] Estimate updates live as options change
- [ ] Submit succeeds with dummy keys gracefully rejected (no crash)
- [ ] Row lands with `status='request'`; anon-key queries (curl smoke test in SUPABASE_SETUP.md §6) cannot read it or the contact column
- [ ] Closed state disables the "Request this" buttons and blocks the request modal (deep links included)
- [ ] Required-field validation with visible errors

### F3 — Private drag-and-drop admin board (`admin.html`, unlisted) 🚧

**User story:** As Ven, I open my private board, see new requests, drag them through the pipeline, toggle paid, and open/close commissions — and the public site reflects it.

- **Key gate**: paste the Supabase service_role key once → validated → stored in `localStorage` (per device). "Forget token" button. Token never appears in the repo.
- **Board**: 4 columns — **📥 Requests → Waiting List → In Progress → Finished**, with counts.
- **Requests column**: full contact info, reference image previews (click to view, ⬇ on the thumb to download), full details — everything the form captured. Cards have an **Accept → Waiting** shortcut (dragging works too).
- **Drag & drop** (HTML5, desktop) + **◀ ▶ move buttons** per card (touch/mobile + a11y fallback).
- **Per card**: paid toggle (dot), edit (same shared form as the public site, incl. attachments + status), delete (confirm + storage cleanup).
- **Settings panel**: removed (Sep 11 2026) — comms open/closed, reopen date and max slots are edited in `commissions.js` now.
- Optimistic updates with rollback + "saving…" indicator.

**Acceptance criteria**
- [ ] Wrong/absent token shows gate screen, no data fetched
- [ ] Request cards show full contact info + clickable refs
- [ ] Drag card (or Accept button) to another column → status updates in Supabase, survives refresh
- [ ] Move buttons work on mobile
- [ ] Paid toggle updates public queue's dot on next refresh
- [ ] Settings changes flip the public commission button state

### F4 — Supabase backend layer 🚧

**User story:** As the site owner, I edit data in Supabase (or via the admin board) and the site updates itself — no code edits, no deploys.

- 1 table: `commissions` (Postgres schema in `supabase-schema.sql`). Services + settings are **not** tables — they live in `commissions.js` (Sep 11 2026).
- `js/db-client.js`: `submitRequest / adminGetCommissions / adminUpdateCommission / adminCreateCommission / adminDeleteCommission / validateKey` — plain `fetch` against the REST API, no SDK
- No auto-refresh: the public site reads everything from the JS data files; its only Supabase call is the form submit.

**Schema — `services`**
| Column | Type |
|---|---|
| id | identity |
| name | text |
| category | `full_render` / `sketch` |
| base_price | int |
| extra_char_price | int |
| description | text |
| image | text (path/URL) |
| active | bool |
| sort | int |

**Schema — `commissions`** (queue + form requests in one table)
| Column | Type |
|---|---|
| id | identity |
| client | text |
| contact | text |
| service | text |
| details | text |
| refs | text (legacy — old link references) |
| options | jsonb (`{background, armor, chars}`) |
| attachments | jsonb (array of `commission-refs` storage paths) |
| estimate | numeric |
| status | `request` / `waiting` / `in_progress` / `finished` |
| paid | bool |
| sort_order | int |
| created_at | timestamptz |

**View — `commissions_public`**: dropped (Sep 8 2026) along with all anon commission reads — only the admin board reads commissions now.

**Schema — `settings`**: table dropped (Sep 11 2026). Comms open/closed, reopen date and max slots live in `commissions.js` under `siteData.settings`.

---

## 4. Architecture

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│  PUBLIC SITE (index.html)   │        │  ADMIN (admin.html) ⬆ unlisted│
│  visitors + Ven             │        │  Ven only                    │
│                             │        │                              │
│  service cards  ◀─ commissions.js    │  drag-drop board             │
│  settings       ◀─ commissions.js    │  (incl. request cards)       │
│  request form   ──create─▶  │        │  full CRUD                   │
└────────────┬────────────────┘        └────────────┬─────────────────┘
             │ anon key (in js/config.js)            │ service_role key
             │  RLS-enforced:                        │ (pasted, localStorage)
             │  · insert status='request' only —     │  bypasses RLS:
             │    no reads/updates/deletes at all    │  full control
             ▼                                       ▼
      ┌────────────────────────────────────────────────┐
      │  SUPABASE (free Postgres) — Row Level Security  │
      │  commissions (the only table)                  │
      └────────────────────────────────────────────────┘
```

**Key model (2 keys, permissions enforced by the database):**

| Key | Can do | Cannot do | Lives |
|---|---|---|---|
| `anon` (public) | insert a commission **iff** `status='request'` and `paid=false` and client+service non-empty | read commissions (or anything); UPDATE / DELETE anything; insert anything with another status | `js/config.js` (committed — it's designed to be public) |
| `service_role` (private) | everything (bypasses RLS) | — | pasted into `admin.html`, browser `localStorage` only |

> This fixes the Airtable limitation: "create-only" and "can't see requests" are **database policies** (`with check (status='request' …)`, view column filtering, no anon update/delete grants), not front-end filtering. Even a crafted API call with the anon key is rejected by Postgres. If the anon key is ever abused: dashboard → rotate JWT secret.

> Honest limitation: client-side tokens are obfuscation, not real auth. Acceptable because all exposed data is public or low-stakes. Roadmap: serverless proxy (Cloudflare Worker) if it ever matters.

---

## 5. UI sketches

Wireframes, not pixel-perfect. Colors follow the site's purple palette (`#A78BFA` primary, cream `#f5f1e8`, Fredoka headings).

### 5.1 Public — full navigation map

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 300" font-family="Segoe UI, sans-serif">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="#8B5CF6"/>
    </marker>
  </defs>
  <style>
    .page { fill: #ffffff; stroke: #A78BFA; stroke-width: 2; rx: 10; }
    .tab  { fill: #E9D5FF; stroke: #A78BFA; }
    .tabActive { fill: #A78BFA; }
    .lbl  { font-size: 13px; fill: #2D1B4E; font-weight: 600; }
    .sub  { font-size: 11px; fill: #666; }
    .h    { font-size: 14px; fill: #2D1B4E; font-weight: 700; }
  </style>

  <text x="430" y="24" text-anchor="middle" class="h">PUBLIC SITE — banner nav (hash routing, one page)</text>

  <rect x="330" y="38" width="200" height="56" rx="28" class="tab"/>
  <text x="430" y="60" text-anchor="middle" class="lbl">Home · Examples · Services · Terms</text>
  <text x="430" y="78" text-anchor="middle" class="sub">click again to deselect · 4 tabs</text>

  <rect x="20"  y="130" width="180" height="110" rx="10" class="page"/>
  <text x="110" y="152" text-anchor="middle" class="lbl">Home</text>
  <text x="110" y="172" text-anchor="middle" class="sub">profile + status chips</text>
  <text x="110" y="188" text-anchor="middle" class="sub">commission button</text>
  <text x="110" y="204" text-anchor="middle" class="sub">ping list button</text>
  <text x="110" y="220" text-anchor="middle" class="sub">queue board (read)</text>

  <rect x="230" y="130" width="180" height="110" rx="10" class="page"/>
  <text x="320" y="152" text-anchor="middle" class="lbl">Examples</text>
  <text x="320" y="172" text-anchor="middle" class="sub">gallery groups</text>
  <text x="320" y="188" text-anchor="middle" class="sub">(unchanged)</text>

  <rect x="440" y="130" width="190" height="110" rx="10" class="page"/>
  <rect x="450" y="140" width="80" height="20" rx="10" class="tabActive"/>
  <text x="490" y="154" text-anchor="middle" style="font-size:11px;fill:#fff;font-weight:600">NEW</text>
  <text x="535" y="176" text-anchor="middle" class="lbl">Services</text>
  <text x="535" y="194" text-anchor="middle" class="sub">F1 service cards</text>
  <text x="535" y="210" text-anchor="middle" class="sub">F2 request form</text>
  <text x="535" y="226" text-anchor="middle" class="sub">(replaces Prices)</text>

  <rect x="660" y="130" width="180" height="110" rx="10" class="page"/>
  <text x="750" y="152" text-anchor="middle" class="lbl">Terms</text>
  <text x="750" y="172" text-anchor="middle" class="sub">T.O.S</text>
  <text x="750" y="188" text-anchor="middle" class="sub">F.A.Q</text>
  <text x="750" y="204" text-anchor="middle" class="sub">(unchanged)</text>

  <line x1="110" y1="240" x2="320" y2="240" stroke="#8B5CF6" stroke-width="1.5" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <line x1="410" y1="240" x2="510" y2="240" stroke="#8B5CF6" stroke-width="1.5" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <line x1="600" y1="240" x2="700" y2="240" stroke="#8B5CF6" stroke-width="1.5" marker-end="url(#arrow)" marker-start="url(#arrow)"/>
  <text x="430" y="262" text-anchor="middle" class="sub">tabs switch sections on one page — footer on all</text>

  <line x1="430" y1="94" x2="430" y2="120" stroke="#8B5CF6" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>
```

### 5.2 Public — Services section (F1 cards + F2 form entry)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 620" font-family="Segoe UI, sans-serif">
  <style>
    .page { fill: #ffffff; stroke: #A78BFA; stroke-width: 2; }
    .card { fill: #FAFAFF; stroke: #C4B5FD; stroke-width: 1.5; }
    .btn  { fill: #A78BFA; }
    .btnT { font-size: 11px; fill: #ffffff; font-weight: 600; }
    .h1   { font-size: 16px; fill: #2D1B4E; font-weight: 700; }
    .h2   { font-size: 13px; fill: #2D1B4E; font-weight: 700; }
    .price{ font-size: 14px; fill: #8B5CF6; font-weight: 700; }
    .sub  { font-size: 10px; fill: #666; }
    .tag  { fill: #E9D5FF; }
  </style>

  <!-- section frame -->
  <rect x="10" y="10" width="840" height="600" rx="12" class="page"/>
  <text x="30" y="40" class="h1">Commission Services</text>
  <text x="30" y="58" class="sub">Before commissioning, please read the Terms of Service. No shading at all = 15% off.</text>

  <!-- full render cards -->
  <text x="30" y="92" class="h2">Full render</text>
  <!-- card 1 -->
  <rect x="30" y="102" width="250" height="150" rx="10" class="card"/>
  <rect x="42" y="114" width="70" height="90" rx="6" fill="#E9D5FF"/>
  <text x="77" y="163" text-anchor="middle" class="sub">example img</text>
  <text x="124" y="130" class="h2">Bust</text>
  <text x="124" y="150" class="price">€40</text>
  <text x="124" y="168" class="sub">+€35 / extra character</text>
  <rect x="124" y="182" width="140" height="22" rx="11" class="btn"/>
  <text x="194" y="197" text-anchor="middle" class="btnT">Request this →</text>
  <!-- card 2 -->
  <rect x="300" y="102" width="250" height="150" rx="10" class="card"/>
  <rect x="312" y="114" width="70" height="90" rx="6" fill="#E9D5FF"/>
  <text x="347" y="163" text-anchor="middle" class="sub">example img</text>
  <text x="394" y="130" class="h2">Halfbody</text>
  <text x="394" y="150" class="price">€50</text>
  <text x="394" y="168" class="sub">+€40 / extra character</text>
  <rect x="394" y="182" width="140" height="22" rx="11" class="btn"/>
  <text x="464" y="197" text-anchor="middle" class="btnT">Request this →</text>
  <!-- card 3 -->
  <rect x="570" y="102" width="250" height="150" rx="10" class="card"/>
  <rect x="582" y="114" width="70" height="90" rx="6" fill="#E9D5FF"/>
  <text x="617" y="163" text-anchor="middle" class="sub">example img</text>
  <text x="654" y="130" class="h2">Custom</text>
  <text x="654" y="150" class="price">€100+</text>
  <text x="654" y="168" class="sub">moodboard + assigned animal</text>
  <rect x="654" y="182" width="140" height="22" rx="11" class="btn"/>
  <text x="724" y="197" text-anchor="middle" class="btnT">Request this →</text>
  <text x="425" y="272" text-anchor="middle" class="sub">… more cards: Knee up €70 · Fullbody €90 · Chibi €40 · Reference sheet €200+</text>

  <!-- sketch cards (compact row) -->
  <text x="30" y="302" class="h2">Sketch</text>
  <rect x="30" y="312" width="250" height="60" rx="10" class="card"/>
  <rect x="42" y="322" width="40" height="40" rx="6" fill="#E9D5FF"/>
  <text x="94" y="338" class="h2">Sketch Bust</text>
  <text x="94" y="356" class="price">€15</text>
  <rect x="300" y="312" width="250" height="60" rx="10" class="card"/>
  <rect x="312" y="322" width="40" height="40" rx="6" fill="#E9D5FF"/>
  <text x="364" y="338" class="h2">Sketch Halfbody</text>
  <text x="364" y="356" class="price">€24</text>
  <rect x="570" y="312" width="250" height="60" rx="10" class="card"/>
  <rect x="582" y="322" width="40" height="40" rx="6" fill="#E9D5FF"/>
  <text x="634" y="338" class="h2">Sketch Fullbody</text>
  <text x="634" y="356" class="price">€40</text>
  <text x="425" y="392" text-anchor="middle" class="sub">… Sketch Knee up €30 · Sketch Chibi €15 &nbsp;·&nbsp; add-ons: simple bg +€10 · armor +€5–10</text>

  <!-- will/won't draw -->
  <rect x="30" y="410" width="380" height="70" rx="10" class="card"/>
  <text x="50" y="434" class="h2">Will draw</text>
  <text x="50" y="454" class="sub">OCs · Furries · Humans · Ask</text>
  <rect x="440" y="410" width="380" height="70" rx="10" class="card"/>
  <text x="460" y="434" class="h2">Won't draw</text>
  <text x="460" y="454" class="sub">Extreme gore · NSFW · Complex bg · Horses · Complex horns</text>

  <!-- request form entry -->
  <rect x="30" y="500" width="790" height="90" rx="10" class="card" stroke-dasharray="6 3"/>
  <text x="50" y="528" class="h1">Commission Request</text>
  <text x="50" y="548" class="sub">Open the VGen-style form: service, characters, options, references, details — live price estimate.</text>
  <rect x="640" y="540" width="160" height="30" rx="15" class="btn"/>
  <text x="720" y="560" text-anchor="middle" class="btnT">Open request form</text>
</svg>
```

### 5.3 Public — Request form (F2, VGen-style)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 700" font-family="Segoe UI, sans-serif">
  <style>
    .page { fill: #ffffff; stroke: #A78BFA; stroke-width: 2; }
    .box  { fill: #FAFAFF; stroke: #C4B5FD; stroke-width: 1; }
    .btn  { fill: #A78BFA; }
    .btnD { fill: #C4B5FD; }
    .h1   { font-size: 16px; fill: #2D1B4E; font-weight: 700; }
    .lbl  { font-size: 12px; fill: #2D1B4E; font-weight: 600; }
    .sub  { font-size: 10px; fill: #666; }
    .val  { font-size: 11px; fill: #666; }
    .chk  { fill: none; stroke: #A78BFA; stroke-width: 1.5; }
    .note { fill: #fff3cd; stroke: #A78BFA; stroke-width: 1; }
  </style>

  <rect x="10" y="10" width="840" height="680" rx="12" class="page"/>
  <text x="30" y="40" class="h1">Commission Request</text>
  <text x="30" y="58" class="sub">Submitting a request doesn't guarantee acceptance. Ven reviews it and confirms price & timing.</text>

  <!-- note from artist -->
  <rect x="30" y="72" width="790" height="40" rx="8" class="note"/>
  <text x="44" y="90" class="sub">💬 Once you submit, I review the request and reply with exact pricing before we start.</text>
  <text x="44" y="104" class="sub">By ordering you're okay with the piece being used as an example (add-on available to keep it private).</text>

  <!-- name + contact -->
  <text x="30" y="140" class="lbl">Your name *</text>
  <rect x="30" y="148" width="280" height="28" rx="6" class="box"/>
  <text x="42" y="167" class="sub">Name / nickname</text>

  <text x="330" y="140" class="lbl">Contact * (fill at least one)</text>
  <rect x="330" y="148" width="240" height="28" rx="6" class="box"/>
  <text x="342" y="167" class="sub">✉ email</text>
  <rect x="580" y="148" width="240" height="28" rx="6" class="box"/>
  <text x="592" y="167" class="sub">🎮 Discord / Instagram username</text>

  <!-- service pick -->
  <text x="30" y="204" class="lbl">Service *</text>
  <g>
    <rect x="30" y="212" width="120" height="44" rx="8" class="btn"/>
    <text x="90" y="238" text-anchor="middle" class="lbl" style="fill:#fff">Bust</text>
    <rect x="160" y="212" width="120" height="44" rx="8" class="box"/>
    <text x="220" y="238" text-anchor="middle" class="lbl">Halfbody</text>
    <rect x="290" y="212" width="120" height="44" rx="8" class="box"/>
    <text x="350" y="238" text-anchor="middle" class="lbl">Knee up</text>
    <rect x="420" y="212" width="120" height="44" rx="8" class="box"/>
    <text x="480" y="238" text-anchor="middle" class="lbl">Fullbody</text>
    <rect x="550" y="212" width="120" height="44" rx="8" class="box"/>
    <text x="610" y="238" text-anchor="middle" class="lbl">Chibi</text>
    <rect x="680" y="212" width="130" height="44" rx="8" class="box"/>
    <text x="745" y="238" text-anchor="middle" class="lbl">Custom…</text>
  </g>

  <!-- characters + options -->
  <text x="30" y="288" class="lbl">Number of characters *</text>
  <rect x="30" y="296" width="120" height="28" rx="6" class="box"/>
  <text x="90" y="315" text-anchor="middle" class="lbl">−  1  +</text>
  <text x="160" y="315" class="sub">extra character priced per service</text>

  <text x="30" y="352" class="lbl">Options</text>
  <rect x="30" y="362" width="255" height="56" rx="8" class="box"/>
  <rect x="42" y="378" width="14" height="14" rx="3" class="chk"/>
  <text x="64" y="390" class="val">No shading at all</text>
  <text x="230" y="390" class="val" fill="#8B5CF6">−15%</text>
  <text x="64" y="408" class="sub">applies to whole piece</text>

  <rect x="300" y="362" width="255" height="56" rx="8" class="box"/>
  <rect x="312" y="378" width="14" height="14" rx="3" class="chk"/>
  <text x="334" y="390" class="val">Simple background</text>
  <text x="510" y="390" class="val" fill="#8B5CF6">+€10</text>
  <text x="334" y="408" class="sub">pattern / gradient scene</text>

  <rect x="570" y="362" width="250" height="56" rx="8" class="box"/>
  <rect x="582" y="378" width="14" height="14" rx="3" class="chk"/>
  <text x="604" y="390" class="val">Armor / weapons / robotic</text>
  <text x="762" y="390" class="val" fill="#8B5CF6">+€5–10</text>
  <text x="604" y="408" class="sub">per character, complexity based</text>

  <!-- refs + details -->
  <text x="30" y="448" class="lbl">References * (one link per line)</text>
  <rect x="30" y="456" width="385" height="70" rx="8" class="box"/>
  <text x="42" y="474" class="sub">https://toyhou.se/…</text>
  <text x="42" y="490" class="sub">https://imgur.com/…</text>

  <text x="435" y="448" class="lbl">Details — pose, expression, mood, anything</text>
  <rect x="435" y="456" width="385" height="70" rx="8" class="box"/>
  <text x="447" y="474" class="sub">e.g. "my OC sitting, happy, soft colors"</text>

  <!-- quick math -->
  <rect x="30" y="545" width="385" height="85" rx="8" class="box" fill="#E9D5FF" fill-opacity="0.35"/>
  <text x="46" y="568" class="lbl">🧮 Quick math (estimate)</text>
  <text x="46" y="588" class="val">Bust × 1 char · simple bg · +armor …</text>
  <text x="46" y="612" class="lbl" fill="#8B5CF6" font-size="14">≈ €55.00</text>
  <text x="240" y="612" class="sub">final price confirmed by Ven</text>

  <!-- agree + submit -->
  <rect x="435" y="545" width="385" height="85" rx="8" class="box"/>
  <rect x="449" y="563" width="14" height="14" rx="3" class="chk"/>
  <text x="471" y="575" class="val">I've read the T.O.S and agree *</text>
  <rect x="449" y="594" width="357" height="26" rx="13" class="btn"/>
  <text x="627" y="611" text-anchor="middle" style="font-size:12px;fill:#fff;font-weight:600">Submit request</text>
</svg>
```

### 5.4 Public — Home with live queue (F4 effect)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 480" font-family="Segoe UI, sans-serif">
  <style>
    .page { fill: #ffffff; stroke: #A78BFA; stroke-width: 2; }
    .chipO { fill: #C7F9CC; stroke: #22543D; }
    .chipC { fill: #FED7E2; stroke: #742A2A; }
    .btn   { fill: #A78BFA; }
    .btn2  { fill: #C4B5FD; }
    .card  { fill: #FAFAFF; stroke: #C4B5FD; stroke-width: 1; }
    .col   { fill: #f5f1e8; stroke: #C4B5FD; stroke-width: 1; }
    .h1    { font-size: 16px; fill: #2D1B4E; font-weight: 700; }
    .h2    { font-size: 13px; fill: #2D1B4E; font-weight: 700; }
    .lbl   { font-size: 12px; fill: #2D1B4E; font-weight: 600; }
    .sub   { font-size: 10px; fill: #666; }
    .dotP  { fill: #34D399; stroke: #065F46; }
    .dotU  { fill: #FED7E2; stroke: #742A2A; }
    .refresh { font-size: 10px; fill: #8B5CF6; }
  </style>

  <rect x="10" y="10" width="840" height="460" rx="12" class="page"/>

  <!-- profile side -->
  <rect x="30" y="30" width="150" height="150" rx="10" class="card"/>
  <circle cx="105" cy="90" r="40" fill="#E9D5FF"/>
  <text x="105" y="95" text-anchor="middle" class="sub">profile img</text>
  <text x="105" y="152" text-anchor="middle" class="sub">"Hey, I'm Ven…"</text>

  <!-- info side -->
  <text x="200" y="50" class="h1">Venuxiio</text>
  <text x="200" y="68" class="sub">Welcome — commissions, gallery, T.O.S…</text>

  <rect x="200" y="80" width="100" height="22" rx="11" class="chipO"/>
  <text x="250" y="95" text-anchor="middle" class="sub" fill="#22543D">✓ COMMS</text>
  <rect x="310" y="80" width="120" height="22" rx="11" class="chipC"/>
  <text x="370" y="95" text-anchor="middle" class="sub" fill="#742A2A">✗ ART TRADES</text>
  <rect x="440" y="80" width="110" height="22" rx="11" class="chipC"/>
  <text x="495" y="95" text-anchor="middle" class="sub" fill="#742A2A">✗ REQUESTS</text>

  <rect x="200" y="112" width="330" height="34" rx="17" class="btn"/>
  <text x="365" y="133" text-anchor="middle" style="font-size:12px;fill:#fff;font-weight:600">Request a Commission · 3/8 slots</text>
  <rect x="200" y="152" width="330" height="28" rx="14" class="btn2"/>
  <text x="365" y="170" text-anchor="middle" class="sub" style="fill:#2D1B4E">Join the Ping List (12/20)</text>

  <!-- queue -->
  <text x="30" y="215" class="h2">Commission Queue</text>
  <text x="170" y="215" class="refresh">↻ auto-refresh 60s · data: Supabase</text>

  <rect x="30" y="226" width="253" height="200" rx="8" class="col"/>
  <text x="44" y="248" class="lbl">Waiting List</text>
  <rect x="44" y="258" width="60" height="18" rx="9" fill="#A78BFA"/>
  <text x="74" y="271" text-anchor="middle" class="sub" style="fill:#fff">4</text>
  <rect x="44" y="286" width="225" height="38" rx="6" class="card"/>
  <text x="54" y="301" class="sub" style="font-weight:700">#7 Halfbody</text>
  <circle cx="256" cy="297" r="6" class="dotP"/><text x="250" y="319" class="sub">da_glooba</text>
  <rect x="44" y="330" width="225" height="38" rx="6" class="card"/>
  <text x="54" y="345" class="sub" style="font-weight:700">#8 two knees up</text>
  <circle cx="256" cy="341" r="6" class="dotU"/><text x="250" y="363" class="sub">thealvinxu</text>
  <text x="44" y="400" class="sub">…sorted: paid first</text>

  <rect x="303" y="226" width="253" height="200" rx="8" class="col"/>
  <text x="317" y="248" class="lbl">In Progress</text>
  <rect x="317" y="258" width="60" height="18" rx="9" fill="#A78BFA"/>
  <text x="347" y="271" text-anchor="middle" class="sub" style="fill:#fff">1</text>
  <rect x="317" y="286" width="225" height="38" rx="6" class="card"/>
  <text x="327" y="301" class="sub" style="font-weight:700">#18 Fullbody</text>
  <circle cx="529" cy="297" r="6" class="dotP"/><text x="523" y="319" class="sub">newclient</text>

  <rect x="576" y="226" width="253" height="200" rx="8" class="col"/>
  <text x="590" y="248" class="lbl">Finished</text>
  <rect x="590" y="258" width="60" height="18" rx="9" fill="#A78BFA"/>
  <text x="620" y="271" text-anchor="middle" class="sub" style="fill:#fff">11</text>
  <rect x="590" y="286" width="225" height="38" rx="6" class="card" fill-opacity="0.55"/>
  <text x="600" y="301" class="sub" style="font-weight:700">#17 2 halfbodies</text>
  <circle cx="802" cy="297" r="6" class="dotP"/><text x="796" y="319" class="sub">nexystuff</text>
  <text x="590" y="400" class="sub">…collapsed history</text>

  <text x="430" y="452" text-anchor="middle" class="sub">Requests column stays PRIVATE — it only exists on the admin board. Public queue = Waiting / In Progress / Finished.</text>
</svg>
```

### 5.5 Private — Admin: token gate

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 300" font-family="Segoe UI, sans-serif">
  <style>
    .page { fill: #2D1B4E; }
    .box  { fill: #ffffff; stroke: #A78BFA; stroke-width: 2; }
    .btn  { fill: #A78BFA; }
    .h1   { font-size: 16px; fill: #2D1B4E; font-weight: 700; }
    .sub  { font-size: 11px; fill: #666; }
    .field{ fill: #FAFAFF; stroke: #C4B5FD; }
    .lock { fill: #E9D5FF; }
  </style>
  <rect x="10" y="10" width="840" height="280" rx="12" class="page"/>
  <text x="430" y="40" text-anchor="middle" class="h1" style="fill:#fff">Venuxiio — Admin</text>
  <text x="430" y="58" text-anchor="middle" class="sub" style="fill:#C4B5FD">private page · not linked anywhere on the site</text>

  <rect x="230" y="80" width="400" height="180" rx="12" class="box"/>
  <circle cx="430" cy="115" r="20" class="lock"/>
  <text x="430" y="120" text-anchor="middle" style="font-size:14px">🔒</text>
  <text x="430" y="152" text-anchor="middle" class="h1">Enter Supabase key</text>
  <text x="430" y="170" text-anchor="middle" class="sub">Personal access token · stored in this browser only</text>
  <rect x="260" y="182" width="340" height="28" rx="6" class="field"/>
  <text x="272" y="201" class="sub">patXXXX…  (paste, never committed to the repo)</text>
  <rect x="330" y="220" width="200" height="28" rx="14" class="btn"/>
  <text x="430" y="239" text-anchor="middle" style="font-size:12px;fill:#fff;font-weight:600">Unlock board →</text>
</svg>
```

### 5.6 Private — Admin: drag-and-drop board

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 700" font-family="Segoe UI, sans-serif">
  <style>
    .page  { fill: #2D1B4E; }
    .col   { fill: #FAFAFF; stroke: #C4B5FD; stroke-width: 1.5; }
    .colH  { fill: #E9D5FF; }
    .card  { fill: #ffffff; stroke: #C4B5FD; stroke-width: 1; }
    .cardD { fill: #E9D5FF; stroke: #8B5CF6; stroke-width: 2; stroke-dasharray: 5 3; }
    .req   { fill: #fff3cd; stroke: #A78BFA; stroke-width: 1; }
    .btn   { fill: #A78BFA; }
    .btnS  { fill: #C4B5FD; }
    .h1    { font-size: 15px; fill: #2D1B4E; font-weight: 700; }
    .lbl   { font-size: 12px; fill: #2D1B4E; font-weight: 700; }
    .sub   { font-size: 10px; fill: #666; }
    .cnt   { font-size: 11px; fill: #fff; font-weight: 700; }
    .dotP  { fill: #34D399; stroke: #065F46; }
    .dotU  { fill: #FED7E2; stroke: #742A2A; }
    .mv    { fill: none; stroke: #8B5CF6; stroke-width: 1.5; }
  </style>

  <rect x="10" y="10" width="840" height="680" rx="12" class="page"/>

  <!-- topbar -->
  <rect x="30" y="28" width="500" height="34" rx="17" class="btnS"/>
  <text x="50" y="50" class="sub" style="fill:#2D1B4E">🛠 Venuxiio admin — Commissions board</text>
  <rect x="560" y="28" width="130" height="34" rx="17" class="btn"/>
  <text x="625" y="50" text-anchor="middle" class="sub" style="fill:#fff">⚙ Settings</text>
  <rect x="700" y="28" width="130" height="34" rx="17" fill="#FED7E2" stroke="#742A2A"/>
  <text x="765" y="50" text-anchor="middle" class="sub" fill="#742A2A">🔓 Forget token</text>

  <!-- column 1: requests -->
  <rect x="30" y="76" width="188" height="560" rx="10" class="col"/>
  <rect x="30" y="76" width="188" height="30" rx="10" class="colH"/>
  <text x="42" y="96" class="lbl">📥 Requests</text>
  <rect x="176" y="82" width="34" height="18" rx="9" fill="#A78BFA"/>
  <text x="193" y="95" text-anchor="middle" class="cnt">2</text>
  <!-- request card -->
  <rect x="42" y="118" width="164" height="108" rx="6" class="req"/>
  <text x="52" y="136" class="sub" style="font-weight:700">#21 · Request</text>
  <text x="52" y="152" class="sub">client: “Mika” · ig: mika_arts</text>
  <text x="52" y="166" class="sub">Chibi ×2 chars, simple bg</text>
  <text x="52" y="180" class="sub">≈ €85 · refs: 2 links</text>
  <rect x="52" y="190" width="144" height="26" rx="13" class="btn"/>
  <text x="124" y="207" text-anchor="middle" class="sub" style="fill:#fff">Accept → Waiting</text>

  <rect x="42" y="236" width="164" height="108" rx="6" class="req"/>
  <text x="52" y="254" class="sub" style="font-weight:700">#22 · Request</text>
  <text x="52" y="270" class="sub">client: “Ren” · dc: ren#001</text>
  <text x="52" y="284" class="sub">Fullbody, no shading</text>
  <text x="52" y="298" class="sub">≈ €76.50 · refs: 1 link</text>
  <rect x="52" y="308" width="144" height="26" rx="13" class="btn"/>
  <text x="124" y="325" text-anchor="middle" class="sub" style="fill:#fff">Accept → Waiting</text>

  <!-- column 2: waiting -->
  <rect x="238" y="76" width="188" height="560" rx="10" class="col"/>
  <rect x="238" y="76" width="188" height="30" rx="10" class="colH"/>
  <text x="250" y="96" class="lbl">⏳ Waiting List</text>
  <text x="266" y="120" class="sub">3/8 slots</text>
  <!-- waiting card -->
  <rect x="250" y="130" width="164" height="84" rx="6" class="card"/>
  <text x="260" y="148" class="sub" style="font-weight:700">#7 · Halfbody</text>
  <circle cx="400" cy="144" r="6" class="dotU"/>
  <text x="260" y="164" class="sub">da_glooba</text>
  <text x="260" y="178" class="sub">unpaid · ≈ €50</text>
  <!-- drag target ghost -->
  <rect x="250" y="222" width="164" height="84" rx="6" class="cardD"/>
  <text x="332" y="260" text-anchor="middle" class="sub" style="fill:#8B5CF6">drop here ⟵</text>
  <text x="260" y="296" class="sub">◀ ▶ move buttons on each card</text>
  <text x="260" y="312" class="sub">(touch / keyboard fallback)</text>

  <!-- column 3: in progress -->
  <rect x="446" y="76" width="188" height="560" rx="10" class="col"/>
  <rect x="446" y="76" width="188" height="30" rx="10" class="colH"/>
  <text x="458" y="96" class="lbl">🎨 In Progress</text>
  <rect x="458" y="130" width="164" height="84" rx="6" class="card"/>
  <text x="468" y="148" class="sub" style="font-weight:700">#18 · Fullbody</text>
  <circle cx="608" cy="144" r="6" class="dotP"/>
  <text x="468" y="164" class="sub">newclient</text>
  <text x="468" y="178" class="sub">paid ✓ · ≈ €90</text>

  <!-- column 4: finished -->
  <rect x="654" y="76" width="188" height="560" rx="10" class="col"/>
  <rect x="654" y="76" width="188" height="30" rx="10" class="colH"/>
  <text x="666" y="96" class="lbl">✅ Finished</text>
  <rect x="666" y="118" width="164" height="60" rx="6" class="card" fill-opacity="0.6"/>
  <text x="676" y="136" class="sub" style="font-weight:700">#17 · 2 halfbodies</text>
  <text x="676" y="150" class="sub">nexystuff ✓</text>
  <rect x="666" y="186" width="164" height="60" rx="6" class="card" fill-opacity="0.6"/>
  <text x="676" y="204" class="sub" style="font-weight:700">#16 · Fullbody+bg</text>
  <text x="676" y="218" class="sub">theo_frv1 ✓</text>

  <!-- footer hint -->
  <text x="430" y="666" text-anchor="middle" class="sub" style="fill:#C4B5FD">drag cards between columns (desktop) · ◀ ▶ buttons everywhere · every change saves to Supabase instantly · public queue updates within 60 s</text>
</svg>
```

### 5.7 Private — Admin: settings panel

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 380" font-family="Segoe UI, sans-serif">
  <style>
    .page { fill: #FAFAFF; stroke: #A78BFA; stroke-width: 2; }
    .box  { fill: #ffffff; stroke: #C4B5FD; stroke-width: 1; }
    .btn  { fill: #A78BFA; }
    .h1   { font-size: 16px; fill: #2D1B4E; font-weight: 700; }
    .lbl  { font-size: 12px; fill: #2D1B4E; font-weight: 600; }
    .sub  { font-size: 10px; fill: #666; }
    .sw   { fill: #34D399; stroke: #065F46; }
    .swO  { fill: #FED7E2; stroke: #742A2A; }
  </style>

  <rect x="10" y="10" width="840" height="360" rx="12" class="page"/>
  <text x="30" y="40" class="h1">⚙ Settings</text>

  <rect x="30" y="56" width="380" height="70" rx="8" class="box"/>
  <rect x="44" y="76" width="40" height="20" rx="10" class="sw"/>
  <circle cx="70" cy="86" r="8" fill="#fff"/>
  <text x="96" y="90" class="lbl">Commissions OPEN</text>
  <text x="44" y="114" class="sub">flips the public commission button instantly</text>

  <rect x="430" y="56" width="400" height="70" rx="8" class="box"/>
  <text x="446" y="80" class="lbl">Max slots</text>
  <rect x="446" y="88" width="90" height="26" rx="6" fill="#FAFAFF" stroke="#C4B5FD"/>
  <text x="491" y="106" text-anchor="middle" class="lbl">8</text>
  <text x="556" y="106" class="sub">waiting-list count vs slots → “Queue is full” state</text>

  <rect x="30" y="140" width="380" height="70" rx="8" class="box"/>
  <rect x="44" y="160" width="40" height="20" rx="10" class="swO"/>
  <circle cx="54" cy="170" r="8" fill="#fff"/>
  <text x="96" y="174" class="lbl">Art trades CLOSED</text>
  <text x="44" y="198" class="sub">status chips on Home</text>

  <rect x="430" y="140" width="400" height="70" rx="8" class="box"/>
  <rect x="444" y="160" width="40" height="20" rx="10" class="swO"/>
  <circle cx="454" cy="170" r="8" fill="#fff"/>
  <text x="496" y="174" class="lbl">Requests CLOSED</text>
  <text x="444" y="198" class="sub">status chips on Home</text>

  <rect x="30" y="224" width="800" height="70" rx="8" class="box"/>
  <text x="46" y="248" class="lbl">Reopen date (optional)</text>
  <rect x="46" y="256" width="180" height="26" rx="6" fill="#FAFAFF" stroke="#C4B5FD"/>
  <text x="136" y="274" text-anchor="middle" class="sub">2026-12-01</text>
  <text x="246" y="274" class="sub">shown as “Commissions open on …” when closed</text>

  <rect x="30" y="310" width="200" height="34" rx="17" class="btn"/>
  <text x="130" y="332" text-anchor="middle" style="font-size:12px;fill:#fff;font-weight:600">Save settings</text>
  <text x="250" y="332" class="sub">writes the settings row in Supabase · “saving… ✓” feedback</text>
</svg>
```

---

## 6. Roadmap

### This project (v1) — all at once, per decision
1. F4 Supabase layer + config + seed fallback
2. F1 service cards (replaces Prices)
3. F2 request form with live estimate
4. F3 admin board (token gate, DnD, settings)
5. Migrate live data from `commissions.js` → Supabase (guide: `SUPABASE_SETUP.md` + `supabase-schema.sql`)
6. Verify fallback + Supabase paths, mobile, hash-nav regression

### Follow-ups (from STUDY.md, still valid)
- Quick wins: duplicate T.O.S line, typo fixes, favicon + OG tags, lazy gallery images
- Accessibility: single `<nav>` with real links, modal focus trap, contrast fix
- GDPR: cookie consent banner or cookieless analytics
- README rewrite

### Future ideas 💡
- Reviews / testimonials section (VGen-style star ratings)
- ~~File uploads in the form (v1 = links only)~~ done (Sep 11 2026 — up to 3 images into the `commission-refs` bucket)
- Serverless token proxy (Cloudflare Worker) to remove client-side tokens
- Auto "Last updated" footer from Supabase timestamps

---

## 7. Decisions log (from planning, Sep 7 2026)

| Question | Decision |
|---|---|
| Which VGen features | Service cards + in-site request flow + Trello-style drag-drop board |
| Where new feature lives | Replaces the Prices tab (→ "Services") |
| Doc format | Feature spec + roadmap (this file) |
| Board access | Separate private admin page (unlisted `admin.html`) |
| Backend (v1, superseded) | Airtable — replaced by Supabase (see "Backend final") |
| Token model (v1, superseded) | Airtable 2-token split — dropped because Airtable has no create-only scope and table restriction couldn't hide pending requests from the public token |
| Backend (final) | **Supabase** — chosen over Airtable (v1) and Google Sheets + Apps Script because RLS enforces the exact permission split in the database: anon reads public data + creates `request` rows only; service_role key is full control. Free tier fits the traffic |
| Form target | Submits into `commissions` as `status='request'`; DB view `commissions_public` hides request rows + contact columns from the anon key |
| Build order | All at once |
| UI previews | SVG wireframes embedded in this doc (§5) |
