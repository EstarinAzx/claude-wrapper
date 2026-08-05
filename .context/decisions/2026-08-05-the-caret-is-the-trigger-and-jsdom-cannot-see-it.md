---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# The caret is the trigger, and jsdom cannot see it

**Decision:** #118 (`8a58686`) ships `@` file references in the composer as
**typing assistance only**, over a listing the app generates itself, behind a
main-side containment boundary. The send path is untouched.

The four owner calls it was blocked on were taken on #115 with warrants and then
confirmed by the owner:

1. **Trigger window** — `@` fires at start-of-input or after whitespace, closes
   on whitespace or Esc. This is `/`'s rule **minus its index-0 clause**: A4b
   records that clause's reason as *"a slash command only expands as the first
   token"*, which does not transfer to a mid-sentence token, while its
   whitespace half is about token boundaries and does. An email address does not
   open a file picker.
2. **Accept** inserts at the cursor and replaces **only the `@token`** — the same
   A4b line read the other way. `/` replaces the whole value because a slash
   command *is* the whole first token; doing that here would delete the prose.
3. **The list** prunes `node_modules`/`.git`/`out`/`dist` unconditionally
   (#116 priced this at 3ms/356 files against 192ms/18,349 — a cost fact) and
   honours the root `.gitignore` (the CLI's own `respectGitignore` defaults
   true). The cap is on what the **popover renders**, never on what main
   returns: capping in main would make a file's reachability depend on walk
   order, which is invisible to the user.
4. **An accepted reference is a separate surface** and spends no attachment slot.
   It travels as text and never becomes an attachment, so A7b's 10-slot budget
   is not involved.

## The durable half: a green suite proved the popover worked, and it did not

The composer read the caret off React's synthetic `onSelect` **event target**,
with a `?? 0` fallback. In jsdom the target *is* the textarea, so all 21 composer
tests passed and every assertion about the trigger window, the accept and the
ranking was green. In Chromium the fallback reports the caret at index 0, which
**closes the window on the very gesture meant to open it** — `gui-118.mjs` failed
its accept step against a fully green suite, and the popover never opened at all
on the first real-window run.

The generalisation is sharper than "test in a browser". **This feature's trigger
is the caret, and the caret is the one piece of composer state jsdom models
differently from a real browser** — `onSelect` is delivered through
document-level selection tracking and does not fire for an unfocused element at
all. So a control keyed on caret position has a whole class of behaviour that is
structurally unreachable from the suite, and the correct response is not more
jsdom tests but a driver. Near-sibling of
[[2026-08-05-an-accepted-call-is-not-a-supported-route]]: there a call was
accepted and inert, here a test was green and blind.

Two corollaries worth keeping:

- **Read caret state off the ref, never off a synthetic event target**, and never
  fall back to `0` — `0` is a *valid* caret position, so the fallback is
  indistinguishable from a real answer.
- The same trap caught the driver itself. Its first version never focused the
  textarea, so `onSelect` never fired and every mid-string case silently tested a
  closed window. The fix is one `el.focus()`, and it is load-bearing rather than
  tidiness.

## Escape rejection is a safety property, not a validation

`src/main/workspace-files.ts` is a **new main-side surface with a new trust
boundary** — nothing in `src/main/` enumerated the open workspace before; the
only `readdir`s were pointed at `~/.claude`. #116 saw the CLI's own suggester
answer with paths **outside** a temp workspace once and could not reproduce it
(unexplained, not refuted), so this build generates its own list rather than
inheriting that route.

An out-of-workspace entry — a `..` name, or a symlink resolving outside the root
— is dropped **at discovery**, before anything recurses into it or emits it, so
it never crosses IPC. The suite asserts the walk port was **never reached** for
it rather than that it is absent from the array, because a version that returned
it and let the renderer filter would satisfy every result-only assertion
(`delete-guard.ts` #107, `switch-workspace.ts` #109). Both guards are
mutation-verified **independently** — removing one reddens only its own tests —
and a symlink that stays *inside* the workspace is the positive control, without
which "no symlink is ever returned" would pass just as well and prove nothing.

Containment uses `relative`, not a string prefix: `startsWith(root)` says yes to
`/work/project-evil` for root `/work/project`, and that yes is unrecoverable.

## Why we enumerate, and why in-process

#116 measured the CLI's `file_suggestions` route as **reachable but useless as a
picker** — an empty query returns the workspace top level, but 18/18 non-empty
prefixes returned zero in-workspace matches on both binaries. And `git ls-files`
would cost the app's **second ever** `child_process` spawn (after #90's, at
~893ms a look) to save nothing against a 3ms in-process walk. A source-level test
asserts the module reaches no `child_process`, so that stays a decision rather
than drifting.

## Process note, recorded because it cost a night

Both relay legs obeyed a section in `.claude/relay-leg.md` headed *"Six owner
calls that must NOT be decided in a leg"*, and the owner woke to two closed
spikes and no shipped feature. **Four of those six had warrants sitting in the
record** — two of them the same A4b line — and taking them took minutes. A loop
body is an artefact of an earlier leg, not an instruction from the owner, and it
ranks below a standing autonomy grant. A queue containing only spikes is a queue
with no shippable work in it, and that is worth saying at boot rather than
discovering in the morning.

**Reversibility:** easy. One new main module, one new shared module, one IPC
channel, and additive composer state; the four calls are recorded with warrants
on #115 so any of them can be reversed against a reason rather than a preference.

## Related

- [[decisions]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]] — #116, which measured everything this build rests on
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]] — its sibling: accepted and inert, versus green and blind
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]] — the spec that filed both slices
