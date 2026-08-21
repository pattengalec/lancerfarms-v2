# Lancer Farms & Gardens — lancerfarms.com

**Rebuild reference as of August 21, 2026.**
This document is sufficient to reconstruct the site, database, and all tooling from scratch.

> **August 20–21, 2026 was a large session** — the six-tier drawer system, the
> Chad-first lab proposal gate, the team-review pipeline, and the removal of
> the Spanish/i18n layer. Sections 4, 5, 6, 6b, 7 and 11 all changed.
>
> **A gap exists between August 8 and August 20 that this document does not
> fully narrate.** Roughly thirty migrations landed in that window —
> assessments, donations, photo consent, the experiments/proposal module, the
> six-tier rank system — that predate the session this rewrite was done from.
> The migration names are listed in section 7 so nothing is silently missing,
> but the detailed "what changed and why" narrative for that period was not
> reconstructed. If you were the one who did that work, section 12 has a slot
> waiting for it.
>
> If you are reading a copy older than this, most of it is now wrong.

---

## 1. Project overview

Lancer Farms & Gardens is a student-run organic teaching garden at California Baptist University, Riverside CA, located next to the historic Hawthorne House (Colony area). The site serves several audiences: staff/caretakers who log work, faculty who sponsor and approve research, CBU students who propose labs, administrators who approve and configure, and the public who can read about the garden.

**Caretaker:** Chad Pattengale, part-time student caretaker, B.S. Environmental Science (CBU, ~1 year remaining). Dr. Jacob Lanphere (Environmental Science) is the founding faculty advisor. Dr. Bonjun Koo (Environmental Science) is program director and sponsors the Carbon Research Team.

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
├── Transactional email — Resend
│   ├── Sending domain: lancerfarms.com (verification submitted Aug 21 2026,
│   │   DNS records added at Namecheap; propagation pending at time of writing)
│   └── Prior sender: onboarding@resend.dev (Resend's shared sandbox address —
│       could only deliver to the account owner's own inbox, which silently
│       blocked every notification meant for someone other than Chad. This is
│       why the team-review emails failed on first real test — see section 11.)
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
| Resend | **getgrush workspace**, logged in via GitHub OAuth on `pattengalec` (not email/password) | All transactional email — access requests, proposal notifications, team-review links |

**A note on the Resend account, because finding it cost real time on Aug 21:** the working API key lives in the **"getgrush"** workspace, reached by logging into resend.com via **"Continue with GitHub"** using the `pattengalec` GitHub account. Logging in a different way (or authorizing a fresh GitHub OAuth grant) can land in a *different*, empty Resend account with no API keys — that happened mid-session and cost real debugging time. If API Keys ever shows empty, you're in the wrong account/workspace, not looking at a broken dashboard.

**Supabase Vault secrets required:**
- `resend_api_key` — Resend API key for email notifications
- `notify_email_to` — destination email for Chad-facing alerts (access requests, new proposals)
- `notify_email_from` — sender address. **Must be on a Resend-verified domain** or every send to anyone but the account owner is rejected with a 403. Was `onboarding@resend.dev` through Aug 21; update to a `lancerfarms.com` address once domain verification (section 2) completes.

---

## 4. Repository structure

