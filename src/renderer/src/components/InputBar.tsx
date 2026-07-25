import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import {
  admitAttachments,
  type Candidate,
  type Rejection
} from '../../../shared/attachment-policy'
import type { Attachment } from '../../../shared/attachment-types'
import type { ModelOption } from '../../../shared/model-types'

interface InputBarProps {
  busy: boolean
  model: string | null
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

  const label = options.find((o) => o.id === model)?.label ?? model ?? 'Default'

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
              key={`${o.group}:${o.id}`}
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

const InputBar = ({ busy, model, onSend, onStop, onPickModel }: InputBarProps) => {
  const [value, setValue] = useState('')
  // Tray and rejections move together: one paste both admits and refuses items,
  // and the count cap is read off the tray, so a single atomic update avoids
  // judging a batch against a stale count.
  const [tray, setTray] = useState<{ items: TrayItem[]; rejections: Rejection[] }>({
    items: [],
    rejections: []
  })
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!busy) inputRef.current?.focus()
  }, [busy])

  // Only file data is intercepted; a text paste falls through to the input
  // untouched, which is the overwhelmingly common case. Every file — image or
  // not — is routed by the policy module rather than filtered here.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    if (busy) return
    const files = Array.from(e.clipboardData?.files ?? [])
    if (files.length === 0) return
    e.preventDefault()
    void Promise.all(
      files.map(
        async (file): Promise<Candidate> => ({
          name: file.name || 'pasted image',
          mediaType: file.type,
          data: await readAsBase64(file).catch(() => '')
        })
      )
    ).then((candidates) => {
      setTray((prev) => {
        const { accepted, rejected } = admitAttachments(prev.items.length, candidates)
        return {
          items: [...prev.items, ...accepted.map((a) => ({ id: chipId(), ...a }))],
          rejections: rejected
        }
      })
    })
  }

  // Same policy fold as paste so embed-vs-path routing and the count budget stay
  // one route regardless of source. An empty result is cancel — leave the tray
  // and any existing rejection message untouched rather than folding nothing.
  const openPicker = (): void => {
    if (busy) return
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
    if (busy) return
    const text = value
    const attachments = tray.items.map((i) => i.attachment)
    // Attachments alone are a message — "look at this" needs no words.
    if (!text.trim() && attachments.length === 0) return
    onSend(text, attachments)
    setValue('')
    setTray({ items: [], rejections: [] })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
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
      <div className="input-pill">
        <button
          type="button"
          className="attach-btn"
          aria-label="Attach files"
          disabled={busy}
          onClick={openPicker}
        >
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
        <input
          ref={inputRef}
          className="message-input"
          type="text"
          placeholder="Message Claude…"
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
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
