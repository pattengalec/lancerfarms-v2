# The Grush tool contract

*Extracted from two working tools, not designed in advance.*

Grush is an overlay. It sits on top of a site an organisation already has
and turns it into a management system, without the underlying site
depending on it. Deleting the overlay must leave the original intact.

This document defines what a **tool** is inside that overlay. It exists
because a set of tools with no shared contract is anatomy without
physiology — the parts are there and nothing connects them.

---

## Where this came from

Every rule below was written twice by hand before it was written down
once here. The reference implementations are `mixbench.html` and
`irrigation-bom.html` in the `lancerfarms-v2` repo. `grush-tool.js` is
the extraction.

That order matters. A framework designed before its first use fits
nothing; a framework extracted from one example is that example wearing a
costume. Two is the minimum honest sample, and even then the contract
should stay small.

**Nothing is in this contract because it seemed like a good idea.** If a
capability is missing, it is missing because no tool has needed it yet.
That is the correct reason.

---

## 1. What a tool is

> A page with inputs, a computed result, and a printable artifact.

That is the entire definition. If a page has no inputs it is a document,
not a tool, and the contract does not apply to it. If it has inputs but
produces nothing to keep, it is not finished.

Both reference tools fit without stretching, which is why this is the
definition rather than something more ambitious.

### Two kinds of tool, only one of which has a visitor mode

**Tools that compute** take input and produce an answer — a mix ratio, a
bill of materials, a water demand. A visitor plugging in their own
numbers gets something genuinely useful, and the printout is a real
deliverable. These are dual-mode.

**Tools that record** log what happened on a specific site — tasks, photos,
inventory, activity. A visitor "logging activity" ephemerally is not a
demonstration, it is a toy: there is no operation behind it, so the output
means nothing and printing it is meaningless. These are staff-only.

Do not give a recording tool a visitor mode. It has nothing to say.

---

## 2. Mode, not access

**The visitor/staff line is whether a result persists — never whether the
tool runs.**

Neither reference tool gates anything, because neither has anything to
protect: static tables and arithmetic over numbers the visitor typed. A
visitor using the tool and printing the result *is* the demonstration.
Hiding it protects nothing and shows nothing.

State what is true, not what is forbidden:

> **Nothing here is saved.** Everything you enter stays in this browser
> tab and is gone when you close it. Print to keep it.

A banner that implies a locked door which does not exist is a lie in the
interface, and it teaches people the product is smaller than it is.

### Ephemeral means `sessionStorage`

If a tool needs to hold state across a reload within one visit, use
`sessionStorage` — it clears when the tab closes, which is exactly the
requirement. `localStorage` survives the visit and breaks the promise the
banner just made.

---

## 3. Role reads are optional and guarded

`grush-auth.js` declares `const GRUSH`: a **lexical binding that never
appears on `window`.**

```js
var G;
try { G = GRUSH; } catch (e) { return; }   // correct
var G = window.GrushAuth;                  // silently always null
```

This is not a hypothetical. `mixbench.html` looked for `window.GrushAuth`,
on a page that never loaded `grush-auth.js` at all, and its entire Stock &
budget estimator panel shipped **invisible to every user, including
admins, for months**. Nobody noticed, because the failure path was "show
nothing".

Three rules follow:

1. Read the bare name inside a `try`. Bail silently if absent.
2. **A tool must work with the auth layer absent.** Role only changes what
   the banner says.
3. **Never add a dependency merely to change a sentence.** Pulling in
   `supabase-js` and `grush-auth.js` — tens of kilobytes — so a banner can
   read "staff" instead of "visitor" is the same mistake in a new coat.

---

## 4. Print is the visitor's only artifact

So it has to be good.

- **Echo the inputs.** A sheet of quantities that does not record what
  produced it cannot be checked, repeated, or ordered against a week
  later. Echo the *readable* value — `0.4 GPH pressure-compensating`, not
  `0.4`.
- **Stamp the date.**
- **Carry provenance**: the site, an honest disclaimer of what the figure
  is not, and `powered by grush`.
- **Strip the interface.** Input fields, tabs, navigation and the mode
  banner do not belong on paper. The result does.
- **Force black on white.** A dark interface prints as a solid block of
  ink otherwise.

---

## 5. The real boundary is Postgres

Everything in this contract shows and hides UI. **Row-level security is
what actually enforces.** A client-side check is a convenience for the
person using the tool, never a security boundary, and it must never be
described as one in a comment or a commit message.

This is also why visitor mode is safe by construction: RLS refuses
anonymous writes to site tables, so a front-end bug cannot turn a visitor
into a writer.

---

## 6. Deliberately undefined

**How a staff result persists.**

Neither reference tool has ever written a record, so persistence has no
proven shape. Designing it now would mean inventing the generic system
from imagination — the exact failure this extraction-first approach was
chosen to avoid.

It gets defined when a third tool actually needs it, and not before.

---

## 7. Copy, do not hotlink

Each Grush-powered site keeps its **own copy** of `grush-tool.js` and the
mark. A cross-repo reference means removing the overlay from a deployment
leaves a dangling request to a domain that deployment may no longer have
any relationship with.

Duplication is the correct answer when independence is the requirement.

### Styling is not yet duplication — it is two files that agree by coincidence

`grush-brand.css` is the portable token layer. It says so in its own
header, and means it literally: no component rules belong there, only
values. `grush-tokens.css`, in `lancerfarms-v2`, is not a copy of it. It
is the farm's own theme — a second surface for visitor-facing pages,
component rules for `.card` and `body` and focus states, and a set of
token names that happen to hold the same hex values as nine of
`grush-brand.css`'s tokens, because both were tuned toward the same
palette by hand rather than one importing the other.

That agreement is not guaranteed to hold. It held today because someone
checked. The honest state is: two files, values close by discipline, not
by mechanism.

**Deliberately undefined:** whether a third deployment should copy
`grush-brand.css` directly, or write its own theme file the way
`lancerfarms-v2` did. Both single-tool sites have only ever needed the
second pattern. It gets decided when a deployment actually needs the
first, and not before.

---

## Conformance checklist

A tool conforms when all of these are true:

- [ ] It has inputs, a computed result, and a printable artifact
- [ ] It runs for a visitor — nothing is hidden that has nothing to protect
- [ ] Its banner states what persists, not what is forbidden
- [ ] Any role read is guarded and optional; the tool works without auth
- [ ] It adds no dependency it does not functionally need
- [ ] Print echoes the readable inputs, the date, and provenance
- [ ] Print strips the interface and forces black on white
- [ ] Any ephemeral state uses `sessionStorage`, never `localStorage`
