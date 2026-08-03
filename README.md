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
| `bed.html` | **Landing page for a scanned bed sign.** `?b=1E` | Public; content varies by role |
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

To grant operator access: add a row to `grush_operators`. To revoke: set
`revoked_at`. No code change, no deploy.

### Crew names

The names offered under "Who" in the staff tool come from `grush_people`,
managed in admin → **Crew**. This is **attribution, not access** — adding a name
grants nothing, because the staff tool has no gate. Removing someone sets
`active = false` rather than deleting, since past log entries carry the name as
text and history should not change when somebody leaves.

`grush_people` is shared with other Grush sites, so every query is scoped to
`site = 'lfg'`.

### Access requests

`index.html` has a quiet "Work here? Request access" link writing to
`lfg_access_requests`. Handled in admin → **Requests**.

**That table is the one exception to public readability.** Everything else here
is farm data and world-readable; this holds a person's name, email and reason,
about people who do not work here yet. SELECT is operator-only, deliberately.

Approving a **crew** request is one tap — it adds a name, which grants nothing.
Approving an **operator** request is deliberately *not* one tap: the card tells
you to add the `grush_operators` row by hand. An operator can publish to the
public site and delete records; that should not be a button you press by
accident at speed.

---

## Database

Supabase project `gblizuknnvguxyxfequh`. Farm data lives in `lfg_*`; the
`grush_*` tables belong to the Grush platform and are shared with other sites.

| Table | Purpose |
|-------|---------|
| `lfg_growing_areas` | Beds, trees, orchard, grounds — zone, manager, blessing. Also `code` (the QR key), `sort_order` (left-to-right position) and `lat`/`lng` |
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
| `lfg_access_requests` | People asking to be added. **Operator-read only** — see Auth |
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

## The calendar

`lfg_calendar(from, to)` is a Postgres **function**, not a table. It stores
nothing. Every row is a side effect of work recorded somewhere else — a log
entry, a photo, a completed task, a bed event, a dated task — so it cannot
drift from reality and it backfilled itself the moment it was created.

A function rather than a view because recurring tasks have no rows to read:
they have to be expanded into occurrences across a date range, and a view has
no range to expand against. It is `STABLE` and `SECURITY INVOKER`, so RLS
applies to whoever calls it.

Returns `day, kind, label, detail, area_id, area_name, ref_id, tense`, where
`kind` is one of `log · photo · completion · planting · harvest · event · task`
and `tense` is `past · today · future`.

```sql
select * from lfg_calendar(current_date - 7, current_date + 30);
```

**A weekly task with no `recurrence_days` is left off** rather than guessed
onto a day. An honest gap beats a silently invented Tuesday — but it does mean
such a task never appears.

**What feeds it today:** photos, task completions, field logs, and tasks that
carry a `due_date` (settable from both task editors). **What does not:**
plantings and harvests, because `lfg_area_events` has no write path anywhere in
the site. See Known gaps.

---

## Plant records — stub and complete

Photographing something new should never be blocked by the plant not existing
yet. The workflow:

1. **Stub at the point of need.** The plant dropdowns end with "＋ New plant…".
   Type a name and a stub saves as `pending`; the photo links immediately.
2. **Stubs are invisible to visitors automatically.** Learn shows only approved
   plants and the lightbox chip renders only for approved ones. Approve the
   record and every photo already linked to it lights up retroactively.
3. **"Plants to complete"** in the approval queue lists each stub with how many
   photos are waiting on it, so the one blocking the most work comes first.
4. **Fill it in** — tap a stub to open the plant editor in `app.html`.

The editor asks for the four fields that make a plant linkable and visible
(name, category, botanical name, summary), then the grower fields that feed the
calculators (days to maturity, spacing, planting windows, watering). The other
~19 columns stay blank on purpose.

**No invented values, ever.** Uncertain data stays blank rather than guessed.
That rule is why `plant-autofill.ts` was scoped to only the handful of fields
Wikipedia can actually provide.

Approving a plant is operator-only; creating a stub is a crew action.

---

## Notifications

An insert into `lfg_access_requests` fires a trigger that emails Chad, so a
request cannot sit unnoticed for days.

**No Edge Function.** `pg_net` makes the HTTP call straight from Postgres —
worth knowing, because the project has zero Edge Functions deployed and
`plant-autofill.ts` is already written and waiting.

**Secrets live in Vault, never in `lfg_config`.** That table's SELECT policy is
`key <> 'admin_password'` — a denylist of exactly one entry — so anything else
put there is readable with the anon key printed in every page. An API key there
would be public.

| Vault secret | What it is |
|---|---|
| `resend_api_key` | Resend sending-access key |
| `notify_email_to` | where alerts go |
| `notify_email_from` | sender address |

The trigger is `SECURITY DEFINER` (the caller is anon and must not read Vault),
and the call is **fire and forget** — a slow or down Resend never blocks the
insert. Losing a notification is survivable; losing the request is not.

Currently sending from Resend's sandbox address, which only delivers to the
address the Resend account was registered with. Verifying a domain at
resend.com/domains lifts that and lets alerts go anywhere.

To switch to SMS or push later, change the secrets and the trigger body —
nothing else references them.

---

## Bed signs and QR codes

Every raised bed has a tile sign carrying its code in large text and a QR code:

```
https://lancerfarms.com/bed.html?b=1E
```

### Why this shape

The QR gets glued to tile and is then permanent. Everything below follows from
that.

- **A dedicated page, not a link into `app.html`.** What a scan should show will
  change; the tile will not. Pointing the code at today's page would weld
  today's design to physical tile.
