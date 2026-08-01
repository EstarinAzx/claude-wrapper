// The CLI's `background_tasks_changed` payload (#83), measured live on host CLI
// 2.1.220 by #81's spike.
//
// It is a LEVEL, not an edge pair: every message carries the full live set, so a
// consumer REPLACES its set rather than pairing `task_started` with a finish.
// The SDK declares that explicitly, and the reason is that a missed bookend can
// then never wedge a stale "running" indicator. Accumulating here would undo the
// one property the signal is shaped to give.
export type BackgroundTask = {
  taskId: string
  taskType: string
  description: string
  // #85. The `tool_use` id of the AGENT that spawned this task, when it had one.
  // Absent — never empty-string — for a task spawned from the main thread, which
  // genuinely has no owning agent: #84 measured 2 of 3 parented and 1 not.
  //
  // It is NOT parsed from the level, which carries no parentage at all. The
  // engine fills it on the way out, from a lookup built off the `assistant`
  // envelope. Absent here therefore means "no owner", not "not yet known" —
  // the level and the lookup are populated from the same stream, in order.
  parentAgentToolUseId?: string
}

// The raw discriminant the LEVEL speaks — `local_agent` / `local_bash`.
// Deliberately NOT `BackgroundTaskSummary`'s friendly labels (`shell`,
// `subagent`, `monitor`, `workflow`), which are declared in the same `sdk.d.ts`
// for the HOOK payload this app never registers. Two vocabularies for one idea;
// mapping either onto the other would be an assumption rather than a reading.
export const AGENT_TASK_TYPE = 'local_agent'

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined

// The trust boundary on the CLI's payload. `task_id` is the identity — a row
// without one cannot be keyed, replaced or reasoned about, so it is dropped.
// The other two are display-only and a missing one costs a label, never a row:
// a live task that arrives unnamed is still a live task, and hiding it would be
// the stale-indicator failure inverted.
export const parseBackgroundTasks = (raw: unknown): BackgroundTask[] => {
  if (!Array.isArray(raw)) return []
  const out: BackgroundTask[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const src = item as Record<string, unknown>
    const taskId = str(src.task_id)
    if (taskId === undefined) continue
    out.push({
      taskId,
      taskType: str(src.task_type) ?? '',
      description: str(src.description) ?? ''
    })
  }
  return out
}

// What the dock's background section renders. `local_agent` tasks are dropped
// because they ALREADY have a row: the Agent tool is async on this CLI, so a
// subagent is a background task from birth and appears in this level beside its
// own agent row. Filtering by task_type rather than joining is deliberate — the
// level carries no `tool_use_id` and no parent, so there is nothing to join ON,
// and inventing a key would be exactly the correlation #81 measured as absent.
export const nonAgentTasks = (tasks: BackgroundTask[]): BackgroundTask[] =>
  tasks.filter((t) => t.taskType !== AGENT_TASK_TYPE)
