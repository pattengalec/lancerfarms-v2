/* ═══════════════════════════════════════════════════════════════
   lfg-config.js — Lancer Farms & Gardens service configuration
   ───────────────────────────────────────────────────────────────
   Every page reads its backend settings from here. Nothing else in
   the site should contain a URL, key, cloud name, or preset.

   HANDOVER NOTE
   To move this site to a different owner's infrastructure, change
   the four values below and nothing else. The farm's data lives in
   the lfg_* tables; the grush_* tables belong to the Grush platform
   and are not part of this site.
   ═══════════════════════════════════════════════════════════════ */
window.LFG_CONFIG = {

  /* Supabase — farm database (lfg_* tables) */
  SUPABASE_URL:      'https://gblizuknnvguxyxfequh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGl6dWtubnZndXh5eGZlcXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzE5NjIsImV4cCI6MjA5OTIwNzk2Mn0.9m3e5T4S1kL9wusD0ZJBgIkshGt_Ws55iEcBE8bbLiE',

  /* Cloudinary — photo storage. Separate account from Supabase. */
  CLOUDINARY_CLOUD:  'ddbsuxerb',
  CLOUDINARY_PRESET: 'lfg-photos',

  /* Esri — satellite basemap tiles for garden-map.html. Public
     application key, restricted to lancerfarms.com by referrer URL in
     the ArcGIS Location Platform dashboard — same trust level as the
     Supabase anon key above: fine to be visible in client JS, the real
     boundary is the referrer restriction. Expires ~Aug 2027; renew at
     location.arcgis.com before then or the map's imagery stops loading. */
  ARCGIS_API_KEY: 'AAPTaXzVyAHa1WIpSa3NczouZdA..XO-TV83A4dq7DtWEtbKjqePxOi75ieOUj6w1iqUIcEnmGeQxHSaZ5_HWvW3OmSat825wT-doFAN6NAZ654gGQkLk0EvXhhkYAgzhvfgARL6NqZ_TsudpOdXi2Q39YHNVqbISHAAV_tWYPjajlNVyGblXmItKbAjrDlJB-UeINsuNj8nWvMYKAMFmga4txCAn3AcI1Tfn66EZ3L1Hg8FzoCn5z_xUX2-ln2uwXZmpiKrgBTkSdY0as085lT0.AT1_OLw1PiWl',

  /* Identifies this farm to shared Grush components. */
  SITE: 'lfg'
};
