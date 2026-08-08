/* ═══════════════════════════════════════════════════════════════════════
   grush-tool.js — the tool contract.

   EXTRACTED, NOT DESIGNED. Every behaviour here was written twice by hand
   first — once in mixbench.html, once in irrigation-bom.html — and only
   then pulled out. Nothing in this file is speculative. If a capability
   is missing it is because no tool has needed it yet, and that is the
   correct reason for it to be missing.

   WHAT A GRUSH TOOL IS
     A page with inputs, a computed result, and a printable artifact.
     That is the whole definition. Both reference tools fit it without
     stretching, which is why it is the definition.

   MODE, NOT ACCESS
     The visitor/staff line is whether a result PERSISTS, not whether the
     tool runs. Neither reference tool gates anything, because neither has
     anything to protect: static tables and arithmetic over numbers the
     visitor typed. A visitor using the tool and printing the result IS
     the demonstration. Hiding it protects nothing and shows nothing.

     Today no tier persists anything, so the banner says exactly that
     rather than implying a locked door that does not exist.

   ROLE READS ARE OPTIONAL AND GUARDED
     grush-auth.js declares `const GRUSH` — a lexical binding that never
     appears on window. mixbench once looked for window.GrushAuth, on a
     page that never loaded grush-auth.js at all, and its entire estimator
     panel shipped invisible to every user for months. Nobody noticed,
     because the failure path was "show nothing".

     So: read the bare name inside a try, bail silently, and NEVER add a
     dependency merely to change a sentence. A tool must work with the
     auth layer absent.

   PRINT IS THE VISITOR'S ONLY ARTIFACT
     It therefore carries its own inputs and a provenance line. A sheet of
     quantities that does not record what produced it cannot be checked,
     repeated, or ordered against a week later.

   THE REAL BOUNDARY IS POSTGRES
     Everything here shows and hides UI. Row-level security is what
     actually enforces. Never confuse the two.

   ── USE ────────────────────────────────────────────────────────────────
     <script src="grush-tool.js"></script>
     <script>
       GrushTool.mount({
         id:      'irrigation-bom',
         title:   'Irrigation bill of materials',
         banner:  '#ibMode',       // empty div; the banner renders into it
         echo:    '#ibEcho',       // empty div; print-only input echo
         print:   '#pb',           // existing button, or omit
         inputs:  ['sGpm','sGph','sSpacing','sZones'],
         labels:  { sGpm:'Supply GPM', sGph:'Emitter' },   // optional
         footer:  'quantities are a planning figure, not a purchase order',
         site:    'Lancer Farms & Gardens \u00b7 lancerfarms.com'
       });
     </script>

   Everything is optional except id and title. A tool with no inputs still
   gets a banner; a tool with no print button still gets an echo it can
   trigger itself via GrushTool.print(id).
   ═══════════════════════════════════════════════════════════════════════ */
