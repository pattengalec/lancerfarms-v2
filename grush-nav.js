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
  if (document.getElementById('grush-rail')) return;   // already mounted

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
  #grush-rail #grush-burger svg{ width:40px; height:40px; display:block; }

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
    letter-spacing:.16em; text-transform:uppercase; color:var(--nav-accent);
    font-family:var(--font-mono, ui-monospace, monospace);
  }
  .grush-item{
    display:flex; align-items:center; gap:14px; width:calc(100% - 20px);
    margin:0 10px 8px; min-height:68px; padding:0 14px;
    background:var(--nav-cell); border:1.5px solid var(--nav-line);
    border-radius:12px; color:var(--nav-ink); text-decoration:none;
    font:600 1.02rem/1.25 inherit; font-family:inherit; text-align:left;
    cursor:pointer; -webkit-tap-highlight-color:transparent;
  }
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

  /* ── rail ── */
  var rail = document.createElement('nav');
  rail.id = 'grush-rail';
  rail.setAttribute('aria-label', 'Primary');

  var burger = document.createElement('button');
  burger.id = 'grush-burger';
  burger.type = 'button';
  burger.setAttribute('aria-label', 'Open menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'grush-drawer');
  burger.innerHTML = BURGER;
  rail.appendChild(burger);

  (CFG.rail || []).slice(0, 2).forEach(function (it) {
    rail.appendChild(makeItem(it, ''));
  });

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

  function addGroup(g) {
    if (!g || !g.items || !g.items.length) return;
    if (g.label) {
      var lb = document.createElement('div');
      lb.className = 'grush-group';
      lb.textContent = g.label;
      drawer.appendChild(lb);
    }
    g.items.forEach(function (it) { drawer.appendChild(makeItem(it, 'grush-item')); });
  }

  (CFG.groups || []).forEach(addGroup);

  /* Staff group is appended only if grush-auth reports an operator.
     If grush-auth is absent — which is what happens once the Grush
     side is extracted — nothing is added and the page is unaffected. */
  var staffMounted = false;
  function syncStaff() {
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
    document.body.appendChild(rail);
    /* Reserve space so the rail never covers page content. */
    var h = rail.offsetHeight || 78;
    var prev = getComputedStyle(document.body).paddingBottom;
    document.body.style.paddingBottom =
      'calc(' + (parseInt(prev, 10) || 0) + 'px + ' + h + 'px)';
    syncStaff();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.GrushNav = { open: open, close: close, toggle: toggle };
})();
