---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# Deleting a session is singular, unscoped, and confirmed

**Decision:** A session row gains a delete affordance that calls the SDK's `deleteSession(id)` — **one row at a time, `dir` deliberately omitted, behind a two-step inline confirm**. No bulk delete, no "clear this project", no archive, no trash.

**The non-goal, stated so it stops being re-proposed:** cleaning up the ~75 `sdk-cli` automation rows the listing fix admits is **not** a motive for this feature. That is a filtering problem, already on record as an open question, and destroying data to tidy a view is the worst available fix for it.

## Why `dir` is omitted

This is the counter-intuitive part and the reason it is written down. Passing `dir` looks safer — it bounds the blast radius to the directory the row claims. It is not safer, because of what the SDK does with it.

`deleteSession`'s no-`dir` branch **enumerates every project directory** (`sF(fn(), {withFileTypes:true})` filtered to directories, `sdk.mjs`) and stats `{id}.jsonl` in each — the same enumerate-don't-encode shape [[2026-07-28-storage-location-is-an-index-not-an-encoding]] adopted. The `dir` branch instead runs realpath → **encode** → stat: the exact synthesize-a-directory-name-from-a-cwd operation that ADR removed from this codebase, here running inside a dependency where we cannot see it fail. #44 measured that failure at **45 of 494** live sessions on drive-letter case drift alone, so passing `dir` buys a delete button that silently no-ops on roughly 9% of rows.

What omitting it costs: a cross-project UUID collision. `deleteSession` validates the id is a UUID before touching anything (`Invalid sessionId … must be a UUID`) and these are v4 UUIDs from the CLI, so that is a rounding error, not a risk. Trading a nil-probability wrong deletion for a measured ~9% no-op deletion is a bad trade.

**The bonus:** the "Unknown project" branch disappears. With no `dir`, a cwd-less row deletes like any other — no fallback rule, no refusal to design, one fewer branch, and it is the branch nobody would have tested.

## Why the confirm stays

Not ceremony — **hover-reveal and no-confirm are jointly indefensible.** A control that materialises under a cursor already in motion and destroys the only copy of a conversation on its first click is a mis-click generator. Either is fine alone. Hover-reveal is kept (a permanently visible destructive control beside 100 rows is worse), so the confirm stays: first click arms the row, second commits, blur or Escape reverts. **Only one row armed at a time** — arming a second disarms the first, the same one-slot instinct as the dock.

There is no trash and no undo; the JSONL is the only copy. And most rows on that rail are transcripts the *terminal* wrote, not this app's work — a wrapper deleting another program's data on one unconfirmed click is a different proposition from deleting its own.

No modal, no `window.confirm`: the first paints a glass layer DESIGN.md bans, the second is a renderer-blocking OS dialog and would be the only un-designed OS surface in the app — the same objection `base.css:44-49` records against Chromium's default scrollbar.

## Statuses, and the absence of a third convention

Two outcomes, reusing the shape the app already has — main decides and returns a status, the renderer phrases it on the existing inline `role="status"` line, per [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]].

- **Not-found is `ok`, not a failure.** `deleteSession` throws when the session is absent; that is a staleness signal, and the correct response is success. The user's intent ("that session is not in my store") is satisfied — ordinary idempotent-delete semantics.
- **Every other throw is one `failed` status.** Do not string-match the SDK's error message to classify it. Do not invent a `null`-vs-`[]` analogue for a mutation — that convention belongs to the read channels (#60) and copying it here would be a third convention for no gain. Caught-and-ignored is wrong on its own: a delete that failed must not leave a row that looks deleted.

## Deleting the session you are in

Allowed — refusing it is tidier but leaves the user unable to delete the very conversation they just decided was junk, which is the most common motive. Afterwards the pane falls back to **`newChat()`**, and the spec says so explicitly, because the standing landmine reads *never clear the pane with `newChat()` on a switch path* and someone will over-apply it. It is right here precisely because we want what it does: the resume target points at a transcript that no longer exists, and `targetSession(null)` is what clears it.

**Refuse deletion of the active session while `busy`.** A turn in flight is appending to that JSONL, and on Windows an open handle without `FILE_SHARE_DELETE` fails the unlink outright. Foreign rows stay deletable while busy — they touch no running engine — mirroring the existing `disabled={!foreign && busy}`. **Probe the open-handle behaviour against a real store before writing the ticket** rather than assuming; it is the same one-call probe that settled the listing bug.

## Wiring note

The rail must re-list after a successful delete. `session-index.ts`'s enumeration index will hold a stale entry afterwards; that staleness is benign (a lenient read answers `[]`), so **do not add an invalidation**. If someone adds one anyway, the standing rule that a failed rebuild is never cached still applies.

The row is currently a single `<button>` wrapping title and meta (`Sidebar.tsx:112-127`), so the delete control cannot nest inside it — the `<li>` gains a sibling. Reveal on row hover **and on keyboard focus-within**; hover-only is keyboard-inaccessible.

**Reversibility:** hard for the user (no undo), easy for the code.

## Related

- [[decisions]]
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — why `dir` is omitted
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — why these rows are visible at all
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] — the status channel reused
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — where deletion deliberately does *not* live
