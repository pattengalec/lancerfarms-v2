# Lancer Farms & Gardens — lancerfarms.com

**Rebuild reference as of August 8, 2026.**
This document is sufficient to reconstruct the site, database, and all tooling from scratch.

> **August 8, 2026 was a large session.** The Grush layer became formally
> removable, `desk.html` was built, the tool contract was written and
> published to the getgrush repo, `triage.html` was rewritten, and the
> translation strategy changed. Sections 4, 5, 6, 6a, 11 and 12 all
> changed. If you are reading an older copy, most of it is now wrong.

---

## 1. Project overview

Lancer Farms & Gardens is a student-run organic teaching garden at California Baptist University, Riverside CA, located next to the historic Hawthorne House (Colony area). The site serves three audiences: staff/caretakers who log work, administrators who approve and configure, and the public who can read about the garden.

**Caretaker:** Chad Pattengale, part-time student caretaker, B.S. Environmental Science (CBU, ~1 year remaining). Reports to Julie Ratzlaff (Lab Director). Dr. Jacob Lanphere (Environmental Science) is the founding faculty advisor. Dr. Bonjun Koo (Environmental Science) is program director.

**Platform:** The site is the Grush farm management chassis (getgrush.com) deployed on the LFG site. The same Supabase project also hosts Fun Guy Fungi (FGF) as a co-tenant using `fgf_*` prefixed tables.

---

## 2. Architecture

```
lancerfarms.com
│
├── Static HTML/CSS/JS (no build step)
│   └── GitHub Pages — repo: pattengalec/lancerfarms-v2, branch: main
│
├── Backend — Supabase
│   ├── Project: "Lancer Farms" (Grush org)
│   ├── Project ID: gblizuknnvguxyxfequh
│   ├── Region: AWS us-east-2
│   └── Config file: lfg-config.js (in repo, public anon key only)
│
├── Photos — Cloudinary
│   ├── Cloud name: ddbsuxerb
│   └── Upload preset: lfg-photos
│
└── DNS — Namecheap → lancerfarms.com → GitHub Pages CNAME
```

**Key constraint:** No build tool, no npm, no CLI required for edits. All changes are file edits committed to `main`. GitHub Pages auto-deploys on push.

---

## 3. External service accounts

| Service | Account | Purpose |
|---|---|---|
| GitHub | pattengalec | Repo host + Pages deploy |
| Supabase | chad@getgrush.com | Database + auth + functions |
| Cloudinary | ddbsuxerb | Photo upload + CDN |
| Namecheap | — | DNS for lancerfarms.com |
| Resend | Via vault secret `resend_api_key` | Access request email notifications |

**Supabase Vault secrets required:**
- `resend_api_key` — Resend API key for email notifications
- `notify_email_to` — destination email for access request alerts
- `notify_email_from` — sender address (must be a verified Resend domain)

---

## 4. Repository structure

```
pattengalec/lancerfarms-v2 (branch: main)
│
├── index.html          Landing page — one door to desk.html + access request
├── desk.html           The console — tiered menu + 2x2 glove desktop
├── app.html            Staff PWA — tasks, photos, areas, log, triage
├── admin.html          Admin dashboard — all CRUD + approval queues
├── manual.html         Farm manual — 6 topic sections with tabs
├── data.html           Live farm data dashboard (public)
├── almanac.html        Growing almanac — planting calendar, plant DB
├── triage.html         Plant triage tool (Three.js ACLS-style model)
├── howto.html          Step-by-step how-to card player
├── mixbench.html       Mix Bench — recipe configurator + estimators
├── irrigation-bom.html Irrigation bill of materials calculator
├── visitor.html        Visitor hub — four tiles (See / Learn / Do / Share)
├── see.html            Photo gallery — approved photos, zone filters, lightbox
├── learn.html          Plant knowledge base — 36 plants, search + category
├── do.html             Calculators — bed soil volume, harvest date
├── share.html          Visit counter, moderated notes, share link
├── bed.html            QR landing page — role-aware, reads ?b=CODE
├── watch.html          Showcase video player
├── features.html       Feature overview
├── about-grush.html    What Grush is → links to getgrush.com
│
│                       ── FARM-OWNED (survive removal of the Grush layer) ──
├── lfg-config.js       Supabase URL + anon key + Cloudinary config
├── lfg-db.js           The farm's Supabase client. Split out of grush-auth
│                       on Aug 8 so public pages stop importing identity
│                       just to reach a database handle
├── lfg-theme.css       Legacy theme tokens (older pages)
├── i18n.js             English + Spanish chrome. Every other language is
│                       the browser's job — see section 6b
│
│                       ── GRUSH LAYER (removable; see section 6a) ──
├── grush-auth.js       Identity: magic link, session, grush_role()
├── grush-nav.js        Shared nav/drawer/rail + a copy of the tracker
├── grush-track.js      Page-view counter, standalone. Extracted from
│                       grush-nav on Aug 8 so a page can be counted
│                       without inheriting a nav rail
├── grush-tool.js       The tool contract implementation — banner, input
│                       echo, print, guarded role read
├── grush-desk-staff.js desk.html's tier definitions and sign-in sheet
├── grush-settings.js   Theme owner + settings console
├── grush-shell.css     Shared shell layout
├── grush-theme.css     The Grush design language applied to desk.html
│
├── lfg-logo-192.webp   App icon
├── lfg-logo-512.webp   PWA icon (large)
├── lfg-logo-180.png    Apple touch icon
├── lfg-emblem.svg      Emblem mark
├── grush-mark.png      Grush wordmark, 494x294 RGBA. Canonical copy lives
│                       in the getgrush repo; this is a deliberate duplicate
├── bed-qr-cards.pdf    Print-ready QR cards, 23 beds, 4-up
├── bed-qr-test-sheet.pdf   Single-page scan test sheet
├── LFG PO Bed QR Signs v004.docx   Purchase order, $45.63
├── lancerfarms-showcase-16x9.mp4   Showcase video (landscape)
├── lancerfarms-showcase-9x16.mp4   Showcase video (portrait)
├── poster-16x9.jpeg / poster-9x16.jpeg   Video posters
├── TEACHING-TOOL-CONCEPT.txt   Concept notes
│
└── CNAME               lancerfarms.com → GitHub Pages
```

