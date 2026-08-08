/* ═══════════════════════════════════════════════════════════════════════
   lfg-db.js — the farm's database client. Farm-owned, Grush-free.

   WHY THIS FILE EXISTS.
   Public pages needed one thing from grush-auth.js: a Supabase client.
   Not identity, not the operator allowlist, not magic links — a client.
   But `GRUSH.sb` was the only place one got created, so index, learn, do,
   see, share and bed all imported the whole identity module to reach it.
   That made six visitor pages break the moment the Grush layer was
   removed, for a dependency none of them actually had.

   This file creates the client. grush-auth.js now BORROWS it. The farm
   owns its own database connection, which is what the handover note in
   lfg-config.js promised all along.

   LOAD ORDER:
     1. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
     2. lfg-config.js     (supplies URL + anon key)
     3. lfg-db.js         (this file)
     ...then grush-auth.js, ONLY on pages that need identity.

   ONE CLIENT PER PAGE, DELIBERATELY.
   supabase-js keeps its auth session in localStorage. Two clients on one
   page means two GoTrue instances racing over the same keys — it logs
   "Multiple GoTrueClient instances detected" and can drop a session on
   refresh. grush-auth.js checks for window.LFG.sb before creating its
   own, so loading both files yields exactly one client.

   USE:
     const sb = LFG.sb;
     const { data } = await sb.from('lfg_growing_areas').select('*');

   Anonymous reads only. Row-level security decides what comes back.
   ═══════════════════════════════════════════════════════════════════════ */
window.LFG = (function () {
  'use strict';

  var CFG = window.LFG_CONFIG || window.GRUSH_CONFIG || {};

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[lfg-db] supabase-js must load BEFORE lfg-db.js');
    return { sb: null, SITE: CFG.SITE || 'lfg' };
  }
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    console.error('[lfg-db] lfg-config.js must load BEFORE lfg-db.js');
    return { sb: null, SITE: CFG.SITE || 'lfg' };
  }

  return {
    sb:   window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY),
    SITE: document.documentElement.dataset.grushSite || CFG.SITE || 'lfg',
    URL:  CFG.SUPABASE_URL,
    ANON: CFG.SUPABASE_ANON_KEY
  };
})();