```
pattengalec/lancerfarms-v2 (branch: main)
│
├── index.html          Landing page — one door to desk.html + access request
├── desk.html           The console — six-tier locked menu + 2x2 glove desktop
├── app.html            Staff PWA — tasks, photos, areas, log, triage
├── admin.html          Admin dashboard — all CRUD + approval queues + team-review visibility
├── manual.html         Farm manual — 6 topic sections with tabs
├── data.html            Live farm data dashboard (public)
├── almanac.html        Growing almanac — planting calendar, plant DB
├── triage.html         Plant triage tool (Three.js ACLS-style model)
├── howto.html          Step-by-step how-to card player
├── mixbench.html       Mix Bench — recipe configurator + estimators
├── irrigation-bom.html Irrigation bill of materials calculator
├── visitor.html        Visitor hub — four tiles (See / Learn / Do / Share)
├── see.html            Photo gallery — approved photos, zone filters, lightbox
├── learn.html          Plant knowledge base — plants, search + category
├── do.html             Calculators — bed soil volume, harvest date
├── share.html          Visit counter, moderated notes, share link
├── bed.html            QR landing page — role-aware, reads ?b=CODE
├── watch.html          Showcase video player
├── features.html       Feature overview
├── help.html           How-to-use-the-site help page
├── about-grush.html    What Grush is → links to getgrush.com
│
│                       ── STUDENT RESEARCH PIPELINE (added Aug 2026) ──
├── propose.html        Lab proposal form. Team-only: picks a research team
│                       from a live directory (only teams with a documented
│                       leader are listed), writes the proposal, submits.
│                       No direct-to-Chad path exists — see section 6d.
├── team-review.html    Token-gated page reached only via a personal emailed
│                       link. Every team member can respond (agree / suggest
│                       changes / propose an alternative); the team's
│                       documented leader additionally sees an editable copy
│                       of the proposal and a "Send to Chad" action. See 6d.
├── review.html         Token-gated sponsor decision page — the faculty
│                       sponsor's one-click approve/reject, reached only via
│                       their emailed link after Chad forwards a proposal.
│
│                       ── FARM-OWNED (survive removal of the Grush layer) ──
├── lfg-config.js       Supabase URL + anon key + Cloudinary config
├── lfg-db.js           The farm's Supabase client. Split out of grush-auth
│                       so public pages stop importing identity just to
│                       reach a database handle
├── lfg-theme.css       Legacy theme tokens (older pages)
│
│                       ── GRUSH LAYER (removable; see section 6a) ──
├── grush-menu.js       The shared drawer, defined once. Farm-owned tiers
│                       (Emergency, Visitor, Support) plus the footer. The
│                       overlay below extends it at runtime via addTier().
├── grush-auth.js       Identity: magic link, session, grush_role()
├── grush-nav.js        Shared nav/drawer/rail for every page except desk.html.
│                       Renders locked tiers as closed-by-default accordions
│                       with a dimmed item preview and a Request Access form
│                       that writes to lfg_access_requests — no sign-in
│                       required to ask.
├── grush-track.js      Page-view counter, standalone.
├── grush-tool.js       The tool contract implementation — banner, input
│                       echo, print, guarded role read
├── grush-desk-staff.js desk.html's tier definitions and sign-in sheet.
│                       Owns Tools, CBU Student, Staff, Instructor, Faculty.
│                       "Propose a lab" lives under CBU Student (locked),
│                       not Tools — moved Aug 21 so it reads as a student
│                       privilege rather than a general calculator; the
│                       page itself still has no auth wall, so a direct
│                       link still works for anyone who has one.
├── grush-settings.js   Theme owner + settings console
├── grush-shell.css     Shared shell layout
├── grush-theme.css     The Grush design language applied to desk.html
├── grush-tokens.css    Shared design tokens, loaded on every page
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

**`i18n.js` was deleted Aug 21 2026** — see section 6b. If you find a page still loading it, that page is stale and needs the same cleanup applied to index/visitor/learn/do/see/share that night.

**Three design systems co-exist intentionally:**
- **LFG style** (app, admin, manual, data, almanac, triage, howto, visitor, see, learn, do, share): `Fraunces` / `Source Sans 3` / `Courier Prime`. Earth tones: `#2A2620` paper, `#F0EDE2` ink, `#7E9A6E` green, `#A8B89A` leaf, `#C9973F` amber.
  Canonical tokens: `--ink --ink-soft --paper --card --line --line-strong --green --leaf --amber`.
- **Grush tool style** (mixbench, irrigation-bom): `Bricolage Grotesque` / `Source Serif 4` / `JetBrains Mono`. Navy/cyan/chartreuse. Predates the design language below and has not been migrated.
- **Grush design language** (`grush-theme.css`, applied to desk.html): `Fraunces` / `IBM Plex Sans` / `IBM Plex Mono`. Substrate `#14110F`, mycelium `#E8E1D4`, spore `#C9A227`, steel `#5C7080`, oxblood `#8C2F39` — reserved for destructive actions only.
- **`propose.html` and `team-review.html`** use their own small dark palette (`--paper #2A2620`, `--card #34302A`, `--green #7E9A6E`, `--amber #C9973F`) — close kin to the LFG style but self-contained, since both are standalone forms rather than pages inside the drawer.

---

## 5. Page-by-page function reference