- **The `code` column, not the uuid or the name.** `code` is a separate column
  precisely so it can stay fixed while `name` changes. Parsing the code out of
  the display name would mean renaming a bed breaks 23 signs. It is also
  readable, matches the text printed on the same sign, and can be typed by hand
  if a code will not scan in bright sun. Unique index on `upper(code)`, so two
  beds can never share a QR target.
- **One page, both audiences**, resolved by role rather than by two sets of
  codes.

### How `bed.html` behaves

The bed code renders first and largest — that is how you confirm you scanned the
right bed before anything else loads.

Then a **role gate**, but only when no role is stored. Someone working through
twenty beds should not answer it twenty times; the choice is remembered, with a
*Viewing as … · switch* link at the foot.

| | Visitor | Staff |
|---|---|---|
| Code, name, zone, blessing | yes | yes |
| Photos, what is growing | yes | yes |
| Open tasks, recent work log | — | yes |
| Actions | Explore farm · Almanac | Log work here · Farm data |

Tasks and work logs are operational detail: useful standing at the bed with a
trowel, noise to someone on a tour.

**Photos and logs are filtered to approved only**, because anyone can scan a
sign. Unmoderated content must not be the first thing a visitor sees.

### Printing the signs

QR settings that matter outdoors: **error correction Q**, **2 inches minimum**,
black on white, square modules, clear quiet zone, no URL shortener. The
procedure is a how-to card in the system — *Make the bed signs with QR codes* —
attached to a task, so whoever picks it up gets it step by step on their phone.

Codes were generated with `segno` at error correction Q and machine-verified:
every one decoded back to its own bed before printing.

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
| Zone 1 | 1A–1H, 1J, 1K (10 beds) | 1.55 × 0.86 m | 18" |
| Zone 2 | 2A–2F (6 beds) | 3.08 × 1.53 m | 24" |
| Zone 3 | 3A–3G (7 beds) | 3.18 × 1.29 m | 24" |

**Zone numbers follow the irrigation controller**, not the layout — Zone 1 here
is watering zone 1 on the Rain Dial.

**Beds are lettered left to right facing inward** toward the White House at the
centre of the garden. Position is authoritative, not the letter: the physical
order lives in `lfg_growing_areas.sort_order`, and every query orders by
`zone → sort_order → name`. That matters because inserting a bed mid-row
re-letters everything downstream, which is exactly what happened when Zone 1
went from 8 beds to 10.

**`I` is skipped.** `1I` misreads as `11` on a weathered outdoor label — the
same reason parking bays and aircraft seats skip I and O. Zone 1 runs A–H, J, K.

Zone 1 is a single row of 10 along the NE wall, split by a shed gap between 1E
and 1F. Zone 2 has 3 beds per side of the SW porch path. Zone 3 is a single row
parallel to the NW wall.

Nothing references a bed by name — photos, logs, events, comments, reports,
requests and tasks all join on `area_id`. Renaming a bed is therefore free, and
history follows the physical bed rather than the label.

Each bed also carries a **`code`** (`1E`) — the short stable key printed on its
sign and used by the QR. Separate from `name` on purpose; see Bed signs.

**`lat` / `lng` are ready but empty.** Mounting day is the one occasion when
somebody stands at all 23 beds with a phone, so that is when coordinates get
captured. They also feed the GIS coursework.

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

**No way to record a planting or a harvest.** `lfg_area_events` is the table for
"planted Bed 2C with lettuce on 1 March" and nothing in the site can write to
it — no UI, and its INSERT is operator-only, which is probably wrong for a crew
action. Zero rows. This is the missing half of a *farm* calendar rather than an
activity feed, and the largest open item.

**Bed GPS is not captured.** `lat` / `lng` exist and are empty. Mounting day is
the one occasion someone stands at every bed with a phone; after that it is a
special trip.

**`bed.html` shows plants from `lfg_area_events`, which has no rows** — so the
"Growing here" section is empty on every bed until plantings can be recorded.
See the item above.

**The calendar has no page.** `lfg_calendar()` is live and self-backfilling; the
month grid is not built. Its drawer entry sits commented out in `app.html`.

**`plant-autofill.ts` was written but never deployed.** Zero Edge Functions on
the project. Without it every plant stub is filled in by hand. The file is not
in this repo — check Drive.

**`lfg_inventory` allows a hard DELETE with the anon key.** Closing it needs a
UI decision first: move deletion behind operator, or make it a soft delete like
every other table. A policy alone would stop crew managing supplies.

**A weekly task cannot be given a weekday.** Both editors offer
Once/Daily/Weekly/Monthly but no day picker, so `recurrence_days` stays null and
the task never lands on the calendar.

**The approval queue is implemented twice** — `app.html` and `admin.html` both
read pending photos, comments and logs; only app's lists plant stubs. Two
implementations of one queue will drift.

**How-to cards are English only.** `howto.html` does not load `i18n.js`, and the
switcher only translates elements carrying `data-i18n` — card steps come from
the database and no language switch will ever reach them. Fixing it properly
means translation columns plus player changes.

**`og:` tags are not set sitewide**, pending `lfg-og.png`.

**`index.html` and `about-grush.html` have no drawer nav.** Deliberate — one is
a three-second role gate, the other a leaf page.

**Teach is designed but unbuilt.** The staff drawer is grouped Plan / Do /
Learn; Teach is intended as an instructor sandbox for designing, delegating,
managing and recording experiments in selected beds. That is a schema
conversation before a UI one — instructors as a role distinct from operator and
crew, experiments as first-class records, bed reservation, and observations that
attach to the experiment rather than the general field log.

**GIS map view**, pending a farm visit to trace bed polygons.
