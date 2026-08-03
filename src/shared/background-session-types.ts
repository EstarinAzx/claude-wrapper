// One LIVE background Claude Code SESSION, as the CLI's own **agent view**
// (`claude agents --json`) lists it.
//
// "Agent" means three different things in this repo, and this is the third —
// `.context/flows.md` carries the collision table. Say which one, every time:
//   * this app's **Agents dock** — subagents INSIDE the one open session.
//   * `background-tasks.ts`'s **BackgroundTask** — a job inside the one open
//     session (a `run_in_background` Bash job, a spawned subagent). Pushed live
//     on `tasks:changed` whenever membership changes.
//   * **BackgroundSession**, here — a WHOLE separate Claude Code conversation
//     running under the CLI's supervisor, in no way part of the open session.
//     Polled on demand, never pushed: #90 measured that no live flag exists.
//
// The field set is deliberately narrow, and every omission is a measurement
// from #90 rather than a preference:
//   sessionId  the ONLY universal key — `id` is absent on interactive rows.
//   state      carried as the RAW string. Four values were measured where three
//              were predicted (`working` was unpredicted) and the set is OPEN,
//              so an allow-list would lie by omission.
//   name       absent on 2 of 17 measured rows, so optional.
//   startedAt  epoch ms.
// `pid` and `status` are deliberately NOT carried: they describe a live OS
// process while `state` describes a background row, and #90's finding was that
// **no single field describes a row's liveness**. Carrying both here would
// invite exactly the unified "is it alive" boolean that finding rules out.
export interface BackgroundSession {
  sessionId: string
  name?: string
  state?: string
  startedAt?: number
}
