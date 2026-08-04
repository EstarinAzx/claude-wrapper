// #112 — a live query for a LIST read, rebuilt lazily when a writer discarded
// the handle.
//
// Three writers (`model:set`, `permission:set-mode`, `backend:set-mode`) call
// `discardEngine` and rebuild nothing, while `commands:list` and `model:list`
// were answered straight off that handle. #105 measured the consequence on the
// built app over its own IPC, one writer apart with no prompt sent: 15 → 0
// models and 119 → 0 commands, 6/6 warmed runs. A second model change was
// impossible without sending a turn first, and it was invisible because
// `model:list`'s `current` comes from `model-mode.ts` rather than the engine,
// so the pill went on showing the model that had just been picked.
//
// LAZY HERE, NOT EAGER IN `discardEngine`. Rebuilding and warming inside the
// discard was priced at a median 1539ms per click (#105) — a CLI process spawned
// on every model, permission and backend click, paid by every user, including
// the one who never opens a menu again. These two reads are the only consumers
// that need a live query without a send, so the cost belongs on them: a user who
// picks a model and then sends a prompt pays nothing extra at all.
//
// NOT A CACHE. Both read handlers carry an explicit no-cache contract — the
// SDK's `supportedCommands()` tracks the CLI's own `commands_changed` pushes,
// and a remembered model list is outright WRONG across a backend flip, where the
// list legitimately changes. This rebuilds the query and re-asks; it never
// remembers an answer.
//
// WHY PORTS. Everything this needs lives in `index.ts` module state, which
// vitest cannot import. The alternative — inlining these five lines in both
// handlers — would leave the resume threading below unpinnable, and that is the
// half that fails silently.
export type ListEnginePorts<E> = {
  // The current handle, or null once a writer discarded it.
  live: () => E | null
  make: () => E
  // Installs the rebuilt engine as the handle. Separate from `make` on purpose:
  // an omitted install still answers this read correctly and spawns a fresh
  // process on the next one, which no return-value assertion can see.
  set: (engine: E) => void
  warmUp: (engine: E, resume: string | undefined) => void
  // `pendingResume` — what the discarding writer said the next conversation is.
  resume: () => string | null
}

// Returns a live engine for a list read, rebuilding it if a writer threw the
// last one away.
//
// SHARPEST FAILURE MODE — the resume target has to travel INTO the warm-up.
// `resume` binds when the query is CONSTRUCTED (#73) and `ensureQuery` returns
// early ever after, so warming bare leaves the rebuilt engine on a fresh session
// while the pane, refilled from disk, looks correct. `discardEngine` already
// stores the right value per path (the session id for a model or permission
// pick, null for the backend flip's deliberate fresh start), so reading it here
// handles all three writers uniformly BECAUSE that asymmetry is already encoded
// there.
export const ensureListEngine = <E>(ports: ListEnginePorts<E>): E => {
  const live = ports.live()
  if (live) return live
  const rebuilt = ports.make()
  ports.set(rebuilt)
  ports.warmUp(rebuilt, ports.resume() ?? undefined)
  return rebuilt
}
