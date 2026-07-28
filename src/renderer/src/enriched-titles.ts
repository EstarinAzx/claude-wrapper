// In-memory enriched labels for sessions whose recorded title is a bare slash
// command (#49), keyed by session id. No cache file and no dependency: the whole
// point is that this costs one transcript read per row the owner actually looks
// at, and zero for the rest of the store.
//
// The PROMISE is cached, not the resolved value. A row that mounts, unmounts and
// remounts while its read is still in flight must not start a second one — "read
// once" has to include the in-flight window, which is exactly where a list that
// re-renders on focus, filter and workspace change spends its time.
//
// A resolved `null` is a cached ANSWER, not a miss: "this session has no
// substantive prompt" and "its transcript would not load" are both terminal, and
// both describe rows that can never improve. Retrying them on every remount is
// how a lazy read turns back into the whole-store scan this replaced. A rejected
// IPC folds into that same null for the same reason.
const cache = new Map<string, Promise<string | null>>()

export const enrichedTitle = (id: string, cwd: string | null): Promise<string | null> => {
  let pending = cache.get(id)
  if (!pending) {
    pending = window.api.titleHint(id, cwd).catch(() => null)
    cache.set(id, pending)
  }
  return pending
}

// A module-level cache outlives a test file's teardown, so one suite's store
// would otherwise decide the next suite's labels. Same contract as
// `resetSessionIndex()` in main.
export const resetEnrichedTitles = (): void => {
  cache.clear()
}
