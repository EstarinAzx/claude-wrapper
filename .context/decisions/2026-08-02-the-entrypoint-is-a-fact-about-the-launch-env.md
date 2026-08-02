---
type: decision
project: claude-wrapper
date: 2026-08-02
updated: 2026-08-02
tags: [context, decision]
---

# The entrypoint this app writes is a fact about the launch env

**#89, landed as `5e41520`.** The `src/` change is a **comment** — no behaviour
moved, the argument it justifies stays exactly as it was, and the live pin is
untouched. Measured on host CLI **2.1.220 / SDK 0.3.220**, backend `wisped`, by
`scripts/spike-89-entrypoint.mjs` — three configs, one real turn each, findings
in `scripts/spike-89-findings.json`.

**Finding: the ticket's observation was right and its implication was half
wrong.** There really are zero `sdk-ts` records in this project's store
directory. That does not mean the discriminator is absent — it means the comment
named the wrong member of it. Third time this project has hit the #84 shape: a
correct observation carrying a wrong stated implication.

## What was measured

The SDK's stamp is **inherit-wins**, at both of its spawn sites in `sdk.mjs`:

```js
Kt = xt ? {...xt} : {...process.env}
if (!Kt.CLAUDE_CODE_ENTRYPOINT) Kt.CLAUDE_CODE_ENTRYPOINT = "sdk-ts"
```

`xt` is `options.env`, and `engine.ts` passes one (`env: getEnv()` →
`getSpawnEnv` → `resolveSpawnEnv`, which spreads `process.env` wholesale and
never sets the key). So the app does not decide what it writes — **whatever
launched it does**:

| launch context | env in | transcript wrote | SDK verdict | hidden by `includeProgrammatic: false` |
|---|---|---|---|---|
| terminal Claude Code session | `cli` | **`sdk-cli`** | programmatic | **yes** |
| outside any session | *absent* | **`sdk-ts`** | programmatic | **yes** |
| VS Code Claude Code session | `claude-vscode` | **`claude-vscode`** | *interactive* | **no** |

Two things fall out of the table that reading the guard alone does not give you.
An inherited value is **transformed, not passed through** (`cli` → `sdk-cli`),
and that transform is not in `sdk.mjs` at all — it belongs to the CLI binary.
And there is **no `sdk-` prefix rule**: the third config exists only to test
that, and `claude-vscode` survives untransformed, falls outside the SDK's
three-member set, and is classified **interactive**. So **the app can write a
non-programmatic transcript**, and the 15 `claude-vscode` records in this
project's directory are the shape of it.

## Why the comment's conclusion survives anyway

`includeProgrammatic: false` takes this machine's listing from **806 rows to
567** — a **239-row delta** (the comment's old figure was 560 vs 672, spanning
all projects; the shape held, the number moved because the store grew). Each
config's own session was confirmed present with the flag and absent without it
**through the real `listSessions()`**, not through the replica classifier the
harness also carries. The `claude-vscode` run is the internal control: its
session stayed visible both ways, and the interactive total moved 567 → 568.

So the argument is load-bearing for the common launches, **inert** for the VS
Code one, and **never wrong to pass**. The correction is to the reasoning, not
to the decision — which is why nothing but a comment changed.

## Two mechanism findings the ticket did not ask for

Both from deobfuscating the classifier, which the ticket's step 2 explicitly
recorded as not yet done:

```js
var dn = 65536, sEe = new Set(["sdk-cli","sdk-ts","sdk-py"])
function B1(e, t) {                                   // e = head, t = tail
  let r = pc(e,"entrypoint") ?? er(t,"entrypoint")
  if (r && sEe.has(r)) return !0
  let n = e.split("\n").find(i => i.includes('"parentUuid":')) ?? e
  let o = pc(n,"sessionKind")
  return o === "daemon" || o === "daemon-worker"
}
```

**One record decides a whole session.** `r_()` reads only two 64KB windows, head
and tail. `pc()` takes the **first** match scanning forward, `er()` the **last**.
So the verdict is the first `entrypoint` in the first 64KB, else the last in the
last 64KB — everything between is never read. This retires the counting method
the ticket's own table used: **counting records is not counting sessions.** And
a session file *can* hold mixed values — three were found in a 400-file scan,
each mixing `claude-vscode` with `cli`, all three classified off first-in-head.
"The session's entrypoint" is not a well-defined thing.

**`sessionKind: "daemon" | "daemon-worker"` is a second programmatic path**,
independent of `entrypoint` entirely. The old comment's mechanism half was
therefore **incomplete**, not merely mis-provenanced. On this machine the only
`sessionKind` on disk is `"bg"` (38575 records), so the path exists in the
runtime and is **unexercised here** — recorded that way rather than as a
negative, per #81's rule about untested absences.

## The full value set is five

All 1178 JSONL files across 139 project directories (the ticket sampled 200):

| value | records | SDK verdict |
|---|---|---|
| `cli` | 100750 | interactive |
| `claude-vscode` | 7154 | interactive |
| `sdk-cli` | 3647 | programmatic |
| `sdk-ts` | 1172 | programmatic |
| **`claude-desktop`** | **21** | interactive |

`claude-desktop` was unknown to the ticket, which had asked for the sweep on
exactly the grounds that more values probably existed. It was right.

## What this does to #86

The `sdk-cli` de-noising half gets a **stronger negative than it asked for**. A
filter hiding "the app's own programmatic sessions" would, here, be hiding
`sdk-cli` — the same value ~20 of this repo's own GUI-driver sessions carry.
**The wrapper's own sessions and the headless automation #86 wants de-noised are
the same `entrypoint` value and are not separable by it.** No filter was built;
whether to filter at all stays an open owner call there.

## The deviation, recorded

Step 1 asked for the outside-a-session case launched from outside a Claude Code
session. Every process this run can start descends from one, so
`outside-session` is a **reconstruction by environment** — it removes exactly the
key the guard reads, plus the other session-provenance vars. Faithful to the
deciding variable; not a real detached launch. It is a `limit` field in the
findings file rather than a silent equivalence, following #87's precedent for
the unmeasurable native backend. The `inherited` config is a real measurement of
the case that actually occurs when an agent launches the app.

## Related

- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — the decision
  this corrects the reasoning of. Its conclusion stands; its provenance
  sentence did not.
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88, the sibling
  spike whose harness shape this one copies
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87, whose `limit` precedent
  this one follows
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84, the pattern:
  right observation, wrong stated implication
