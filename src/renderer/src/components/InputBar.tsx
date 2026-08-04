import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import {
  admitAttachments,
  type Candidate,
  type Rejection
} from '../../../shared/attachment-policy'
import type { Attachment } from '../../../shared/attachment-types'
import { modelLabel, type ModelOption } from '../../../shared/model-types'
import type { SlashCommandInfo } from '../../../shared/command-types'
import { decideQueue, type LastTurn } from '../../../shared/queued-send'

interface InputBarProps {
  busy: boolean
  model: string | null
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
}

// Bottom-right model pill. The list is fetched on demand each time the menu
// opens (mode-aware, live from wisp routing); disabled while a turn streams so a
// pick never lands mid-stream. The label maps the current id back to its option
// label when known, else shows the raw id, else "Default" (the CLI default).
const ModelPill = ({
  model,
  busy,
  onPick
}: {
  model: string | null
  busy: boolean
  onPick: (model: string | null) => void
}) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ModelOption[]>([])

  const label = modelLabel(options, model)

  const toggle = (): void => {
    if (busy) return
    const next = !open
    setOpen(next)
    if (next) void window.api.listModels().then((info) => setOptions(info.models))
  }

  const pick = (id: string | null): void => {
    onPick(id)
    setOpen(false)
  }

  return (
    <div className="model-pill-wrap">
      {open && <button type="button" className="model-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setOpen(false)} />}
      <button
        type="button"
        className="model-pill"
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
const COULD_NOT_READ = "Couldn't be read — it may have been moved, deleted or locked"

const InputBar = ({
  busy,
  model,
  lastTurn,
  engineDead = false,
  pendingInsert,
  onSend,
  onStop,
  onPickModel
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

  const prefix = value.slice(1).toLowerCase()
  const matches =
    triggering && !dismissed && cmdList !== null
      ? cmdList.filter(
          (c) =>
            c.name.toLowerCase().startsWith(prefix) ||
            (c.aliases ?? []).some((a) => a.toLowerCase().startsWith(prefix))
        )
      : []
  const popoverOpen = matches.length > 0
  const hi = Math.min(highlight, matches.length - 1)

  const accept = (c: SlashCommandInfo): void => {
    // Insert, never send — the trailing space also closes the trigger window.
    setValue(`/${c.name} `)
    inputRef.current?.focus()
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
        setHighlight((hi + 1) % matches.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((hi - 1 + matches.length) % matches.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        accept(matches[hi])
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
              {` — ${r.reason}`}
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
          <span className="queued-note-label">Queued — sends when this turn finishes</span>
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
            // Typing re-arms a dismissed popover and re-anchors the highlight.
            setDismissed(false)
            setHighlight(0)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        {popoverOpen ? (
          <div className="command-popover" role="listbox" aria-label="Command suggestions">
            {matches.map((c, i) => (
              <button
                key={c.name}
                type="button"
                role="option"
                aria-selected={i === hi}
                className={`command-option${i === hi ? ' command-option--active' : ''}`}
                // preventDefault keeps focus in the input through a mouse pick.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => accept(c)}
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
      <div className="input-foot">
        <p className="footer-line">Claude can make mistakes. Verify important information.</p>
        <ModelPill model={model} busy={busy} onPick={onPickModel} />
      </div>
    </footer>
  )
}

export default InputBar
