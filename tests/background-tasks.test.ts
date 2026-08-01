import { describe, test, expect } from 'vitest'
import {
  parseBackgroundTasks,
  nonAgentTasks,
  type BackgroundTask
} from '../src/shared/background-tasks'

// The exact wire shape #81 measured on host CLI 2.1.220, kept as a runnable
// fixture rather than re-derived from the declaration.
const wire = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  task_id: 'task_01ABC',
  task_type: 'local_bash',
  description: 'npm run build',
  ...over
})

describe('background tasks — parsing the level payload (#83)', () => {
  test('reads the measured wire shape', () => {
    expect(parseBackgroundTasks([wire()])).toEqual([
      { taskId: 'task_01ABC', taskType: 'local_bash', description: 'npm run build' }
    ])
  })

  test('a payload that is not an array is an empty set, not a throw', () => {
    // The level is per-process and this app rebuilds the engine often; a
    // malformed message must degrade to "nothing running", never to a crash in
    // the message loop that would take the whole turn with it.
    expect(parseBackgroundTasks(undefined)).toEqual([])
    expect(parseBackgroundTasks(null)).toEqual([])
    expect(parseBackgroundTasks({})).toEqual([])
    expect(parseBackgroundTasks('local_bash')).toEqual([])
  })

  test('drops a task with no id, and keeps one with no description', () => {
    // Asymmetric on purpose. `task_id` is the identity — without it the row
    // cannot be keyed or replaced. `description` is display-only, and dropping a
    // live task for want of a label is the stale-indicator bug inverted: the
    // panel would under-report work that is genuinely running.
    const parsed = parseBackgroundTasks([
      wire({ task_id: undefined }),
      wire({ task_id: '' }),
      wire({ task_id: 'task_keep', description: undefined })
    ])
    expect(parsed).toEqual([
      { taskId: 'task_keep', taskType: 'local_bash', description: '' }
    ])
  })

  test('skips non-object entries rather than inventing rows for them', () => {
    expect(parseBackgroundTasks([null, 'x', 7, wire()])).toHaveLength(1)
  })
})

describe('background tasks — what the dock section shows (#83)', () => {
  const bash: BackgroundTask = {
    taskId: 't-bash',
    taskType: 'local_bash',
    description: 'npm test'
  }
  const agent: BackgroundTask = {
    taskId: 't-agent',
    taskType: 'local_agent',
    description: 'Explore the codebase'
  }

  test('a local_agent task is dropped — it already has an agent row', () => {
    // Acceptance: "a local_agent task in the level does not produce a duplicate
    // row alongside its agent row". The Agent tool is async on this CLI, so
    // every subagent is in this level from birth.
    expect(nonAgentTasks([bash, agent])).toEqual([bash])
  })

  test('a task with an unknown type is kept, not silently swallowed', () => {
    // Only `local_agent` earns exclusion, and only because it is shown
    // elsewhere. A future task_type this app has never seen is still background
    // work the user started, so an allow-list here would make the panel lie by
    // omission the first time the CLI grows a kind.
    const monitor: BackgroundTask = {
      taskId: 't-new',
      taskType: 'local_something_new',
      description: 'watch'
    }
    expect(nonAgentTasks([bash, monitor, agent])).toEqual([bash, monitor])
  })

  test('an empty set stays empty', () => {
    expect(nonAgentTasks([])).toEqual([])
  })
})
