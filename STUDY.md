# Website Improvement Study — Venuxiio Commission Portfolio

**Date:** September 7, 2026
**Scope:** `index.html`, `styles.css`, `commissions.js`, `assets/` (~13 MB), deployment on GitHub (`venuxiio/commissions`)
**Method:** full code review, asset audit, and runtime verification of the data-driven logic (status dates, slot counting, queue rendering).

---

## 1. Snapshot

The site is a single-page static portfolio for art commissions: Home (status + queue), Prices, Examples gallery with modal viewer, T.O.S, and F.A.Q. Data-driven queue via `commissions.js`, Google Form for requests, Google Sheets for the ping list, Google Analytics for stats.

**What already works well**

- Clean visual identity (Schoolbell + Fredoka, purple palette, hand-drawn dotted borders) — consistent and recognizable.
- Queue board auto-generated from data — updating it requires zero HTML edits.
- Smart commission button: reacts to open/closed dates and slot count, and swaps to the Ping List when full/closed.
- Image modal with Escape/outside-click close, `object-fit` discipline, responsive breakpoints.
- Google Fonts with `display=swap`, images already in WebP.

The issues below are ordered by impact. Everything in §2 is verified, not speculative.

---

## 2. Bugs (confirmed)

| # | Severity | Where | Problem |
|---|----------|-------|---------|
| 1 | 🔴 High | `commissions.js:5` → `index.html:789-797` | `"startDate": "none"` becomes `Invalid Date`. Runtime-tested: the home button currently renders **“Commissions open on Invalid Date”** — visible to every visitor while commissions are closed. |
| 2 | 🔴 High | `index.html:549-567` | Same `Invalid Date` hits the status indicators: `today >= Invalid Date` is `false`, so COMMS shows ✗ — *accidentally* correct today, but for the wrong reason, and untestable. |
| 3 | 🟡 Medium | `index.html:440-441` & `450-451` | T.O.S lists “Full payment is required before I begin your commission…” **twice**, worded slightly differently — reads as careless on the page clients must trust most. |
| 4 | 🟡 Medium | `index.html:442` vs `445` | T.O.S contradiction: “Full payment is required **before I begin**” but also “Work will begin **after I send the initial sketch** and confirmation”. Unclear whether the sketch comes before or after payment. |
| 5 | 🟡 Medium | `index.html:750` | `updateCommissionFormButton` reads `#queue-slot-counter`, which doesn’t exist in the HTML — dead code. |
| 6 | 🟢 Low | `commissions.js:137` | Trailing comma in the commissions array — valid in modern JS, fragile in older tooling. |
| 7 | 🟢 Low | `commissions.js` / `index.html:104` | Comment says data comes from `commissions.json`; it’s actually `commissions.js`. |
| 8 | 🟢 Low | `index.html:664` | `console.log('Tracking navigation:'…)` left in production. |

**Fix for #1/#2 (suggested):** make the intent explicit instead of encoding it in a date string:

```js
{ "name": "COMMS", "open": false, "startDate": null },   // closed, no date yet
{ "name": "ART TRADES", "open": false, "startDate": "2035-01-01" },
```

```js
const isOpen = status.open === true || (status.startDate && today >= new Date(status.startDate));
```

and render “Commissions closed — join the ping list” when `startDate` is `null`.

---

## 3. Performance

**Assets: ~13 MB in repo, roughly 9 MB unreferenced.**

| Item | Size | Status |
|------|------|--------|
| `assets/fonts/` (FBWallW, 5 files) | **7.7 MB** | **Unused** — no `@font-face` anywhere; the site uses Google Fonts |
| `assets/images/background1.webp` | 244 KB | 0 references |
| `assets/images/Illustration10.webp` | 84 KB | 0 references |
| `assets/images/image02–12.webp` | ~— | 0 references |
| `assets/images/leftArrow.webp`, `path33.svg` | — | 0 references |
| `assets/images/chibiex.webp` | 100 KB | Only inside a commented-out HTML block |
| `Welcome to my page.pdf` | 675 KB | 0 references (old portfolio version?) |

Deleting the unused files (after a final visual check) roughly **halves the repo** and speeds clones/deploys. Keep the PDF only if you link it somewhere.

**Loading path issues**

