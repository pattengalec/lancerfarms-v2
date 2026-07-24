/* ============================================================
   grush-settings.js — one settings module for every Grush site.
   Drop in beside grush-auth.js; load at the END of <head>,
   after the page's inline <style>, WITHOUT defer:

     <script src="grush-settings.js"></script>

   THE CONSOLE. A simulated 80s-boombox control surface: slide
   switches for discrete choices, ridged rotary pots for continuous
   ones, LED indicators for state, brushed panel, corner screws.
   Every surface is drawn from the site's own CSS variables, so the
   console re-skins itself live — it IS the theme preview.

     BASE   rocker toggle: LIGHT / DARK. Site-controlled and immune
            to OS theme changes after a one-time first-visit seed —
            we never listen to the media query again.
     HUE    continuous 360° pot. The page's palette is plotted as
            a chord of dots on the knob's ring; turning transposes
            the whole chord in OKLCH (lightness & chroma locked, so
            no position can produce an unreadable screen). 0° =
            stock. Double-tap snaps home.
     TONE   trim pot, cool <-> warm: temperature of the neutrals,
            bounded, center detent = stock.
     DEPTH  trim pot, deep <-> bright: surface lightness within a
            pre-bounded window computed inside the chosen base; ink
            never moves, so contrast cannot collapse.
     CHROMA trim pot, soft <-> vivid: saturation of the chromatic
            voices only, bounded, center detent = stock.
     SOUND  3-position detent: MUTE / CHILL / ASSERTIVE. Landing on
            a profile auditions its reward sound.
     TEXT   3-position detent: S / M / L.

   The console is built from the site's own CSS variables, so it
   re-skins itself live as you turn — the console IS the preview.

   SOUND ENGINE: Web-Audio synthesized, no files. Event vocabulary:
   tap open close nav toggle success (modify/complete) reward
   (create; ethereal) error. Pages call GrushSettings.play('reward').

   Storage: localStorage only, key grush_<site>_settings.
   Language stays delegated to i18n.js (lfg_lang key).
   ============================================================ */