**Three design systems co-exist intentionally:**
- **LFG style** (app, admin, manual, data, almanac, triage, howto, visitor, see, learn, do, share): `Fraunces` / `Source Sans 3` / `Courier Prime`. Earth tones: `#2A2620` paper, `#F0EDE2` ink, `#7E9A6E` green, `#A8B89A` leaf, `#C9973F` amber. `manual.html` moved off `IM Fell English` on Aug 5 2026; no page uses it now.
  Canonical tokens: `--ink --ink-soft --paper --card --line --line-strong --green --leaf --amber`.
- **Grush tool style** (mixbench, irrigation-bom): `Bricolage Grotesque` / `Source Serif 4` / `JetBrains Mono`. Navy/cyan/chartreuse: `#050a18`, `#00c8ff`, `#c8ff00`, `#ffb830`. Predates the design language below and has not been migrated.
- **Grush design language** (`grush-theme.css`, applied to desk.html): `Fraunces` / `IBM Plex Sans` / `IBM Plex Mono`. Substrate `#14110F`, mycelium `#E8E1D4`, spore `#C9A227`, steel `#5C7080`, oxblood `#8C2F39` — reserved for destructive actions only. 1px hairlines, 14px radius, one easing curve. The signature move is *the pin*: a spore bar grows down a row's leading edge on press, from the docking-port story the showcase narrates. Canonical tokens live in `grush-brand.css` in the **getgrush repo**; this repo carries a copy.

---

## 5. Page-by-page function reference

### index.html — Landing page (13KB)

One door. Enters `desk.html`; there is no longer a Staff/Visitor fork.

**Removed Aug 8 2026:** `chooseRole()` asked people to *declare* a role, stored it in `localStorage`, and routed staff to app.html / visitors to visitor.html. That was a second, weaker answer to a question `grush_role()` and the operator allowlist already answer properly, and it outlived the visit, which the tool contract forbids. A one-line cleanup clears the stale `lfg_role` key from anyone who used the old page.

Also carries: the access request sheet (writes `lfg_access_requests`; a trigger emails Chad), the EN/ES switch, and — added Aug 8 — description, Open Graph and canonical meta, which the page previously had none of, so a shared link previewed as bare URL text.

### desk.html — The console (23KB)

The launcher, and the shop window. Built Aug 8 2026.

- **Left**: a menu in tiers — Visitor, Tools, Staff, Admin. Locked tiers are shown greyed, not hidden: seeing a locked door is how you learn the building exists.
- **Right**: a 2×2 desktop the person fills themselves, persisted per device.
- **Glove rules inherited from grush-nav.js**: 68px rows, 56px add buttons, no overlapping hit fields, no edge-swipe. Refinement means thinner hairlines, never smaller targets.
- **Drag is the secondary path.** Tap `+` to add, long-press a slot to clear. Implemented with Pointer Events, because HTML5 drag events never fire on touch devices at all.
- **`?preview=visitor|staff|admin`** shows another tier's view. It may only ever *narrow* — it cannot grant access you lack.

**Structure matters here.** `desk.html` itself is farm-owned and contains no reference to auth, Supabase, staff or admin. The whole Grush layer arrives through one marked block at the bottom of the file. See section 6a.

**Capacitive reality:** ordinary leather or cloth work gloves do not actuate a capacitive screen at all. Large targets fix accuracy, not conductivity. Crew need nitrile or touchscreen-rated gloves; no amount of CSS changes that.

### app.html — Staff PWA (111KB)
- Full farm operations interface, mobile-first
- **Tabs:** Today's tasks · Areas · Log · Photos · How-to · Hub
- **Hub menu** → Learn section links: Farm manual, How-to cards, Plant triage, Mix Bench, Irrigation BOM
- Photo upload pipeline via Cloudinary (cloud `ddbsuxerb`, preset `lfg-photos`)
- Task completion logging → `lfg_task_completions`
- Area log entries → `lfg_log`
- Loads: `grush-auth.js`, `lfg-config.js`, Supabase JS CDN

### admin.html — Admin dashboard (101KB)
- Operator-gated (requires email in `grush_operators` table)
- Tabs: Areas · Tasks · Photos · Plants · Inventory · Requests · Settings
- Full CRUD on all major tables
- Photo approval queue (pending → approved/rejected)
- Access request management

### manual.html — Farm manual (110KB)
- 6 topic cards: Soil · Concrete · Irrigation · Pest & Disease · Planting · Tools & Records
- Each topic has tabs with inline calculators and reference data
- **Nav links:** Staff App · Farm data · Almanac · **Mix Bench** · **Irrigation BOM**
- **Irrigation → Reference tab:** tool cards linking to Irrigation BOM and Mix Bench water calculator
- **Pest → Treatments tab:** tool card linking to Mix Bench
- Loads Supabase for manual entries (`lfg_manual_entries`)

### data.html — Farm data dashboard (34KB)
- Public-facing live data: areas, events, photos, log
- Hub menu Learn section: Farm manual, How-to cards, Plant triage, **Mix Bench**, **Irrigation BOM**
- Stats: area count, event count, photo count

### almanac.html — Growing almanac (9KB)
- Operator-gated sections
- Plant database browser from `lfg_master_plants`
- Zone 9b planting calendar

### triage.html — Plant triage (58KB)

A decision tree over plant symptoms, with a live Three.js model of seven plant systems whose spheres grow and brighten as belief shifts.

**Rewritten Aug 8 2026.** The file carried **five near-copies of the same 98-line block** — the belief logic plus the whole scene — one at top level and four pasted inside restart-button click handlers. 392 duplicated lines, and they had drifted: three of the five carried a function the others did not.

The paste was doing real work: re-declaring `let bel` inside a handler gave that handler a fresh belief array, so **the reset was a side effect of the redeclaration.** Removing the copies required `resetBelief()` to do it on purpose. Deleting them without that would have left restart looking like it worked while silently keeping the old beliefs.

Now: `bootOrgan()` builds the scene, `resetBelief()` resets state, and each restart handler calls both. Collapsing the copies also exposed **two `onclick` handlers assigned to the same `#restart` element four lines apart** — the second overwriting the first, neither visible next to the other.

