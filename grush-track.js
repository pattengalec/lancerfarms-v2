/* ═══════════════════════════════════════════════════════════════════════
   grush-track.js — page-view counter, standalone.

   WHY THIS FILE EXISTS.
   The counter used to live inside grush-nav.js, which meant a page could
   only be counted if it also accepted a bottom rail and a drawer. So
   index.html, watch.html, bed.html, features.html and three others were
   invisible in the numbers — not unvisited, uninstrumented. The analytics
   could not answer "where do people enter the site?" because the front
   door was never wired.

   Splitting it out makes tracking one script tag, independent of
   navigation. A page can now be counted without inheriting UI it does
   not want.

   THIS IS GRUSH-SIDE. It writes to grush_page_views, a grush_* table.
   Delete this tag and the page keeps working; only the count stops.

   LOAD ORDER:
     1. lfg-config.js   (supplies URL, anon key, SITE)
     2. grush-track.js  (this file)
   No supabase-js needed — it is one plain fetch to a PostgREST RPC.

   DOUBLE-COUNT GUARD. grush-nav.js still carries its own copy of this
   logic, because funguyfungi.org and any other deployment may load the
   nav without this file. Both now check window.GRUSH_TRACKED, so a page
   carrying BOTH scripts counts exactly once, whichever runs first.

   SAFETY. grush_track_view() is the only write path into
   grush_page_views — there is no INSERT or UPDATE policy — so a tampered
   call cannot create arbitrary rows.

   Every failure here is swallowed on purpose. A counter must never be
   able to break a page.
   ═══════════════════════════════════════════════════════════════════════ */
(function trackView() {
  'use strict';

  if (window.GRUSH_TRACKED) return;            /* nav already counted it */

  var C = window.LFG_CONFIG || window.FGF_CONFIG || window.GRUSH_CONFIG;
  if (!C || !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !C.SITE) {
    console.warn('[grush-track] config missing — load lfg-config.js first');
    return;
  }

  /* Crew tooling is excluded: those are work sessions, not visits, and
     counting them would drown the visitor signal we actually want. */
  if (/\/(admin|triage|app)\.html$/i.test(location.pathname)) return;

  window.GRUSH_TRACKED = true;

  try {
    fetch(C.SUPABASE_URL + '/rest/v1/rpc/grush_track_view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': C.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + C.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        p_site: C.SITE,
        p_path: location.pathname + location.search
      })
    }).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (n) {
      if (n !== null && n !== undefined) window.GRUSH_PAGE_VIEWS = n;
    }).catch(function () { /* offline or blocked; not critical */ });
  } catch (e) { /* no fetch; not critical */ }
})();
