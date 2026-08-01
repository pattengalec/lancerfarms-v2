/* ============================================================
   grush-mode.js — one light/dark system for every Grush page.

   LOAD IT FIRST, in <head>, BEFORE any stylesheet:
     <script src="grush-mode.js"></script>

   It is deliberately synchronous and tiny. It must set the mode
   attribute before the first paint or you get a flash of the wrong
   theme on every page load.

   ── Behaviour ──
   Follows the phone's setting until someone taps a toggle. From then
   on their choice is remembered across pages and visits, until they
   cycle back to Auto. Nothing is taken away from anyone: pages that
   had a toggle keep it, pages that only followed the OS gain one if
   they want it.

   ── What it replaces ──
   Three separate implementations (data.html, manual.html, admin.html)
   and two incompatible conventions:
       data / manual / admin   :root = light,  [data-mode="dark"] overrides
       visitor / almanac /
       about-grush             :root = dark,   @media light overrides

   Both keep working, because this module always writes an EXPLICIT
   data-mode of "light" or "dark" — never "auto" — onto <html>.
     - Light-default pages need no CSS change at all.
     - Dark-default pages change one wrapper line:
           @media (prefers-color-scheme: light){ :root{ … } }
       becomes
           :root[data-mode="light"]{ … }
       A media query cannot be overridden by a user's choice, which is
       the whole reason those pages had no toggle.

   ── API ──
     GRUSH_MODE.get()        -> 'auto' | 'light' | 'dark'   (the preference)
     GRUSH_MODE.resolved()   -> 'light' | 'dark'            (what is showing)
     GRUSH_MODE.set(v)       -> set preference, apply, remember
     GRUSH_MODE.toggle()     -> flip light <-> dark
     GRUSH_MODE.cycle()      -> auto -> light -> dark -> auto

   Any element with [data-mode-toggle] is wired automatically and gets
   its label kept in sync. window.toggleMode() and window.updateModeIcon()
   are provided as aliases so pages that already call them keep working.
   ============================================================ */

var GRUSH_MODE = (function () {

  var KEY = 'grush_mode';                 // shared across every Grush site
  var mq  = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return (v === 'light' || v === 'dark' || v === 'auto') ? v : 'auto';
    } catch (e) { return 'auto'; }        // private mode / storage disabled
  }

  var pref = stored();

  function systemIs() { return (mq && mq.matches) ? 'dark' : 'light'; }
  function resolved() { return pref === 'auto' ? systemIs() : pref; }

  function apply() {
    var m = resolved();
    var el = document.documentElement;
    el.setAttribute('data-mode', m);
    // Keeps native form controls, scrollbars and the iOS status bar in
    // step with the theme. Without it a dark page gets white select menus.
    el.style.colorScheme = m;
    paintToggles();
  }

  function paintToggles() {
    var m = resolved();
    var icon = (pref === 'auto') ? '\u25D1'          // half-filled: following OS
             : (m === 'dark')    ? '\u263D'          // moon
                                 : '\u2600';         // sun
    var label = (pref === 'auto') ? 'Theme: auto (following your device)'
                                  : 'Theme: ' + m;
    var nodes = document.querySelectorAll('[data-mode-toggle]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      // Respect a page that wants its own glyph inside the button.
      if (!n.hasAttribute('data-mode-keep-label')) n.textContent = icon;
      n.setAttribute('aria-label', label);
      n.setAttribute('title', label);
    }
  }

  function set(v) {
    pref = (v === 'light' || v === 'dark') ? v : 'auto';
    try { localStorage.setItem(KEY, pref); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent('grush:mode', {
      detail: { pref: pref, resolved: resolved() }
    }));
  }

  function toggle() { set(resolved() === 'dark' ? 'light' : 'dark'); }

  function cycle() {
    set(pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto');
  }

  // Apply immediately — before the stylesheets below us finish, and before
  // <body> exists. This is why the script tag must be synchronous and first.
  apply();

  // Track the OS only while the person has not made a choice.
  if (mq) {
    var onSystem = function () { if (pref === 'auto') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', onSystem);
    else if (mq.addListener) mq.addListener(onSystem);          // older iOS
  }

  // Wire toggles once the DOM exists. Delegated, so buttons rendered later
  // by JS work too without re-binding.
  document.addEventListener('DOMContentLoaded', function () {
    paintToggles();
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-mode-toggle]') : null;
      if (!t) return;
      e.preventDefault();
      // data-mode-toggle="cycle" gets the three-state control.
      (t.getAttribute('data-mode-toggle') === 'cycle') ? cycle() : toggle();
    });
  });

  // Back-compat for pages still calling the old per-page functions.
  window.toggleMode = toggle;
  window.updateModeIcon = paintToggles;

  return { get: function () { return pref; }, resolved: resolved,
           set: set, toggle: toggle, cycle: cycle };
})();