**Five leaks fixed at the same time.** Every `bootOrgan()` used to add an animation loop, a WebGLRenderer, a resize listener, seven label divs and a caption, none of which were ever taken down. Browsers cap live WebGL contexts around 16, so **the canvas would have gone blank after roughly fifteen restarts**, silently. Fixed with a generation counter — a stale `oframe()` sees `gen !== organGen` and returns rather than re-queueing, which is the only way to end a `requestAnimationFrame` chain from outside — plus explicit disposal, because Three.js holds GPU buffers that outlive their JS references.

**Readability, same session.** The palette was rebuilt *against the label colour* rather than in isolation: cream `#F0EDE2` on the old `#4FA83C` scored 2.56 and on `#EDA100` scored 1.85, unreadable exactly when it mattered because a sphere grows as belief rises. Deep hues now clear 4.5:1 on all seven at peak emissive, worst case 4.82. Labels are one cream instead of seven tints, positioned from the actual projection maths (`scale × height × 0.181 + 13px`), with overlap resolved by belief so the strongest label keeps the position it earned. Edge opacity floor went 0.03 → 0.09 and the threshold 0.62 → 0.50, because the lattice — the actual content — was invisible for most of a session.

### howto.html — How-to cards (18KB)
- Step-by-step card player (swipe/tap navigation)
- Loads cards from `lfg_howto_cards` via Supabase
- Cards have: title, summary, materials checklist, safety note, steps (JSONB array of `{text}`)
- **5 cards as of Aug 4 2026:** string trellis, + 3 others + removable shade structure

### mixbench.html — Mix Bench (84KB)

Three calculators: The Mix (recipe reference), Stock & budget estimator, Water demand estimator. Zero database calls, zero storage, zero writes.

**The estimator was invisible to everyone until Aug 8 2026.** Three independent reasons, any one sufficient: the page never loaded `grush-auth.js`; the gate looked for `window.GrushAuth`, which does not exist under any casing; and `unlock()` had exactly one caller, inside that dead gate. `<div id="estPanel" class="hidden">` shipped hidden and nothing ever removed the class. Not gated — unreachable.

The gate is gone. Nothing there is private: static tables and arithmetic over numbers the visitor types. A visitor using the tool and printing the result *is* the demonstration.

**Now conforms to the tool contract** (section 6c) via `grush-tool.js`: mode banner, print with echoed inputs, guarded optional role read. Mounts twice, once per tab.

### irrigation-bom.html — Irrigation BOM (25KB)
- Standalone parts list calculator for drip retrofit
- Inputs: supply GPM, emitter GPH, spacing, zone count, bed groups (N/W/L per group)
- Sections: zone hardware (filter, regulator, flush valve), per-bed hardware (adapter, header, tees, dripline, end caps, stakes, goof plugs), path sleeves
- All prices editable, recalculate live
- Flow check against measured supply
- 8 design-decision cards explaining every specification choice
- "What this does not include" table: gauge, tools, mulch, labor, zone valve work
- Links back to manual.html and mixbench.html

### visitor.html — Visitor hub (6KB)
- Four tiles: **See**, **Learn**, **Do**, **Share** — the whole public shape in one screen
- Shares the staff fork's visual language (82px tiles, Fraunces + Source Sans 3)
- `NOT_BUILT` array marks tiles whose page does not exist yet; currently empty
- Staff login link → index.html

### see.html — Photo gallery (11KB)
- Approved photos from `lfg_photos`, newest first, square grid (2-up phone / 3-up wider)
- Zone filter chips built from real data; bed-code chips; captions
- Lightbox with keyboard nav and Escape
- `subject_type` shown as an inert chip — Learn crossover not yet wired

### learn.html — Plant knowledge base (12KB)
- 26 approved plants from `lfg_master_plants` with botanical name and summary
- Search + category filters; detail sheet with facts and days-to-maturity
- **Filters out 8 placeholder rows** that carry a category and nothing else
- No plant photographs exist yet, so cards lead with the initial rather than a
  grey rectangle implying an image is coming
- Perennials show why days-to-maturity is absent rather than leaving a blank

### do.html — Calculators (13KB)
- **Bed soil volume** — reads the 23 real beds from `lfg_growing_areas`; cubic feet,
  cubic yards, bags rounded up; fill depth pre-fills from `soil_depth_in`
- **Harvest date** — the 14 annuals with `days_to_maturity`; planting date to
  estimated harvest, with a check-from date a week earlier
- Trees, berries and perennials are excluded from the harvest tool on purpose:
  days-to-maturity does not apply to them and listing them would invite a false answer

### share.html — Share (13KB)
- Site view counter from `grush_total_views('lfg')`; shows an em dash, never 0, on failure
- Moderated notes insert to `lfg_comments` with `status='new'`
- Web Share API with copy-link fallback
- Operator-only per-path breakdown via `GRUSH.isOperator()` (convenience, not security —
  the SELECT policy on `grush_page_views` is permissive)

### bed.html — QR bed landing (15KB)
- Reads bed code from `?b=CODE` (uppercased); role-aware staff/visitor fork
- Target of the 23 printed QR signs

### about-grush.html — About Grush (8KB)
- `<meta http-equiv="refresh">` → getgrush.com
- Handles all "managed by grush" footer links across the site

---

## 6. Authentication architecture

**File:** `grush-auth.js` (needs supabase-js from CDN, then `lfg-config.js`, then `lfg-db.js`)

**Three tiers as of Aug 8 2026.** The old two-tier model could not express the difference between crew tooling and irreversible actions.

1. **Visitor** — the absence of a row. Never stored.
2. **Staff** — email in `grush_operators`, `revoked_at IS NULL`, `role = 'staff'`.
3. **Admin** — same, `role = 'admin'`. Approvals, crew, configuration.

`grush_operators.role` was added Aug 8 (`text not null default 'staff'`, checked against `('staff','admin')`).

**`grush_role()`** — SECURITY DEFINER, returns `'visitor' | 'staff' | 'admin'`. Reads the allowlist without exposing it and returns `'visitor'` for any signed-in stranger. Granted to `anon` and `authenticated`.

**Key exports:** `isOperator()`, `sendLink(email)`, `requireOperator()`, `session()`, `signOut()`, `headers()`, `rest()`, `stamp()`, and `sb` — though public pages should use `LFG.sb` from `lfg-db.js` instead.

