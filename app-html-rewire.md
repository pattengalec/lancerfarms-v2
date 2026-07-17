# app.html rewire — exact diffs

Against `lancerfarms-v2/app.html` @ 2026-07-10. Line numbers are pre-edit;
work **bottom-up** (start at 956, end at line 2) so earlier edits don't shift
later ones.

For `funguyfungi.org/app.html`: identical, except `data-grush-site="fgf"` and
the table names are `fgf_*`.

---

## 1 — line 2: declare the site

```html
<!-- before -->
<html lang="en">
<!-- after -->
<html lang="en" data-grush-site="lfg">
```

This is the only per-site difference in the whole module. It's what makes one
`grush-auth.js` serve both farms instead of a fifth copy-paste.

---

## 2 — lines 451-455: one client, not two

`grush-auth.js` reads `window.SUPABASE_ANON_KEY`, so the key must be on
`window` **before** the module loads — a top-level `const` in a classic script
is not. Split the block:

```html
<!-- before -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
const SUPABASE_URL='https://gblizuknnvguxyxfequh.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
```

```html
<!-- after -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  window.SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // same key, unchanged
</script>
<script src="grush-auth.js"></script>
<script>
const sb = GRUSH.sb;          // ONE client. Do not call createClient again.
```

Keep the key exactly as it is. It is public by design — it was never the
problem. The password was.

---

## 3 — line 457: delete the hardcoded crew

```js
// before
const CREW = ['Chad','Maria','Sam','Guest'];
// after — deleted. Roster lives in grush_people; 'Guest' is gone on purpose.
let CREW = [];   // {id, display_name}, filled by loadCrew()
```

---

## 4 — line 522: load the roster on entry

```js
// before
function enterStaff(){
  go('hub');
  loadAreas(); loadTasks(); loadInventory(); refreshApproveBadge();
}
// after
async function enterStaff(){
  go('hub');
  await loadCrew();
  loadAreas(); loadTasks(); loadInventory(); refreshApproveBadge();
}
async function loadCrew(){
  CREW = await GRUSH.crew();
  if(!CREW.length) toast('No crew on the roster — add one in admin');
}
```

Fetch once on entry, so the render at line 560 stays synchronous and you don't
have to thread `async` through the whole render path.

---

## 5 — line 560: render from the roster

```js
// before
document.getElementById('who-grid').innerHTML=CREW.map(n=>'<button class="chip" style="min-height:52px" onclick="pickWho(this,\''+n+'\')">'+n+'</button>').join('');
// after
document.getElementById('who-grid').innerHTML=CREW.map(p=>
  '<button class="chip" style="min-height:52px" onclick="pickWho(this,\''+p.id+'\')">'+esc(p.display_name)+'</button>'
).join('');
```

Passing `p.id`, not the name — names get edited, ids don't. `esc()` already
exists at line 658.

---

## 6 — line 569: pickWho stores the person

```js
// before
function pickWho(el,n){ ...; state.who=n; }
// after
function pickWho(el,id){
  el.parentElement.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  const p = CREW.find(x=>x.id===id);
  state.who = p || null;
  if(p) GRUSH.setWho(p);          // persists across reloads
}
```

---

## 7 — lines 598-601: the log insert

```js
// before
logged_by: state.who || 'Staff',
approval_status: 'pending',
submitted_by: state.who || 'Staff'
// after
...GRUSH.stamp({}, { fields:['logged_by','submitted_by'] }),
approval_status: 'pending',
```

`state.who` is now an object — left as-is it would have written
`[object Object]` into `logged_by`. `stamp()` resolves the name.

---

## 8 — line 660, 695, 956: kill the 'staff' literal

These three are the actual bug: attribution hardcoded to a string.

```js
// 660 — before
.insert({task_id:id, completed_by:'staff', task_title:title})
// 660 — after
.insert(GRUSH.stamp({task_id:id, task_title:title}, { fields:['completed_by'] }))
```

```js
// 695 — before
const row={ title, recurrence_type:editRecur, area_id:area, created_by:'staff' };
// 695 — after
const row=GRUSH.stamp({ title, recurrence_type:editRecur, area_id:area }, { fields:['created_by'] });
```

```js
// 956 — before
uploaded_by:'staff', approval_status:'pending', submitted_by:'staff'
// 956 — after
...GRUSH.stamp({}, { fields:['uploaded_by','submitted_by'] }),
approval_status:'pending'
```

---

## Guard: unattributed writes

`stamp()` falls back to `'Unattributed'` rather than throwing, so a crew member
who never taps a chip still saves their work — losing the record is worse than
losing the name. If you'd rather block it, add to `submitLog()`:

```js
if(!GRUSH.who()){ toast('Tap your name first'); return; }
```

I'd leave it soft until the roster's been in real use for a week.

---

## Not in this diff

`actor_id` — `stamp()` writes it only when the column exists. Adding
`actor_id uuid references grush_people(id)` to the log tables is the first real
move of the shared core, and it's what finally makes attribution a foreign key
instead of a free-text string that nobody validates. Separate migration,
separate conversation.