- **No `loading="lazy"`** on the 17 example images — a visitor who only wants prices still downloads the whole gallery. One attribute per `<img>` fixes it.
- **No `width`/`height` on images** → layout shift (CLS) while the gallery loads.
- `background-attachment: fixed` (`styles.css:65`) is ignored or janky on iOS Safari; the 25rem tiling pattern also repaints on scroll for mobile users.
- `.banner { height: 100vh }` (`styles.css:86`) — on mobile browsers `100vh` exceeds the visible viewport (URL bar). `height: 100svh` with a `100vh` fallback is the modern fix.
- Example thumbs are 48–348 KB files rendered at ~150–200 px tall (e.g. `bust.webp` 348 KB). Resizing to 2× display size (~400 px) before committing would cut gallery weight by ~70 % with no visible loss. (See §9, quick win #4.)
- `commissions.js` loads in `<head>` without `defer` — minor, but free to fix.

---

## 4. SEO & social sharing — the biggest missed opportunity

For an artist, the site’s traffic will overwhelmingly arrive as **links pasted into Discord, Instagram, X, and Toyhouse**. Right now those links preview as a bare title and nothing else.

Missing from `<head>`:

- `<meta name="description">` — also what Google shows under the title.
- **Open Graph tags** (`og:title`, `og:description`, `og:image`, `og:url`) — the Discord/Instagram link card.
- Twitter card tags.
- **Favicon** — currently none; the browser tab shows a blank page icon, and favicons appear next to shared links in some apps.

Suggested block (uses existing assets):

```html
<link rel="icon" href="assets/images/profile.webp">
<meta name="description" content="Venuxiio — digital art commissions. Busts, halfbodies, fullbodies, chibis and reference sheets. Check prices, examples and queue status.">
<meta property="og:title" content="Venuxiio — Art Commissions">
<meta property="og:description" content="Prices, examples, queue status and T.O.S. Commissions in EUR via PayPal.">
<meta property="og:image" content="assets/images/banner.webp">
<meta property="og:type" content="website">
```

Caveat: og:image needs an **absolute URL** in practice — `https://venuxiio.github.io/commissions/assets/images/banner.webp` (adjust to the real domain). A cropped 1200×630 banner image would look even better than the full artwork.

Also: the `README.md` is still the Bitbucket tutorial template — it’s the first thing anyone sees on the GitHub repo. Replacing it with a short real README (what the site is, how to edit `commissions.js`, how to deploy) takes 10 minutes.

---

## 5. Accessibility

The site is keyboard-unusable beyond Tab-through-links, which also excludes switch-device users.

1. **Nav items are `<nav>` elements with click handlers** (`index.html:31-43`). Four separate `<nav>` landmarks confuse screen readers (“navigation, navigation, navigation…”), and they aren’t focusable — keyboard users can never switch tabs. Fix: one `<nav>` wrapping real `<a href="#prices">` links (the hash-routing JS keeps working), or `<button>`s.
2. **Queue collapsible header** (`index.html:96-100`) is a clickable `<div>` — no keyboard access. Use a `<button>` + `aria-expanded`.
3. **Image modal** (`index.html:427-433`): no `role="dialog"`, no `aria-modal`, focus isn’t trapped or moved, and focus never returns to the card that opened it. `#modal-image` keeps `alt=""` even after opening — set it to the title.
4. **Status ✓/✗ are color-only signals** for the status meaning — add visually-hidden text (“open”/“closed”) or an `aria-label`.
5. **Contrast**: `.pricing-extra` uses `--color-text-gray-muted: #999` on white (~2.8:1) — below the 4.5:1 WCAG minimum; the “+€35 per extra character” lines are hard to read. `#767676` is the lightest compliant gray.

---

## 6. Privacy — GDPR exposure

Google Analytics (`index.html:6-17`) loads **unconditionally** for every visitor. You’re an EU-based creator (EUR prices, `.fr`-adjacent audience) serving EU visitors — analytics cookies without consent is exactly what GDPR Article 5 frowns on, and the cookie-CSSUI already exists (`styles.css:1315-1423`, `.cookie-consent-banner`) but **no matching HTML/JS was ever added** — so someone started this and didn’t finish.

Options, simplest first:

1. **Drop GA** for a cookieless counter (GoatCounter, Plausible, Umami) — no consent needed, no banner.
2. **Finish the banner**: gate `gtag('config', …)` behind consent; load GA only after “Accept”.

---

## 7. Code quality & maintenance

- **~350 lines of inline JS** live inside `index.html:538-884` (plus a second inline block at `:66-80`). Moving them to `app.js` with `defer` would make both files reviewable and let the browser cache them. Pure mechanical move, zero behavior change.
- **Dead CSS**: `.profile`, `.contact-button`, `.kpi-value`, `.queue-header`, cookie-banner block (if option 1 above is chosen) have no matching markup.
- **Stale footer** (`index.html:532`): “Last updated: May 15, 2026” — nearly 4 months old and manually maintained. Either automate it from the last commit date, or remove it (a wrong date is worse than none).
- **Slot logic note** (`index.html:756`): slots count only `waiting-list`; a commission moved to `in-progress` frees a slot and reopens the form while work continues. Probably intended (“queue slots”), but worth a conscious decision.

---

## 8. Content suggestions (trust = conversions)

1. **Add a “How it works” strip** on Home: `Form → I confirm & quote → sketch preview → payment → delivery`. It resolves bug #4 by *showing* the flow, sets expectations, and reduces “how does this work?” DMs. Four icons, one row.
2. **Link the FAQ from the nav** — it’s reachable only via inline text links, yet it contains the “when do you reopen?” answer that closed-status visitors need most. Alternative: merge F.A.Q into Terms and rename the tab “Terms & FAQ”.
3. **Won’t-draw list**: “Horse” reads oddly — “Horses / equines” if that’s the intent. Also consider adding “mecha/complex machinery” if armor is +€5-10 but full mecha isn’t offered.
4. **Prices header note** “Choosing no shading AT ALL applies a 15% discount” — bold it or restyle as a callout chip; it’s the most attractive line on the page and currently looks like body text.
5. **Commission button when closed**: once bug #1 is fixed, make the closed state *also* a visible button that says “Commissions closed — get notified” and links to the ping-list form. Right now the disabled button is a dead end for your most interested visitors.

---

## 9. Prioritized action plan

### 🟢 Quick wins (< 1 h total, do first)

1. Fix `"startDate": "none"` → `open` flag + closed-state button text (bugs #1, #2) — *15 min*
2. Delete duplicate T.O.S line + fix “personnal” typo + clarify payment-vs-sketch order — *10 min*
3. Add favicon, meta description, OG/Twitter tags — *20 min*
4. Add `loading="lazy"` + `width`/`height` to all gallery `<img>` — *10 min*
5. Remove `console.log`, add `defer` to `commissions.js` — *2 min*

### 🟡 Short term (an afternoon)

6. Delete unused assets (fonts 7.7 MB, unreferenced images, maybe PDF) — *30 min incl. visual check*
7. Replace `<nav>` per-tab with one `<nav>` + real links; make queue header a `<button aria-expanded>` — *45 min*
8. Modal semantics: `role="dialog"`, focus trap, restore focus, set alt on open — *45 min*
9. Decide GA vs cookieless analytics; implement banner or swap — *varies*
10. Rewrite README.md as a real project readme — *15 min*

### 🔵 Medium term (a weekend)

11. Move inline JS → `app.js`; purge dead CSS — *1–2 h*
12. Downscale gallery thumbnails to 2× display size (Squoosh: squoosh.app, batch) — *1 h*
13. “How it works” section + nav entry for FAQ — *2 h*
14. `100svh` banner + remove `background-attachment: fixed` on mobile — *30 min*
15. Automate or remove the “Last updated” footer line — *30 min*

---

## 10. Verification checklist for after each change

- [ ] Open site with hash `#prices`, `#examples`, `#terms`, `#faq`, and no hash — correct section + nav highlight each time
- [ ] Commission button: closed (`open:false`), open with free slots, open and full — three states render correctly
- [ ] Queue: counts per column, paid/unpaid dot, waiting-list sort order
- [ ] Modal: open, Escape, backdrop click, close button; body scroll re-enables
- [ ] Mobile (≤736 px): stacked layout, no horizontal scroll, banner not clipped
- [ ] Lighthouse pass ≥ 90 performance / accessibility after lazy-loading + contrast fix