**`GRUSH` is a lexical `const`, not a property of `window`.** Read the bare name inside a `try`:

```js
var G; try { G = GRUSH; } catch (e) { return; }   // correct
var G = window.GrushAuth;                          // silently always null
```

This is not hypothetical. `mixbench.html` looked for `window.GrushAuth`, on a page that never loaded `grush-auth.js` at all, and **its entire Stock & budget estimator shipped invisible to every user, including admins, for months.** Nobody noticed, because the failure path was "show nothing." The gate was removed Aug 8 — see section 6c.

**One client per page.** supabase-js keeps its session in `localStorage`; two clients means two GoTrue instances racing the same keys, logging *"Multiple GoTrueClient instances detected"* and occasionally dropping a session on refresh. `grush-auth.js` borrows `window.LFG.sb` when `lfg-db.js` has already made one.

**Never reload from a `grush:auth` handler.** supabase-js emits `INITIAL_SESSION` on every page load and `TOKEN_REFRESHED` on a timer. A `location.reload()` there is an infinite loop, and a magic-link redirect makes it worse because the link opens a second tab and both spin. Re-read the role in place instead.

**The real boundary is Postgres.** Every client-side check shows and hides UI. Row-level security is what enforces.

---

## 6a. The Grush layer is removable

**This is the product thesis, not a tidiness preference.** Grush is an overlay on a site an organisation already has. Deleting it must leave the original intact.

**The removal test**, run — not asserted — on Aug 8:

1. Delete `grush-auth.js`, `grush-desk-staff.js`, `grush-theme.css`, `grush-track.js`
2. Delete the marked block at the bottom of `desk.html`
3. Delete the `GRUSH OVERLAY` blocks in `share.html` and `almanac.html`
4. Delete the counter blocks in the pages that carry them

Result: **zero dangling script references across every public page.** One code reference survives, in `share.html`, and it degrades correctly — `GRUSH` is a lexical const, so the bare name throws `ReferenceError`, the existing `catch` swallows it, and the operator panel stays hidden.

**What made this possible:** `GRUSH.sb` used to be the only way to get a Supabase client, so six public pages imported the whole identity module to reach a database handle they were entitled to anyway. `lfg-db.js` now owns the connection and `grush-auth.js` is a guest on it.

Staff and admin pages (`admin`, `app`, `data`, `howto`, `manual`, `triage`) still reference `grush-auth.js` — correctly, since they *are* the Grush layer and would be removed with it.

---

## 6b. Languages

**Spanish by hand. Everything else by browser.**

CBU has ~316 international students across 60+ countries — five to fifteen people per language. Riverside itself is ~53% Latino. So Spanish has a large, local, permanent audience and the international cohort is a long tail no dictionary can serve.

- `i18n.js` carries **en + es only**, 35 keys, wired across index / visitor / learn / do / see / share.
- The previous dictionary held en/es/fr/pt and **0 of 38 keys matched the live copy** on learn, do or see. It had drifted so far that switching to English would have changed the English. Rebuilt from scratch Aug 8.
- Every other language is handled by Chrome/Safari/Edge native translation, which reaches **everything** — including plant summaries and how-to cards in Postgres that can never appear in a file.

**Keeping the site translatable is the actual work:**
- All text is real DOM. Nothing is drawn into a canvas — including the triage organ labels, which are `<div>` elements positioned over the canvas.
- Every page declares `lang`; `setSiteLang()` updates it so a translator knows what it is starting from.
- `translate="no"` on brand links and the EN/ES switch.
- `translate="no" lang="la"` on botanical names. Chrome renders *Mentha spicata* as "spiked mint" otherwise, which is not the plant's name and is not searchable against any reference.

**Unreviewed.** The Spanish has not been checked by a native speaker. Low risk for tiles and headings; higher for anything a stranger acts on.

---

## 6c. The tool contract

Written Aug 8, published to the **getgrush repo** as `GRUSH-TOOL-CONTRACT.md` and `grush-tool.js`. Extracted from two working tools, not designed in advance.

> **A Grush tool is a page with inputs, a computed result, and a printable artifact.**

- **Mode, not access.** The visitor/staff line is whether a result *persists*, never whether the tool runs. Neither reference tool gates anything, because neither has anything to protect.
- **Compute tools get a visitor mode; recording tools do not.** A visitor logging fake activity against a farm that is not theirs produces nothing worth printing.
- **Role reads are optional and guarded.** A tool must work with the auth layer absent, and must not add a dependency merely to change a sentence.
- **Print is the visitor's only artifact**, so it echoes the readable inputs, the date, and provenance.
- **Ephemeral means `sessionStorage`.** `localStorage` outlives the visit and breaks the promise the banner made.

**Conforming tools:** `mixbench.html`, `irrigation-bom.html`. Both dropped their hand-rolled implementations onto `grush-tool.js` — 4,688 and 3,608 bytes removed respectively.

**Deliberately undefined:** how a staff result persists. No tool has ever written a record, so persistence has no proven shape. It gets defined when a third tool needs it.

---

## 7. Database — Supabase project gblizuknnvguxyxfequh

### Co-tenant architecture
All `lfg_*` tables belong to Lancer Farms & Gardens. All `fgf_*` tables belong to Fun Guy Fungi. Shared tables: `grush_operators`, `grush_people`.

### Tables — LFG

**`lfg_config`** (9 rows) — Key/value farm config
- `key` PK, `value`, `updated_at`
- Keys: `farm_name`, `farm_lat`, `farm_lng`, `cloudinary_cloud`, `cloudinary_preset`, `visit_days`, `admin_password`, `donations_enabled`, `donations_url`
- RLS: public read (except `admin_password`), operators update

