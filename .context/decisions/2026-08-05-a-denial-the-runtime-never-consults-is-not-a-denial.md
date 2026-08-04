---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# A denial the runtime never consults is not a denial, and the third try at the `@` route was the one that called it

**Decision:** #116 (`bd0fed5`) closes as a spike with **no `src/` diff**. `@path`
already resolves through this app's own option shape, so the send half of the
feature ships today with no code; the CLI's `file_suggestions` route **is**
callable but is not usable as a picker; and an app-owned in-process walk is the
list source. Filed as **#118** (`needs-info`, blocked on four owner calls).

**AMENDS** [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]] — that
entry's conclusion is refuted by the method it prescribed.

## The route: wrong three times, and the third was a grep

That entry records two failed arguments and one it believed settled the question:

1. union membership — refuted, the union is direction-agnostic;
2. the absent `fileSuggestions()` method — refuted via #88's dispatcher;
3. **the runtime bundle** — `sdk.mjs` contains zero occurrences of
   `file_suggestions`, therefore "the SDK answers this request, it does not send
   it". Recorded as standing, "now on runtime evidence rather than typings".

**Number three is the same error as number two, one level down.** Every named
control method on the runtime `Query` is a thin wrapper over a generic
`request({ subtype })` dispatcher, so a subtype absent from the bundle's *text*
is not a subtype the SDK cannot *send*. Grepping the bundle is still reading
names; it is just reading them somewhere less obvious than the method list.

What settled it was doing what the ticket said — **calling**:

```js
await query.request({ subtype: 'file_suggestions', query: 'src' })
// -> { subtype: 'success', request_id: '…', response: { suggestions: [...] } }
```

Non-vacuous because a bogus subtype on the same handle is refused by name:
`Unsupported control request subtype: spike116_definitely_not_a_real_subtype`.
Without that control, `success` is equally consistent with a dispatcher that
swallows anything.

**The practical posture survives, its reason does not.** The route is reachable
and useless as a picker: an empty query returns the workspace's top level, while
**18/18 non-empty prefixes returned zero in-workspace matches** across two
workspaces and both binaries (`binariesAgree: true`) — including prefixes naming
files that exist. An autocomplete that empties the moment a character is typed
is not one.

## The durable half: `canUseTool` is not a control surface

**This harness's first version printed a confident `YES` on Q1 that was
unsound**, and the mechanism generalises well past spikes.

Arms B and C denied tools through `canUseTool`. But `settingSources` defaults to
loading **all** filesystem settings, this machine's `permissions.defaultMode` is
`bypassPermissions`, and `engine.ts` already states the rule that breaks:
*"canUseTool stays wired above — the SDK only invokes it when the mode asks."*
So the denial silently did nothing, and **"answered without tools" actually meant
"answered using tools the harness never saw."**

The evidence is preserved in the findings: arm A records **1 `canUseTool`
consultation and 3 `tool_use` blocks**. The two witnesses disagree, and only one
of them is the app's.

Fixed by denying with `disallowedTools` — *"removed from the model's context and
cannot be used, even if they would otherwise be allowed"* — keeping `canUseTool`
as a **recorder**, and reporting **both** witnesses per arm. `toolRemovalHeld`
now gates the verdict, so a tool surviving removal makes a run *unscored* rather
than quietly wrong.

Generalisation for the next harness, and for any code reasoning about tool
denial: **`canUseTool` is not a control surface — it is a request the ambient
permission mode may never make.** Anything asserting "the model could not do X"
needs a witness that does not route through it. Near-sibling of
[[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]]: there an
`await` separated a check from its effect, here a *permission mode* separates a
callback from ever being called.

## Q1, and why it shrinks the build

`@path` in ordinary prompt text **is already resolved** by the CLI through this
app's exact `query()` options shape. Three arms, run-random sentinel:

| arm | prompt | tools | `tool_use` blocks | answered |
|---|---|---|---|---|
| A positive control | `notes.txt` | available | 3 (`Glob`, `Read`) | yes |
| B measurement | `@notes.txt` | **removed** | **0** | yes |
| C negative control | `notes.txt` | **removed** | 0 | **no** |

B answering with nothing to read the file with, and C failing on the
byte-identical prompt, is the mention being expanded CLI-side. This is the
dumb-pipe rule (A8) paying out: the wrapper already ships `@` resolution and
always has, so **#118 is typing assistance only**, and its sharpest required
test is the pin that the sent text stays byte-identical — a "helpful" renderer
expansion would replace a working CLI behaviour with a worse one and no
rendering test would see it.

## Cost, and one hazard left open

In-process recursive walk: **3ms median / 356 files** pruned, 192ms / 18,349
unpruned. `git ls-files`: 27ms **and a second `child_process` spawn** (the app
has exactly one, #90, at ~893ms/look). So the app enumerates in-process, and the
60× pruned/unpruned gap makes "exclude `node_modules`" a cost question rather
than only a taste one.

**Recorded unexplained, not refuted:** during exploratory probing the same
request in a temp workspace answered with paths **outside** it — home
`~/.claude` entries and `..\..\..\..\..\..\` escapes into an unrelated directory
— while in-workspace files did not match, same handle, same run. **Not
reproduced** in 4 rounds × 7 probes after excluding the CLI binary,
`options.env`, handle age and probe order. Kept verbatim as
`priorObservation` because a thing seen once and not reproduced is unexplained,
not absent. #118 generates its own list and rejects escapes **in main**, so it
does not depend on the answer.

**Reversibility:** high. No `src/` change, no ADR reversed, no dependency added,
no owner call taken. The four parked `@` calls remain the owner's; answering
them on #115 flips #118 to `ready-for-agent` with no other change.

## Related

- [[decisions]]
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]] — amended here
- [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]]
- [[2026-08-04-an-empty-list-is-attributed-not-observed]]
- [[overview]] · [[active-work]] · [[pick-up]]
