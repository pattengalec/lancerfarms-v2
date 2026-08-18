/* ═══════════════════════════════════════════════════════════════════════
   grush-nav.js — shared navigation: bottom rail + left drawer
   ───────────────────────────────────────────────────────────────────────
   Renders one rail and one drawer on every page that includes it, so
   navigation lives in ONE file instead of being copy-pasted per page.

   USAGE — declare a config before loading this script:

     <script>
     window.GRUSH_NAV = {
       rail: [ {label:'Home', icon:'\u{1F3E0}', href:'/index.html'} ],
       groups: [
         { label:'This page', items:[
             {label:'Overview', icon:'\u25A6', onclick:"switchTab('overview')"} ]},
         { label:'Explore', items:[
             {label:'Almanac', icon:'\u{1F326}', href:'/almanac.html'} ]}
       ],
       staff: { label:'Staff', items:[
             {label:'Staff tool', icon:'\u{1F9F0}', href:'/app.html'} ]}
     };
     <\/script>
     <script src="grush-nav.js?v=1"><\/script>

   Item keys:  label (required), icon, href, onclick (string), run (function)

   ── DESIGN RULES, deliberate. Please keep them. ──────────────────────
   1. GLOVE TARGETS. This site is used outdoors in work gloves. A gloved
      fingertip has a wider contact patch and no tactile feedback, so the
      bare-finger 44px floor is not enough. Rail cells are 60px tall,
      drawer rows 68px, the close button 60x60. Spacing matters as much
      as size: the failure mode is hitting the neighbour, not missing.
   2. NO OVERLAPPING HIT FIELDS. An enlarged tap area must never cover
      another interactive element. Everything here is sized honestly —
      no invisible padding is layered over anything clickable.
   3. NO EDGE-SWIPE TO OPEN. Swipe gestures need precision gloves remove.
      The burger is the only opener.
   4. THE RAIL AND DRAWER ARE PLATES. They stay dark in light mode, like
      the title bar. Only the page ground flips.
   5. STAFF ITEMS ARE A CONVENIENCE, NOT A BOUNDARY. Hiding a link is
      not security. The real boundary is Supabase row-level security.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.GRUSH_NAV || {};
  /* Guard against a double include. It used to look for #grush-rail,
     which is no longer built — so the guard silently stopped guarding. */
  if (document.getElementById('grush-header')) return;   // already mounted

  /* ── styles ─────────────────────────────────────────────────────── */
  var css = `
  :root{
    --nav-bg:#1E1B16; --nav-cell:#34302A; --nav-line:#45423A;
    --nav-ink:#F0EDE2; --nav-soft:#B0A99C; --nav-accent:#D4A44E;
    --nav-active:#3E5C42; --nav-active-line:#7E9A6E;
  }

  /* ── bottom rail ── */
  #grush-rail{
    position:fixed; left:0; right:0; bottom:0; z-index:900;
    display:flex; gap:14px; align-items:stretch;
    padding:9px 10px calc(9px + env(safe-area-inset-bottom));
    background:var(--nav-bg); border-top:1.5px solid var(--nav-line);
  }
  #grush-rail button, #grush-rail a{
    flex:1; min-height:60px; display:flex; align-items:center;
    justify-content:center; gap:9px;
    background:var(--nav-cell); border:1.5px solid var(--nav-line);
    border-radius:12px; color:var(--nav-ink); text-decoration:none;
    font:600 1rem/1 inherit; font-family:inherit; cursor:pointer;
    padding:0 10px; -webkit-tap-highlight-color:transparent;
  }
  #grush-rail button:active, #grush-rail a:active{
    background:var(--nav-active); border-color:var(--nav-active-line);
  }
  /* the burger keeps a fixed width so labels never squeeze it */
  /* Selector must outrank '#grush-rail button' (id+element), so it is
     scoped rather than relying on the bare id. */
  #grush-rail #grush-burger{ flex:0 0 76px; background:var(--nav-accent);
    border-color:var(--nav-accent); padding:0; }
  #grush-rail #grush-burger:active{ filter:brightness(.9); background:var(--nav-accent); }
  /* 26px, not 40. The sandwich was an illustration and needed the room;
     three strokes at that size read as a fence. The BUTTON keeps its 76px
     width — the target does not shrink with the glyph. */
  #grush-rail #grush-burger svg{ width:26px; height:26px; display:block; }

  /* Rail-less mode: the burger is hosted by the page's own header.
     app.html already owns the bottom of the screen with .actionbar, its
     bottom sheets and a splash overlay, so a rail there would collide
     with all three. Sized as a glove-friendly 44px target. */
  /* Pinned bottom-left when the page has no header to host it. Matches
     the rail burger's corner so the control never moves between pages. */
  .grush-burger-float{
    position:fixed; left:14px; bottom:calc(14px + env(safe-area-inset-bottom));
    z-index:998; width:56px; height:56px; border-radius:16px;
    background:var(--nav-accent, #2E3A2A); color:var(--nav-ink, #F0EDE2);
    box-shadow:0 4px 16px rgba(0,0,0,.34);
  }
  .grush-burger-float svg{ width:26px; height:26px; }
  .grush-burger-hosted{
    flex:0 0 auto; width:44px; height:44px; padding:0; border:0;
    display:flex; align-items:center; justify-content:center;
    background:transparent; color:var(--bar-ink, var(--nav-ink, #F0EDE2));
    border-radius:12px; cursor:pointer; -webkit-tap-highlight-color:transparent;
  }
  .grush-burger-hosted:active{ background:rgba(255,255,255,.10); }
  .grush-burger-hosted svg{ width:30px; height:30px; display:block; }

  /* ── scrim ── */
  #grush-scrim{
    position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.55);
    opacity:0; pointer-events:none; transition:opacity .22s ease;
  }
  #grush-scrim.on{ opacity:1; pointer-events:auto; }

  /* ── drawer ── */
  #grush-drawer{
    position:fixed; top:0; left:0; bottom:0; z-index:1010;
    width:300px; max-width:86%; overflow-y:auto; overscroll-behavior:contain;
    background:var(--nav-bg); border-right:1.5px solid var(--nav-line);
    transform:translateX(-100%); transition:transform .24s ease;
    padding-bottom:calc(20px + env(safe-area-inset-bottom));
    -webkit-overflow-scrolling:touch;
  }
  #grush-drawer.on{ transform:translateX(0); }
  .grush-dhead{
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 10px 12px 18px; border-bottom:1px solid var(--nav-line);
    box-shadow:inset 0 -4px 0 -3px var(--nav-accent);
  }
  .grush-dhead h2{
    margin:0; font-size:1.15rem; font-weight:700; color:var(--nav-ink);
    font-family:var(--font-display, Georgia, serif); letter-spacing:-.01em;
  }
  .grush-close{
    width:60px; height:60px; flex:none; border:0; background:transparent;
    color:var(--nav-soft); font-size:2rem; line-height:1; cursor:pointer;
    border-radius:12px; -webkit-tap-highlight-color:transparent;
  }
  .grush-close:active{ background:var(--nav-cell); }
  .grush-group{
    padding:16px 18px 6px; font-size:.68rem; font-weight:700;
    letter-spacing:.16em; text-transform:uppercase; color:var(--tier-color, var(--nav-accent));
    font-family:var(--font-mono, ui-monospace, monospace);
  }
  .grush-item{
    display:flex; align-items:center; gap:14px; width:calc(100% - 20px);
    margin:0 10px 8px; min-height:68px; padding:0 14px;
    background:var(--nav-cell); border:1.5px solid var(--nav-line);
    border-left:3px solid var(--tier-color, var(--nav-line));
    border-radius:12px; color:var(--nav-ink); text-decoration:none;
    font:600 1.02rem/1.25 inherit; font-family:inherit; text-align:left;
    cursor:pointer; -webkit-tap-highlight-color:transparent;
  }
/* A locked tier is shown, dimmed, and inert. Hiding it would mean a
   visitor page and a staff page had different drawers, which is the thing
   this file exists to stop. */
.grush-locked{opacity:.42;filter:grayscale(.6);cursor:not-allowed;}
.grush-locked-group{opacity:.55;}
/* The footer sits below every tier, separated and quieter. */
.grush-foot{margin-top:18px;padding-top:14px;border-top:1px solid rgba(128,128,128,.28);opacity:.72;}
/* Emergency: the one colour used nowhere else on the site. */
.grush-tier-emergency{background:#D6342B !important;color:#fff !important;
  border-color:#D6342B !important;font-weight:700;margin-bottom:14px;}
  .grush-item:active{ background:var(--nav-active); border-color:var(--nav-active-line); }
  .grush-item .ic{ font-size:1.4rem; flex:none; width:28px; text-align:center; }
  .grush-item[aria-current="page"]{ border-color:var(--nav-accent); }

  #grush-rail button:focus-visible, #grush-rail a:focus-visible,
  .grush-item:focus-visible, .grush-close:focus-visible{
    outline:3px solid var(--nav-accent); outline-offset:2px;
  }
  @media (prefers-reduced-motion:reduce){
    #grush-drawer, #grush-scrim{ transition:none; }
  }`;

  css += `
  /* ══ SHARED HEADER ══════════════════════════════════════════════════
     Modelled on the .sitebar four pages already carried — logo, eyebrow,
     title — because it was the best header on the site and the other
     fourteen pages had none. Rendered here so there is one definition
     rather than five lookalikes drifting apart.

     The burger sits on the LEFT, with Back and Home — same corner the
     drawer itself opens from. It briefly lived on the right, one corner
     for every page after years of it drifting between bottom-left in a
     rail, bottom-left floating, and top-left in a header depending on
     the page — but a control on the opposite side from the thing it
     opens read as a mistake even with that consistency. Left, grouped
     with the other navigation controls, is where it stays. */
  #grush-header{
    position:sticky; top:0; z-index:40; display:flex; align-items:center; gap:11px;
    padding:9px 12px; background:var(--nav-bar, #221E19);
    border-bottom:1px solid var(--nav-line, #45423A);
    box-shadow:inset 0 -4px 0 -3px var(--nav-accent, #7E9A6E);
  }
  #grush-header img{ width:34px; height:34px; border-radius:9px; flex:0 0 auto; display:block; }
  #grush-header .gh-home{ flex:0 0 auto; display:block; -webkit-tap-highlight-color:transparent; }
  #grush-header .gh-back{
    flex:0 0 auto; width:40px; height:40px; margin:0; padding:0; border:none;
    background:transparent; color:var(--nav-ink, #F0EDE2); cursor:pointer;
    display:flex; align-items:center; justify-content:center; border-radius:9px;
    -webkit-tap-highlight-color:transparent;
  }
  #grush-header .gh-back:active{ background:rgba(255,255,255,.08); }
  #grush-header .gh-back svg{ width:22px; height:22px; display:block; }
  #grush-header .gh-wrap{ min-width:0; flex:1; }
  #grush-header .gh-eb{
    font-family:ui-monospace,monospace; font-size:.58rem; font-weight:700;
    letter-spacing:.12em; text-transform:uppercase; color:var(--nav-accent, #7E9A6E);
    margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  #grush-header .gh-ttl{
    font-family:'Fraunces',Georgia,serif; font-size:1.02rem; font-weight:600;
    line-height:1.15; color:var(--nav-ink, #F0EDE2);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  /* 48px: the glove floor. The glyph is 26px; the target is not. */
  #grush-header .grush-burger-hosted{ width:48px; height:48px; }

  /* A page that carried its own header keeps the markup and loses the
     display, rather than being edited in eighteen places. */
  .grush-has-header .sitebar, .grush-has-header .topbar{ display:none !important; }

  /* ══ SHARED FOOTER ═════════════════════════════════════════════════ */
  #grush-footer{
    margin-top:34px; padding:15px 14px calc(15px + env(safe-area-inset-bottom));
    border-top:1px solid var(--nav-line, #45423A);
    display:flex; justify-content:space-between; align-items:center; gap:12px;
    font-size:.74rem; color:var(--nav-dim, #B0A99C);
  }
  #grush-footer a{ color:inherit; text-decoration:none; }
  #grush-footer a:hover{ text-decoration:underline; }
  #grush-footer .gf-mark{ opacity:.8; }
`;

  var st = document.createElement('style');
  st.id = 'grush-nav-style';
  st.textContent = css;
  document.head.appendChild(st);

  /* ── the burger. Four bands: bun, lettuce, patty, bun — so it still
        reads as a stacked menu icon at a glance. ── */
  var BURGER =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path d="M5 21C5 12.7 13.5 6.5 24 6.5S43 12.7 43 21c0 1.2-.9 2-2.1 2H7.1C5.9 23 5 22.2 5 21Z" fill="#E8B45C"/>' +
    '<circle cx="17" cy="14" r="1.7" fill="#FBF6E8"/><circle cx="26" cy="11.5" r="1.7" fill="#FBF6E8"/>' +
    '<circle cx="33.5" cy="15.5" r="1.7" fill="#FBF6E8"/>' +
    '<path d="M6.5 24.2h35c1 0 1.6 1.1 1 1.9-1.4 1.8-3.3 2.2-5.2 1.4-1.8-.8-3.6-.5-4.8.8-1.3 1.3-3.2 1.3-4.5 0-1.3-1.3-3.2-1.3-4.5 0-1.3 1.3-3.2 1.3-4.5 0-1.2-1.3-3-1.6-4.8-.8-1.9.8-3.8.4-5.2-1.4-.6-.8 0-1.9 1-1.9Z" fill="#9DB38C"/>' +
    '<rect x="5.5" y="28.6" width="37" height="7.2" rx="3.6" fill="#7A4A2B"/>' +
    '<path d="M7.2 37.2h33.6c1.2 0 2.2.9 2.2 2.1 0 2.4-2.1 4.2-4.7 4.2H9.7C7.1 43.5 5 41.7 5 39.3c0-1.2 1-2.1 2.2-2.1Z" fill="#D89B45"/>' +
    '</svg>';

  /* Hosted mode gets a plain three-line glyph in currentColor.
     The sandwich above is a deliberate joke and it lands on the rail,
     where it sits on a 76px amber tile at 40px. Dropped to 30px inside a
     dark sitebar next to a serif wordmark it stops reading as a joke and
     starts reading as clip art. Same reason a logo does not shrink well.

     Override per page with GRUSH_NAV.burgerIcon:
       'lines'    force the glyph
       'sandwich' force the illustration
       '<svg…>'   any raw markup you like                                */
  var LINES =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<path d="M3.5 7h17"/><path d="M3.5 12h17"/><path d="M3.5 17h17"/>' +
    '</svg>';

  var here = location.pathname.split('/').pop() || 'index.html';

  function makeItem(it, cls) {
    var el = document.createElement(it.href ? 'a' : 'button');
    el.className = cls;
    if (it.href) {
      el.href = it.href;
      if (it.href.split('/').pop() === here) el.setAttribute('aria-current', 'page');
    } else {
      el.type = 'button';
    }
    el.innerHTML = (it.icon ? '<span class="ic">' + it.icon + '</span>' : '') +
                   '<span>' + it.label + '</span>';
    if (it.run)     el.addEventListener('click', function (e) { it.run(e); close(); });
    if (it.onclick) el.addEventListener('click', function () {
      try { (new Function(it.onclick))(); } catch (err) { console.error('nav item:', err); }
      close();
    });
    if (it.href) el.addEventListener('click', close);
    return el;
  }

  /* ── rail ──
     GRUSH_NAV.rail === false opts out of the bottom rail entirely. The
     drawer still works; only the burger moves. Use it on any page that
     already owns the bottom of the screen — a fixed action bar, bottom
     sheets, a full-screen splash. Set GRUSH_NAV.burgerHost to a selector
     for where the burger should live; it defaults to the sitebar. */

  var burger = document.createElement('button');
  burger.id = 'grush-burger';
  burger.type = 'button';
  burger.setAttribute('aria-label', 'Open menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'grush-drawer');
  burger.innerHTML = BURGER;

  /* No rail is built any more. CFG.rail is still read by nothing, and the
     one or two shortcuts it carried — Desk, Farm — are in the drawer,
     which is now the same drawer on every page. */
  burger.className = 'grush-burger-hosted';

  /* Three lines by default, everywhere.

     The illustrated sandwich — bun, seeds, lettuce, patty — was a joke on
     the word, and it was charming in the rail. But it is the only control
     on the site drawn in a different visual language from everything
     around it, and the drawer behind it is now the SAME drawer on every
     page. A shared control that changes appearance by page undoes the
     point of sharing it.

     BURGER is kept, not deleted: a page can still ask for it with
     burgerIcon:'sandwich', and the getgrush showcase may want it. */
  var icon = CFG.burgerIcon;
  if (icon === 'sandwich') burger.innerHTML = BURGER;
  else if (typeof icon === 'string' && icon.indexOf('<') === 0) burger.innerHTML = icon;
  else burger.innerHTML = LINES;

  /* ── scrim + drawer ── */
  var scrim = document.createElement('div');
  scrim.id = 'grush-scrim';

  var drawer = document.createElement('aside');
  drawer.id = 'grush-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Menu');
  drawer.hidden = false;

  var head = document.createElement('div');
  head.className = 'grush-dhead';
  head.innerHTML = '<h2>' + (CFG.title || 'Menu') + '</h2>';
  var closeBtn = document.createElement('button');
  closeBtn.className = 'grush-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close menu');
  closeBtn.innerHTML = '&times;';
  head.appendChild(closeBtn);
  drawer.appendChild(head);

  /* g.top === true places the group ABOVE everything already in the
     drawer instead of after it.

     This exists for the staff group. It mounts asynchronously — after
     isOperator() resolves — so it can only ever be appended, which put
     the approvals queue at the very bottom of the drawer. That is the one
     item meaning a person is waiting.

     Built into a fragment first and inserted once, so a group with a
     label and five items does not walk backwards through five separate
     insertBefore calls and end up reversed. */
  function addGroup(g) {
    if (!g || !g.items || !g.items.length) return;

    var target = g.top ? document.createDocumentFragment() : drawer;
    if (g.label) {
      var lb = document.createElement('div');
      lb.className = 'grush-group';
      lb.textContent = g.label;
      target.appendChild(lb);
    }
    g.items.forEach(function (it) { target.appendChild(makeItem(it, 'grush-item')); });

    if (g.top) drawer.insertBefore(target, drawer.firstChild);
  }

  /* ── the shared menu ──────────────────────────────────────────────────
     If grush-menu.js is present it IS the menu, and any per-page groups
     are ignored. That is the whole point: eleven pages each carried a
     hand-written list and six of them had drifted apart, so a page's own
     opinion about the menu is exactly what had to stop mattering.

     CFG.groups still works when grush-menu.js is absent, so a page that
     has not been converted keeps its old drawer rather than losing
     navigation entirely. */
  var MENU = window.GRUSH_MENU;

  function addMenuTier(t) {
    if (!t || !t.items || !t.items.length) return;
    var locked = MENU.locked(t);

    /* t.color has existed on tier definitions since grush-desk-staff.js
       was written, but nothing ever read it — the drawer rendered every
       tier in the same plain ink regardless. Setting it as a custom
       property on the label and each item, rather than hardcoding a
       color, means this still respects whatever grush-settings.js's
       hue/tone/chroma trims are doing to --tier-staff/--tier-visitor
       at the time, instead of freezing a color that could drift out of
       sync with the rest of the page. */
    var tierColor = t.color || 'var(--tier-visitor)';

    if (t.label) {
      var lb = document.createElement('div');
      lb.className = 'grush-group' + (locked ? ' grush-locked-group' : '');
      lb.style.setProperty('--tier-color', tierColor);
      lb.textContent = t.label + (locked ? '  \u{1F512}' : '');
      drawer.appendChild(lb);
    }
    t.items.forEach(function (it) {
      var el = makeItem(it, 'grush-item' + (t.id ? ' grush-tier-' + t.id : ''));
      if (t.id !== 'emergency') el.style.setProperty('--tier-color', tierColor);
      if (locked) {
        /* Shown, not hidden. Seeing a locked door is how you learn the
           building exists — and it is the same drawer on every page, so
           a visitor page shows exactly what a staff page shows. */
        el.classList.add('grush-locked');
        el.setAttribute('aria-disabled', 'true');
        el.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
        }, true);
      }
      drawer.appendChild(el);
    });
  }

  function buildMenu() {
    MENU.tiers.forEach(addMenuTier);
    (MENU.footer || []).forEach(function (it) {
      var el = makeItem(it, 'grush-item grush-foot');
      drawer.appendChild(el);
    });
  }

  if (MENU) buildMenu();
  else (CFG.groups || []).forEach(addGroup);

  /* Staff group is appended only if grush-auth reports an operator.
     If grush-auth is absent — which is what happens once the Grush
     side is extracted — nothing is added and the page is unaffected. */
  /* Re-render once the role is known. isOperator() is asynchronous, so the
     first paint is always as a visitor; without this a signed-in operator
     would see their own tiers locked until they reloaded. */
  function refreshMenuRole() {
    if (!MENU) return;
    /* grush-auth declares `const GRUSH`, a lexical binding that never
       appears on window. Read the bare name inside a try. */
    var G; try { G = GRUSH; } catch (e) { return; }
    if (!G || !G.sb) return;

    /* It exports no role(); the role comes from the grush_role() RPC,
       which reads the operator allowlist without exposing it and returns
       'visitor' for any signed-in stranger. */
    G.session().then(function (sess) {
      if (!sess) return;
      return G.sb.rpc('grush_role').then(function (r) {
        var role = (!r.error && r.data) ? r.data : 'visitor';
        if (role === MENU.role) return;
        MENU.role = role;
        rebuildDrawer();
      });
    }).catch(function () { /* not signed in; the drawer stays as a visitor's */ });
  }

  function rebuildDrawer() {
    /* Everything after the header. Rebuilding rather than toggling classes
       because a tier can appear or disappear, not merely unlock. */
    while (drawer.children.length > 1) drawer.removeChild(drawer.lastChild);
    buildMenu();
  }

  var staffMounted = false;
  function syncStaff() {
    if (MENU) { refreshMenuRole(); return; }
    if (staffMounted || !CFG.staff) return;
    /* grush-auth.js declares `const GRUSH` — a global lexical binding that
       never appears on window. Read the bare name, guarded. */
    var G; try { G = GRUSH; } catch (e) { G = undefined; }
    if (!G || typeof G.isOperator !== 'function') return;
    Promise.resolve(G.isOperator()).then(function (ok) {
      if (ok && !staffMounted) { staffMounted = true; addGroup(CFG.staff); }
    }).catch(function () { /* not signed in; leave it hidden */ });
  }

  /* ── open / close ── */
  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    drawer.classList.add('on');
    scrim.classList.add('on');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    syncStaff();
    closeBtn.focus();
  }
  function close() {
    drawer.classList.remove('on');
    scrim.classList.remove('on');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function toggle() { drawer.classList.contains('on') ? close() : open(); }

  burger.addEventListener('click', toggle);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('on')) close();
  });
  document.addEventListener('grush:auth', syncStaff);

  /* ── mount ── */
  function mount() {
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    /* ── the shared header ─────────────────────────────────────────────
       Built on every page, ahead of everything else in <body>. Burger,
       Back, and Home all sit on the LEFT now, in that order, because the
       drawer itself opens from the left — a control on the opposite
       corner from the thing it opens read as a mistake even though it
       wasn't one. Grouping the three navigation controls together also
       means the eyebrow/title, which is what changes per page, gets the
       calmer job of filling the remaining space rather than being
       squeezed between icons on both sides.

       Back calls history.back() when there's somewhere in THIS site's
       history to return to (checked via document.referrer's origin, not
       just history.length, since a fresh tab opened straight to a deep
       link has history.length > 1 from the browser's own chrome but
       nowhere on-site to go back to); otherwise it's simply omitted,
       since Home covers that case. Home is the logo, tapping through to
       the true site root. */
    var hdr = document.createElement('header');
    hdr.id = 'grush-header';

    burger.className = 'grush-burger-hosted';
    hdr.appendChild(burger);

    var canGoBack = false;
    try { canGoBack = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (canGoBack) {
      var backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'gh-back';
      backBtn.setAttribute('aria-label', 'Back');
      backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
      backBtn.addEventListener('click', function () { history.back(); });
      hdr.appendChild(backBtn);
    }

    var homeLink = document.createElement('a');
    homeLink.href = CFG.home || 'index.html';
    homeLink.className = 'gh-home';
    homeLink.setAttribute('aria-label', 'Home');
    var logo = document.createElement('img');
    logo.src = CFG.logo || 'lfg-logo-192.webp';
    logo.alt = '';
    homeLink.appendChild(logo);
    hdr.appendChild(homeLink);

    var hw = document.createElement('div');
    hw.className = 'gh-wrap';
    /* The eyebrow says WHERE you are; the title says where you are on the
       whole site. Without the eyebrow the header repeats itself on every
       page and stops carrying information. */
    hw.innerHTML =
      '<div class="gh-eb">' + (CFG.eyebrow || 'Lancer Farms &middot; Zone 9b') + '</div>' +
      '<div class="gh-ttl">' + (CFG.title || 'Lancer Farms &amp; Gardens') + '</div>';
    hdr.appendChild(hw);

    document.body.insertBefore(hdr, document.body.firstChild);
    document.body.classList.add('grush-has-header');

    /* ── the shared footer ─────────────────────────────────────────────
       Appended last. A page that already had its own keeps it and gets
       this underneath, so nothing is silently deleted — pass
       GRUSH_NAV.footer:false on a page that should not have one. */
    if (CFG.footer !== false) {
      var ft = document.createElement('footer');
      ft.id = 'grush-footer';
      ft.innerHTML =
        '<span>lancerfarms.com</span>' +
        '<a class="gf-mark" href="https://getgrush.com" translate="no">powered by grush</a>';
      document.body.appendChild(ft);
    }

/* The rail and the floating burger are gone. Both were attempts to put
       the menu somewhere sensible on a page with no header; the header
       above is the answer, and two fallbacks for a case that no longer
       exists is how a file starts lying about itself. */
    syncStaff();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  /* ── Page-view counter ──────────────────────────────────────────────
     Fires once per load against grush_track_view(). That function is the
     only write path into grush_page_views — there is no INSERT or UPDATE
     policy — so a tampered call cannot create arbitrary rows.

     Staff tooling is excluded: those are crew pages, not visits, and
     counting them would drown the visitor signal we actually want.

     KEPT HERE ON PURPOSE. grush-track.js now carries the same logic as a
     standalone file, so pages without a nav can be counted. This copy
     stays because funguyfungi.org and any other deployment may load the
     nav WITHOUT that file, and silently losing their counts would be
     worse than the duplication. Both check window.GRUSH_TRACKED, so a
     page carrying both scripts counts exactly once.

     Every failure here is swallowed on purpose. A counter must never be
     able to break a page. */
  (function trackView() {
    if (window.GRUSH_TRACKED) return;          /* grush-track.js got there first */

    var C = window.LFG_CONFIG || window.FGF_CONFIG;
    if (!C || !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !C.SITE) return;
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

  window.GrushNav = { open: open, close: close, toggle: toggle };
})();
