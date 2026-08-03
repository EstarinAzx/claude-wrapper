import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DeleteStatus, SessionMeta } from '../../../shared/session-types'
import type { BackgroundSession } from '../../../shared/background-session-types'
import { clampSidebarWidth, DEFAULT_SIDEBAR_WIDTH } from '../../../shared/sidebar-width'
import { groupSessions, type SessionScope } from '../../../shared/session-groups'
import { needsEnrichment } from '../../../shared/session-titles'
import { enrichedTitle } from '../enriched-titles'

const WIDTH_KEY = 'sidebar-width'
const SCOPE_KEY = 'sidebar-scope'

// One page of rows. The store holds ~490 sessions across 37 projects, so the
// list is capped globally rather than per project and grows a page at a time.
const PAGE = 100

// Text, not icons: "which projects am I looking at" has no established glyph,
// and an ambiguous icon here would be an invented affordance for a standard
// task. Persistent rather than a menu, because a scoped rail hides ~90% of the
// store and the user must be able to see that at a glance, not remember it.
const SCOPES: ReadonlyArray<readonly [SessionScope, string]> = [
  ['project', 'This project'],
  ['all', 'All projects']
]

const readStoredWidth = (): number => {
  const raw = window.localStorage.getItem(WIDTH_KEY)
  return clampSidebarWidth(raw === null ? DEFAULT_SIDEBAR_WIDTH : Number(raw))
}

// Scoped by default: the rail opens showing the workspace the user is actually
// in. Anything that is not the one stored string is the default, so a corrupt
// or hand-edited value degrades to the safe view rather than a broken one.
const readStoredScope = (): SessionScope =>
  window.localStorage.getItem(SCOPE_KEY) === 'all' ? 'all' : 'project'

const relTime = (ms: number): string => {
  if (!ms) return ''
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(ms).toLocaleDateString()
}