**`lfg_growing_areas`** (35 rows) — All growing zones and landmarks
- `id` UUID PK, `name`, `area_type` (raised_bed/tree/shrub/ground/container/other/zone/landmark), `zone`, `manager`, `description`, `blessing`, `blessing_ref`, `created_at`, `archived_at`, `sort_order`, `code`, `lat`, `lng`
- **Added Aug 4 2026:** `width_ft` NUMERIC(5,2), `length_ft` NUMERIC(5,2), `soil_depth_in` NUMERIC(5,1), `sun_exposure` TEXT
- RLS: public read (non-archived), operators update, anon insert
- **Current data:** 23 raised beds (Zone 1: 10 beds 4×8, Zone 2: 6 beds 5×10, Zone 3: 7 beds 5×10, all 30" deep, all full sun), plus grove/grounds/landmarks

**`lfg_master_plants`** (34 rows) — Plant database
- Full agronomic profile: botanical name, planting windows, spacing, days to maturity, stage timeline (JSONB), transplant flag, temp ranges, approval workflow
- `approval_status`: pending/approved/rejected

**`lfg_photos`** (59 rows) — Photo records
- Links to Cloudinary URLs, area FK, plant FK, approval workflow
- `subject_type` for categorization

**`lfg_tasks`** (10 rows) — Task definitions
- Recurrence types: visit/daily/weekly/biweekly/monthly/interval/one_time/seasonal
- `recurrence_days` JSONB (array of weekday names for weekly tasks)
- Links to `lfg_howto_cards` via `howto_id` and `howto_ids[]`
- Priority 1–5, color, is_core flag

**`lfg_task_completions`** (9 rows) — Task log
- `task_id` FK, `completed_by`, `visit_date`, `notes`, `task_title` (denormalized)

**`lfg_log`** (4 rows) — Field activity log
- Area FK, note, logged_by, approval workflow, `group_id` for batch entries

**`lfg_area_events`** (0 rows) — Planting/harvest events
- Event types: planted/harvested/pruned/treated/fruited/removed/observed/other
- Approval workflow

**`lfg_howto_cards`** (5 rows) — How-to card content
- `title`, `summary`, `steps` JSONB (`[{text: "..."}]`), `materials` text, `safety_note`, `material_ids[]` UUID array
- **Cards as of Aug 4 2026:** 4 pre-existing + "Build a removable shade structure for a raised bed" (added this session, 12 steps)

**`lfg_inventory`** (13 rows) — Supply inventory
- `item_name`, `category`, `quantity`, `unit`, `par_level`, `notes`, `image_url`, `image_credit`

**`lfg_access_requests`** (1 row) — Staff access queue
- `display_name`, `email`, `reason`, `requested_role` (crew/operator), `status` (new/approved/declined)
- Insert triggers `notify_access_request()` → Resend email

**`lfg_comments`**, **`lfg_reports`**, **`lfg_requests`** — Community/issue tracking (all empty)

**`lfg_manual_entries`** (1 row) — CMS entries for manual sections

**`lfg_settings`** (1 row) — JSONB settings (donation config)

**`lfg_visit_overrides`** — Override visit day scheduling (empty)

### Tables — FGF (mirror of LFG schema, prefixed `fgf_`)
Same structure as LFG tables. `fgf_growing_areas` has 7 rows (mushroom station/chamber types). Other FGF tables are empty — FGF site not yet built out.

### Shared tables

**`grush_operators`** (1 row) — Operator allowlist
- `email` PK, `display_name`, `note`, `added_at`, `revoked_at`
- Comment: "Signing in is NOT enough; the email must appear here and not be revoked."

**`grush_people`** (3 rows) — Crew roster (credential-free)
- `site` (lfg/fgf), `display_name`, `active`, `sort_order`

### Functions

| Function | Type | Security | Search path | Notes |
|---|---|---|---|---|
| `set_updated_at()` | Trigger | Invoker | public | Sets `updated_at = now()` |
| `is_operator()` | SQL stable | **DEFINER** | public, pg_temp | Checks JWT email in grush_operators. Must stay DEFINER for auth.jwt() access |
| `lfg_calendar(date,date)` | SQL stable | Invoker | public | Returns unified calendar projection across log/photos/completions/events/tasks |
| `area_name_status(text)` | SQL stable | Invoker | public | Fuzzy name lookup for growing areas |
| `notify_access_request()` | PLpgSQL trigger | **DEFINER** | public,extensions,vault,pg_temp | Sends Resend email on new access request. Must stay DEFINER for vault access |
| `grush_track_view(text,text)` | PLpgSQL | **DEFINER** | public | The **only** write path into `grush_page_views`. Validates site, normalises path (keeps `?b=CODE` on bed.html, strips query elsewhere), rejects overlong/bad paths |
| `grush_total_views(text)` | SQL | **DEFINER** | public | Site-wide view sum, used by share.html |
| `grush_weekly_digest(text,boolean)` | PLpgSQL | **DEFINER** | public | Builds and emails the pending-decisions report. `p_send=false` is a dry run: no email, no snapshot. Pending counts mirror admin.html's queue exactly (`approval_status='pending'`) |

### Migrations (in order)
1. `lfg_full_schema_replay` — full schema baseline
2. `add_photo_subject_type` — subject_type on photos
3. `allow_update_photos_for_moderation` — RLS for photo approval
4. `clone_lfg_schema_to_fgf` — FGF co-tenant tables
5. `fgf_area_type_container_values` — FGF area type enum
6. `grush_identity_core` — grush_operators, grush_people, is_operator()
7. `seed_grush_people_roster` — initial crew names
8. `areas_and_photo_links` — lat/lng, photo-plant FK
9. `howto_cards` — lfg_howto_cards table
10. `howto_chains` — howto_ids[] on tasks
11. `inventory_images` — image_url/credit on inventory
12. `add_check_admin_password_rpc` — admin password check RPC
13. `restrict_admin_password_read` — RLS fence on admin_password key
14. `add_is_operator_function` — is_operator() function
15. `lfg_photos_operator_writes` — operator photo RLS
16. `lfg_comments_moderation_rls` — comments RLS
17. `lfg_operator_only_config_and_events` — config/events operator gates
18. `revoke_check_admin_password_execute` — revoke public execute on password RPC
19. `lfg_manual_entries_operator_writes` — manual entries RLS
20. `lfg_operator_edits_areas_howto_plants` — areas/howto/plants operator writes
21. `lfg_operator_approvals_log_reports_requests_tasks` — approval workflow RLS
22. `fix_lfg_tasks_role_scope` — task RLS scope fix
23. `lfg_zone1_renumber_add_two_beds` — Zone 1 bed numbering
24. `lfg_calendar_projection_function` — lfg_calendar() function
25. `lfg_master_plants_operator_update` — plants operator RLS
26. `lfg_access_requests` — access request table + trigger
27. `enable_pg_net_and_store_resend_secrets` — pg_net + vault secrets
28. `notify_on_access_request` — notify_access_request() trigger
29. `007_area_dedupe` — deduplicate growing areas
30. `008_log_group_id` — group_id on lfg_log
31. `lfg_growing_areas_code_and_coords` — code + lat/lng columns
32. `add_bed_dimensions` — **width_ft, length_ft, soil_depth_in, sun_exposure** (Aug 4 2026)
33. `fix_function_search_paths` — set_updated_at, lfg_calendar, area_name_status search paths fixed (Aug 4 2026)
34. `grush_page_views_counter` — `grush_page_views` table + `grush_track_view()` (Aug 5 2026)
35. `grush_total_views_function` — `grush_total_views()` (Aug 5 2026)
36. `grush_weekly_digest` — `grush_view_snapshots` table + `grush_weekly_digest()` (Aug 5 2026)
37. `grush_weekly_digest_fix_pending_predicates` — counted `approval_status<>'approved'`, which swept in **rejected** items and reported them as awaiting approval. Now `='pending'` (Aug 5 2026)
38. `enable_pg_cron` — pg_cron extension (Aug 5 2026)
39. `schedule_weekly_digest` — cron job `lfg-weekly-digest` (Aug 5 2026)
40. `digest_heading_cadence_neutral` — heading "Farm week in review" → "Farm status", rewritten from the live definition rather than retyped (Aug 5 2026)
41. `digest_twice_weekly` — schedule to Tuesday + Saturday (Aug 5 2026)

### Scheduled jobs (pg_cron)

| Job | Schedule | Command |
|---|---|---|
| `lfg-weekly-digest` | `0 14 * * 2,6` | `select public.grush_weekly_digest('lfg', true);` |

- pg_cron evaluates schedules in **UTC**, and this database is set to UTC.
  `14:00 UTC` = **07:00 America/Los_Angeles while PDT is in force**.
- **DST, dated:** when PDT ends **Nov 1 2026** the send drifts to 06:00 local.
  Reschedule to `0 15 * * 2,6` to hold 07:00, and reverse it in March.
- The job is a handful of counts plus one HTTP call — no quiet window needed.
  The time is chosen for when the report is worth reading.
- Reschedule with `cron.schedule('lfg-weekly-digest', …)` — reusing the name
  **replaces** the job. A new name would add a second job and double-send.

### RLS summary
- **Public read:** growing areas (non-archived), config (except admin_password), photos (approved), master plants (approved), log, task completions, howto cards, people, inventory
- **Operator write:** all tables — areas, tasks, photos, plants, log, events, comments, inventory, config, manual entries, howto cards
- **Anon insert:** growing areas, log entries, comments, reports, requests, access requests, area events
- **No public write:** config, operators table, settings
- **`grush_page_views`:** RLS on, SELECT for anon+authenticated, **no INSERT/UPDATE policy** — all writes go through `grush_track_view()`
- **`grush_view_snapshots`:** RLS on, **zero policies** — reachable only by the DEFINER digest function

---

## 8. Physical garden data

**Location:** 33.9281° N, 117.4302° W (Hawthorne House, Colony area, CBU)
**USDA Zone:** 9b
**CIMIS ETo Zone:** 9 — South Coast marine-to-desert transition, ~55.1 in/year

**Beds:**

| Zone | Count | Size | Area | Soil depth | Sun | Irrigation station |
|---|---|---|---|---|---|---|
| Zone 1 | 10 | 4 × 8 ft | 320 sq ft | 30 in | Full | Station A |
| Zone 2 | 6 | 5 × 10 ft | 300 sq ft | 30 in | Full | Station B |
| Zone 3 | 7 | 5 × 10 ft | 350 sq ft | 30 in | Full | Station C |
| **Total** | **23** | | **970 sq ft** | | | |

**Soil volume:** ~81 cu yd at 27" fill (3" freeboard), ~90 cu yd at full 30" fill
**Settling:** ~1.5 in/year typical → ~3 cu yd annual replacement needed