*(Sections for app.html, admin.html's non-review tabs, manual.html, data.html, almanac.html, triage.html, howto.html, mixbench.html, irrigation-bom.html, bed.html, about-grush.html are unchanged from the Aug 8 description and are not repeated here — see git history for that text if needed. What follows covers everything that changed or was added since.)*

### index.html — Landing page

One door. Enters `desk.html`. Carries the access request sheet (writes `lfg_access_requests`; a trigger emails Chad) and Open Graph/canonical meta. **The EN/ES language switch was removed Aug 21 2026** — see section 6b. `i18n.js` no longer loads here.

### desk.html — The console

The launcher. Left pane is a menu in **six locked tiers** (Tools open; CBU Student, Staff, Instructor, Faculty locked by rank), right pane is a 2×2 desktop the person fills themselves, persisted per device via `localStorage`.

**Glove rules, unchanged since Aug 8:** 68px rows, 56px add buttons, no overlapping hit fields, no edge-swipe, drag as the secondary path via Pointer Events. `?preview=` still only ever narrows.

**Structure is unchanged:** `desk.html` itself is farm-owned and contains no reference to auth, Supabase, staff or admin. The whole Grush layer arrives through one marked block at the bottom of the file. See section 6a.

### grush-nav.js — the shared drawer (every page except desk.html)

Every labelled tier renders as a closed-by-default `<details>` accordion — open or locked, so a visitor and an operator see the same six doors and only some open on the first tap. A locked tier's body shows a dimmed, non-interactive preview of what's inside, plus a **Request Access** control that expands into a name/email form and writes to `lfg_access_requests` — no sign-in needed to ask. `desk.html` has its own, separate implementation of the same idea (`grush-desk-staff.js`) because it also needs the `+` add-to-desk button, which the shared drawer doesn't have.

### propose.html — Lab proposal (student research pipeline)

Public, no login required. **Team-only as of Aug 21 2026** — there is no path to submit a proposal without picking a team; the old "submit directly to Chad" option was removed at Chad's request after testing surfaced that it defeated the point of routing ideas through a team first.

- **Gate screen:** a live directory of active research teams, but **only teams with a currently documented leader are listed** (queried from `lfg_teams` joined against `lfg_team_members` where `is_leader = true and left_at is null`). A team with nobody able to finalize a proposal isn't offered — a team with no leader is a dead end, not a real option. If the query fails or nothing qualifies, the visitor sees a plain message pointing to Chad's email instead of a broken form.
- Tapping a team card carries you straight into the form with that team locked in (shown as "Submitting to: [team]," with a "Change team" link back).
- **Faculty sponsor is always optional at this stage** — the team decides it together during review; the team lead confirms it when finalizing.
- On submit, the row lands in `lfg_experiments` with `approval_status = 'team_review'` and `team_id` set. RLS only allows a public insert at that exact status — see section 7. A trigger (`notify_team_review`) then creates one `lfg_proposal_reviews` row per active team member and emails each a personal token link to `team-review.html`.

### team-review.html — Team member response + leader finalize

Reached only via a personal magic link (`?token=...`) from `notify_team_review()`. No login — the token is the credential, same pattern `review.html` already used for the sponsor's link. Every read and write goes through a SECURITY DEFINER RPC (`get_proposal_by_review_token`, `get_team_responses`, `submit_team_response`, `finalize_team_proposal`); the page never touches `lfg_experiments` or `lfg_proposal_reviews` directly, because a public page has no RLS credentials to do so.

- **Every team member** sees the proposal read-only, sees what teammates have already said, and can submit their own response: **Agree**, **Suggest changes**, or **Propose an alternative**, each with a note. Reusable, not single-use — a response can be revised before the meeting.
- **The team's documented leader** (`is_leader = true` on their specific token) additionally sees an editable copy of every field plus a faculty-sponsor picker and a **"Send to Chad"** button. Only a leader's token can call `finalize_team_proposal()` — enforced inside the function itself, not just hidden in the UI. Finalizing saves the leader's edits and flips `approval_status` to `'new'`, which is the exact same status a (now-removed) direct submission used to land at — from that instant the proposal is indistinguishable to Chad's queue from one that skipped team review entirely.

### admin.html — Admin dashboard, Review Queue changes

The Review Queue's `loadReview()` now also pulls proposals sitting at `approval_status = 'team_review'` and shows them in a **read-only** strip — "In team review — not yet yours to act on" — with a response-progress count ("2 of 3 responded") pulled from `lfg_proposal_reviews`. No buttons on these cards; Chad isn't the one acting at that stage, the team is.

Proposals that land at `approval_status = 'new'` (whether from a finalized team submission, or historically from a since-removed direct path) still show under **"Lab proposals — your first look"** with two real actions:
- **Forward to sponsor** — flips `approval_status` to `'pending'`, which is what fires the sponsor's emailed decision link (`review.html`). Does not finalize anything; only the sponsor's own decision, or a direct reject, does that.
- **Reject** — flips to `'rejected'`, notifies the student, the sponsor never sees it.

---

## 6. Authentication architecture

**File:** `grush-auth.js` (needs supabase-js from CDN, then `lfg-config.js`, then `lfg-db.js`)

**A six-tier rank system, not the three-tier model this document described through Aug 8** (migration `six_tier_rank_system`, Aug 20 2026). Both `grush-menu.js` and `grush-desk-staff.js` share the same rank table:

```js
RANK = { emergency: 0, visitor: 0, tools: 0, student: 1, staff: 2, instructor: 3, faculty: 4, owner: 5 }
```

- **Emergency, Visitor, Tools** — open to everyone, never locked, never require sign-in.
- **CBU Student** (rank 1) — locked. Holds "Propose a lab" (real, working) plus two `soon:true` placeholders pending campus approval.
- **Staff** (rank 2) — locked. Recording tools: log, tasks, photos, inventory, locations, how-to cards, garden map.
- **Instructor** (rank 3) — locked, placeholder only.
- **Faculty** (rank 4) — locked. Approvals, admin panel, team management (placeholder).
- **Owner** (rank 5) — Chad alone. Never granted from an access request.

An unranked/unknown tier is treated as **open**, deliberately — the cost of a wrongly-open row is someone sees a page they could have reached anyway; the cost of a wrongly-shut one is a greyed-out emergency button.

`grush_operators.role` and `grush_operators.rank` carry this on the database side. `grush_role()` — SECURITY DEFINER — reads the allowlist and returns the caller's tier name, `'visitor'` for anyone not on it.

**`GRUSH` is a lexical `const`, not a property of `window`.** Read the bare name inside a `try`:

```js
var G; try { G = GRUSH; } catch (e) { return; }   // correct
var G = window.GrushAuth;                          // silently always null
```

**One client per page**, **never reload from a `grush:auth` handler**, **the real boundary is Postgres** — all unchanged from Aug 8, still load-bearing, see that section's original text if this summary isn't enough.

---

## 6a. The Grush layer is removable

Unchanged in substance since Aug 8 — see that section's text. The removal test still passes: delete the marked overlay blocks, zero dangling script references remain on public pages.

---

## 6b. Languages — the Spanish/i18n layer was removed

**Removed entirely Aug 21 2026.** This section previously documented a hand-maintained `i18n.js` carrying English + Spanish for a handful of visitor-facing tiles and headings, with everything else left to the browser's native translation. That design was sound in principle but the execution didn't deliver on it: tapping the ES toggle silently translated three tiles and left the rest of the page — and every other page — in English, with no active guidance toward the browser's own translate feature. That read as broken, not as "here's how you get the rest."

**Current state:** no hand-maintained translation layer exists. The site relies entirely on the browser's native translation (Chrome/Safari/Edge), same as it always did for everything `i18n.js` didn't cover — which was already almost the entire site. `i18n.js` was deleted from the repo; the EN/ES switch markup was removed from `index.html` and `visitor.html`; `data-i18n`/`data-i18n-ph` attributes were stripped from `index.html`, `visitor.html`, `learn.html`, `do.html`, `see.html`, `share.html`.

If a hand-maintained translation layer is rebuilt in the future, the failure mode to design against is exactly this one: partial coverage that looks broken rather than looking like a deliberate handoff to the browser.

---

## 6c. The tool contract

Unchanged since Aug 8 — see that section's original text. `mixbench.html` and `irrigation-bom.html` still conform; no new tool has been added to the contract since.

---

## 6d. The lab proposal pipeline

Built across several sessions; the version described here is current as of Aug 21 2026.

**Every proposal goes through a team. There is no path that skips it.** This was a deliberate late change — an earlier version of `propose.html` let a student submit straight to Chad, bypassing team review entirely, and Chad had that option removed once he saw it defeated the purpose.

**The full chain:**

1. **`propose.html`** — student picks a team from a directory limited to teams with a documented leader, writes the proposal, submits. Lands at `approval_status = 'team_review'`.
2. **`notify_team_review()`** (AFTER INSERT trigger) creates one `lfg_proposal_reviews` row per active team member and emails each a personal token link.
3. **`team-review.html`** — every member can respond (agree / suggest changes / alternative); the leader can additionally edit and finalize.
4. **`finalize_team_proposal()`** — leader-only, token-gated, SECURITY DEFINER. Saves edits, sets a sponsor, flips `approval_status` to `'new'`.
5. **`notify_proposal_new()`** (fires on INSERT *or* UPDATE of `approval_status`, so it catches both a legacy direct submission and a team finalize) emails Chad.
6. **`admin.html`** Review Queue — Chad reviews, then either **Forward to sponsor** (`approval_status → 'pending'`, fires `notify_proposal_submitted()`, emails the sponsor a token link to `review.html`) or **Reject** (`approval_status → 'rejected'`, fires `notify_proposal_decided()`, emails the student — sponsor never sees it).
7. **`review.html`** — the sponsor's one-click decision page, via `get_experiment_by_token()` / `decide_experiment()`. Their decision fires `notify_proposal_decided()` again, this time on the sponsor's actual verdict.

**Every step from 2 through 7 is a SECURITY DEFINER function or trigger.** No public page ever has direct RLS-governed write access to `lfg_experiments` or `lfg_proposal_reviews` beyond the single, narrow insert `propose.html` performs — everything downstream is mediated. This is the same pattern the sponsor-decision flow (`review.html`) already used before the team-review layer existed; the team layer was built to match it rather than invent a second convention.

---

## 7. Database — Supabase project gblizuknnvguxyxfequh

### Co-tenant architecture
All `lfg_*` tables belong to Lancer Farms & Gardens. All `fgf_*` tables belong to Fun Guy Fungi. Shared tables: `grush_operators`, `grush_people`.

### Tables — LFG (unchanged from Aug 8; see that section for the full list)

`lfg_config`, `lfg_growing_areas`, `lfg_master_plants`, `lfg_photos`, `lfg_tasks`, `lfg_task_completions`, `lfg_log`, `lfg_area_events`, `lfg_howto_cards`, `lfg_inventory`, `lfg_access_requests`, `lfg_comments`, `lfg_reports`, `lfg_requests`, `lfg_manual_entries`, `lfg_settings`, `lfg_visit_overrides` — structure as documented Aug 8. `lfg_access_requests.requested_role` was widened (migration `widen_access_request_roles`, Aug 20) to accept `staff | instructor | faculty` in addition to the original `crew | operator`, matching the six-tier rank system.

### Tables — added since Aug 8

**`lfg_experiments`** (migration `lfg_experiments_module`, Aug 17 2026, extended through Aug 21) — the lab proposal / experiment record. Columns as of Aug 21:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `kind` | text NOT NULL, default `'proposal'` | |
| `research_question`, `background`, `hypothesis`, `design`, `procedure`, `materials` | text | all nullable |
| `approval_status` | text NOT NULL, default `'pending'` | see CHECK constraint below |
| `submitted_by`, `submitted_by_email` | text | |
| `sponsor_id`, `sponsor_name` | uuid / text | nullable — optional until a team lead finalizes |
| `team_id` | uuid, FK → `lfg_teams` | nullable — added Aug 21, `null` means a legacy direct submission |
| `requested_area_id`, `requested_location_label` | uuid / text | |
| `approval_token` | uuid, default `gen_random_uuid()` | the sponsor's single-use-in-spirit (not enforced single-use) decision link credential |
| `approval_token_expires_at`, `approval_token_used_at` | timestamptz | |
| `reviewed_by`, `reviewed_at`, `review_note` | text / timestamptz / text | |
| `status`, `start_date`, `end_date`, `description`, `created_by`, `created_at`, `archived_at` | — | pre-dates the proposal-specific fields; general experiment record |

**`approval_status` CHECK constraint** (fixed Aug 21, migration `fix_approval_status_check_constraint`): `ANY (ARRAY['new', 'team_review', 'pending', 'approved', 'rejected'])`. **This constraint was NOT updated when `'new'` and `'team_review'` were introduced as valid statuses** (migrations `proposal_chad_gate` and `team_review_workflow`) — it silently rejected every insert at either value with a generic Postgres error until a real end-to-end submission test on Aug 21 surfaced it. If you add a new `approval_status` value in the future, **check this constraint**, not just the RLS policy — they are two separate gates and both need updating.

**`lfg_proposal_reviews`** (migration `team_review_workflow`, Aug 21) — one row per team member per proposal under review.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `experiment_id` | uuid NOT NULL, FK → `lfg_experiments`, ON DELETE CASCADE | |
| `team_member_id` | uuid NOT NULL, FK → `lfg_team_members`, ON DELETE CASCADE | |
| `review_token` | uuid NOT NULL UNIQUE, default `gen_random_uuid()` | the member's personal magic-link credential |
| `response_type` | text, CHECK `IN ('agree','suggest_changes','alternative')` | null until they respond |
| `note` | text | |
| `responded_at` | timestamptz | null until they respond; presence of a value is what "responded" means everywhere else in the app |
| `created_at` | timestamptz, default `now()` | |

RLS: locked to operators only (`grush_rank() >= 4`). No public policy — every access goes through the SECURITY DEFINER RPCs in section 6d.

**`lfg_teams`** (migration `create_lfg_teams`, Aug 20) — research teams.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `faculty_sponsor` | text | display-only, informational — the real sponsor relationship lives on `lfg_experiments.sponsor_id/name` |
| `current_research` | text | shown in the `propose.html` directory |
| `active` | boolean, default `true` | |
| `created_at` | timestamptz | |

RLS: public SELECT where `active = true` (added Aug 21, migration `public_team_directory`) — needed so `propose.html`'s directory works for an anonymous visitor. Operator write access separately.

**`lfg_team_members`** (migration `create_lfg_teams`, extended `add_team_leader_flag` Aug 20) — team roster.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `team_id` | uuid NOT NULL, FK → `lfg_teams` | |
| `display_name` | text NOT NULL | |
| `email` | text | CBU email — shown as a `mailto:` in the public directory |
| `term` | text | e.g. a semester label, informational |
| `joined_at` | date, default `CURRENT_DATE` | |
| `left_at` | date | null means currently active |
| `is_leader` | boolean, default `false` | exactly the flag both the directory and the finalize permission check key off of |

RLS: public SELECT limited to `is_leader = true and left_at is null` (migration `public_team_directory`, Aug 21) — **deliberately not a full-roster read.** Someone with an idea should be able to reach the person coordinating a team without every member's email becoming public. Operator write access separately.

**Current seed data (as of Aug 21):** one active team, "Carbon Research Team," sponsored by Dr. Koo, three members — Fabio Da Costa Silva, Liesel Arden Young, Isabella V. Salazar (`is_leader = true`).

### Functions — added or changed since Aug 8

All are SECURITY DEFINER unless noted.

| Function | Purpose |
|---|---|
| `notify_proposal_submitted()` | Trigger. Emails the sponsor a decision link when `approval_status` becomes `'pending'`. Fires on **INSERT or UPDATE of `approval_status`** (widened Aug 21 so it also catches a team-lead forward, not only a legacy direct submission at insert time). |
| `notify_proposal_decided()` | Trigger, UPDATE. Emails the student when the sponsor (or Chad, on reject) sets `approval_status` to `'approved'`/`'rejected'`. |
| `get_experiment_by_token(p_token)` | Sponsor reads a proposal via their token, bypassing RLS. |
| `decide_experiment(p_token, p_decision, p_note, p_reviewer_name)` | Sponsor's approve/reject action from `review.html`. |
| `notify_proposal_new()` | Trigger. Emails Chad when a proposal reaches `approval_status = 'new'`. Fires on **INSERT or UPDATE**, so it catches a team-lead finalize as well as an insert. |
| `notify_team_review()` | Trigger, AFTER INSERT. When a proposal lands at `approval_status = 'team_review'`, creates one `lfg_proposal_reviews` row per active team member and emails each their personal `team-review.html` link. |
| `get_proposal_by_review_token(p_token)` | A team member reads the proposal, their own tier's status, and whether they're the leader, via their token. |
| `get_team_responses(p_token)` | Everyone else's already-submitted responses on the same proposal — names and content, not tokens or contact info. |
| `submit_team_response(p_token, p_response_type, p_note)` | A team member's agree/suggest/alternative response. Reusable — updates in place, not single-use. Refuses once the proposal has left `'team_review'`. |
| `finalize_team_proposal(p_token, ...all fields..., p_sponsor_id, p_sponsor_name)` | **Leader-only**, enforced inside the function by checking `is_leader` on the token's team-member row. Saves the leader's edits and sets `approval_status = 'new'`. |

Functions unchanged since Aug 8 (`is_operator()`, `grush_track_view()`, `grush_total_views()`, `grush_weekly_digest()`, `set_updated_at()`, `lfg_calendar()`, `area_name_status()`) are not repeated here.

### Migrations

Migrations 1–41 (through `digest_twice_weekly`, Aug 5 2026) are as documented in earlier copies of this file — see git history if the detail is needed. **Migrations 42 onward, in order, names only** (the detailed narrative for Aug 9–Aug 17 was not reconstructed for this rewrite — see the note at the top of this document):

42. `add_operator_role_tier` (Aug 8)
43. `photo_consent_and_read_policy` (Aug 9)
44. `area_events_plant_link` (Aug 9)
45. `log_operator_autoapprove` (Aug 9)
46. `operator_delete_rejected` (Aug 9)
47. `photo_upload_acknowledgements` (Aug 9)
48. `notify_pending_review` (Aug 9)
49. `notify_pending_review_triggers` (Aug 9)
50. `lfg_experiments_module` (Aug 17) — introduces `lfg_experiments`
51. `lfg_experiment_readings_custom_area` (Aug 17)
52. `lfg_experiment_files` (Aug 17)
53. `lfg_experiments_template_section_model` (Aug 17)
54. `lfg_experiments_structured_proposal_fields` (Aug 17)
55. `lfg_donations_table` (Aug 17)
56. `lfg_supply_donations_table` (Aug 17)
57. `lab_proposal_faculty_and_review_workflow` (Aug 20) — introduces the sponsor token/`review.html` flow
58. `lfg_experiments_add_requested_location` (Aug 20)
59. `allow_public_file_attach_to_pending_proposals` (Aug 20)
60. `lfg_experiments_add_submitted_by_email` (Aug 20)
61. `lab_proposal_email_triggers` (Aug 20)
62. `assessment_catalog_orders_and_results` (Aug 20)
63. `student_auth_and_assessment_convergence` (Aug 20)
64. `public_read_assessment_readings` (Aug 20)
65. `create_lfg_teams` (Aug 20)
66. `add_team_leader_flag` (Aug 20)
67. `six_tier_rank_system` (Aug 20) — see section 6
68. `widen_access_request_roles` (Aug 20)

**Migrations 69 onward — Aug 20–21, fully documented, this session:**

69. `proposal_chad_gate` — introduces `approval_status = 'new'`, the RLS policy restricting public inserts to that value, `notify_proposal_new()`, widens `notify_proposal_submitted()`'s trigger to fire on UPDATE as well as INSERT.
70. `public_team_directory` — public SELECT on `lfg_teams` (active only) and `lfg_team_members` (leaders only), for `propose.html`'s directory.
71. `team_review_workflow` — `lfg_experiments.team_id`, `lfg_proposal_reviews` table, `notify_team_review()`, `get_proposal_by_review_token()`, `get_team_responses()`, `submit_team_response()`, `finalize_team_proposal()`.
72. `proposal_team_only` — tightens the RLS policy so a public insert may **only** land at `'team_review'`, removing the direct-to-`'new'` path entirely, matching the UI change that removed the "submit solo" option.
73. `fix_approval_status_check_constraint` — the CHECK-constraint fix described above.

### Scheduled jobs (pg_cron)

Unchanged since Aug 5 — see that section's original text for the DST note.

### RLS summary — additions since Aug 8

- **`lfg_experiments`:** public INSERT only at `approval_status = 'team_review'` (see migration 72 above — this is the current state; it was `'new'` then `'new' or 'team_review'` at earlier points in the same session, so don't trust an older copy of this doc or a stale comment in the code). Operator ALL access (`grush_rank() >= 4`).
- **`lfg_proposal_reviews`:** operator-only, no public policy of any kind — every access goes through SECURITY DEFINER RPCs.
- **`lfg_teams`:** public SELECT where `active = true`. Operator write.
- **`lfg_team_members`:** public SELECT where `is_leader = true and left_at is null` only — not a full roster. Operator write.

---

## 8. Physical garden data

Unchanged since Aug 8 — see that section's original text.

---

## 9. Key contacts (as of Aug 2026)

| Name | Role | Notes |
|---|---|---|
| Chad Pattengale | Caretaker / developer | chad@getgrush.com |
| Dr. Jacob Lanphere | Env. Science faculty, founding advisor | |
| Dr. Bonjun Koo | Env. Science program director | Sponsors the Carbon Research Team |
| Isabella V. Salazar | Carbon Research Team lead | |
| Fabio Da Costa Silva | Carbon Research Team member | |
| Liesel Arden Young | Carbon Research Team member | |

---

## 10. Rebuild procedure

Steps 1–4 and 7–9 are unchanged since Aug 8 — see that section's original text.

### Step 5 — Seed data (updated)
- Insert operator email into `grush_operators`, with a `role` **and `rank`** matching the six-tier system in section 6 — the first one should be `rank = 5` (owner).
- Seed `lfg_config`, `grush_people`, `lfg_growing_areas`, `lfg_master_plants`, `lfg_inventory`, `lfg_howto_cards` as before.
- **Seed `lfg_teams`** with at least one active team, and **`lfg_team_members`** with at least one row where `is_leader = true` and `left_at IS NULL` — without this, `propose.html`'s directory is empty and nobody can submit a proposal at all, since the site no longer offers a direct-to-Chad path.

### Step 6 — Vault secrets (updated)
Add `resend_api_key`, `notify_email_to`, `notify_email_from`. **`notify_email_from` must be an address on a Resend-verified domain**, or every email to anyone but the Resend account's own owner will be silently rejected — see section 2 and section 11.

---

## 11. Open items (as of Aug 21 2026)

| Item | Priority | Notes |
|---|---|---|
| **Resend domain verification for lancerfarms.com** | High | Submitted Aug 21; DNS records (DKIM, MX, SPF, DMARC) added at Namecheap. Propagation can take a few hours. Once verified: update `notify_email_from` vault secret to a `lancerfarms.com` address, then re-test the team-review notification chain end to end with a real email delivery, not just the DB rows. |
| **Team-review pipeline: DB-verified, email delivery not yet confirmed** | High | The full chain — insert, trigger, `lfg_proposal_reviews` rows, tokens — was tested and confirmed correct in the database on Aug 21. The Resend sandbox restriction (see section 2) meant the actual emails to Fabio, Liesel, and Isabella were never delivered. Re-test once the domain verifies. |
| ~~Direct-to-Chad proposal submission~~ | ✅ Aug 21 | Removed by design decision — every proposal now must go through a team. See section 6d. |
| ~~i18n / Spanish translation layer~~ | ✅ Aug 21 | Removed entirely rather than fixed — see section 6b. |
| ~~"Propose a lab" under Tools~~ | ✅ Aug 21 | Moved to the locked CBU Student tier. |
| Plant illustrations | High | Unchanged since Aug 8 — see that section. |
| `plant-autofill.ts` Edge Function | Medium | Unchanged since Aug 8. |
| Financials tab | Medium | Unchanged since Aug 8. |
| DST reschedule of `lfg-weekly-digest` | Low | **Nov 1 2026** — unchanged since Aug 8. |
| Bed QR signs fabrication | Medium | Unchanged since Aug 8. |
| irrigation retrofit hardware purchased + installed | High | Unchanged since Aug 8. |
| Aug 9–17 migrations undocumented in narrative form | Low | See the note at the top of this document and the bare migration list in section 7. Worth a proper writeup if anyone has the context. |
| Grush tool style not migrated | Low | Unchanged since Aug 8. |
| `desk.html` 2×2 uses `localStorage` | Low | Unchanged since Aug 8. |
| Team management UI (`admin.html`) | Low | `lfg_teams`/`lfg_team_members` exist and are seeded; no admin page manages them yet — listed `soon:true` in the Faculty tier. |

---

## 12. Session history

### August 20–21, 2026

Carried over from a prior "Research team kickoff" session: battle-test the six-tier drawer, README, and several smaller items. What actually happened, roughly in order:

**Six-tier drawer confirmed live.** Verified by direct testing (screenshots against the running site, not just code review) that all six tiers, correct lock states, and correct sign-in CTAs render exactly as coded on `desk.html`.

**`desk.html` gained an accordion + Request Access pattern.** It had its own older, flat menu renderer that predated the pattern `grush-nav.js` already used everywhere else — locked tiers showed items flat and disabled with a single generic "sign in" button, no way to preview what was inside without already having access. Rebuilt to match: closed-by-default `<details>` per tier, a dimmed item preview for locked tiers, the existing sign-in CTA kept, and a new Request Access button underneath that writes to `lfg_access_requests` — the same table the homepage's "Work here?" form and `grush-nav.js`'s drawer both already used.

**The Spanish/i18n layer was removed, not fixed.** Investigation found the ES toggle only ever covered a sliver of the site (three tiles, a couple of headings) and gave no active guidance toward the browser's native translation for everything else — it read as broken. Rather than widen coverage, the whole layer was deleted: `i18n.js` removed from the repo, the switch UI removed from `index.html`/`visitor.html`, `data-i18n` attributes stripped from six pages.

**The lab proposal gate was built, then rebuilt twice as requirements sharpened.** First pass: proposals landed as `'new'` and Chad had to explicitly forward them before a sponsor ever saw them — a genuine gap before this, where the site emailed the sponsor the instant a student submitted, with no review step for Chad at all. Second pass, after Chad proposed the idea of routing proposals through a research team first: a team-review stage was added in front of the Chad gate, with per-member response tokens and a leader-only finalize action. Third pass, after live testing: the direct-to-Chad path was removed outright, at Chad's explicit request, once he saw that leaving it in place undermined the whole point of routing through a team.

**A public team directory was added to `propose.html`**, deliberately narrow — only teams with a documented, currently-active leader are shown, and only that leader's contact info is exposed (their CBU email, not a full roster). This was itself iterated once: an early version fell back to a solo-submission form if no team qualified, which stopped making sense once solo submission was removed entirely, and was replaced with a plain "email Chad directly" message instead.

**A real end-to-end test caught a genuine schema bug.** A live submission through `propose.html` failed with a generic "submission failed" error. Root cause, found via Postgres logs: a CHECK constraint on `lfg_experiments.approval_status`, left over from before this session's work, still only allowed `pending/approved/rejected` — the RLS policy had been updated to allow `'new'` and `'team_review'`, but the CHECK constraint, a separate gate, had not. Fixed, and the same test proposal (a real fungal strain bank research proposal Chad co-drafted for the Carbon Research Team) was resubmitted successfully — confirmed in the database down to all three team members' review tokens.

**That same real test then surfaced a second, external problem:** the Resend account was still using its shared sandbox sender address (`onboarding@resend.dev`), which can only deliver to the account owner's own inbox. Every notification this site had ever sent up to that point happened to be addressed to Chad, so this had never been caught. The moment a notification needed to reach someone else — Fabio, Liesel, Isabella — it silently failed. Diagnosed via Resend's own delivery logs (`net._http_response`), not guesswork. Chad began domain verification for `lancerfarms.com` at Resend, added the required DNS records at Namecheap (DKIM, MX, SPF, DMARC), and it was propagating, unresolved, at the end of the session — see section 11.

**A wrong Resend account was found and worked around mid-session.** Logging into Resend via a fresh GitHub OAuth grant landed in a different, empty account than the one already sending Chad's emails — the working account required logging in with `chad@getgrush.com` credentials specifically, reached through the "getgrush" workspace. Documented in section 3 so it isn't rediscovered the hard way again.

**This README was brought back into alignment with reality.** It had drifted significantly — not just from tonight's work, but from roughly thirty undocumented migrations between Aug 8 and Aug 20 covering assessments, donations, photo consent, the experiments module, and the six-tier rank system itself. Rather than fabricate a detailed history for a period not directly witnessed, that gap is flagged explicitly (see the note at the top of this document) with the migration names preserved and the narrative left for whoever has the context to fill in.

---

### August 8, 2026

*(unchanged from earlier copies of this file — see git history)*

### August 5, 2026

*(unchanged from earlier copies of this file — see git history)*

### August 4, 2026

*(unchanged from earlier copies of this file — see git history)*

---

*README updated August 21, 2026. Sections 4, 5, 6, 6b, 6d, 7, 9, 10, 11 and the
top of 12 were verified against the live repository and Supabase project
`gblizuknnvguxyxfequh` at time of writing. Sections 1, 2 (partially), 3
(partially), 6a, 6c, 8, and the Aug 4/5/8 entries in section 12 are carried
over from the Aug 8 2026 version of this document and were not independently
re-verified in this pass.*
