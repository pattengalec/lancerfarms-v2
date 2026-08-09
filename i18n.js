/* ═══════════════════════════════════════════════════════════════════════
   i18n.js — Spanish translation of the visitor chrome.

   WHAT CHANGED AND WHY.

   The previous dictionary carried en, es, fr and pt across 38 keys — and
   0 of 38 matched the live copy on learn.html, do.html or see.html. It
   had been written against wording since rewritten, so wiring it up would
   have changed the ENGLISH text too, not only the translations. It was
   rebuilt rather than repaired.

   ONE LANGUAGE, ON PURPOSE.
   CBU has roughly 316 international students across more than 60
   countries — five to fifteen people per language. Hand-maintaining
   ~8,400 words of site copy in twenty languages for cohorts that size is
   not sustainable, and the previous attempt demonstrates the failure
   mode: dictionaries drift away from the pages they describe.

   Riverside is a different matter. Latinos are about 53% of the city's
   population, so Spanish has a large, local, permanent audience. That is
   the one language worth carrying by hand.

   EVERY OTHER LANGUAGE IS THE BROWSER'S JOB.
   Chrome, Safari and Edge translate pages natively into ~100 languages,
   and they translate EVERYTHING — including plant summaries and how-to
   cards that live in Postgres and can never appear in a file like this.
   It costs nothing to maintain and cannot drift. The job is to keep the
   site translatable, not to translate it: real DOM text, correct lang
   attributes, and translate="no" on the things that must not be touched.

   SCOPE. Visitor chrome only — the tiles, headings and buttons a Spanish
   speaker meets first. Plant records, the triage tree and the manual are
   left to the browser deliberately: hand-translating a decision tree
   about plant health and getting one branch wrong is worse than not
   translating it at all.

   REVIEW STATUS: unreviewed by a native speaker. These read correctly to
   me, and "reads correctly to me" is not the standard for text a stranger
   will act on. Have someone check them before you rely on it.
   ═══════════════════════════════════════════════════════════════════════ */
window.I18N = {
  langs: ['en', 'es'],
  dict: {
    en: {
      'role.enter'      : 'Enter the farm',
      'role.enter_sub'  : 'Tools, records and what grows here',
      'req.link'        : 'Work here? Request access',

      'hub.place'       : 'Riverside, CA \u00b7 Zone 9b',
      'tile.see'        : 'See',
      'tile.see_sub'    : 'Photos from the beds and grounds',
      'tile.learn'      : 'Learn',
      'tile.learn_sub'  : 'What grows here, and what it needs',
      'tile.do'         : 'Do',
      'tile.do_sub'     : 'Work out spacing, water and timing',
      'tile.share'      : 'Share',
      'tile.share_sub'  : 'Leave a note for the farm',
      'hub.staff'       : 'Staff login \u2192',

      'learn.title'     : 'Learn',
      'learn.intro'     : 'Every plant growing at the farm, what it is, and how long it takes.',

      'do.soil_h'       : 'How much soil does a bed take?',
      'do.ready_h'      : 'When will it be ready?',
      'do.bed'          : 'Bed',
      'do.depth'        : 'Fill depth (in)',
      'do.bag'          : 'Bag size',
      'do.plant'        : 'Plant',
      'do.planted'      : 'Planted on',
      'do.cuft'         : 'cubic feet',

      'see.title'       : 'See',
      'see.intro'       : 'Photographs from the beds and grounds, taken by the caretaker crew.',

      'share.title'     : 'Share',
      'share.intro'     : 'Leave a note for the crew, or pass the farm along to someone else.',
      'share.share_h'   : 'Share the farm',
      'share.note_h'    : 'Leave a note',
      'share.send'      : 'Send note',
      'share.notes_h'   : 'Notes from visitors',

      'back'            : '\u2190 Back',
      'back.farm'       : '\u2190 Back to the farm',
      'loading'         : 'Loading\u2026',
      'managed'         : 'managed by'
    },

    es: {
      'role.enter'      : 'Entrar a la granja',
      'role.enter_sub'  : 'Herramientas, registros y lo que crece aqu\u00ed',
      'req.link'        : '\u00bfTrabajas aqu\u00ed? Solicita acceso',

      'hub.place'       : 'Riverside, CA \u00b7 Zona 9b',
      'tile.see'        : 'Ver',
      'tile.see_sub'    : 'Fotos de los bancales y los jardines',
      'tile.learn'      : 'Conocer',
      'tile.learn_sub'  : 'Qu\u00e9 crece aqu\u00ed y qu\u00e9 necesita',
      'tile.do'         : 'Hacer',
      'tile.do_sub'     : 'Calcula espaciado, riego y tiempos',
      'tile.share'      : 'Compartir',
      'tile.share_sub'  : 'Deja un mensaje para la granja',
      'hub.staff'       : 'Acceso del personal \u2192',

      'learn.title'     : 'Conocer',
      'learn.intro'     : 'Cada planta que crece en la granja, qu\u00e9 es y cu\u00e1nto tarda.',

      'do.soil_h'       : '\u00bfCu\u00e1nta tierra necesita un bancal?',
      'do.ready_h'      : '\u00bfCu\u00e1ndo estar\u00e1 listo?',
      'do.bed'          : 'Bancal',
      'do.depth'        : 'Profundidad de llenado (pulg)',
      'do.bag'          : 'Tama\u00f1o del saco',
      'do.plant'        : 'Planta',
      'do.planted'      : 'Sembrado el',
      'do.cuft'         : 'pies c\u00fabicos',

      'see.title'       : 'Ver',
      'see.intro'       : 'Fotograf\u00edas de los bancales y los jardines, tomadas por el equipo de cuidadores.',

      'share.title'     : 'Compartir',
      'share.intro'     : 'Deja un mensaje para el equipo, o comparte la granja con alguien m\u00e1s.',
      'share.share_h'   : 'Comparte la granja',
      'share.note_h'    : 'Deja un mensaje',
      'share.send'      : 'Enviar mensaje',
      'share.notes_h'   : 'Mensajes de visitantes',

      'back'            : '\u2190 Volver',
      'back.farm'       : '\u2190 Volver a la granja',
      'loading'         : 'Cargando\u2026',
      'managed'         : 'gestionado por'
    }
  }
};

