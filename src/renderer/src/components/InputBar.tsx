import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import {
  admitAttachments,
  type Candidate,
  type Rejection
} from '../../../shared/attachment-policy'
import type { Attachment } from '../../../shared/attachment-types'
import { findModel, modelLabel, type ModelOption } from '../../../shared/model-types'
import { effortLevelsFor, type EffortLevel } from '../../../shared/effort'
import type { SlashCommandInfo } from '../../../shared/command-types'
import { decideQueue, type LastTurn } from '../../../shared/queued-send'
import { applyAtAccept, findAtQuery, matchFiles } from '../../../shared/file-refs'

interface InputBarProps {
  busy: boolean
  model: string | null
  // #124 — the CLI's pickable rows, owned by App because two controls read
  // them: the pill lists them, and the effort control reads the effort scale
  // off the row covering `model`.
  models: ModelOption[]
  effort: EffortLevel | null
  // How the last turn ended (#80), which is not the same question as whether one
  // is running. `busy` going false cannot drive the queued send: Stop, a failed
  // turn and a finished one all clear it, and only the last has earned a send.
  lastTurn?: LastTurn | null
  // The CLI died under us (#73). A queued prompt must never be spent on it —
  // read HERE, at the moment the turn ends, rather than when it was queued,
  // because dying mid-turn is precisely one of the things that can change while
  // a prompt waits.
  engineDead?: boolean
  // Commands-dock insert (#39). REPLACES the composer text — a slash command
  // only expands as the first token, so inserting at the cursor is
  // meaningless; the click is deliberate. The nonce re-triggers the effect
  // when the same command is clicked twice.
  pendingInsert?: { text: string; nonce: number } | null
  onSend: (text: string, attachments: Attachment[]) => void
  onStop: () => void
  onPickModel: (model: string | null) => void
  onPickEffort: (effort: EffortLevel | null) => void
  // Re-read the rows. Called when the pill opens, so the list stays live
  // without this component owning the fetch.
  onRefreshModels: () => void
}

