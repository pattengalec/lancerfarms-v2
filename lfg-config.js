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

  /* Identifies this farm to shared Grush components. */
  SITE: 'lfg'
};
