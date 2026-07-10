# lancerfarms-v2
lancer farms website rebuild to v2
# Lancer Farms & Gardens — v2

A full-stack farm operations platform for the community garden at California Baptist University, Riverside CA.  
Built on GitHub Pages + Supabase. No build step. No framework. Plain HTML, CSS, and JavaScript.

**Live URLs**
| Page | URL | Access |
|------|-----|--------|
| Guest / Gate | [index.html](https://pattengalec.github.io/lancerfarms-v2/) | Public |
| Staff Ops App | [app.html](https://pattengalec.github.io/lancerfarms-v2/app.html) | Staff login |
| Admin Panel | [admin.html](https://pattengalec.github.io/lancerfarms-v2/admin.html) | Admin password |
| Farm Manual | [manual.html](https://pattengalec.github.io/lancerfarms-v2/manual.html) | Public |
| Data Dashboard | [data.html](https://pattengalec.github.io/lancerfarms-v2/data.html) | Public, read-only |

---

## Repo Map

```
lancerfarms-v2/
│
├── index.html          # Public entry point
│                       # Crash Bandicoot-style splash → Guest/Staff gate
│                       # Guest experience: Farm info, Garden browse, Almanac, More
│                       # Staff → redirects to app.html
│
├── app.html            # Staff field operations PWA
│                       # Login: "Godisgood" + birthday MMDD + first name
│                       # Tabs: Today's Tasks, Growing Areas, Field Log, More
│                       # Task detail sheets with instructions
│                       # Area detail with bible quotes and event history
│                       # Almanac: live NWS weather + sun/moon calculator
│                       # Photo album + upload (Cloudinary)
│                       # Damage reports, supply requests
│
├── admin.html          # Admin-only management panel
│                       # Auth: password stored in lfg_config (Supabase)
│                       # Tabs: Dashboard, Tasks, Areas, Inventory,
│                         Reports, Requests, Field Log, Comments, Task Log
│                       # Task CRUD: add, edit, archive, mark complete
│                       # Sort order control for task sequence
│                       # Donations toggle (on/off + URL, no code deploy needed)
│                       # Area CRUD with blessings, manager, description
│                       # Inventory management with par levels and low-stock alerts
│
├── manual.html         # Farm reference manual
│                       # 7 topics: Soil & Amendments, Concrete & Hardscape,
│                         Irrigation, Pest & Disease, Planting & Crops,
│                         Tools & Equipment, Farm Records
│                       # Live calculators: soil volume, concrete bags,
│                         irrigation run time
│                       # Amendment reference cards (your on-hand products)
│                       # Dynamic entries from Supabase (lfg_manual_entries)
│                       # Admin can add entries without code changes
│
├── data.html           # CBU read-only data dashboard
│                       # No login required
│                       # Tabs: Overview (stats + recent activity),
│                         Beds (tappable grid + event history),
│                         Field Log (date range filter),
│                         Inventory (grouped, low-stock highlighted),
│                         Photos (grid + lightbox),
│                         Almanac (live weather + sun/moon)
│
├── lfg-ambient.js      # Ambient system (loaded by app.html and index.html)
│                       # Sound: tap, open, close, success, error, complete
│                       # Haptic: vibration patterns for all interactions
│                       # Creatures: 15 farm emoji floating at 3 depth tiers
│                       # Weather emojis: pulled from NWS cache, intensity-scaled
│                       # Public API: LFG.sound.*, LFG.haptic.*, LFG.ambient.*
│
├── lfg-theme.css       # Shared design system
│                       # Light/dark mode via [data-mode] on <html>
│                       # CSS variables: --bg, --surface, --card, --accent, etc.
│                       # Button styles, form fields, cards, toasts, lightbox
│
├── lfg-db.js           # Supabase client module (used by admin.html)
│                       # Note: app.html inlines DB functions directly
│                         (module scope breaks onclick handlers)
│
├── lfg-logo.png        # Farm logo (used as favicon and in headers)
├── lfg-wordmark.png    # Farm wordmark (used on staff login screen)
├── lfg-farm-map.kml    # Approximate bed polygons for Google My Maps
│                       # Positions need ground-truthing at farm
│
└── README.md           # This file
```

---

## Backend — Supabase

**Project:** `muecvqxsqnhkhjrabtxh` (Cottages Project, repurposed)  
**URL:** `https://gblizuknnvguxyxfequh.supabase.co`

### Tables (all prefixed `lfg_`)

| Table | Purpose |
|-------|---------|
| `lfg_config` | Key/value site config (admin password, visit days, donations toggle + URL) |
| `lfg_growing_areas` | All farm areas: beds, trees, orchard, grounds. Includes zone, manager, blessing, description |
| `lfg_area_events` | Plant/harvest/prune/observe events per area |
| `lfg_tasks` | Task definitions with recurrence, instructions, priority, sort_order |
| `lfg_task_completions` | Log of who completed each task and when |
| `lfg_log` | General field log entries |
| `lfg_photos` | Photo records (Cloudinary URLs + metadata) |
| `lfg_reports` | Damage/issue reports submitted by staff or admin |
| `lfg_requests` | Supply/repair requests from staff |
| `lfg_comments` | Guest messages to admin |
| `lfg_inventory` | Tools and supplies with quantity, par level, category |
| `lfg_visit_overrides` | Schedule swaps (replace Mon with Tue, etc.) |
| `lfg_manual_entries` | Dynamic content for the Farm Manual |

### Auth model
- **Staff:** Password = `Godisgood` + birthday MMDD (e.g. `Godisgood0315`). Verified client-side. Name entered on login for attribution.
- **Admin:** Password stored in `lfg_config` key `admin_password`. Set via Supabase Table Editor.
- **Guest/Data:** No auth. Public read via Supabase anon key with RLS.

---

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Supabase** | Database + API | Project `muecvqxsqnhkhjrabtxh` |
| **Cloudinary** | Photo storage | Cloud `ddbsuxerb`, preset `lfg-photos`, folder `lfg-guest-photos` for guest uploads |
| **NWS API** | Live weather | `api.weather.gov` — farm GPS `33.9281417, -117.4301472` |
| **Google Fonts** | Typography | IM Fell English, Source Sans 3, Courier Prime |
| **GitHub Pages** | Hosting | Repo `pattengalec/lancerfarms-v2`, branch `main` |

---

## Farm Geography (locked reference)

- **House GPS:** `33.9281417, -117.4301472`
- **Ridge bearing:** `146.14°`
- **USDA Zone:** 9b · Riverside, CA

| Zone | Beds | Dimensions | Depth |
|------|------|------------|-------|
| Zone 1 | 1A–1H (8 beds) | 1.55 × 0.86m | 18" |
| Zone 2 | 2A–2F (6 beds) | 3.08 × 1.53m | 24" |
| Zone 3 | 3A–3G (7 beds) | 3.18 × 1.29m | 24" |

Zone 1 is a single row of 8 along the NE wall, split by a shed gap between 1D and 1E.  
Zone 2 has 3 beds per side of the SW porch path.  
Zone 3 is a single row parallel to the NW wall.

---

## Staff Login

URL: `https://pattengalec.github.io/lancerfarms-v2/app.html`  
Password format: `Godisgood` + birthday as MMDD  
Example: `Godisgood0315` for March 15th

---

## Pending / Roadmap

- [ ] GIS map tab in app.html (needs farm visit to trace polygons with Google My Maps)
- [ ] Domain switch — point `lancerfarms.com` to v2 (do last, after full testing)
- [ ] Donations link — add URL in admin when CBU approves
- [ ] `index.html` guest map view when GIS data is ready
- [ ] Seed v1 Google Sheets data into Supabase