**Irrigation:**
- Controller: Irritrol Rain Dial series, 3 zones for garden beds (sequential), citrus on separate program
- Measured supply: 3.3 GPM at zone valve (90 sec to fill 5-gal bucket)
- Design emitter: 0.4 GPH pressure-compensating inline dripline
- Regulator: 25 PSI at each zone valve
- Filter: 155-mesh inline before regulator
- Beds 1A and 1B: prototype PVC manifold with Orbit screw-in manifolds (installed summer 2026)
- Remaining 21 beds: upgrade pending (see irrigation-bom.html for full spec)

**Irrigation schedule (CIMIS Zone 9, 0.4 GPH emitters, 85% efficiency):**

| Month | Interval | Zone 1 runtime | Zone 2–3 runtime |
|---|---|---|---|
| Jan | 3 days | 31 min | 29 min |
| Feb | 3 days | 44 min | 41 min |
| Mar–Oct | Daily | 19–35 min | 18–33 min |
| Jul (peak) | Daily | 35 min | 33 min |
| Nov | 3 days | 40 min | 37 min |
| Dec | 3 days | 26 min | 25 min |

**Rain Dial Water Budget percentages:** Jul=100%, Jun/Aug=92%, May/Sep=79%, Apr=71%, Mar/Oct=54%, Nov=38%, Feb=42%, Dec=25%, Jan=29%

---

## 9. Key contacts (as of Aug 2026)

| Name | Role | Notes |
|---|---|---|
| Chad Pattengale | Caretaker / developer | chad@getgrush.com |
| Julie Ratzlaff | Lab Director, immediate supervisor | Out until mid-August |
| Dr. Jacob Lanphere | Env. Science faculty, founding advisor | Returns Aug 17 |
| Dr. Bonjun Koo | Env. Science program director | Meeting Aug 18 |

---

## 10. Rebuild procedure

### Step 1 — GitHub repo
Create public repo `pattengalec/lancerfarms-v2`. Enable GitHub Pages on `main` branch, root folder. Add `CNAME` file containing `lancerfarms.com`.

### Step 2 — Supabase project
Create project in Grush organization, us-east-2. Run all migrations in the order listed in section 7 above. The migration files are not in the GitHub repo — they exist only in Supabase's migration history. Reconstruct from the schema in section 7 if rebuilding from zero.