/* ── applying it ─────────────────────────────────────────────────────── */

function setSiteLang(l) {
  if (!window.I18N.dict[l]) l = 'en';
  try { localStorage.setItem('lfg_lang', l); } catch (e) {}

  /* The lang attribute is not cosmetic. It tells a browser translator what
     it is starting FROM, and it tells a screen reader which voice to use.
     Leaving it at "en" on a Spanish page makes both worse. */
  document.documentElement.setAttribute('lang', l);

  var d = window.I18N.dict[l], en = window.I18N.dict.en;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    var v = d[k] !== undefined ? d[k] : en[k];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    var k = el.getAttribute('data-i18n-ph');
    var v = d[k] !== undefined ? d[k] : en[k];
    if (v !== undefined) el.setAttribute('placeholder', v);
  });

  document.querySelectorAll('.lang-switch button').forEach(function (b) {
    b.classList.toggle('on', b.getAttribute('data-l') === l);
  });
}

function buildSwitches() {
  var cur = 'en';
  try { cur = localStorage.getItem('lfg_lang') || 'en'; } catch (e) {}
  var codes = { en: 'EN', es: 'ES' };

  document.querySelectorAll('[data-lang-switch]').forEach(function (box) {
    if (box.getAttribute('data-built')) return;
    box.setAttribute('data-built', '1');
    box.classList.add('lang-switch');
    /* Never translate the switch. EN and ES are labels for languages, not
       words in a sentence, and a translator will happily mangle them. */
    box.setAttribute('translate', 'no');

    window.I18N.langs.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = codes[l] || l.toUpperCase();
      b.setAttribute('data-l', l);
      b.setAttribute('lang', l);
      if (l === cur) b.classList.add('on');
      b.addEventListener('click', function () { setSiteLang(l); });
      box.appendChild(b);
    });

    /* Point at the tool that covers the other sixty. Two buttons cannot
       serve a campus drawing from 60+ countries, and implying otherwise is
       worse than naming the thing that can. */
    if (!box.parentNode.querySelector('.lang-hint')) {
      var hint = document.createElement('span');
      hint.className = 'lang-hint';
      hint.textContent = '\u00bfOtro idioma? Use su navegador \u00b7 Other language? Use your browser';
      box.parentNode.insertBefore(hint, box.nextSibling);
    }
  });
}

function injectSwitchCSS() {
  if (document.getElementById('lang-switch-css')) return;
  var st = document.createElement('style');
  st.id = 'lang-switch-css';
  st.textContent =
    '.lang-switch{display:inline-flex;gap:2px;background:rgba(255,255,255,.06);' +
      'border-radius:999px;padding:3px;vertical-align:middle;}' +
    '.lang-switch button{border:0;background:none;cursor:pointer;font-family:inherit;' +
      'font-size:12px;font-weight:600;letter-spacing:.3px;color:#9a978d;padding:7px 12px;' +
      'border-radius:999px;line-height:1;transition:color .15s,background .15s;}' +
    '.lang-switch button:hover{color:#F0EDE6;}' +
    '.lang-switch button.on{background:rgba(255,255,255,.13);color:#F0EDE6;}' +
    '.lang-hint{display:block;margin-top:7px;font-size:11px;line-height:1.4;opacity:.55;}';
  document.head.appendChild(st);
}

document.addEventListener('DOMContentLoaded', function () {
  injectSwitchCSS();
  buildSwitches();
  var l = 'en';
  try { l = localStorage.getItem('lfg_lang') || 'en'; } catch (e) {}
  setSiteLang(l);
});
