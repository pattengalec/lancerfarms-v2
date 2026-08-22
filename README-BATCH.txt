LANCER FARMS — BATCH FIX (Aug 22 2026)
13 files, ready to upload as-is over the existing repo root.

WHAT'S IN HERE
1. desk.html — fixes the broken "Assign labs to students" / "Team
   management" / "Adopt a growing area" / "Garden use policy" links.
   These were soon:true placeholders that got a real (but empty) href
   set on them, so tapping any of them tried to load a page that
   never existed → 404. They now render as inert, dimmed rows
   labeled "— Soon" instead of dead links.

2. The other 12 files — donate, irrigation-bom, watch, about-grush,
   features, fund-the-farm, bed, experiments, help, faculty, store,
   mixbench — had a leftover <script src="i18n.js?v=2"> tag (plus a
   stale comment in 6 of them) left over from the Spanish-translation
   removal. Both are stripped. i18n.js itself was already deleted
   from the repo separately — this just removes the last references
   to it.

HOW TO COMMIT THIS
GitHub's upload page does NOT unzip a .zip for you — you have to hand
it the individual files, not the archive.

On iPhone:
1. Tap the .zip Claude gave you to download it (Files app, Downloads).
2. In the Files app, tap and hold the .zip → "Uncompress" — this
   creates a folder with all 13 files loose inside it.
3. Go to https://github.com/pattengalec/lancerfarms-v2 in Safari
   (or Chrome, doesn't matter for this step) → tap "Add file" →
   "Upload files".
4. Tap "choose your files", pick the Files app, select all 13 files
   from the uncompressed folder (tap Select, tap each one, or "Select
   All"), and confirm.
5. Scroll down, write a commit message (e.g. "fix soon-item dead
   links + strip leftover i18n.js references"), commit directly to
   main.
6. Wait ~30–60 sec for GitHub Pages to rebuild, then reload
   lancerfarms.com/desk.html and confirm the Instructor/Faculty
   placeholder rows no longer link anywhere.

This uploads all 13 as ONE commit since you select them together in
step 4 — that's the "batch" part.