const Trash = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M2.6 3.4h6.8M4.7 3.4V2.3h2.6v1.1M3.6 3.4l.45 6.3h3.9l.45-6.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Used twice: the rail head re-lists stored transcripts, the background-sessions
// head re-runs the CLI look. Same glyph because it is the same verb — extracted
// so the two cannot drift into different arrows.
const Refresh = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path
      d="M11.5 7a4.5 4.5 0 1 1-1.3-3.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M11.5 2v2.2H9.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <polyline
      points={dir === 'left' ? '7.5,2.5 4,6 7.5,9.5' : '4.5,2.5 8,6 4.5,9.5'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// One row of the rail. A component rather than inline JSX because MOUNTING is
// the enrichment trigger (#49): a row past the page cap, or behind a collapsed
// rail, is never rendered and so never asks for anything. That is the whole
// mechanism keeping this lazy — 490 sessions, at most a screenful of reads.
const SessionRow = ({
  session,
  groupLabel,
  foreign,
  active,
  busy,
  armed,
  enriched,
  onEnriched,
  onOpen,
  onSwitch,
  onArm,
  onDisarm,
  onDelete
}: {
  session: SessionMeta
  groupLabel: string
  foreign: boolean
  active: boolean
  busy?: boolean
  armed: boolean
  enriched?: string
  onEnriched: (id: string, label: string) => void
  onOpen?: (id: string) => void
  onSwitch?: (id: string, cwd: string | null) => void
  onArm: (id: string) => void
  onDisarm: () => void
  onDelete: (id: string) => void
}) => {
  // Only rows whose recorded title is a bare slash command ask, and each asks
  // once ever — the module cache dedupes across remounts and across the
  // in-flight window. The row passes its OWN project: the rail is global, so
  // this session usually does not live in the open workspace.
  useEffect(() => {
    if (!needsEnrichment(session.title)) return
    let live = true
    void enrichedTitle(session.id, session.cwd ?? null).then((text) => {
      if (live && text) onEnriched(session.id, text)
    })
    return () => {
      live = false
    }
    // `enriched` is deliberately not a dependency: receiving the answer must not
    // re-run the effect that asked the question.
  }, [session.id, session.title, session.cwd, onEnriched])

  // Display only. The store is untouched and no customTitle is ever set — this
  // label exists for as long as the app is open and not one moment longer.
  const label = enriched || session.title || 'Untitled session'
  const meta = relTime(session.lastUpdated)
  const classes = ['session-row-btn']
  if (active) classes.push('session-row-btn-active')
  if (foreign) classes.push('session-row-btn-foreign')

  return (
    <li
      className={armed ? 'session-row session-row-armed' : 'session-row'}
      // Escape reverts an armed row. Bound to the row rather than the control so
      // it still fires once focus has moved to Cancel.
      //
      // Stopped, so ONE Escape dismisses one thing: the subagent drawer listens
      // for Escape on `window`, and without this a single press would disarm the
      // row and close the drawer together. Narrow by construction — this only
      // runs when the key passed through an armed row, which means focus was
      // already inside it; an Escape pressed anywhere else never reaches here
      // and the drawer still closes normally.
      onKeyDown={(e) => {
        if (!armed || e.key !== 'Escape') return
        e.stopPropagation()
        onDisarm()
      }}
      // Blur reverts. `focusout` bubbles, so this sees focus leaving ANY control
      // in the row; the containment check is what keeps a hop from Delete to
      // Cancel — which is still inside the row — from disarming it.
      onBlur={(e) => {
        if (!armed) return
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        onDisarm()
      }}
    >
      <button
        type="button"
        className={classes.join(' ')}
        aria-current={active ? 'true' : undefined}
        // Deliberately NOT gated on `busy` when foreign: a switch is a
        // main-process transaction that asks the engine itself and answers
        // `busy`. Disabling here would be a second busy source — and would make
        // the refusal it returns unreachable.
        disabled={!foreign && busy}
        title={foreign ? `${label} — ${groupLabel}` : label}
        onClick={() => (foreign ? onSwitch?.(session.id, session.cwd ?? null) : onOpen?.(session.id))}
      >
        <span className="session-row-title">{label}</span>
        {meta ? <span className="session-row-meta">{meta}</span> : null}
      </button>
      {/* A SIBLING of the row button, never a child: that button wraps the whole
          title+meta block, and a nested button is invalid HTML whose click the
          parent would also receive — opening the session you are deleting.

          The SAME element arms and then commits, rather than swapping in a
          separate confirm button. That keeps it mounted across the transition,
          so it keeps focus: a replacement would unmount the focused element,
          drop focus to the body, and the blur-reverts rule would disarm the row
          the instant it armed. The accessible name changes with the state, which
          is also how a test can see the transition rather than infer it. */}
      <button
        type="button"
        className={armed ? 'session-delete session-delete-armed' : 'session-delete'}
        // Refused only for the ACTIVE session mid-turn, and only that one: the
        // running turn appends to ITS transcript, and a delete there succeeds
        // and is then undone — the CLI recreates the file on its next write,
        // resurrecting the row as a stub (probed against a real store, #68).
        // Every other row, foreign or local, is untouched by that turn.
        disabled={active && busy}
        aria-label={armed ? `Confirm delete ${label}` : `Delete ${label}`}
        onClick={() => (armed ? onDelete(session.id) : onArm(session.id))}
      >
        {armed ? 'Delete' : <Trash />}
      </button>
      {armed ? (
        <button
          type="button"
          className="session-delete session-delete-cancel"
          aria-label={`Cancel delete ${label}`}
          onClick={onDisarm}
        >
          Cancel
        </button>
      ) : null}
    </li>
  )
}

const Sidebar = ({
  cwd,
  activeId,
  busy,
  onOpen,
  onSwitch,
  onChooseFolder,
  onNewChat,
  onDelete
}: {
  cwd: string
  activeId?: string | null
  busy?: boolean
  onOpen?: (id: string) => void
  // A row outside the open workspace. Carries the project it belongs to —
  // absent for the "Unknown project" group, which main rejects as missing-cwd.
  onSwitch?: (id: string, cwd: string | null) => void
  // Open a project that has no session to resume into (#48). Lives here, beside
  // "New chat", because the sessions rail is where workspaces are already
  // chosen; the titlebar pills are global preferences and stay untouched.
  onChooseFolder?: () => void
  onNewChat?: () => void
  // Commit a delete (#68). The rail owns ARMING and the re-list; the pane owns
  // the IPC call, the failure line and the fall-back-to-a-new-chat when the row
  // being destroyed is the one on screen. Split there because the status line
  // and the pane are App's, and a rail that reached into either would be
  // deciding things it cannot see.
  onDelete?: (id: string) => Promise<DeleteStatus>
}) => {
  // `null` = the last listing FAILED (#60), which is a different thing from the
  // empty array meaning the store holds nothing. Same nullable shape the channel
  // speaks, so the rail is not re-deriving a state main already decided.
  const [sessions, setSessions] = useState<SessionMeta[] | null>([])
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidthState] = useState(readStoredWidth)
  const [query, setQuery] = useState('')
  const [scope, setScopeState] = useState<SessionScope>(readStoredScope)
  const [limit, setLimit] = useState(PAGE)
  // Labels derived so far, by session id (#49). Rendered rows fill this in; it
  // is never populated ahead of time, which is what keeps the reads lazy.
  const [labels, setLabels] = useState<ReadonlyMap<string, string>>(() => new Map())
  // The id of the ONE row currently offering Delete / Cancel, or null. A single
  // slot is the mechanism behind "only one row is armed at a time" — arming a
  // second overwrites the first rather than being separately dismissed, so the
  // rule cannot be violated by forgetting to clean up.
  const [armed, setArmed] = useState<string | null>(null)
  const reqIdRef = useRef(0)

  // #91 — the workspace's LIVE BACKGROUND SESSIONS (the CLI's agent view), kept
  // entirely apart from `sessions` above, which is STORED TRANSCRIPTS. Two
  // sources, two lifetimes, two states: a background session is a running
  // process the app does not own, a stored session is a file on disk.
  //
  // `null` = the look FAILED, `[]` = nothing is running here — the same nullable
  // contract the store speaks (#60), for the same reason.
  const [bgSessions, setBgSessions] = useState<BackgroundSession[] | null>([])
  // Starts true: the first look is already on its way when this paints, and
  // rendering "None running here" before anyone has looked would be a lie.
  const [bgLooking, setBgLooking] = useState(true)
  const bgReqIdRef = useRef(0)

  // Stable, so a row's enrichment effect does not re-run every render.
  const onEnriched = useCallback((id: string, label: string): void => {
    setLabels((prev) => (prev.get(id) === label ? prev : new Map(prev).set(id, label)))
  }, [])

  // Filter → sort/group → cap, in that order and all client-side over metadata
  // already in hand. A narrowed query starts at page one again; carrying a
  // "show more" from the previous query would reveal a page the user never
  // asked for.
  const { groups, shown, matched } = useMemo(
    () => groupSessions(sessions ?? [], { query, cwd, scope, limit, labels }),
    [sessions, query, cwd, scope, limit, labels]
  )

  // Same class of preference as the width, so it persists the same way. Changing
  // scope starts at page one again for the same reason a narrowed query does:
  // carrying a "show more" across would reveal a page the user never asked for.
  const setScope = useCallback((next: SessionScope): void => {
    setScopeState(next)
    setLimit(PAGE)
    window.localStorage.setItem(SCOPE_KEY, next)
  }, [])

  // Persist UI-layout prefs (this width); engine-intent state stays in-memory.
  const setWidth = useCallback((px: number): void => {
    const clamped = clampSidebarWidth(px)
    setWidthState(clamped)
    window.localStorage.setItem(WIDTH_KEY, String(clamped))
  }, [])

  // Drag the right edge: capture the start point + width, then track pointer
  // moves on the window (not the thin handle) until release so the drag keeps
  // following even when the cursor outruns the 6px grip.
  const startResize = useCallback(
    (e: React.PointerEvent): void => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width
      const onMove = (ev: PointerEvent): void => setWidth(startWidth + (ev.clientX - startX))
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [width, setWidth]
  )

  const refresh = useCallback(() => {
    const reqId = ++reqIdRef.current
    void window.api.listSessions().then((list) => {
      if (reqId === reqIdRef.current) setSessions(list)
    })
  }, [])

  // One CLI process per call, ~893ms (#90). Guarded by the same request-id
  // pattern as `refresh` so a slow look cannot overwrite a newer one.
  const refreshBackground = useCallback(() => {
    const reqId = ++bgReqIdRef.current
    setBgLooking(true)
    void window.api.listBackgroundSessions().then((list) => {
      if (reqId !== bgReqIdRef.current) return
      setBgSessions(list)
      setBgLooking(false)
    })
  }, [])

  const disarm = useCallback(() => setArmed(null), [])

  // The second click. Disarms first — the confirmation has been given, so the
  // row must not sit armed through the round trip and invite a third click.
  //
  // The re-list is gated on success and is the ONLY thing that removes the row:
  // nothing is dropped optimistically, so a delete that failed leaves the row
  // exactly where it was rather than showing a gap that the next refresh
  // silently refills. Main answers `ok` for a session the store no longer holds,
  // so a stale row is re-listed away by the same path as a real deletion.
  const commitDelete = useCallback(
    (id: string): void => {
      setArmed(null)
      void onDelete?.(id).then((status) => {
        if (status === 'ok') refresh()
      })
    },
    [onDelete, refresh]
  )

  useEffect(() => {
    refresh()
  }, [cwd, activeId, refresh])

  useEffect(() => {
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  // Deliberately NOT joined to the effect above, and deliberately NOT on the
  // window `focus` listener beside it: those fire on every refocus and on every
  // `activeId` change, and each firing here is a whole CLI process (#90).
  //
  // A workspace change is the one automatic look there is, because the previous
  // workspace's answer is not merely stale, it is about a different directory.
  // Everything else is the refresh button. NOTHING here may become a timer —
  // #90 measured that a 5s poll costs ~19% of a core continuously, and that the
  // staleness window equals the poll interval, so a self-refreshing list would
  // claim to be live while being routinely wrong.
  useEffect(() => {
    refreshBackground()
  }, [cwd, refreshBackground])

  if (collapsed) {
    return (
      <aside className="sidebar sidebar-collapsed" aria-label="Sessions">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Expand sessions"
          aria-expanded={false}
          onClick={() => setCollapsed(false)}
        >
          <Chevron dir="right" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="sidebar" aria-label="Sessions" style={{ width }}>
      <div className="sidebar-head">
        <span className="sidebar-title">Sessions</span>
        <div className="sidebar-head-actions">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Refresh sessions"
            onClick={refresh}
          >
            <Refresh />
          </button>
          {/* Deliberately NOT gated on `busy`, unlike "New chat" beside it: a
              switch is a main-process transaction that asks the engine itself
              and answers `busy`. Disabling here would be a second busy source —
              and would make the refusal it returns unreachable. Same reasoning
              as a foreign session row (#47). */}
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Open project"
            onClick={() => onChooseFolder?.()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M2 11.3V3.5h3.7l1.2 1.5h5.1v6.3H2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="New chat"
            disabled={busy}
            onClick={() => onNewChat?.()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 2.5v9M2.5 7h9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Collapse sessions"
            aria-expanded={true}
            onClick={() => setCollapsed(true)}
          >
            <Chevron dir="left" />
          </button>
        </div>
      </div>
      {/* LIVE BACKGROUND SESSIONS — its own labelled section, above the stored
          transcripts, and the whole point of the label is that the two are not
          the same thing (#91). The rail was already the dangerous lookalike:
          it has a scope control and so LOOKS like it lists running work. It
          does not — everything below this section is a file on disk. Showing
          the live ones here, named, resolves that rather than deepening it.

          A section, not a dock: no titlebar toggle, no new control, and there
          is no router to reach a new dock with anyway.

          Above `.sidebar-filter` on purpose. The filter and the scope chips
          belong to the stored list and act on nothing here, so they sit with
          what they govern rather than straddling both. */}
      <section className="bg-sessions" aria-label="Background sessions">
        <div className="bg-sessions-head">
          <h3 className="bg-sessions-title">Background sessions</h3>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Refresh background sessions"
            // The ONLY thing in this app that repopulates the list, besides
            // opening a different workspace. Disabled while a look is in flight
            // so a second click cannot start a second CLI process (#90).
            disabled={bgLooking}
            onClick={refreshBackground}
          >
            <Refresh />
          </button>
        </div>
        {bgSessions === null ? (
          // A failed look. No separate Retry control: the refresh button one
          // line above IS the retry, and a second one would be two affordances
          // for one action.
          <div className="bg-sessions-empty" role="status">
            Could not list background sessions.
          </div>
        ) : bgSessions.length === 0 ? (
          // An empty list after a successful look is a real answer, not an
          // error — but only once someone has actually looked, which is what
          // separates these two strings.
          <div className="bg-sessions-empty">
            {bgLooking ? 'Looking…' : 'None running here'}
          </div>
        ) : (
          <ul className="bg-session-list">
            {bgSessions.map((s) => (
              // Keyed on sessionId: `id` is absent on some rows and is only an
              // 8-char prefix of this where it exists (#90).
              //
              // Read-only rows, deliberately: no attach, no peek, no reply —
              // those are a separate unmeasured feature. Which also means this
              // section adds exactly ONE tab stop (its refresh button) to a
              // rail that already carries ~100.
              <li key={s.sessionId} className="bg-session-row">
                <span className="bg-session-name" title={s.name || s.sessionId}>
                  {s.name || s.sessionId}
                </span>
                {/* The raw string from the CLI. Never mapped, never given an
                    icon per value: four values were measured where three were
                    predicted and the set is open (#90), so any lookup here
                    would silently render an unknown state as nothing. */}
                {s.state ? <span className="bg-session-state">{s.state}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="sidebar-filter">
        <input
          type="search"
          className="sidebar-filter-input"
          aria-label="Filter sessions"
          placeholder="Filter sessions…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE)
          }}
        />
      </div>
      <div className="session-scope" role="group" aria-label="Session scope">
        {SCOPES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="session-scope-btn"
            aria-pressed={scope === value}
            onClick={() => setScope(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {sessions === null ? (
        // A failed listing, NOT "No sessions yet" — those words are what a fresh
        // install sees, and reusing them for a breakage is the dead end this
        // exists to remove. The retry belongs to this branch alone: an empty
        // store has nothing a second look could turn up.
        <div className="sidebar-empty" role="status">
          <span>Could not load sessions.</span>
          <button
            type="button"
            className="sidebar-empty-retry"
            aria-label="Retry loading sessions"
            onClick={refresh}
          >
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="sidebar-empty">No sessions yet</div>
      ) : groups.length === 0 ? (
        // Two different nothings. A query that matches nothing is the user's own
        // narrowing and says so. Everything else here is the scope: the store has
        // sessions, none of them in this workspace — unreachable while showing all
        // projects, so it needs no scope guard, and it offers the one control that
        // resolves it rather than making the rail look broken.
        <div className="sidebar-empty">
          {query.trim() ? (
            <span>No sessions match “{query.trim()}”</span>
          ) : (
            <>
              <span>No sessions in this project yet</span>
              <button
                type="button"
                className="sidebar-empty-retry"
                onClick={() => setScope('all')}
              >
                Show all projects
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="session-groups">
          {groups.map((group) => (
            <div key={group.key} className="session-group">
              <h3 className="session-group-head" title={group.label}>
                {group.label}
              </h3>
              <ul className="session-list">
                {group.sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    groupLabel={group.label}
                    // A row outside the open workspace resumes through the
                    // workspace transition (#47) rather than the in-project
                    // resume: it has to move the engine's cwd before the
                    // transcript means anything.
                    foreign={!group.current}
                    active={s.id === activeId}
                    busy={busy}
                    armed={s.id === armed}
                    enriched={labels.get(s.id)}
                    onEnriched={onEnriched}
                    onOpen={onOpen}
                    onSwitch={onSwitch}
                    onArm={setArmed}
                    onDisarm={disarm}
                    onDelete={commitDelete}
                  />
                ))}
              </ul>
            </div>
          ))}
          {matched > shown ? (
            <button
              type="button"
              className="session-more"
              onClick={() => setLimit((n) => n + PAGE)}
            >
              Show {matched - shown} more
            </button>
          ) : null}
        </div>
      )}
      <div
        className="sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onPointerDown={startResize}
      />
    </aside>
  )
}

export default Sidebar