### Step 3 — lfg-config.js
This file is in the repo and contains the public anon key. If the Supabase project is recreated, update `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### Step 4 — Cloudinary
Create upload preset `lfg-photos` on cloud `ddbsuxerb` (unsigned, folder: `lfg`). If using a new cloud, update `lfg-config.js`.

### Step 5 — Seed data
- Insert operator email into `grush_operators`, **with a `role`** — `'admin'` for the first one, or nothing works
- Seed `lfg_config` with: `farm_name`, `farm_lat`, `farm_lng`, `cloudinary_cloud`, `cloudinary_preset`, `visit_days`, `admin_password`
- Seed `grush_people` with crew names
- Seed `lfg_growing_areas` with the 35 records (23 beds + grove/grounds/landmarks)
- Seed `lfg_master_plants` (36 records), `lfg_inventory` (13 records), `lfg_howto_cards` (7 records)

### Step 6 — Vault secrets (for access request emails)
In Supabase Vault: add `resend_api_key`, `notify_email_to`, `notify_email_from`.

### Step 7 — DNS
Point `lancerfarms.com` A record or CNAME to GitHub Pages. Verify HTTPS is enabled in repo Settings → Pages.

### Step 8 — Upload all files
Upload all 20 HTML files, every `.js` and `.css` listed in section 4, and the image assets to `main`.

**Load order is load-bearing** on any page that talks to the database:

```
1. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
2. lfg-config.js      supplies URL + anon key
3. lfg-db.js          creates the one client
4. grush-auth.js      borrows it — only on pages that need identity
```

Getting 2 and 3 the wrong way round fails silently: `lfg-db.js` logs a warning and every query returns nothing.

### Step 9 — Verify the removal test
Before calling a rebuild done, run the procedure in section 6a. If deleting the Grush layer leaves a dangling reference on a public page, the seam has leaked and the deployment is not clean.

---

## 11. Open items (as of Aug 8 2026)

| Item | Priority | Notes |
|---|---|---|
| ~~Staff gate in mixbench.html~~ | ✅ Aug 8 | Gate was dead and is **removed**. The estimator is open to everyone; nothing there is private. See section 6c. |
| Plant illustrations | High | **All 36 plants have `stock_image_url` empty.** learn.html ships text-first by design. Planned mechanism: a GitHub Action fetching PD-only botanical illustrations from Wikimedia (`<Botanical name> - botanical illustrations`), restricted to PD-Old / CC-PD-Mark, recording source + author per image |
| ~~8 placeholder rows in `lfg_master_plants`~~ | ✅ Aug 8 | All completed. 36 plants, every one with a botanical name, common name and summary. Mint was split into Spearmint / Peppermint / Apple Mint; "Kabotia" corrected to Kabocha Squash; Borage recategorised Shrub → Herb. |
| `plant-autofill.ts` Edge Function | Medium | Written, **not deployed**. The unbuilt piece of the Learn/Do content pipeline |
| `lfg_manual_entries` has 1 row | Medium | The manual's topic/tab system is nearly empty. The 7 written procedures live in `lfg_howto_cards` and are now listed on the manual home, but no topic mapping exists |
| Financials tab | Medium | Stub only, under **Records** in admin.html. No financial table exists. Schema decision pending: plain ledger vs. ledger with purchase-order approval states |
| DST reschedule of `lfg-weekly-digest` | Low | **Nov 1 2026** — see Scheduled jobs above |
| Purchase order approver signature | Medium | `LFG PO Bed QR Signs v004.docx` — $45.63, unsigned. Approver not yet named |
| Bed QR signs fabrication | Medium | Cards printed to `bed-qr-cards.pdf`; cedar/laminate/mount steps written as how-to cards parts 1–3. Signs not yet mounted, so per-bed view counts are all zero |
| sun_exposure field populated | Low | All 23 beds currently `full`. Field exists for future beds under shade |
| irrigation retrofit hardware purchased + installed | High | BOM at irrigation-bom.html. ~$838 + 15% contingency. Needs Facilities for controller reprogramming. |
| Email to Julie Ratzlaff re: garden budget | High | Draft after Lanphere review Aug 17, Koo conversation Aug 18 |
| Supabase: is_operator() callable by anon | Advisory | Intentional — function needs DEFINER context. Documented, not fixable without breaking auth. |
| Supabase: notify_access_request() callable by anon | Advisory | Intentional — needs DEFINER for vault access. |
| Empty Cottages project (muecvqxsqnhkhjrabtxh) | Low | Delete from Grush org when ready. Blank project, no data. |
| Spanish review by a native speaker | Medium | `i18n.js` es strings are unreviewed. Low risk on tiles; higher on anything a stranger acts on. |
| mixbench / triage Spanish | Medium | Currently machine-translated along with everything else. A mistranslated dilution ratio is a safety problem, not a UX one. Hand-translate if crew start relying on them in Spanish. |
| Grush tool style not migrated | Low | mixbench and irrigation-bom still use the navy/cyan palette that predates `grush-theme.css`. Two Grush looks co-exist. |
| `desk.html` 2×2 uses `localStorage` | Low | The tool contract says ephemeral state is `sessionStorage`. A visitor's slot choices currently outlive the visit. |
| i18n only covers visitor chrome | Low | 35 keys. The manual, triage tree and plant records are browser-translated by design — see section 6b. |

---

## 12. Session history

### August 8, 2026

The longest session so far. Roughly in order:

**Data.** Eight plant records completed — the weekly digest had flagged them for weeks. Mint split into three species, "Kabotia" corrected to Kabocha Squash, Borage recategorised. `lfg_master_plants` now 36 rows with no gaps.

**Three-tier auth.** `grush_operators.role` added; `grush_role()` written as SECURITY DEFINER. Chad set to `admin`.

**`desk.html` built** — tiered menu, 2×2 glove desktop, drag via Pointer Events, `?preview=` for checking other tiers.

**The Grush layer became removable.** `lfg-db.js` split out of `grush-auth.js` so six public pages stopped importing identity to reach a database client. The removal test now passes site-wide. A regression was caught mid-way: `almanac.html` needed the identity stack after all, for `grush-nav`'s staff group, and got it back inside a marked block.

**The mark.** Designed in Canva (deep-orange baseball script, no swoosh), keyed to true transparency by hand because Canva's transparent export could not clear an image background. Placed at the foot of the desk drawer. Canonical copy plus `grush-brand.css` published to the getgrush repo; `grush_badge_rect.png` deleted as an unused orphan whose cyan appeared nowhere in the palette.

**Tracking extracted.** `grush-track.js` split from `grush-nav.js`, so a page can be counted without inheriting a nav rail. Coverage 12 → 17 pages. Paths normalised at write time (`/index.html` → `/`) so one page cannot split across two rows.

**The tool contract** written and published, then made load-bearing: `mixbench.html` and `irrigation-bom.html` both refitted onto `grush-tool.js`, shedding 4,688 and 3,608 bytes of hand-rolled implementation.

**`mixbench`'s estimator turned on** after months invisible to every user.

**`index.html`** lost `chooseRole()` and gained share metadata it never had.

**Tiering resolved** on the contract's own line: Tools open to everyone, Staff and Admin locked. `manual.html` came out from behind a login it never needed. `features.html` finally linked.

**`triage.html` rewritten** — 392 duplicated lines removed, a dead handler found, five leaks fixed, palette and labels rebuilt for readability.

**Languages.** Old dictionary discarded (0 of 38 keys matched the live copy), rebuilt as en+es, with the site made translatable for everything else.

**Bugs I introduced and then fixed in the same session:** a reload loop from wiring `location.reload()` to `grush:auth`, and a wiped Sign-out button from appending it before a call that clears the menu. Both were violations of contracts documented in the files I was editing.

### August 5, 2026

**New files:**
- `see.html` — photo gallery, 58 approved photos, zone filters, lightbox
- `learn.html` — plant knowledge base, 26 plants, text-first
- `do.html` — bed soil volume + harvest date calculators
- `share.html` — visit counter, moderated notes, share link
- `bed-qr-cards.pdf` — 23 print-ready QR cards, 4-up, error-correction H

**Modified files:**
- `visitor.html` — rebuilt as the four-tile hub; `NOT_BUILT` now empty, all tiles live
- `admin.html` — **12 tabs consolidated into 5 groups** (Review / Work / Farm / Records / People).
  Two tabs were both labelled "Requests": `lfg_requests` is now **Supplies**,
  `lfg_access_requests` is **Requests**. The access-request tab had been in
  position 12, off the right edge on a phone, which is why a request sat unseen
  for three days. Panel markup and every `load*()` function were left untouched —
  47 data-layer calls before and after. Sub-tabs are pills, not a second row of
  underlined tabs, so the shape tells you which depth you are at.
- `app.html` — Manual tile called `go('manual')`, but `#screen-manual` never
  existed, so it cleared every panel and left the tool blank. Now opens
  `manual.html`. `go()` falls back to the hub instead of blanking. Log tile's
  text wrapper made a flex column — it had been rendering "LogActivity · problem · need"
  on one line because the primary tile lays out in a row.
