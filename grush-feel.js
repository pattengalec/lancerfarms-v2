/* ═══════════════════════════════════════════════════════════════════════
   grush-feel.js — the physical signature layer.

   THE PROBLEM THIS FIXES.

   The pin — a spore bar growing down a row's leading edge on press — was
   the Grush signature, and nobody had ever seen it. It fired on :active
   on rows that navigate, and the browser is already painting the next
   page before the animation finishes its first frame.

   Any signature that plays on DEPARTURE is invisible. That is a placement
   error, not an animation error, and it splits the work in two:

     ARRIVAL gets the signature. A page that has just loaded has all the
     time in the world, because nothing is racing it.

     PRESS gets confirmation, but only where the screen SURVIVES the press
     — adding to the desk, picking a chip, saving a record. There the
     animation is telling you something happened and has time to say it.

   HAPTICS, AND AN HONEST GAP.

   Safari on iOS and macOS has never implemented the Vibration API.
   navigator.vibrate does not exist there and no amount of feature
   detection changes that. The crew is mixed, so this is real on the
   Android handsets and silently absent on the iPhones.

   There is a polyfill that fakes it by overlaying hidden switch inputs
   and wrapping the document in a label to intercept clicks. It is not
   used here. This site has a log form and admin controls that delete
   things, and a library that simulates clicks on your own elements is the
   wrong trade for a buzz.

   So: real where it works, nothing where it does not, and documented
   either way. A gap someone knows about is a gap. A gap nobody knows
   about is a bug report six months from now.

   REMOVABLE. This is Grush layer, not farm. Delete the file and the
   script tag; the site loses its signature and nothing else.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HAS_VIBRATE = typeof navigator !== 'undefined' &&
                    typeof navigator.vibrate === 'function';

  /* Someone who has asked the OS to reduce motion has asked once, for
     everything. Honour it for animation. Haptics are not vestibular and
     stay on — a person using reduced motion in a garden still benefits
     from knowing their tap registered. */
  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── the three patterns ───────────────────────────────────────────────
     Three, deliberately. A vocabulary you cannot tell apart through a
     glove is not a vocabulary, and the whole point of feedback on this
     site is that it works when sound does not — hearing protection, a
     running mower, wind.

     tap      one short beat   — registered
     confirm  two beats        — written down
     warn     three hard beats — look at the screen

     Rising in length as well as count, so they differ by duration even if
     a cheap motor blurs the gaps together. */
  var PATTERNS = {
    tap:     12,
    confirm: [16, 46, 16],
    warn:    [34, 58, 34, 58, 34]
  };

  function buzz(name) {
    if (!HAS_VIBRATE) return false;
    var p = PATTERNS[name];
    if (p === undefined) return false;
    try {
      /* Returns false in a background tab, or before the page has any
         user activation. Not an error — just nothing to do. */
      return navigator.vibrate(p);
    } catch (e) { return false; }
  }

  /* ── ARRIVAL: the seat ────────────────────────────────────────────────
     Content settles down and in as the page loads, the way a container
     seats onto a docking port. ~190ms, transform and opacity only, so it
     runs on the compositor and never touches layout.

     Applied by adding a class rather than animating by default: if this
     script fails to load, no class is added, nothing animates, and the
     page renders normally. A signature must never be able to hide the
     content it decorates. */
  function seat() {
    if (REDUCED) return;
    var host = document.querySelector('[data-grush-seat]') || document.body;
    if (!host) return;
    host.classList.add('grush-seat');
    /* Take the class off once it has played. Leaving an animation class on
       an element means anything that later re-triggers it — a class
       toggle, a reflow on some browsers — replays the whole thing. */
    window.setTimeout(function () { host.classList.remove('grush-seat'); }, 700);
  }

  /* ── WRITE: the settle ────────────────────────────────────────────────
     A row that has just become a record gets a spore underline that
     sweeps across it and fades. Used after a save, on the thing that was
     saved — not on the button that saved it.

     This is the pin's real job. It was on rows that navigate, where it
     never had time to play; here the screen stays put and it can. */
  function settle(el) {
    if (!el || REDUCED) { buzz('confirm'); return; }
    el.classList.remove('grush-settle');
    /* Force a reflow so the class can be re-added and replay on the same
       element twice in a row. Without this, logging two things against the
       same row animates once. */
    void el.offsetWidth;
    el.classList.add('grush-settle');
    window.setTimeout(function () { el.classList.remove('grush-settle'); }, 900);
    buzz('confirm');
  }

  /* ── PRESS: acknowledgement ───────────────────────────────────────────
     Bound automatically to controls that do NOT replace the screen. An
     anchor with an href is excluded on purpose: that is a departure, and
     departures get no signature.

     Delegated from the document so it covers controls added later —
     chips, rows and slots on this site are all built at runtime. */
  function bindPress() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target && e.target.closest
            ? e.target.closest('button, .chip, .add, .slot, [data-feel]')
            : null;
      if (!t) return;
      if (t.disabled) return;
      /* Anything that navigates is a departure. Skip it. */
      if (t.closest('a[href]:not([href="#"])')) return;

      var kind = t.getAttribute('data-feel');
      buzz(kind === 'warn' || kind === 'confirm' ? kind : 'tap');
    }, { passive: true });
  }

  /* ── public surface ───────────────────────────────────────────────────
     Deliberately tiny. Four things, and every one of them is safe to call
     when nothing supports it. */
  window.GrushFeel = {
    tap:      function () { return buzz('tap'); },
    confirm:  function () { return buzz('confirm'); },
    warn:     function () { return buzz('warn'); },
    settle:   settle,
    seat:     seat,
    /* So a page can say plainly whether haptics exist here rather than
       guessing, and so this stays testable. */
    supported: HAS_VIBRATE
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { seat(); bindPress(); });
  } else {
    seat(); bindPress();
  }
})();
