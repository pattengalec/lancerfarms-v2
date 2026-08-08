/* ============================================================
   grush-auth.js — one identity module for every Grush site.

   LOAD ORDER MATTERS. On every page, in this order:
     1. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
     2. lfg-config.js        (supplies URL + anon key)
     3. grush-auth.js        (this file)

   Two tiers, deliberately separate:
     CREW      tap a name. no password. identifies, never authorizes.
     OPERATOR  magic link + allowlist. authorizes approve/delete/config.

   Replaces: Godisgood+MMDD, lfg_config.admin_password, the admin PIN
   in app.html, the dead verifyStaffPassword(), and the hardcoded
   'staff' attribution string.

   Client-side checks here are for SHOWING AND HIDING UI ONLY.
   Row-level security in Postgres is what actually enforces anything.
   ============================================================ */

const GRUSH = (() => {

  /* ---------- configuration ---------- */
  // lfg-config.js sets window.LFG_CONFIG. A Fun Guy Fungi page can set
  // window.GRUSH_CONFIG with the same shape instead. Nothing is hardcoded
  // here, so moving to different infrastructure means editing the config
  // file and nothing else.
  const CFG  = window.LFG_CONFIG || window.GRUSH_CONFIG || {};
  const URL_ = CFG.SUPABASE_URL;
  const ANON = CFG.SUPABASE_ANON_KEY;

  // <html data-grush-site="fgf"> overrides; otherwise the config's SITE.
  const SITE = document.documentElement.dataset.grushSite || CFG.SITE || 'lfg';

  if (!window.supabase || !window.supabase.createClient)
    console.error('[grush] supabase-js must load BEFORE grush-auth.js');
  if (!URL_ || !ANON)
    console.error('[grush] lfg-config.js must load BEFORE grush-auth.js');

  /* BORROW the farm's client if lfg-db.js already made one.

     This module used to be the only place a Supabase client got created,
     so every public page imported the whole identity layer just to reach
     GRUSH.sb — and broke whenever the Grush layer was removed. lfg-db.js
     now owns the connection; this file is a guest on it.

     Creating a second client would be worse than redundant. supabase-js
     stores its session in localStorage, so two GoTrue instances race over
     the same keys, log "Multiple GoTrueClient instances detected", and
     can drop a session on refresh. One client per page. */
  const sb = (window.LFG && window.LFG.sb)
           || window.supabase.createClient(URL_, ANON);

  /* ---------- CREW: attribution, no credentials ---------- */

  const CREW_KEY = `grush_${SITE}_who`;

  async function crew() {
    const { data, error } = await sb.from('grush_people')
      .select('id,display_name')
      .eq('site', SITE).eq('active', true)
      .order('sort_order').order('display_name');
    if (error) { console.error('[grush] crew load failed', error); return []; }
    return data;
  }

  // Returns {id, display_name} or null. Survives reload; cleared by signOutCrew().
  function who() {
    try { return JSON.parse(localStorage.getItem(CREW_KEY)); } catch { return null; }
  }
  function setWho(person) { localStorage.setItem(CREW_KEY, JSON.stringify(person)); }
  function signOutCrew() { localStorage.removeItem(CREW_KEY); }

  // Stamp every write. Replaces  completed_by:'staff'  etc.
  // Usage:  sb.from('lfg_log').insert(GRUSH.stamp({ note }))
  function stamp(row, opts = {}) {
    const p = who();
    const name = p?.display_name || 'Unattributed';
    const out = { ...row };
    for (const f of (opts.fields || ['logged_by', 'submitted_by'])) out[f] = name;
    if (opts.actorId !== false && p?.id) out.actor_id = p.id;
    return out;
  }

  /* ---------- OPERATOR: magic link + allowlist ---------- */

  // Sending a link is NOT granting access. The allowlist decides; see is_operator().
  async function sendLink(email) {
    const { error } = await sb.auth.signInWithOtp({
      email: String(email || '').trim().toLowerCase(),
      options: { emailRedirectTo: window.location.href, shouldCreateUser: true }
    });
    if (error) {
      // Built-in SMTP is rate-limited and best-effort — surface it honestly.
      if (/rate|limit|429/i.test(error.message))
        return { ok: false, msg: 'Too many emails just now — wait a few minutes, or set up custom SMTP.' };
      return { ok: false, msg: error.message };
    }
    return { ok: true, msg: 'Check your email for a sign-in link.' };
  }

  async function session() {
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  // The real gate. A valid session proves an inbox, nothing more.
  // is_operator() is SECURITY DEFINER: it reads the allowlist without
  // exposing it, and returns false for any signed-in stranger.
  async function isOperator() {
    if (!(await session())) return false;
    const { data, error } = await sb.rpc('is_operator');
    if (error) { console.error('[grush] is_operator failed', error); return false; }
    return data === true;
  }

  async function signOut() { await sb.auth.signOut(); }

  /* Gate a privileged view. Returns true if the UI may render.
     Note this is convenience only — RLS is what actually enforces.
     Never treat a client-side check as the boundary again. */
  async function requireOperator({ onDenied } = {}) {
    if (await isOperator()) return true;
    if (await session()) {
      await signOut();
      onDenied?.('That address is signed in but is not an operator on this farm.');
    } else {
      onDenied?.(null);
    }
    return false;
  }

  /* ---------- REST helpers for pages that don't use supabase-js ----------

     admin.html talks to PostgREST with plain fetch(). Those requests must
     carry the signed-in user's JWT, not the anon key, or RLS sees an
     anonymous visitor and refuses every operator-only write.

       apikey         always the anon key — that's the API gateway ticket.
       Authorization  the session token when signed in, anon key otherwise.

     Both headers are required. Sending only one gets a 401.
  --------------------------------------------------------------------- */

  // Current bearer token: the user's if signed in, else the anon key.
  async function token() {
    const s = await session();
    return s?.access_token || ANON;
  }

  // Await this immediately before a fetch so the token is never stale.
  async function headers(extra) {
    return {
      apikey: ANON,
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json',
      ...(extra || {})
    };
  }

  // Thin fetch wrapper. path is everything after /rest/v1/ —
  //   GRUSH.rest('lfg_photos?approval_status=eq.pending')
  //   GRUSH.rest('lfg_photos?id=eq.' + id, { method:'PATCH', body:{...} })
  async function rest(path, opts = {}) {
    const { body, headers: extra, ...init } = opts;
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      ...init,
      headers: await headers(extra),
      body: body === undefined ? undefined
           : (typeof body === 'string' ? body : JSON.stringify(body))
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${detail}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* ---------- events ---------- */

  // Fires on sign-in, sign-out, and silent token refresh. Pages that cache
  // headers should re-sync here.
  sb.auth.onAuthStateChange((evt) => {
    document.dispatchEvent(new CustomEvent('grush:auth', { detail: evt }));
  });

  return { sb, SITE, URL: URL_, ANON,
           crew, who, setWho, signOutCrew, stamp,
           sendLink, session, isOperator, requireOperator, signOut,
           token, headers, rest };
})();
