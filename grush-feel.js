/* ═══════════════════════════════════════════════════════════════════════
   grush-feel.js — the physical signature layer.
   Slightly softer timing for a more tactile / ASMR-friendly feel.
   Drop-in replacement. Same public API.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HAS_VIBRATE = typeof navigator !== 'undefined' &&
                    typeof navigator.vibrate === 'function';

  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── the three patterns ───────────────────────────────────────────────
     tap      one short beat   — registered
     confirm  two beats        — written down
     warn     three hard beats — look at the screen
  */
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
      return navigator.vibrate(p);
    } catch (e) { return false; }
  }

  /* ── ARRIVAL: the seat ────────────────────────────────────────────────
     Slightly longer and softer settle for a more physical feel.
  */
  function seat() {
    if (REDUCED) return;
    var host = document.querySelector('[data-grush-seat]') || document.body;
    if (!host) return;
    host.classList.add('grush-seat');
    window.setTimeout(function () { host.classList.remove('grush-seat'); }, 780);
  }

  /* ── SETTLE: a thing became a record ────────────────────────────────── */
  function settle(el) {
    if (!el || REDUCED) { buzz('confirm'); return; }
    el.classList.remove('grush-settle');
    void el.offsetWidth;
    el.classList.add('grush-settle');
    window.setTimeout(function () { el.classList.remove('grush-settle'); }, 980);
    buzz('confirm');
  }

  /* ── PRESS: acknowledgement ─────────────────────────────────────────── */
  function bindPress() {
    document.addEventListener('pointerdown', function (e) {
      var t = e.target && e.target.closest
            ? e.target.closest('button, .chip, .add, .slot, [data-feel]')
            : null;
      if (!t) return;
      if (t.disabled) return;
      if (t.closest('a[href]:not([href="#"])')) return;

      var kind = t.getAttribute('data-feel');
      buzz(kind === 'warn' || kind === 'confirm' ? kind : 'tap');
    }, { passive: true });
  }

  window.GrushFeel = {
    tap:      function () { return buzz('tap'); },
    confirm:  function () { return buzz('confirm'); },
    warn:     function () { return buzz('warn'); },
    settle:   settle,
    seat:     seat,
    supported: HAS_VIBRATE
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { seat(); bindPress(); });
  } else {
    seat(); bindPress();
  }
})();