window.GrushTool = (function () {
  'use strict';

  var TOOLS = {};

  /* ── styles, injected once ───────────────────────────────────────────
     Colours resolve against whatever the host page defines and fall back
     to literals, so a tool keeps its own palette. The contract governs
     structure and behaviour, never appearance. */
  var CSS = [
    '.gt-modebar{border:1px solid var(--line,#22304d);border-left:3px solid var(--amber,#ffb830);',
    '  border-radius:10px;padding:13px 16px;margin:0 0 22px;background:rgba(255,184,48,.06);}',
    '.gt-modebar[data-mode="staff"]{border-left-color:var(--cyan,#00c8ff);background:rgba(0,200,255,.06);}',
    '.gt-tag{display:block;font-size:.66rem;font-weight:600;letter-spacing:.16em;',
    '  text-transform:uppercase;color:var(--amber,#ffb830);margin-bottom:5px;',
    '  font-family:var(--f-mono,ui-monospace,monospace);}',
    '.gt-modebar[data-mode="staff"] .gt-tag{color:var(--cyan,#00c8ff);}',
    '.gt-why{margin:0;font-size:.9rem;line-height:1.5;color:var(--dim,#8fa3c4);}',
    '.gt-echo{display:none;} .gt-sig{display:none;}',
    '@media print{',
    '  .gt-modebar{display:none!important;}',
    '  .gt-echo{display:block!important;margin:0 0 14px;padding:9px 0;',
    '    border-top:1px solid #999;border-bottom:1px solid #999;',
    '    font-family:var(--f-mono,ui-monospace,monospace);font-size:9.5pt;',
    '    line-height:1.6;color:#000;}',
    '  .gt-echo b{font-weight:600;}',
    '  .gt-sig{display:block!important;margin-top:16px;padding-top:9px;',
    '    border-top:1px solid #ccc;font-family:var(--f-mono,ui-monospace,monospace);',
    '    font-size:8pt;letter-spacing:.1em;color:#666;}',
    '  @page{margin:14mm;}',
    '}'
  ].join('\n');

  var styled = false;
  function injectCSS() {
    if (styled) return;
    styled = true;
    var s = document.createElement('style');
    s.id = 'grush-tool-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function $(sel) { return sel ? document.querySelector(sel) : null; }

  /* Readable value of a control: the selected option's TEXT, not its
     value. "0.4" means nothing on a printout; "0.4 GPH pressure-
     compensating" does. */
  function readable(el) {
    if (!el) return null;
    if (el.options && el.selectedIndex >= 0) {
      var o = el.options[el.selectedIndex];
      return o ? o.text : el.value;
    }
    return el.value;
  }

  /* Best label for a control, in order of quality:
       1. an explicit override in cfg.labels
       2. the page's own <label for="id"> text — it is already written for
          humans, so prefer it over anything we can derive
       3. the id, de-prefixed and split on camelCase: sGph -> "Gph",
          fBedSize -> "Bed Size". A last resort, not a good outcome. */
  function labelFor(t, id) {
    if (t.labels[id]) return t.labels[id];

    var lab = document.querySelector('label[for="' + id + '"]');
    if (lab) {
      var txt = (lab.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt) return txt;
    }

    return String(id)
      .replace(/^[a-z](?=[A-Z])/, '')          /* drop an sX / fX / wX prefix */
      .replace(/([a-z])([A-Z])/g, '$1 $2')     /* split camelCase           */
      .replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
  }

  function titleCase(s) {
    return String(s).replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
  }

  function mount(cfg) {
    if (!cfg || !cfg.id) { console.warn('[grush-tool] mount needs an id'); return; }
    injectCSS();

    var t = {
      id: cfg.id,
      title: cfg.title || cfg.id,
      inputs: cfg.inputs || [],
      labels: cfg.labels || {},
      footer: cfg.footer || '',
      site: cfg.site || '',
      bannerEl: $(cfg.banner),
      echoEl: $(cfg.echo),
      role: 'visitor'
    };
    TOOLS[t.id] = t;

    /* ── banner ── */
    if (t.bannerEl) {
      t.bannerEl.className = 'gt-modebar';
      t.bannerEl.setAttribute('data-mode', 'visitor');
      t.bannerEl.innerHTML =
        '<span class="gt-tag">Nothing here is saved</span>' +
        '<p class="gt-why">Everything you enter stays in this browser tab and is gone ' +
        'when you close it. Print to keep it.</p>';
    }

    /* ── echo ── */
    if (t.echoEl) {
      t.echoEl.classList.add('gt-echo');
      buildEcho(t);
      t.inputs.forEach(function (id) {
        var e = document.getElementById(id);
        if (!e) return;
        e.addEventListener('change', function () { buildEcho(t); });
        e.addEventListener('input', function () { buildEcho(t); });
      });
    }

    /* ── signature, appended after the echo's parent ── */
    if (t.site || t.footer) {
      var sig = document.createElement('div');
      sig.className = 'gt-sig';
      sig.textContent = [t.site, t.footer, 'powered by grush']
        .filter(Boolean).join(' \u00b7 ');
      var host = t.echoEl ? t.echoEl.parentNode : document.body;
      host.appendChild(sig);
    }

    /* ── print ── */
    var pb = $(cfg.print);
    if (pb) pb.addEventListener('click', function () { print(t.id); });

    /* ── role, optional ── */
    readRole(t);
    return t;
  }

  function buildEcho(t) {
    if (!t.echoEl) return;
    var parts = t.inputs.map(function (id) {
      var v = readable(document.getElementById(id));
      if (v === null || v === '') return null;
      return labelFor(t, id) + ': ' + v;
    }).filter(Boolean);

    t.echoEl.innerHTML =
      '<b>' + t.title + '</b> \u00b7 ' + new Date().toLocaleDateString() +
      (parts.length ? '<br>' + parts.join(' \u00b7 ') : '');
  }

  function print(id) {
    var t = TOOLS[id];
    if (t) buildEcho(t);
    window.print();
  }

  /* Read the bare GRUSH name, guarded. See the header: assuming an
     interface that was never loaded is what cost mixbench its estimator. */
  function readRole(t) {
    var G;
    try { G = GRUSH; } catch (e) { return; }
    if (!G || !G.sb || typeof G.session !== 'function') return;

    G.session().then(function (sess) {
      if (!sess) return;
      return G.sb.rpc('grush_role').then(function (r) {
        if (r.error || !r.data || r.data === 'visitor') return;
        t.role = r.data;
        if (!t.bannerEl) return;
        t.bannerEl.setAttribute('data-mode', 'staff');
        t.bannerEl.querySelector('.gt-tag').textContent = 'Signed in as ' + r.data;
        t.bannerEl.querySelector('.gt-why').textContent =
          'This result still is not saved anywhere \u2014 no tier stores it yet. ' +
          'Print it to keep it.';
      });
    }).catch(function () { /* stay on the visitor wording */ });
  }

  return {
    mount: mount,
    print: print,
    echo: function (id) { buildEcho(TOOLS[id]); },
    role: function (id) { return TOOLS[id] ? TOOLS[id].role : 'visitor'; },
    tools: function () { return Object.keys(TOOLS); }
  };
})();
