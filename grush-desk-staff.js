/* ═══════════════════════════════════════════════════════════════════════
   grush-desk-staff.js — the STAFF OVERLAY for desk.html.

   THIS FILE IS THE GRUSH PRODUCT. desk.html is the farm's.

   Everything crew-facing lives here: the staff and admin tiers, the role
   lookup, the locked state, and the sign-in sheet. The farm's page holds
   none of it and never refers to this file by name except in the one
   script tag that loads it.

   THE REMOVAL TEST. Delete the four tags in the GRUSH STAFF OVERLAY block
   of desk.html. Expected result:
     - staff and admin tiers disappear from the menu
     - no tier is locked, because only this file locks anything
     - the sign-in sheet is gone
     - a desk slot holding a staff page shows "Unavailable, hold to clear"
     - everything else is untouched
   If anything else breaks, the seam has leaked and that is a bug here.

   LOAD ORDER, same as every Grush page:
     1. supabase-js   2. lfg-config.js   3. grush-auth.js   4. this file

   Missing any of them is not fatal. The tiers still render, locked, and
   the sign-in button reports honestly that sign-in is unavailable. A
   half-loaded overlay must never take the farm's page down with it.

   TIERS ARE NOT CHOSEN, THEY ARE READ. Both locked tiers open the same
   sheet. Sending a link proves an inbox; grush_role() reads the operator
   allowlist and decides what that inbox gets. A button offering to "log
   in as admin" would be lying.

   AND THE REAL BOUNDARY IS POSTGRES. Every check in this file is for
   showing and hiding UI. Row-level security is what actually enforces.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var D = window.GrushDesk;
  if (!D) { console.warn('[grush-desk] GrushDesk not found; overlay idle.'); return; }

  var RANK = { visitor: 0, staff: 1, admin: 2 };
  var role = 'visitor';

  /* ── the tiers this overlay owns ─────────────────────────────────────
     Retier freely. `id` must stay one of staff | admin, because RANK is
     what decides visibility. */
  D.addTier({
    id: 'staff', label: 'Staff', color: 'var(--tier-staff)', locked: true,
    items: [
      { label: 'Field tool',   icon: '\u{1F9F0}', href: 'app.html' },
      { label: 'Manual',       icon: '\u{1F4D3}', href: 'manual.html' },
      { label: 'Plant triage', icon: '\u{1FA7A}', href: 'triage.html' },
      { label: 'Mix bench',    icon: '\u{2697}',  href: 'mixbench.html' },
      { label: 'How-to cards', icon: '\u{1F5C2}', href: 'howto.html' },
      { label: 'Irrigation',   icon: '\u{1F4A7}', href: 'irrigation-bom.html' }
    ]
  });

  D.addTier({
    id: 'admin', label: 'Admin', color: 'var(--tier-admin)', locked: true,
    items: [
      { label: 'Admin panel', icon: '\u{1F510}', href: 'admin.html' },
      { label: 'Farm data',   icon: '\u{1F4CA}', href: 'data.html' }
    ]
  });

  /* One gate for both panes: the menu asks it, and so does every desk
     slot, so a revoked tier greys out in both places at once. */
  D.setGate(function (tierId) { return RANK[tierId] <= RANK[role]; });

  /* ── the sign-in sheet ───────────────────────────────────────────── */
  var SHEET_CSS = [
    '.gd-scrim{position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,.65);',
    '  display:none;align-items:center;justify-content:center;padding:20px;}',
    '.gd-scrim.on{display:flex;}',
    '.gd-sheet{width:100%;max-width:420px;background:var(--desk-plate,#1E1B16);',
    '  color:#F0EDE2;border:1.5px solid var(--desk-line,#45423A);border-radius:18px;',
    '  padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.55);}',
    '.gd-sheet h3{margin:0 0 6px;font:700 1.25rem/1.2 var(--font-head,Georgia,serif);}',
    '.gd-sheet p{margin:0 0 16px;font-size:.88rem;line-height:1.5;color:var(--desk-dim,#6E685D);}',
    '.gd-sheet label{display:block;font:700 .68rem/1 var(--font-mono,ui-monospace,monospace);',
    '  letter-spacing:.14em;text-transform:uppercase;color:var(--desk-accent,#D4A44E);margin-bottom:8px;}',
    '.gd-sheet input{width:100%;min-height:60px;padding:0 16px;font-size:1.05rem;',
    '  font-family:inherit;color:#F0EDE2;background:var(--desk-cell,#34302A);',
    '  border:1.5px solid var(--desk-line,#45423A);border-radius:12px;outline:none;}',
    '.gd-sheet input:focus{border-color:var(--desk-accent,#D4A44E);}',
    '.gd-acts{display:flex;gap:10px;margin-top:16px;}',
    '.gd-acts button{flex:1;min-height:60px;border-radius:12px;font:700 1rem/1 inherit;',
    '  font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '.gd-send{background:var(--desk-accent,#D4A44E);border:1.5px solid var(--desk-accent,#D4A44E);color:#1B1B17;}',
    '.gd-send:active{filter:brightness(.9);} .gd-send:disabled{opacity:.5;cursor:default;}',
    '.gd-cancel{background:transparent;border:1.5px solid var(--desk-line,#45423A);color:var(--desk-dim,#6E685D);}',
    '.gd-cancel:active{background:var(--desk-cell,#34302A);}',
    '.gd-msg{margin:14px 0 0;font-size:.88rem;line-height:1.5;min-height:1.2em;}',
    '.gd-msg.ok{color:var(--desk-active-line,#7E9A6E);} .gd-msg.bad{color:var(--alert,#C97A4A);}',
    '.gd-out{margin:0 10px 10px;width:calc(100% - 20px);min-height:60px;border-radius:12px;',
    '  background:transparent;border:1.5px solid var(--desk-line,#45423A);',
    '  color:var(--desk-dim,#6E685D);font:600 .95rem/1 inherit;font-family:inherit;cursor:pointer;}',
    '.gd-out:active{background:var(--desk-cell,#34302A);}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = SHEET_CSS;
  document.head.appendChild(style);

  var scrim = document.createElement('div');
  scrim.className = 'gd-scrim';
  scrim.innerHTML =
    '<div class="gd-sheet" role="dialog" aria-modal="true" aria-labelledby="gdTitle">' +
      '<h3 id="gdTitle">Sign in</h3>' +
      '<p id="gdWhy"></p>' +
      '<label for="gdEmail">Farm email</label>' +
      '<input id="gdEmail" type="email" inputmode="email" autocomplete="email" ' +
             'autocapitalize="off" spellcheck="false" placeholder="you@example.com">' +
      '<div class="gd-acts">' +
        '<button class="gd-cancel" id="gdCancel" type="button">Cancel</button>' +
        '<button class="gd-send" id="gdSend" type="button">Send link</button>' +
      '</div>' +
      '<p class="gd-msg" id="gdMsg"></p>' +
    '</div>';
  document.body.appendChild(scrim);

  var $ = function (id) { return document.getElementById(id); };
  var elEmail = $('gdEmail'), elSend = $('gdSend'), elMsg = $('gdMsg'), elWhy = $('gdWhy');

  function openSheet(tierId) {
    elWhy.textContent = (tierId === 'admin')
      ? 'We\u2019ll email a sign-in link. Admin access comes from the farm\u2019s operator list \u2014 signing in does not grant it by itself.'
      : 'We\u2019ll email a sign-in link. Your address has to be on the farm\u2019s operator list for crew tools to appear.';
    elMsg.textContent = ''; elMsg.className = 'gd-msg';
    elSend.disabled = false; elSend.textContent = 'Send link';
    scrim.classList.add('on');
    setTimeout(function () { elEmail.focus(); }, 60);
  }
  function closeSheet() { scrim.classList.remove('on'); }

  $('gdCancel').addEventListener('click', closeSheet);
  scrim.addEventListener('click', function (e) { if (e.target === scrim) closeSheet(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && scrim.classList.contains('on')) closeSheet();
  });
  elEmail.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  elSend.addEventListener('click', send);

  function auth() { var G; try { G = GRUSH; } catch (e) { G = undefined; } return G; }

  async function send() {
    var email = elEmail.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      elMsg.className = 'gd-msg bad';
      elMsg.textContent = 'That doesn\u2019t look like an email address.';
      return;
    }
    var G = auth();
    if (!G || typeof G.sendLink !== 'function') {
      elMsg.className = 'gd-msg bad';
      elMsg.textContent = 'Sign-in is unavailable \u2014 grush-auth.js did not load.';
      return;
    }
    elSend.disabled = true; elSend.textContent = 'Sending\u2026';
    elMsg.className = 'gd-msg'; elMsg.textContent = '';
    var r = await G.sendLink(email);
    elMsg.className = 'gd-msg ' + (r.ok ? 'ok' : 'bad');
    elMsg.textContent = r.msg;
    elSend.textContent = r.ok ? 'Link sent' : 'Send link';
    elSend.disabled = r.ok;
  }

  /* ── lock state follows the role ─────────────────────────────────── */
  function applyRole(r, label) {
    role = r;
    D.setViewer(label);
    D.setSub(r === 'visitor'
      ? 'Four things you reach for most. Sign in for crew tools.'
      : 'Four things you reach for most. Tap + in the menu to fill a slot.');

    ['staff', 'admin'].forEach(function (id) {
      var locked = RANK[id] > RANK[role];
      D.setLock(id, {
        locked: locked,
        action: id === 'staff' ? 'Sign in to unlock crew tools'
                               : 'Sign in with an admin account',
        why:    id === 'staff' ? 'Field tool, manual, triage and the mix bench.'
                               : 'Approvals, crew and configuration.',
        onClick: openSheet
      });
    });

    if (role !== 'visitor') addSignOut();
    D.setGate(function (t) { return RANK[t] <= RANK[role]; });
    addSignature();
  }

  var outAdded = false;
  function addSignOut() {
    if (outAdded) return;
    outAdded = true;
    var scroll = document.getElementById('menuScroll');
    if (!scroll) return;
    var b = document.createElement('button');
    b.className = 'gd-out'; b.type = 'button'; b.textContent = 'Sign out';
    b.addEventListener('click', async function () {
      var G = auth();
      if (G && G.signOut) { await G.signOut(); }
      location.reload();
    });
    scroll.appendChild(b);
  }

  /* ── the signature ───────────────────────────────────────────────────
     Last thing in the drawer, below every tier and below sign-out. A
     maker's mark sits at the foot of the work, not at the top of it.

     Re-appended on each render because renderMenu() clears menuScroll —
     appendChild on an existing node moves it, so this never duplicates. */
  var sig = document.createElement('a');
  sig.className = 'grush-sig-block';
  sig.href = 'https://getgrush.com';
  sig.setAttribute('aria-label', 'Grush — see how this software works');
  /* Caption first. "powered by" then the mark reads as one sentence; the
     other order reads as two unrelated fragments. */
  sig.innerHTML = '<span class="sig-cap">powered by</span>' +
                  '<img src="grush-mark.png" alt="" width="494" height="294">';

  function addSignature() {
    var scroll = document.getElementById('menuScroll');
    if (scroll) scroll.appendChild(sig);
  }

  /* ── read the role ───────────────────────────────────────────────── */
  applyRole('visitor', 'Visitor');

  (async function () {
    var actual = 'visitor';
    try {
      var G = auth();
      if (G && G.sb) {
        var s = await G.session();
        if (s) {
          var r = await G.sb.rpc('grush_role');
          if (!r.error && r.data) actual = r.data;
        }
      }
    } catch (e) { console.warn('[grush-desk] role lookup failed; staying visitor', e); }

    /* ?preview=visitor|staff|admin — for checking what other tiers see.
       It may only ever NARROW. It cannot hand out access you lack. */
    var p = new URLSearchParams(location.search).get('preview');
    var valid = p && RANK[p] !== undefined;
    var shown = (valid && RANK[p] <= RANK[actual]) ? p : actual;
    var label = shown.charAt(0).toUpperCase() + shown.slice(1) +
      (valid && shown === p && p !== actual ? ' (preview)' : '') +
      (valid && RANK[p] > RANK[actual] ? ' \u2014 preview denied' : '');

    applyRole(shown, label);
  })();

  document.addEventListener('grush:auth', function () { location.reload(); });
})();
