# Lancer Farms & Gardens

Farm operations site for the community garden at California Baptist University,
Riverside CA. GitHub Pages + Supabase. No build step, no framework, no bundler —
plain HTML, CSS and JavaScript, edited directly and committed.

Live at **[lancerfarms.com](https://lancerfarms.com)** (see `CNAME`).

---

## Pages

| Page | Purpose | Who can use it |
|------|---------|----------------|
| `index.html` | Role gate: splash, then Staff or Visitor | Public |
| `visitor.html` | Public farm experience — photos, plants, notes | Public |
| `app.html` | Staff field tool — log work, tasks, inventory, photos | Public page; approve/edit needs operator |
| `admin.html` | Admin panel — review queue, tasks, areas, inventory, config | Operator sign-in required |
| `data.html` | Read-only dashboard — overview, beds, field log, photos | Public |
| `manual.html` | Farm reference manual with calculators | Public; editing needs operator |
| `almanac.html` | Weather, sun and moon | Public |
| `howto.html` | Step-by-step how-to card player | Public; archiving needs operator |
| `triage.html` | Plant triage diagnostic with a 3D model | Public |
| `about-grush.html` | Colophon for the Grush platform | Public |

**To reach the admin panel:** `app.html` → burger → Manage → Admin panel.
That link is deliberately ungated — `admin.html` has its own sign-in wall, and
hiding the door only locked out the person who needed it.

---

## Shared modules

Every cross-cutting concern lives in exactly one file. That is what makes a
change cheap: one edit, not ten.

| File | Owns |
|------|------|
| `lfg-config.js` | **All credentials.** Supabase URL and anon key, Cloudinary cloud and preset. The only file in the repo holding them. |
| `grush-auth.js` | Identity. Magic-link sign-in, `is_operator()` checks, session-aware request headers. |
| `grush-nav.js` | Navigation. Builds the bottom rail and left drawer from a `window.GRUSH_NAV` config object on each page. |
| `grush-settings.js` | **Theming, site-wide.** Snapshots `:root`, derives light, applies OKLCH hue/tone/depth/chroma, writes inline custom properties on `<html>`. |
| `grush-shell.css` | Opt-in app-shell layout — fixed chrome, scrolling middle. |
| `lfg-theme.css` | Shared design tokens for `admin.html` and `data.html`. |
| `i18n.js` | Language switching (EN / ES / FR / PT). |

### Two rules worth knowing before you edit anything

**`:root` must hold the DARK palette.** `grush-settings.js` treats it as the
input and derives light from it. Put light values in `:root` and dark mode will
serve them back untransformed. This has been got wrong twice.

**Modals must sit above `z-index: 1010`.** The nav rail is 900 and the drawer is
1010. Anything lower gets covered — silently, and usually only at the bottom of
the screen where the controls are.

```
   30   app.html action bar
   40   page title bars
  900   grush-nav rail
 1010   grush-nav drawer
 1100   lightboxes
 1200   bottom sheets, toasts
 1300   settings console
```

### Layout: tools versus documents

Pages you *operate* use the app shell (`grush-shell.css`): fixed header, only
the middle scrolls. Pages you *read* do not, because locking the body stops
Safari collapsing its URL bar — you would permanently donate ~60px on a page
you scroll a long way down.

- App shell: `admin.html`, `app.html`
- Normal scrolling: `manual.html`, `data.html`, `almanac.html`, `visitor.html`

---

## Auth

Two tiers, deliberately separate.

**Crew** identifies, never authorizes. Staff pick a role in `app.html`; no
password, no session. They can log work, complete tasks, add photos and create
locations, because those are legitimate acts for someone with no credentials.

**Operators** authorize. Sign-in is an emailed one-time link plus membership in
the `grush_operators` table, checked server-side by `is_operator()`. Operators
approve, moderate, rename, archive and delete.

There are **no client-side passwords anywhere on this site.** Three were
removed: an admin password, a hardcoded PIN in `app.html`, and a
`Godisgood`+MMDD pattern that guarded the farm manual in public source. If you
find a password check running in the browser, it is a bug.

To grant access: add a row to `grush_operators`. To revoke: set `revoked_at`.
No code change, no deploy.

---

## Database

Supabase project `gblizuknnvguxyxfequh`. Farm data lives in `lfg_*`; the
`grush_*` tables belong to the Grush platform and are shared with other sites.

| Table | Purpose |
|-------|---------|
| `lfg_growing_areas` | Beds, trees, orchard, grounds — zone, manager, blessing |
| `lfg_area_events` | Plant / harvest / prune / observe events per area |
| `lfg_tasks` | Task definitions: recurrence, instructions, priority, sort order |
| `lfg_task_completions` | Who completed what, and when |
| `lfg_log` | General field log |
| `lfg_photos` | Cloudinary URLs plus metadata |
| `lfg_comments` | Visitor notes, moderated |
| `lfg_reports` | Damage and issue reports |
| `lfg_requests` | Supply and repair requests |
| `lfg_inventory` | Tools and supplies with par levels |
| `lfg_master_plants` | Plant reference records |
| `lfg_howto_cards` | How-to card definitions |
| `lfg_manual_entries` | Dynamic farm manual content |
| `lfg_config` | Key/value site config — visit days, donations toggle and URL |
| `lfg_settings` | Read-only settings |
| `lfg_visit_overrides` | Schedule swaps |
| `grush_operators` | The operator allowlist. `is_operator()` reads this. |
| `grush_people` | Crew names for attribution, per site |

### Row-level security

The rule is **crew create, operators approve**, enforced in Postgres rather than
in the browser.

- Visitor and crew inserts stay open, but must land pending or unmoderated
- Approving, publishing, resolving, renaming, archiving and deleting require `is_operator()`
- Unmoderated visitor comments are not readable by the public

The anon key is printed in this repo by design. It is not a secret — it is the
API gateway ticket. RLS is what actually stops anyone doing anything.

---

## External services

| Service | Purpose | Where configured |
|---------|---------|------------------|
| Supabase | Database + REST API | `lfg-config.js` |
| Cloudinary | Photo storage — cloud `ddbsuxerb`, preset `lfg-photos` | `lfg-config.js` |
| NWS API | Live weather — `api.weather.gov` | in-page |
| Google Fonts | IM Fell English, Fraunces, Source Sans 3, Courier Prime | in-page |
| GitHub Pages | Hosting — `pattengalec/lancerfarms-v2`, branch `main` | `CNAME` |

**Handover:** to move this site to different infrastructure, change the four
values in `lfg-config.js` and nothing else.

---

## Farm geography (locked reference)

- **House GPS:** `33.9281417, -117.4301472`
- **Ridge bearing:** `146.14°`
- **USDA Zone:** 9b · Riverside, CA

| Zone | Beds | Dimensions | Depth |
|------|------|------------|-------|
| Zone 1 | 1A–1H (8 beds) | 1.55 × 0.86 m | 18" |
| Zone 2 | 2A–2F (6 beds) | 3.08 × 1.53 m | 24" |
| Zone 3 | 3A–3G (7 beds) | 3.18 × 1.29 m | 24" |

Zone 1 is a single row of 8 along the NE wall, split by a shed gap between 1D
and 1E. Zone 2 has 3 beds per side of the SW porch path. Zone 3 is a single row
parallel to the NW wall.

---

## Editing this site

Mobile-first workflow, no terminal required. Edit a file through GitHub's web
editor, or replace it wholesale via **Add file → Upload files** — a same-path
upload overwrites and commits in one step. GitHub Pages redeploys on push.

**Cache keys matter.** Shared scripts are requested with a version string
(`grush-settings.js?v=11`). Change a shared file and every page still asking for
the old version keeps serving the cached copy. Bump the query string on the
pages that need the change.

---

## Known gaps

- `app.html:702` — `addLocationInline()` omits `area_type`, which is `NOT NULL`.
  That insert has never succeeded; it fails with a generic toast.
- `lfg_inventory` allows a hard DELETE with the anon key. Closing it needs a UI
  decision first — either move deletion behind operator, or make it a soft
  delete like everything else.
- `og:` tags are not set sitewide; waiting on `lfg-og.png`.
- `index.html` and `about-grush.html` have no drawer nav. Deliberate — one is a
  three-second role gate, the other a leaf page.
- GIS map view, pending a farm visit to trace bed polygons.