- `manual.html` — restyled to repo conventions: `IM Fell English` → **Fraunces**;
  palette rebuilt on the nine repo tokens with the old names kept as aliases;
  body text was `--forest` (pale sage), now `--ink`; removed `maximum-scale=1.0`
  which blocked pinch-zoom; added `color-scheme` meta; `Inter` was referenced
  7× and never loaded. Removed the "← App" and Admin buttons and the duplicate
  nav row — Mix Bench and Irrigation BOM existed **only** there, so they moved
  into the drawer first. `--terra` was used but never defined, so the Remove
  button rendered white text on no background. Added a **Field how-tos** list
  surfacing all 7 `lfg_howto_cards` procedures, each linking to `howto.html?id=`.
- `howto.html` — steps support an optional `url` + `url_label` button
- `grush-nav.js` — page-view tracking on every page; staff pages excluded

**Database:**
- Migrations 34–41 (see list above): page-view counter, total-views function,
  weekly digest, pending-predicate fix, pg_cron, schedule, heading, twice-weekly
- `grush_page_views` — RLS on, read-only to clients; `grush_track_view()` is the only writer
- `grush_view_snapshots` — RLS on, **no policies**; only the digest function reaches it
- Digest scheduled **Tuesday + Saturday 07:00 Pacific**; first send delivered and confirmed
- How-to cards: bed QR signs split into **parts 1–3** (5 / 7 / 7 steps)

**Corrections made to earlier assumptions during this session:**
- The 8 problem rows in `lfg_master_plants` are fully blank placeholders, not
  named plants missing a botanical name
- The 12 plants without `days_to_maturity` are all trees, shrubs or perennials.
  The data is complete wherever the measure applies — Do was never blocked
- Shipping Learn without images does not violate the accuracy rule. The rule is
  don't fabricate; an honest blank is fine

---

### August 4, 2026

**New files:**
- `mixbench.html` — Mix Bench teaching configurator + chemical estimator + water demand calculator + irrigation BOM (all in one)
- `irrigation-bom.html` — Standalone drip irrigation bill of materials calculator
- `visitor.html` — Public-facing farm landing page
- `about-grush.html` — Redirect to getgrush.com

**Modified files:**
- `manual.html` — Added Mix Bench + Irrigation BOM to nav and as tool cards in Irrigation and Pest sections
- `app.html` — Added Mix Bench + Irrigation BOM to Learn menu
- `data.html` — Added Mix Bench + Irrigation BOM to Learn menu

**Database (Supabase):**
- Migration `add_bed_dimensions`: added `width_ft`, `length_ft`, `soil_depth_in`, `sun_exposure` to `lfg_growing_areas`; seeded all 23 beds with measured dimensions
- Migration `fix_function_search_paths`: fixed `set_updated_at`, `lfg_calendar`, `area_name_status` search_path advisories; switched `area_name_status` from SECURITY DEFINER to INVOKER
- Inserted how-to card: "Build a removable shade structure for a raised bed" (12 steps, `lfg_howto_cards`)

**Security:**
- Removed `#staff` URL bypass from `mixbench.html` staff gate

---

*README updated August 5, 2026. Every figure in this document was verified against
the live site and Supabase project `gblizuknnvguxyxfequh` at time of writing —
file sizes from the repository tree, row counts and policies from the database.*
