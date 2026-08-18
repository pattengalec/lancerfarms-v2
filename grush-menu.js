/* ═══════════════════════════════════════════════════════════════════════
   grush-menu.js — the menu, defined once.

   WHY THIS EXISTS.

   Before this file there were SEVEN drawers. Eleven pages each carried a
   hand-written GRUSH_NAV config, six of which listed a different set of
   destinations — data.html had no triage, howto.html had no irrigation,
   triage.html had no mixbench — and five pages (learn, do, see, share,
   visitor) had no drawer at all. desk.html had its own tier system on top.

   Nothing kept any of them in step. Moving Almanac and Bed lookup into
   Tools updated exactly one of the seven. That is not a bug in any of the
   files; it is what happens when the same list is written down seven
   times.

   Now: one list. Every page loads this file and gets the same drawer.

   ── OWNERSHIP ─────────────────────────────────────────────────────────
   This file is FARM-OWNED and defines the farm's own destinations. The
   Grush overlay adds its tiers at runtime through addTier(), the same way
   it always has, so deleting the overlay leaves this file working with
   the farm's own pages intact. The seam survives.

   ── WHY STAFF ITEMS CAN BE LINKS NOW ──────────────────────────────────
   app.html's five tools used to be sections switched by go('log'), so the
   only way to offer them in a drawer was a run: function, which meant the
   drawer had to live INSIDE app.html. Making those screens addressable —
   app.html?s=log — is what allows one shared drawer to reach them from
   anywhere. That change was the precondition for this file.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var M = window.GRUSH_MENU = {
    tiers: [],
    footer: [],

    /* Tiers render in the order they are added, except that `first: true`
       jumps the queue. The overlay loads after this file, so without that
       flag nothing it adds could ever sit above the farm's own tiers. */
    addTier: function (t) {
      if (!t || !t.items || !t.items.length) return;
      if (t.first) M.tiers.unshift(t); else M.tiers.push(t);
    },

    /* Rank decides who may open a tier. Anything unranked is treated as
       OPEN, deliberately: a menu that fails closed on an unknown tier is
       how the emergency row ended up greyed out and unclickable. The cost
       of a wrongly-open row is that someone sees a page they could have
       reached anyway. */
    RANK: { emergency: 0, visitor: 0, tools: 0, staff: 1, admin: 2 },

    role: 'visitor',

    locked: function (tier) {
      if (!tier.locked) return false;
      var need = M.RANK[tier.id];
      if (need === undefined) return false;
      return need > (M.RANK[M.role] || 0);
    }
  };

  /* ── EMERGENCY ────────────────────────────────────────────────────────
     Above everything, in a colour used nowhere else, on every page.
     Never locked, never in the desk slots. */
  M.addTier({
    id: 'emergency', label: '', locked: false,
    items: [ { label: 'Emergency', icon: '\u{1F6A8}', href: 'emergency.html' } ]
  });

  /* ── VISITOR ──────────────────────────────────────────────────────────
     Places to go. Learn / Do / See / Share are destinations; the things
     that compute an answer live in Tools. */
  M.addTier({
    id: 'visitor', label: 'Visitor', color: 'var(--tier-visitor)', locked: false,
    items: [
      { label: 'Learn', icon: '\u{1F4D6}', href: 'learn.html' },
      { label: 'Do',    icon: '\u{1F9E4}', href: 'do.html'    },
      { label: 'See',   icon: '\u{1F33B}', href: 'see.html'   },
      { label: 'Share', icon: '\u{1F4AC}', href: 'share.html' }
    ]
  });

  /* ── SUPPORT ─────────────────────────────────────────────────────────
     Public and unlocked, deliberately — asking someone to give shouldn't
     require them to sign in first. Three distinct destinations because
     the money (or goods) flow to three different places and pretending
     otherwise would be dishonest: the developer personally, the farm's
     operating needs, and (once built) a merch store. */
  M.addTier({
    id: 'support', label: 'Support', color: 'var(--tier-visitor)', locked: false,
    items: [
      { label: 'Support the Developer', icon: '\u{1F49B}', href: 'donate.html' },
      { label: 'Fund the Farm',         icon: '\u{1F33E}', href: 'fund-the-farm.html' },
      { label: 'Farm Store',            icon: '\u{1F6CD}\u{FE0F}', href: 'store.html' }
    ]
  });

  /* An index of everything the site does. After every tier, because it
     describes the whole menu above it rather than being another
     destination in it. */
  M.footer = [
    { label: 'Everything here', icon: '\u{1F5C3}', href: 'features.html' }
  ];
})();