const GrushSettings = (() => {
  'use strict';

  const SITE = document.documentElement.dataset.grushSite || 'lfg';
  const KEY  = `grush_${SITE}_settings`;
  const VER  = 3;

  /* ─────────────────────────── store ─────────────────────────── */

  const DEFAULTS = {
    v: VER, seeded: false,
    base: 'dark',             // light | dark
    hue: 0,                   // chord rotation, degrees; 0 = stock
    tone: 0,                  // -1..1 cool <-> warm, 0 = stock
    depth: 0,                 // -1..1 deep <-> bright, 0 = stock
    chroma: 0,                // -1..1 soft <-> vivid, 0 = stock
    sound: 'chill',           // mute | chill | assertive
    text: 'default'           // small | default | large
  };

  let S = load();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && raw.v === VER) return { ...DEFAULTS, ...raw };
      if (raw && raw.v === 2)                         // migrate v2
        return { ...DEFAULTS, ...raw, v: VER };
      if (raw && raw.v === 1) {                       // migrate v1
        return { ...DEFAULTS, seeded: !!raw.seeded,
          base: raw.theme === 'custom' ? (raw.customBase || 'dark')
              : (raw.theme || 'dark'),
          hue: raw.theme === 'custom' ? (raw.hue || 0) : 0,
          sound: raw.sound || 'chill', text: raw.text || 'default' };
      }
    } catch {}
    return { ...DEFAULTS };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

  /* One-time first-visit seed from the device preference, then deaf
     to the OS forever — no media-query listener is ever attached. */
  if (!S.seeded) {
    try {
      if (matchMedia('(prefers-color-scheme: light)').matches) S.base = 'light';
    } catch {}
    S.seeded = true; save();
  }

  /* ──────────────────── color math (OKLab/OKLCH) ─────────────────
     Björn Ottosson's matrices. Rotation happens on (a,b) so L and
     chroma are untouched — contrast preserved by construction.
     Verified: 0px round-trip drift on the site palette; ink/paper
     holds 12.75–12.90:1 across the full wheel. */

  const srgb2lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lin2srgb = c => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

  function rgbToOklab(r, g, b) {
    r = srgb2lin(r / 255); g = srgb2lin(g / 255); b = srgb2lin(b / 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return {
      L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    };
  }
  function oklabToRgb(L, a, b) {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    let r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    const f = c => Math.max(0, Math.min(255, Math.round(lin2srgb(c) * 255)));
    return { r: f(r), g: f(g), b: f(b2) };
  }
  function parseColor(str) {
    if (!str) return null;
    str = str.trim();
    let m = str.match(/^#([0-9a-f]{3})$/i);
    if (m) { const h = m[1]; return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 }; }
    m = str.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (m) return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
    m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    return null;
  }
  const toCss = c => c.a < 1
    ? `rgba(${c.r},${c.g},${c.b},${+c.a.toFixed(3)})`
    : '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');

  function rotateColor(color, deg) {
    if (!deg) return color;
    const o = rgbToOklab(color.r, color.g, color.b);
    const rad = deg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    const a = o.a * cos - o.b * sin, b = o.a * sin + o.b * cos;
    return { ...oklabToRgb(o.L, a, b), a: color.a };
  }
  /* Auto light derivation for page-specific colors with no hand-
     tuned override: invert OKLab lightness, soften chroma a touch. */
  function lightFlip(color) {
    const o = rgbToOklab(color.r, color.g, color.b);
    const L = Math.max(0.12, Math.min(0.985, 1.10 - o.L * 0.92));
    return { ...oklabToRgb(L, o.a * 0.85, o.b * 0.85), a: color.a };
  }
  function hueChroma(color) {
    const o = rgbToOklab(color.r, color.g, color.b);
    return { h: Math.atan2(o.b, o.a) * 180 / Math.PI, c: Math.hypot(o.a, o.b), L: o.L };
  }
  /* Bounded trims applied inside the chosen base. TONE warms/cools
     the neutrals, CHROMA scales only the chromatic voices, DEPTH
     nudges surface lightness in a small window while ink stays put
     — bounds sized so no knob position can break readability. */
  function trim(color, s) {
    const o = rgbToOklab(color.r, color.g, color.b);
    const C = Math.hypot(o.a, o.b);
    if (s.chroma && C >= 0.03) {
      const f = 1 + s.chroma * 0.4;
      o.a *= f; o.b *= f;
    }
    if (s.tone && C < 0.05) {
      const rad = 55 * Math.PI / 180;                 // warm axis
      const amt = s.tone * 0.012 * (1 - C / 0.05);
      o.a += Math.cos(rad) * amt; o.b += Math.sin(rad) * amt;
    }
    if (s.depth) {
      const isSurface = s.base === 'dark' ? o.L < 0.5 : o.L > 0.72;
      if (isSurface) o.L = Math.max(0.08, Math.min(0.99, o.L + s.depth * 0.05));
    }
    return { ...oklabToRgb(o.L, o.a, o.b), a: color.a };
  }

  /* ───────────────────────── theme engine ───────────────────────── */

  /* Hand-tuned light values for the shared core vocabulary; anything
     a page declares beyond these gets lightFlip(). Amber note: 3.39:1
     on cream — accents and large text only, not body copy. */
  const LIGHT = {
    '--paper': '#F5F1E6', '--bg': '#F5F1E6', '--surface': '#FDFBF4',
    '--card': '#FDFBF4', '--card-bg': '#FDFBF4',
    '--ink': '#2A2620', '--ink-soft': '#6E675A',
    '--line': '#DDD6C6', '--line-strong': '#C4BCA8',
    '--border': '#DDD6C6', '--card-border': '#DDD6C6',
    '--green': '#5E7A50', '--leaf': '#8AA07A', '--amber': '#A87A2F',
    '--accent': '#5E7A50', '--accent-2': '#8AA07A',
    '--green-d': '#3D4A3E', /* stays deep: splash paints light text on it */
    '--shadow': '0 1px 0 rgba(32,38,28,.05), 0 2px 8px rgba(32,38,28,.08)',
    '--card-shadow': '0 1px 0 rgba(32,38,28,.05), 0 2px 8px rgba(32,38,28,.08)'
  };
  const SKIP = /^--font|^--radius|^--border-w|^--border-s$/;

  let BASE = null;   // { name: rawValue } — the page's own dark palette

  function snapshotBase() {
    if (BASE) return BASE;
    BASE = {};
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; } // cross-origin
      if (!rules) continue;
      for (const rule of rules) {
        if (!rule.selectorText || !/(^|,)\s*:root\b/.test(rule.selectorText)) continue;
        for (const prop of rule.style) {
          if (prop.startsWith('--')) BASE[prop] = rule.style.getPropertyValue(prop).trim();
        }
      }
    }
    return BASE;
  }

  function resolvedPalette() {
    const base = snapshotBase();
    const out = {};
    for (const [name, raw] of Object.entries(base)) {
      if (SKIP.test(name)) { out[name] = raw; continue; }
      let val = raw;
      if (S.base === 'light') {
        if (LIGHT[name] !== undefined) val = LIGHT[name];
        else { const c = parseColor(raw); val = c ? toCss(lightFlip(c)) : raw; }
      }
      if (S.hue || S.tone || S.depth || S.chroma) {
        const c = parseColor(val);
        if (c) val = toCss(trim(rotateColor(c, S.hue), S));
      }
      out[name] = val;
    }
    return out;
  }

  function applyTheme() {
    const html = document.documentElement;
    const pal = resolvedPalette();
    for (const [name, val] of Object.entries(pal)) html.style.setProperty(name, val);
    html.dataset.themeBase = S.base;

    /* Pin color-scheme with `only`, judged by actual paper lightness:
       browser UI follows the site, Android auto-darkening is blocked,
       and OS theme flips change nothing mid-session. */
    const paper = parseColor(pal['--paper'] || pal['--bg'] || '#2A2620');
    const isLight = paper ? rgbToOklab(paper.r, paper.g, paper.b).L > 0.6 : false;
    const scheme = isLight ? 'only light' : 'only dark';
    html.style.colorScheme = scheme;
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'color-scheme'; document.head.appendChild(meta); }
    meta.content = scheme;

    applyText();
  }

  function applyText() {
    const z = { small: '0.92', default: '1', large: '1.12' }[S.text] || '1';
    /* zoom scales px-built pages wholesale; Firefox <126 ignores it
       (silent no-op there — honest limitation, v1). */
    document.documentElement.style.zoom = z;
  }

  /* ───────────────────────── sound engine ───────────────────────── */

  let CTX = null;
  function ctx() {
    if (!CTX) { try { CTX = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (CTX && CTX.state === 'suspended') CTX.resume();
    return CTX;
  }

  const PROFILES = {
    chill: {
      wave: 'sine', gain: 0.11,
      tap:     { freqs: [420], dur: .06, a: .005, r: .07 },
      open:    { freqs: [330], glideTo: 392, dur: .14, a: .01, r: .12 },
      close:   { freqs: [392], glideTo: 330, dur: .12, a: .01, r: .10 },
      nav:     { freqs: [294, 441], dur: .16, a: .015, r: .18, g: .8 },
      toggle:  { freqs: [470], dur: .05, a: .004, r: .06 },
      detent:  { freqs: [640], dur: .02, a: .002, r: .03, g: .55 },
      success: { seq: [392, 523.25], step: .09, dur: .10, a: .008, r: .16 },
      reward:  { freqs: [523.25, 659.25, 783.99], detune: 4, dur: .5, a: .09, r: 1.8,
                 glideCents: 30, delay: { t: .28, fb: .35, wet: .25 }, g: .9 },
      error:   { freqs: [196], wobble: 6, dur: .22, a: .01, r: .16 }
    },
    assertive: {
      wave: 'triangle', gain: 0.19,
      tap:     { freqs: [880], dur: .035, a: .003, r: .05 },
      open:    { freqs: [660], glideTo: 880, dur: .10, a: .005, r: .09 },
      close:   { freqs: [880], glideTo: 660, dur: .09, a: .005, r: .08 },
      nav:     { freqs: [587.33, 880], dur: .12, a: .008, r: .12, g: .85 },
      toggle:  { freqs: [990], dur: .04, a: .003, r: .05 },
      detent:  { freqs: [1180], dur: .018, a: .002, r: .025, g: .6 },
      success: { seq: [659.25, 880, 1046.5], step: .06, dur: .08, a: .005, r: .14 },
      reward:  { freqs: [659.25, 830.61, 987.77], detune: 5, dur: .45, a: .04, r: 2.2,
                 glideCents: 40, delay: { t: .22, fb: .4, wet: .3 }, g: 1.05 },
      error:   { freqs: [174.61], pulses: 2, dur: .09, gap: .07, a: .006, r: .07 }
    }
  };

  function voice(ac, dest, wave, f, t0, p, gain) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = wave; o.frequency.setValueAtTime(f, t0);
    if (p.glideTo)    o.frequency.exponentialRampToValueAtTime(p.glideTo, t0 + p.dur);
    if (p.glideCents) o.detune.linearRampToValueAtTime(p.glideCents, t0 + p.dur + p.r);
    if (p.wobble) {
      const lfo = ac.createOscillator(), la = ac.createGain();
      lfo.frequency.value = p.wobble; la.gain.value = f * 0.02;
      lfo.connect(la); la.connect(o.frequency);
      lfo.start(t0); lfo.stop(t0 + p.dur + p.r);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + p.a);
    g.gain.setValueAtTime(gain, t0 + p.dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur + p.r);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + p.dur + p.r + .05);
  }

  function synth(profileName, event) {
    const prof = PROFILES[profileName]; if (!prof) return;
    const p = prof[event]; if (!p) return;
    const ac = ctx(); if (!ac) return;
    const t0 = ac.currentTime + 0.01;
    const gain = prof.gain * (p.g || 1);

    let dest = ac.destination;
    if (p.delay) {                      /* ethereal shimmer bus */
      const dry = ac.createGain(); dry.gain.value = 1;
      const d = ac.createDelay(1); d.delayTime.value = p.delay.t;
      const fb = ac.createGain(); fb.gain.value = p.delay.fb;
      const wet = ac.createGain(); wet.gain.value = p.delay.wet;
      d.connect(fb); fb.connect(d); d.connect(wet);
      dry.connect(ac.destination); wet.connect(ac.destination);
      const bus = ac.createGain(); bus.connect(dry); bus.connect(d);
      dest = bus;
    }
    if (p.seq) {
      p.seq.forEach((f, i) => voice(ac, dest, prof.wave, f, t0 + i * p.step, p, gain));
    } else if (p.pulses) {
      for (let i = 0; i < p.pulses; i++)
        p.freqs.forEach(f => voice(ac, dest, prof.wave, f, t0 + i * (p.dur + p.gap), p, gain));
    } else {
      const n = p.freqs.length * (p.detune ? 2 : 1);
      p.freqs.forEach(f => {
        if (p.detune) {
          voice(ac, dest, prof.wave, f * Math.pow(2,  p.detune / 1200), t0, p, gain / n);
          voice(ac, dest, prof.wave, f * Math.pow(2, -p.detune / 1200), t0, p, gain / n);
        } else voice(ac, dest, prof.wave, f, t0, p, gain / p.freqs.length);
      });
    }
  }

  let lastTap = 0;
  function play(event) {
    if (S.sound === 'mute') return;
    if (event === 'tap') {
      const now = performance.now();
      if (now - lastTap < 90) return; lastTap = now;
    }
    synth(S.sound, event);
  }
  const preview = (profile, event) => synth(profile, event);

  /* ───────────────────────── THE CONSOLE ─────────────────────────
     Simulated analog potentiometers. Hold anywhere on a knob and
     drag around its center; discrete knobs click across detents and
     snap on release; the HUE pot is continuous with the palette
     chord plotted on its ring. All surfaces use the site's own CSS
     variables, so the console re-skins itself live — it IS the
     theme preview. */

  const SWEEP = 240;                          // detent-knob arc, degrees
  const mod360 = a => ((a % 360) + 360) % 360;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  /* Boombox slide selector. positions = [[value,label],...];
     LED lights over the live position; thumb drags or taps by slot. */
  function slideSwitch({ label, positions, value, onDetent, onLand, compact }) {
    const n = positions.length;
    const box = el('div', 'gsw' + (compact ? ' compact' : ''));

    const leds = el('div', 'gsw-leds');
    const ledEls = positions.map(() => { const l = el('div', 'led'); leds.appendChild(l); return l; });
    box.appendChild(leds);

    const track = el('div', 'gsw-track');
    const thumb = el('div', 'gsw-thumb');
    track.appendChild(thumb);
    box.appendChild(track);

    const labs = el('div', 'gsw-labs');
    const labEls = positions.map(p => { const s = el('span', '', p[1]); labs.appendChild(s); return s; });
    box.appendChild(labs);
    if (label) box.appendChild(el('div', 'gk-name', label));

    let cur = Math.max(0, positions.findIndex(p => p[0] === value));
    const place = () => {
      thumb.style.width = `calc(${100 / n}% - 4px)`;
      thumb.style.left  = `calc(${cur * 100 / n}% + 2px)`;
      ledEls.forEach((l, i) => l.classList.toggle('lit', i === cur));
      labEls.forEach((l, i) => l.classList.toggle('on', i === cur));
    };
    place();

    let dragging = false;
    const slotAt = e => {
      const b = track.getBoundingClientRect();
      return Math.max(0, Math.min(n - 1, Math.floor((e.clientX - b.left) / b.width * n)));
    };
    const moveTo = i => {
      if (i === cur) return;
      cur = i; place(); onDetent?.(positions[cur][0]);
    };
    track.addEventListener('pointerdown', e => {
      dragging = true; track.setPointerCapture(e.pointerId); moveTo(slotAt(e));
    });
    track.addEventListener('pointermove', e => { if (dragging) { e.preventDefault(); moveTo(slotAt(e)); } });
    const settle = () => { if (!dragging) return; dragging = false; onLand(positions[cur][0]); };
    track.addEventListener('pointerup', settle);
    track.addEventListener('pointercancel', settle);
    return box;
  }

  /* Bounded trim pot: 240° sweep, value -1..1, center detent = 0.
     Glove-friendly relative drag: touch anywhere on the knob, drag
     up/down; ~140px of travel spans the full range. */
  function trimKnob({ label, endLabels, value, onInput, onLand }) {
    const box = el('div', 'gk gk-trim');
    const dial = el('div', 'gk-dial');
    const face = el('div', 'gk-face');
    face.appendChild(el('div', 'gk-cap'));
    face.appendChild(el('div', 'gk-dot'));
    dial.appendChild(face);

    for (const m of [-SWEEP / 2, 0, SWEEP / 2]) {
      const t = el('div', 'gk-tick' + (m === 0 ? ' mid' : ''));
      t.style.transform = `rotate(${m}deg) translateY(-34px)`;
      dial.appendChild(t);
    }

    let v = value;
    const render = () => { face.style.transform = `rotate(${v * SWEEP / 2}deg)`; };
    render();

    let dragging = false, startY = 0, startV = 0, raf = 0, snapped = v === 0;
    dial.addEventListener('pointerdown', e => {
      dragging = true; dial.setPointerCapture(e.pointerId);
      startY = e.clientY; startV = v;
    });
    dial.addEventListener('pointermove', e => {
      if (!dragging) return;
      e.preventDefault();
      let nv = startV + (startY - e.clientY) / 70;    /* drag up = increase */
      nv = Math.max(-1, Math.min(1, nv));
      if (Math.abs(nv) < 0.06) nv = 0;               /* center detent */
      const nowSnapped = nv === 0;
      if (nowSnapped !== snapped) { snapped = nowSnapped; play('detent'); }
      v = nv;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; onInput(+v.toFixed(3)); render(); });
    });
    const settle = () => {
      if (!dragging) return; dragging = false;
      onLand(+v.toFixed(3)); play('toggle');
    };
    dial.addEventListener('pointerup', settle);
    dial.addEventListener('pointercancel', settle);

    box.appendChild(dial);
    const ends = el('div', 'gk-ends');
    ends.appendChild(el('span', '', endLabels[0]));
    ends.appendChild(el('span', '', endLabels[1]));
    box.appendChild(ends);
    box.appendChild(el('div', 'gk-name', label));
    return box;
  }

  /* Continuous 360° hue pot with the palette chord on its ring. */
  function hueKnob() {
    const box = el('div', 'gk gk-hue');
    const dial = el('div', 'gk-dial');
    const ring = el('canvas', 'gk-ring');
    const face = el('div', 'gk-face');
    face.appendChild(el('div', 'gk-cap'));
    face.appendChild(el('div', 'gk-dot'));
    dial.appendChild(ring); dial.appendChild(face);
    box.appendChild(dial);
    box.appendChild(el('div', 'gk-name', 'HUE'));

    let ang = S.hue;
    const render = () => { face.style.transform = `rotate(${ang}deg)`; };

    function drawRing() {
      const dpr = window.devicePixelRatio || 1;
      const w = dial.clientWidth || 128;
      ring.width = w * dpr; ring.height = w * dpr;
      ring.style.width = w + 'px'; ring.style.height = w + 'px';
      const x = ring.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = w / 2, R = w / 2 - 5;
      x.clearRect(0, 0, w, w);
      for (let a = 0; a < 360; a += 4) {          /* faint hue track */
        const rad = (a - 90) * Math.PI / 180;
        const rgb = oklabToRgb(0.68, 0.11 * Math.cos(a * Math.PI / 180), 0.11 * Math.sin(a * Math.PI / 180));
        x.beginPath();
        x.arc(c, c, R, rad, rad + 4.4 * Math.PI / 180);
        x.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`;
        x.lineWidth = 4; x.stroke();
      }
      const base = snapshotBase();                /* the chord */
      for (const [name, raw] of Object.entries(base)) {
        if (SKIP.test(name)) continue;
        const col = parseColor(raw); if (!col || col.a < 1) continue;
        const hc = hueChroma(col);
        if (hc.c < 0.02) continue;                // neutrals stay off the ring
        const a2 = (hc.h + S.hue - 90) * Math.PI / 180;
        const rot = rotateColor(col, S.hue);
        x.beginPath();
        x.arc(c + R * Math.cos(a2), c + R * Math.sin(a2), 5, 0, 7);
        x.fillStyle = toCss(rot); x.fill();
        x.lineWidth = 1.5;
        x.strokeStyle = hc.L > 0.55 ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.6)';
        x.stroke();
      }
    }

    /* Glove-friendly relative drag: touch anywhere, drag any
       direction — up or right increases (dx - dy blend). */
    let dragging = false, startX = 0, startY = 0, startAng = 0, raf = 0, lastDetent = 0;
    dial.addEventListener('pointerdown', e => {
      dragging = true; dial.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY; startAng = ang;
    });
    dial.addEventListener('pointermove', e => {
      if (!dragging) return;
      e.preventDefault();
      ang = startAng + ((e.clientX - startX) - (e.clientY - startY)) * 0.9;
      S.hue = Math.round(mod360(ang));
      const step = Math.floor(S.hue / 15);        /* soft detent ticks every 15° */
      if (step !== lastDetent) { lastDetent = step; play('detent'); }
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; applyTheme(); drawRing(); render(); });
    });
    const settle = () => { if (!dragging) return; dragging = false; save(); play('toggle'); };
    dial.addEventListener('pointerup', settle);
    dial.addEventListener('pointercancel', settle);

    let lastTapT = 0;                              /* double-tap = snap home */
    dial.addEventListener('pointerdown', () => {
      const now = performance.now();
      if (now - lastTapT < 300) {
        ang = 0; S.hue = 0; save(); applyTheme(); drawRing(); render(); play('success');
      }
      lastTapT = now;
    });

    render();
    requestAnimationFrame(drawRing);
    box._redraw = drawRing;
    return box;
  }

  function buildConsole() {
    const root = el('div', 'gs-console'); root.id = 'grush-settings';

    const head = el('div', 'gs-head');
    head.appendChild(el('div', 'gs-brand', 'settings'));
    const pwr = el('div', 'gs-pwr');
    const pled = el('div', 'led amber lit'); pwr.appendChild(pled);
    pwr.appendChild(el('span', '', 'PWR'));
    head.appendChild(pwr);
    root.appendChild(head);

    const hue = hueKnob();

    root.appendChild(slideSwitch({
      label: null, compact: true, value: S.base,
      positions: [['light', 'LIGHT'], ['dark', 'DARK']],
      onDetent: v => { S.base = v; applyTheme(); hue._redraw(); play('detent'); },
      onLand:   v => { S.base = v; save(); applyTheme(); hue._redraw(); play('toggle'); }
    }));

    root.appendChild(hue);

    const trims = el('div', 'gs-trims');
    trims.appendChild(trimKnob({
      label: 'TONE', endLabels: ['COOL', 'WARM'], value: S.tone,
      onInput: v => { S.tone = v; applyTheme(); },
      onLand:  v => { S.tone = v; save(); applyTheme(); }
    }));
    trims.appendChild(trimKnob({
      label: 'DEPTH', endLabels: ['DEEP', 'BRIGHT'], value: S.depth,
      onInput: v => { S.depth = v; applyTheme(); },
      onLand:  v => { S.depth = v; save(); applyTheme(); }
    }));
    trims.appendChild(trimKnob({
      label: 'CHROMA', endLabels: ['SOFT', 'VIVID'], value: S.chroma,
      onInput: v => { S.chroma = v; applyTheme(); hue._redraw(); },
      onLand:  v => { S.chroma = v; save(); applyTheme(); hue._redraw(); }
    }));
    root.appendChild(trims);

    const grid = el('div', 'gs-grid');
    grid.appendChild(slideSwitch({
      label: 'SOUND', value: S.sound,
      positions: [['mute', 'MUTE'], ['chill', 'CHILL'], ['assertive', 'ASSERT']],
      onDetent: v => { if (v !== 'mute') synth(v, 'detent'); },
      onLand:   v => { S.sound = v; save(); if (v !== 'mute') synth(v, 'reward'); }
    }));
    grid.appendChild(slideSwitch({
      label: 'TEXT', value: S.text,
      positions: [['small', 'S'], ['default', 'M'], ['large', 'L']],
      onDetent: () => play('detent'),
      onLand:   v => { S.text = v; save(); applyText(); play('toggle'); }
    }));
    root.appendChild(grid);
    return root;
  }

  function injectCSS() {
    if (document.getElementById('gs-css')) return;
    const st = el('style'); st.id = 'gs-css';
    st.textContent =
      /* ── panel: brushed metal, corner screws ── */
      '.gs-console{position:relative;margin:14px 4px 8px;padding:16px 12px 14px;' +
        'border:1.5px solid var(--line-strong,#5A554A);border-radius:14px;' +
        'background:' +
          'radial-gradient(circle 2.6px at 11px 11px, var(--line-strong,#5A554A) 0 1.8px, transparent 2.6px),' +
          'radial-gradient(circle 2.6px at calc(100% - 11px) 11px, var(--line-strong,#5A554A) 0 1.8px, transparent 2.6px),' +
          'radial-gradient(circle 2.6px at 11px calc(100% - 11px), var(--line-strong,#5A554A) 0 1.8px, transparent 2.6px),' +
          'radial-gradient(circle 2.6px at calc(100% - 11px) calc(100% - 11px), var(--line-strong,#5A554A) 0 1.8px, transparent 2.6px),' +
          'repeating-linear-gradient(90deg, rgba(255,255,255,.014) 0 1px, transparent 1px 3px),' +
          'var(--paper,#2A2620);' +
        'box-shadow:inset 0 1px 0 rgba(255,255,255,.06), var(--shadow,none);}' +
      '.gs-head{display:flex;align-items:center;justify-content:space-between;margin:0 8px 10px;}' +
      '.gs-brand{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-soft,#B0A99C);opacity:.7;}' +
      '.gs-pwr{display:flex;align-items:center;gap:5px;font-size:8px;letter-spacing:1.5px;color:var(--ink-soft,#B0A99C);opacity:.8;}' +
      /* ── LEDs ── */
      '.led{width:7px;height:7px;border-radius:50%;flex:0 0 auto;' +
        'background:color-mix(in srgb, var(--ink,#F0EDE2) 10%, var(--paper,#2A2620));' +
        'box-shadow:inset 0 1px 2px rgba(0,0,0,.55);transition:background .15s, box-shadow .15s;}' +
      '.led.lit{background:var(--green,#7E9A6E);' +
        'box-shadow:0 0 7px color-mix(in srgb, var(--green,#7E9A6E) 75%, transparent), inset 0 0 2px rgba(255,255,255,.45);}' +
      '.led.amber.lit{background:var(--amber,#C9973F);' +
        'box-shadow:0 0 7px color-mix(in srgb, var(--amber,#C9973F) 75%, transparent), inset 0 0 2px rgba(255,255,255,.45);}' +
      /* ── slide switches ── */
      '.gsw{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;max-width:132px;}' +
      '.gsw.compact{max-width:96px;margin:0 auto 4px;}' +
      '.gsw-leds{display:flex;width:100%;justify-content:space-around;}' +
      '.gsw-track{position:relative;width:100%;height:32px;border-radius:6px;touch-action:none;' +
        'background:color-mix(in srgb, black 28%, var(--paper,#2A2620));' +
        'border:1px solid var(--line-strong,#5A554A);box-shadow:inset 0 2px 5px rgba(0,0,0,.5);}' +
      '.gsw-thumb{position:absolute;top:2px;bottom:2px;border-radius:4px;cursor:grab;' +
        'background:repeating-linear-gradient(90deg, rgba(255,255,255,.09) 0 1px, transparent 1px 4px),' +
          'linear-gradient(180deg, var(--card,#34302A), var(--paper,#2A2620));' +
        'border:1px solid var(--line-strong,#5A554A);' +
        'box-shadow:0 2px 4px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12);' +
        'transition:left .12s cubic-bezier(.4,0,.2,1);}' +
      '.gsw-labs{display:flex;width:100%;justify-content:space-around;font-size:8.5px;letter-spacing:1px;' +
        'color:var(--ink-soft,#B0A99C);}' +
      '.gsw-labs span{opacity:.55;transition:opacity .15s,color .15s;}' +
      '.gsw-labs span.on{color:var(--green,#7E9A6E);opacity:1;font-weight:700;}' +
      /* ── rotary pots: ridged rim, smooth cap, LED pointer ── */
      '.gs-trims{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 10px;justify-items:center;margin:16px 0 4px;}' +
      '.gs-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 8px;justify-items:center;margin-top:16px;}' +
      '.gk{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:104px;}' +
      '.gk-hue{max-width:none;}' +
      '.gk-dial{position:relative;width:104px;height:104px;touch-action:none;}' +
      '.gk-hue .gk-dial{width:128px;height:128px;}' +
      '.gk-hue{margin:2px auto 0;}' +
      '.gk-trim .gk-dial{width:84px;height:84px;}' +
      '.gk-ends{display:flex;justify-content:space-between;width:100%;font-size:8px;letter-spacing:.8px;color:var(--ink-soft,#B0A99C);opacity:.65;margin-top:-2px;}' +
      '.gk-trim .gk-face{inset:10px;}' +
      '.gk-ring{position:absolute;inset:0;pointer-events:none;}' +
      '.gk-face{position:absolute;inset:14px;border-radius:50%;cursor:grab;' +
        'background:repeating-conic-gradient(' +
          'color-mix(in srgb, var(--ink,#F0EDE2) 16%, var(--paper,#2A2620)) 0deg 4deg,' +
          'var(--paper,#2A2620) 4deg 9deg);' +
        'border:1.5px solid var(--line-strong,#5A554A);' +
        'box-shadow:0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.08), inset 0 -2px 6px rgba(0,0,0,.35);}' +
      '.gk-face:active{cursor:grabbing;}' +
      '.gk-cap{position:absolute;inset:20%;border-radius:50%;' +
        'background:radial-gradient(circle at 35% 30%, var(--card,#34302A), var(--paper,#2A2620) 80%);' +
        'border:1px solid var(--line-strong,#5A554A);' +
        'box-shadow:inset 0 1px 0 rgba(255,255,255,.1), inset 0 -2px 4px rgba(0,0,0,.3);}' +
      '.gk-dot{position:absolute;left:50%;top:7%;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;' +
        'background:var(--amber,#C9973F);' +
        'box-shadow:0 0 6px color-mix(in srgb, var(--amber,#C9973F) 75%, transparent), inset 0 0 2px rgba(255,255,255,.4);}' +
      '.gk-tick{position:absolute;left:50%;top:50%;width:2px;height:7px;margin-left:-1px;margin-top:-3.5px;' +
        'background:var(--ink-soft,#B0A99C);opacity:.55;border-radius:1px;}' +
      '.gk-tick.mid{height:9px;background:var(--green,#7E9A6E);opacity:.8;}' +
      '.gk-name{font-size:10px;letter-spacing:2px;color:var(--ink-soft,#B0A99C);opacity:.85;}' +
      '.gs-gear{opacity:.55;transition:opacity .15s;}' +
      '.gs-gear:active{opacity:1;}';
    document.head.appendChild(st);
  }

  /* ─────────────────────── injection & boot ─────────────────────── */

  function injectUI() {
    injectCSS();

    const panel = document.getElementById('panel');
    if (panel && !document.getElementById('grush-settings'))
      panel.appendChild(buildConsole());

    const topbar = document.querySelector('.topbar');
    if (topbar && !topbar.querySelector('.gs-gear')) {
      const gear = el('button', 'iconbtn gs-gear', '⚙︎');
      gear.type = 'button'; gear.setAttribute('aria-label', 'Settings');
      gear.dataset.gsControl = '1';
      gear.addEventListener('click', openSettings);
      topbar.appendChild(gear);
    }

    /* site-wide tap sound, delegated; console knobs voice their own */
    document.addEventListener('click', e => {
      const t = e.target.closest('button, .tile, .menu-item, .option-card');
      if (t && !t.dataset.gsControl && !t.closest('.gs-console')) play('tap');
    }, true);
  }

  function openSettings() {
    if (typeof window.openMenu === 'function') window.openMenu();
    play('open');
    const sec = document.getElementById('grush-settings');
    if (sec) setTimeout(() => sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
  }

  applyTheme();                                    // pre-paint, in <head>
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', injectUI);
  else injectUI();

  return {
    play, preview, openSettings,
    get: () => ({ ...S }),
    set: patch => { Object.assign(S, patch); save(); applyTheme(); },
    _profiles: PROFILES
  };
})();