// Bottom-right model pill. The list is re-read on demand each time the menu
// opens (mode-aware, live from wisp routing); disabled while a turn streams so a
// pick never lands mid-stream. The label maps the current id back to its option
// label when known, else shows the raw id, else "Default" (the CLI default).
//
// #124 moved the FETCH up to App without changing when it happens: the effort
// control needs these same rows, and a second independent read would double a
// call that can spawn a CLI process (#112). `options` arrives as a prop now;
// `onOpen` is the same on-demand trigger it always was.
const ModelPill = ({
  model,
  options,
  busy,
  onPick,
  onOpen
}: {
  model: string | null
  options: ModelOption[]
  busy: boolean
  onPick: (model: string | null) => void
  onOpen: () => void
}) => {
  const [open, setOpen] = useState(false)

  const label = modelLabel(options, model)

  const toggle = (): void => {
    if (busy) return
    const next = !open
    setOpen(next)
    if (next) onOpen()
  }

  const pick = (id: string | null): void => {
    onPick(id)
    setOpen(false)
  }

  return (
    <div className="model-pill-wrap">
      {open && <button type="button" className="model-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} />}
      {/* Two classes on purpose. `model-pill` is the shell it has always had,
          declared in titlebar.css beside the two titlebar toggles;
          `control-value` is the composer strip's own value treatment, which
          restates those same values in composer.css so this pill and the effort
          readout beside it cannot drift apart when a titlebar pill is retuned.
          Nothing about how this renders today changes. */}
      <button
        type="button"
        className="model-pill control-value"
        aria-label="Model"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Model: ${label}`}
        disabled={busy}
        onClick={toggle}
      >
        {label}
      </button>
      {open && (
        <div className="model-menu" role="menu">
          <button type="button" className="model-menu-item" role="menuitem" onClick={() => pick(null)}>
            Default
          </button>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="model-menu-item"
              role="menuitem"
              onClick={() => pick(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// #124 — the reasoning-effort control, beside the model pill.
//
// A RANGE, not a menu, because effort is ORDINAL: `sdk.d.ts:551` documents the
// five levels as an ascending scale, and a dropdown throws that ordering away.
// Native `<input type="range">` rather than a hand-rolled segmented strip: arrow
// keys, Home/End and the roving focus all come free and correct, which a div
// with click handlers has to reimplement and usually gets wrong.
//
// THE POSITIONS ARE THE CLI'S, not this file's. `effortLevelsFor` reads them off
// the row covering the current model, so a model advertising fewer levels gets
// fewer positions and the one measured model reporting `supportsEffort: false`
// gets no control at all. A literal five-item array here would be the #53 bug
// again, one layer up.
const EffortControl = ({
  effort,
  levels,
  busy,
  onPick
}: {
  effort: EffortLevel | null
  levels: EffortLevel[]
  busy: boolean
  onPick: (effort: EffortLevel | null) => void
}) => {
  // The CLI says this model takes no effort level. Say so where the control
  // would have been rather than hiding it: a control that silently vanishes
  // reads as a bug, and the acceptance here is that the degradation is VISIBLE.
  if (levels.length === 0) {
    return (
      <span className="effort-none" title="This model does not accept an effort level">
        Effort n/a
      </span>
    )
  }

  // STOP 0 IS "Default" — the absence of a level, not a sixth level. It is the
  // state the app opens in (no pick → no options.effort at all), and the model
  // pill's menu carries the identical row for the identical reason.
  //
  // It is here because five bare stops made `low` UNREACHABLE by one gesture, a
  // hole the suite caught rather than review: an unset pick has to park the
  // thumb somewhere, that somewhere was position 0, and a range fires no change
  // event when the thumb is already where the gesture put it. So clicking the
  // leftmost position on a fresh launch did nothing at all. Shifting the scale
  // by one gives the unset state a stop of its own and every level a stop the
  // user can actually land on.
  //
  // This does NOT make it a six-level control: `levels` is still exactly what
  // the CLI advertises, and `ultracode`/`auto` are still absent. Default is the
  // null pick, which is a real IPC value.
  const index = effort === null ? 0 : levels.indexOf(effort) + 1
  // A pick that is not on THIS model's scale — indexOf gave -1, so the thumb has
  // nowhere honest to go and parks on Default. The readout keeps naming the real
  // pick and `--offscale` says the thumb is not standing for it.
  const offscale = index === 0 && effort !== null
  const shown = effort ?? 'Default'

  return (
    <div
      className={`effort-control${offscale ? ' effort-control--offscale' : ''}`}
      title={
        offscale
          ? `Effort: ${shown}. This model does not offer that level.`
          : `Effort: ${shown}`
      }
    >
      <span className="effort-name" aria-hidden="true">
        Effort
      </span>
      <input
        type="range"
        className="effort-range"
        min={0}
        max={levels.length}
        step={1}
        value={offscale ? 0 : index}
        disabled={busy}
        aria-label="Effort"
        // The number under the thumb means nothing to a screen reader; the level
        // is the value. Carries the same truth as the readout, including
        // "Default" for an unset pick.
        aria-valuetext={shown}
        onChange={(e) => {
          const stop = Number(e.target.value)
          onPick(stop === 0 ? null : (levels[stop - 1] ?? null))
        }}
      />
      {/* `control-value` is the strip's shared value shell, worn by the model
          pill too (composer.css). This readout is not a button and does not
          become one by wearing it — the app already uses a hairline box for a
          static chip, and the pill is told apart by its cursor and its hover. */}
      <span className="effort-value control-value">{shown}</span>
    </div>
  )
}

interface TrayItem {
  id: string
  name: string
  attachment: Attachment
}

let nextChipId = 0
const chipId = (): string => {
  nextChipId += 1
  return `chip-${nextChipId}`
}

// FileReader hands back a data URL, which is base64 already — strip the scheme
// so what we keep matches the wire shape, where `data` carries no prefix.
const readAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('unreadable'))
    reader.readAsDataURL(file)
  })

// The composer's own refusal, not the policy's (#106). A clipboard file that has
// moved, been deleted or been locked since it was copied fails to read, and the
// policy cannot describe that: `judgeAttachment` is given a candidate and judges
// what it IS, so a read failure flattened to `''` falls out of the embed branch
// and lands in the catch-all, which names the media type as both the rejected
// kind and an accepted one. The composer is what knows the read failed.
const COULD_NOT_READ = "Couldn't be read, which can mean it was moved, deleted or locked"

const InputBar = ({
  busy,
  model,
  models,
  effort,
  lastTurn,
  engineDead = false,
  pendingInsert,
  onSend,
  onStop,
  onPickModel,
  onPickEffort,
  onRefreshModels
}: InputBarProps) => {
  const [value, setValue] = useState('')
  // A prompt committed while a turn is still running (#80). A FLAG on the draft,
  // never a copy of it, and that choice answers four of the ticket's questions at
  // once: cardinality is one by construction, "replace or append" dissolves
  // because what fires is whatever is in the box when the turn ends, cancelling
  // costs the user nothing because the text never went anywhere, and the whole
  // thing is cleared for free by the `key={cwd}` remount that already resets the
  // draft, the tray and the autocomplete. A queue held in App state would have to
  // join the `ok` branch of the workspace switch by hand — the `pendingInsert`
  // bug class verbatim.
  const [queued, setQueued] = useState(false)
  // Autocomplete (#40). Trigger window: the value starts with '/' and has no
  // space yet — exactly while a command NAME is being typed. A slash
  // mid-sentence never triggers; the first space means arguments, so the
  // popover gets out of the way. null list = not fetched (popover closed).
  const [cmdList, setCmdList] = useState<SlashCommandInfo[] | null>(null)
  // The workspace's referenceable files (#118). null = not fetched. Shared
  // highlight/dismissed state with the `/` popover below, because the two
  // windows are mutually exclusive by construction and one of them is always
  // the one being driven.
  const [fileList, setFileList] = useState<string[] | null>(null)
  // Where the caret is, which is what decides whether an `@` window is open —
  // unlike `/`, the trigger is a property of where the user is typing rather
  // than of the value as a whole.
  const [caret, setCaret] = useState(0)
  const [highlight, setHighlight] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  // Tray and rejections move together: one paste both admits and refuses items,
  // and the count cap is read off the tray, so a single atomic update avoids
  // judging a batch against a stale count.
  const [tray, setTray] = useState<{ items: TrayItem[]; rejections: Rejection[] }>({
    items: [],
    rejections: []
  })
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!busy) inputRef.current?.focus()
  }, [busy])

  // Keyed on the nonce, not the object, so the same command clicked twice
  // fires twice while an unrelated re-render never re-inserts.
  useEffect(() => {
    if (!pendingInsert) return
    setValue(pendingInsert.text)
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInsert?.nonce])

  // Any whitespace ends the window, not just a space (#42): a command name can
  // contain neither, and with newlines in play a break has to close the popover
  // exactly the way a space always did.
  const triggering = value.startsWith('/') && !/\s/.test(value)

  // Re-fetched on every keystroke inside the trigger window (the no-cache
  // contract taken literally), forgotten the moment the window closes. Per
  // keystroke and not per open on purpose: a fetch that lands [] (engine not
  // warm yet) must not wedge the popover shut for the rest of the window —
  // observed live, invisible to jsdom. A user who never types a slash never
  // causes a fetch.
  useEffect(() => {
    if (!triggering) {
      setCmdList(null)
      return
    }
    let live = true
    void window.api.listCommands().then((list) => {
      if (live) setCmdList(list)
    })
    return () => {
      live = false
    }
  }, [triggering, value])

  // The `@` window (#118). `/` takes precedence: the two are mutually exclusive
  // by construction — a value that starts with `/` and holds no whitespace
  // cannot contain an `@` preceded by whitespace or by the start of the input —
  // but the precedence is written down rather than relied on.
  const atQuery = triggering ? null : findAtQuery(value, caret)
  const atOpen = atQuery !== null

  // Fetched once per WINDOW OPEN, not per keystroke, and that difference from
  // `/` above is deliberate rather than an oversight. `/`'s list comes from the
  // engine, which may not be warm yet, so a fetch landing [] must not wedge the
  // popover shut for the rest of the window. This list comes from the
  // filesystem, is query-independent (main returns everything that survives its
  // boundary; the ranking and the cap are the renderer's), and an empty answer
  // means "no workspace open", which is a real answer rather than a cold start.
  //
  // ponytail: no cache across windows either. #116 measured the pruned walk at
  // 3ms/356 files, so one walk per `@` typed is well inside budget. If a
  // monorepo ever makes that false, the ceiling to raise is in
  // `workspace-files.ts` and the fix is a cache with an invalidation story, not
  // a bigger number here.
  useEffect(() => {
    if (!atOpen) {
      setFileList(null)
      return
    }
    let live = true
    void window.api.listWorkspaceFiles().then((files) => {
      if (live) setFileList(files)
    })
    return () => {
      live = false
    }
  }, [atOpen])

  const prefix = value.slice(1).toLowerCase()
  const cmdMatches =
    triggering && !dismissed && cmdList !== null
      ? cmdList.filter(
          (c) =>
            c.name.toLowerCase().startsWith(prefix) ||
            (c.aliases ?? []).some((a) => a.toLowerCase().startsWith(prefix))
        )
      : []
  const fileMatches =
    atQuery && !dismissed && fileList !== null ? matchFiles(fileList, atQuery.query) : []

  const openList: 'command' | 'file' | null =
    cmdMatches.length > 0 ? 'command' : fileMatches.length > 0 ? 'file' : null
  const rowCount = openList === 'command' ? cmdMatches.length : fileMatches.length
  const popoverOpen = openList !== null
  const hi = Math.min(highlight, rowCount - 1)

  // Set by an accept, applied after the controlled value has committed. A
  // mid-string insert has to put the caret back where the user was typing, and
  // React has already reset it to the end of the new value by then.
  const pendingCaret = useRef<number | null>(null)
  useEffect(() => {
    const next = pendingCaret.current
    if (next === null) return
    pendingCaret.current = null
    inputRef.current?.setSelectionRange(next, next)
    setCaret(next)
  }, [value])

  const acceptCommand = (c: SlashCommandInfo): void => {
    // Insert, never send — the trailing space also closes the trigger window.
    setValue(`/${c.name} `)
    inputRef.current?.focus()
  }

  // Replaces ONLY the `@token` being typed, never the whole value — the owner
  // call taken on #115, warranted by A4b: `/` replaces everything because a
  // slash command IS the whole first token, and an `@` reference is one token
  // inside a sentence.
  const acceptFile = (path: string): void => {
    const next = applyAtAccept(value, caret, path)
    pendingCaret.current = next.caret
    setValue(next.value)
    inputRef.current?.focus()
  }

  const acceptHighlighted = (): void => {
    if (openList === 'command') acceptCommand(cmdMatches[hi])
    else if (openList === 'file') acceptFile(fileMatches[hi])
  }

  // Only file data is intercepted; a text paste falls through to the input
  // untouched, which is the overwhelmingly common case. Every file — image or
  // not — is routed by the policy module rather than filtered here.
  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>): void => {
    const files = Array.from(e.clipboardData?.files ?? [])
    if (files.length === 0) return
    e.preventDefault()
    void Promise.all(
      files.map(async (file) => ({
        name: file.name || 'pasted image',
        mediaType: file.type,
        // `null`, never `''`: an empty string is indistinguishable from "this
        // type carries no bytes" once it reaches the policy, and the policy has
        // no vocabulary for a read that failed.
        data: await readAsBase64(file).catch(() => null)
      }))
    ).then((read) => {
      // An unreadable file never reaches the policy, so it also never spends a
      // slot from the count budget — it was refused before it could be judged.
      const candidates: Candidate[] = read.flatMap(({ name, mediaType, data }) =>
        data === null ? [] : [{ name, mediaType, data }]
      )
      const unreadable: Rejection[] = read.flatMap(({ name, data }) =>
        data === null ? [{ name, reason: COULD_NOT_READ }] : []
      )
      setTray((prev) => {
        const { accepted, rejected } = admitAttachments(prev.items.length, candidates)
        return {
          items: [...prev.items, ...accepted.map((a) => ({ id: chipId(), ...a }))],
          rejections: [...unreadable, ...rejected]
        }
      })
    })
  }

  // Same policy fold as paste so embed-vs-path routing and the count budget stay
  // one route regardless of source. An empty result is cancel — leave the tray
  // and any existing rejection message untouched rather than folding nothing.
  const openPicker = (): void => {
    void window.api.pickFiles().then((candidates) => {
      if (candidates.length === 0) return
      setTray((prev) => {
        const { accepted, rejected } = admitAttachments(prev.items.length, candidates)
        return {
          items: [...prev.items, ...accepted.map((a) => ({ id: chipId(), ...a }))],
          rejections: rejected
        }
      })
    })
  }

  const removeItem = (id: string): void => {
    setTray((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }))
  }

  const submit = (): void => {
    const text = value
    const attachments = tray.items.map((i) => i.attachment)
    // Attachments alone are a message — "look at this" needs no words.
    if (!text.trim() && attachments.length === 0) return
    // Enter during a turn COMMITS the draft instead of dropping it (#80). The
    // guard in `useChat.send` stays exactly where it is; this sits above it, and
    // an empty composer still queues nothing, so the commitment always has
    // something to be about.
    if (busy) {
      setQueued(true)
      return
    }
    onSend(text, attachments)
    setValue('')
    setTray({ items: [], rejections: [] })
    // The commitment is discharged by the send itself, so a flush leaves nothing
    // behind to fire a second time — and nothing to spend the NEXT draft on,
    // which is the failure a bare send-count cannot see (the flush empties the
    // box, so the second firing has nothing to send until something is typed).
    setQueued(false)
  }

  // The queued send (#80). Keyed on the nonce and NOT on `busy` going false:
  // every terminal outcome clears busy, so a not-busy rule resends after Stop
  // and can spend the prompt on a dead engine. The decision is the pure table in
  // `shared/queued-send.ts`; this effect only carries out its answer.
  //
  // Exactly-once falls out of the nonce: it changes once per terminal event, and
  // the flush clears the flag through `submit`, so the next turn ending finds
  // nothing queued. `busy` is already false in this commit — the same handler
  // that recorded the outcome cleared it — so `useChat.send` accepts the prompt.
  useEffect(() => {
    if (!lastTurn) return
    const action = decideQueue({ outcome: lastTurn.outcome, queued, engineDead })
    if (action === 'flush') submit()
    // Releases the commitment and NOT the text: the draft stays in the composer,
    // so a stopped or failed turn leaves the user holding exactly what they typed.
    else if (action === 'unqueue') setQueued(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTurn?.nonce])

  // Shift+Enter is a line break, never a send. setRangeText does the splice and
  // leaves the caret after the break, so React state only has to mirror what the
  // DOM already did — no height bookkeeping, no caret restoration.
  const insertNewline = (): void => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    el.setRangeText('\n', start, end, 'end')
    setValue(el.value)
  }

  // THE #40 pin, both directions: Enter is intercepted ONLY while the popover
  // is open with a highlighted row; in every other state it falls through to
  // submit, unchanged. Backwards breaks sending entirely.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Ahead of the popover branch so an open popover cannot swallow the break
    // (#42). Safe for the #40 pin, which is about a plain Enter: the submit
    // fallthrough below still sits AFTER the popover, where it belongs.
    // Mutation-verified — demoting this below the popover branch turns
    // Shift+Enter into an accept and fails the escape test.
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      insertNewline()
      return
    }
    if (popoverOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((hi + 1) % rowCount)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((hi - 1 + rowCount) % rowCount)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        acceptHighlighted()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setDismissed(true)
        return
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const hasTray = tray.items.length > 0 || tray.rejections.length > 0

  return (
    <footer className="input-bar">
      {/* Absent, not empty, when nothing is attached — the default composer must
          look exactly as it did before attachments existed. */}
      {hasTray ? (
        <div className="attachment-tray" aria-label="Attachments">
          {tray.items.map((item) => (
            <span key={item.id} className="attachment-chip">
              {item.attachment.kind === 'image' ? (
                <img
                  className="chip-thumb"
                  src={`data:${item.attachment.mediaType};base64,${item.attachment.data}`}
                  alt=""
                />
              ) : null}
              <span className="chip-name" title={item.name}>
                {item.name}
              </span>
              <button
                type="button"
                className="chip-remove"
                aria-label={`Remove ${item.name}`}
                onClick={() => removeItem(item.id)}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                </svg>
              </button>
            </span>
          ))}
          {tray.rejections.map((r) => (
            <span key={`${r.name}:${r.reason}`} className="attachment-reject" role="alert">
              <span className="reject-name">{r.name}</span>
              {`: ${r.reason}`}
            </span>
          ))}
        </div>
      ) : null}
      {/* The pending state, and the answer to "there is no button to press"
          (#80). While a turn runs the send button IS Stop, so Enter is the only
          affordance left to commit with — which means the commitment has to be
          legible somewhere, or the user has pressed Enter into silence.
          Deliberately quiet, and deliberately NOT a second send button: the one
          control here undoes the commitment.

          Rendered only while something is queued, so the resting composer is
          untouched. `.queued-note-cancel` is its own selector rather than a
          shared base — `.tool-card-toggle` and `.switch-refusal-retry` are both
          on record as bare selectors that started matching the wrong button. */}
      {queued ? (
        <div className="queued-note" role="status">
          <span className="queued-note-label">Queued to send when this turn finishes</span>
          <button
            type="button"
            className="queued-note-cancel"
            aria-label="Cancel queued prompt"
            onClick={() => setQueued(false)}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <div className="input-pill">
        {/* Live while a turn streams, like the field beside it (#80): the tray is
            part of the draft, so a composer that takes words but refuses images
            would queue a prompt with half of it missing. The policy still runs at
            admit time and the IPC boundary still re-checks at send. */}
        <button type="button" className="attach-btn" aria-label="Attach files" onClick={openPicker}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          ref={inputRef}
          className="message-input"
          rows={1}
          placeholder="Message Claude…"
          value={value}
          /* Never disabled (#80). "The composer is dead while a turn runs" is
             the complaint this ticket answers, and `disabled` also takes focus
             away mid-sentence. Sending is still refused while busy — by
             `useChat.send`, which is the one place that reads busy. */
          onChange={(e) => {
            setValue(e.target.value)
            // Read off the element rather than off the new value's length: a
            // mid-string edit leaves the caret where the edit happened, and the
            // `@` window is decided by where the caret is.
            setCaret(e.target.selectionStart ?? e.target.value.length)
            // Typing re-arms a dismissed popover and re-anchors the highlight.
            setDismissed(false)
            setHighlight(0)
          }}
          // Caret moves with no edit — a click or an arrow key — open and close
          // the `@` window just as typing does. Without this, moving back into a
          // half-typed reference leaves the popover shut.
          //
          // Read off the REF, never off the event target. React's `onSelect` is
          // a synthetic event whose target is not reliably this textarea, so
          // `e.target.selectionStart` can be undefined — and a `?? 0` fallback
          // then reports the caret at the start of the value, which closes the
          // window on the very gesture that should keep it open. Measured in a
          // real window by `gui-118.mjs`: the popover opened under jsdom and was
          // shut in Chromium, with every assertion in the vitest suite green.
          onSelect={() => {
            const el = inputRef.current
            if (el) setCaret(el.selectionStart ?? el.value.length)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        {/* Its own class and its own accessible name, not a variant of the
            command popover's: the GUI drivers select by class, and a bare shared
            selector matches whichever list renders first — the
            `.tool-card-toggle` and `.switch-refusal-retry` failure, both silent
            and both green. */}
        {openList === 'file' ? (
          <div className="file-popover" role="listbox" aria-label="File suggestions">
            {fileMatches.map((p, i) => (
              <button
                key={p}
                type="button"
                role="option"
                aria-selected={i === hi}
                className={`file-option${i === hi ? ' file-option--active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => acceptFile(p)}
              >
                <span className="file-row-name">{p.slice(p.lastIndexOf('/') + 1)}</span>
                {p.includes('/') ? (
                  <span className="file-row-path">{p.slice(0, p.lastIndexOf('/'))}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        {openList === 'command' ? (
          <div className="command-popover" role="listbox" aria-label="Command suggestions">
            {cmdMatches.map((c, i) => (
              <button
                key={c.name}
                type="button"
                role="option"
                aria-selected={i === hi}
                className={`command-option${i === hi ? ' command-option--active' : ''}`}
                // preventDefault keeps focus in the input through a mouse pick.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => acceptCommand(c)}
              >
                <span className="command-row-name">/{c.name}</span>
                {c.argumentHint ? (
                  <span className="command-row-hint">{c.argumentHint}</span>
                ) : null}
                {c.description ? (
                  <span className="command-option-desc">{c.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          className="send-btn"
          aria-label={busy ? 'Stop' : 'Send'}
          onClick={busy ? onStop : submit}
        >
          {busy ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 12V4" />
              <path d="M4 7l4-4 4 4" />
            </svg>
          )}
        </button>
      </div>
      {/* The composer's two settings, on a strip of their own. They used to share
          one space-between row with the disclaimer, which packed the disclaimer
          against the left edge and broke DESIGN.md line 67 outright: the footer
          is specified as a CENTRED line under the input, and it cannot be
          centred while two controls are competing for the same row.

          The "Model" name is here and not inside the pill for two reasons. The
          pill's own text is the model, and only the model (tests/model-picker
          pins it to exactly "Default" on a fresh launch, and gui-52 reads it
          back to prove the pill follows the CLI). And with the effort readout
          also resting on "Default", an unlabelled row printed that word twice
          with nothing to say what either one was. Named, they read as two
          settings that happen to be untouched. */}
      <div className="composer-controls">
        <EffortControl
          effort={effort}
          levels={effortLevelsFor(findModel(models, model))}
          busy={busy}
          onPick={onPickEffort}
        />
        <div className="model-control">
          {/* Hidden from assistive tech: the pill already carries
              aria-label="Model", so announcing the word twice is noise. Mirrors
              `.effort-name` beside the slider. */}
          <span className="control-name" aria-hidden="true">
            Model
          </span>
          <ModelPill
            model={model}
            options={models}
            busy={busy}
            onPick={onPickModel}
            onOpen={onRefreshModels}
          />
        </div>
      </div>
      <p className="footer-line">Claude can make mistakes. Verify important information.</p>
    </footer>
  )
}

export default InputBar
