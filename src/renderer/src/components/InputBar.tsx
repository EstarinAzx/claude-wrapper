import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { ModelOption } from '../../../shared/model-types'

interface InputBarProps {
  busy: boolean
  model: string | null
  onSend: (text: string) => void
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

const InputBar = ({ busy, model, onSend, onStop, onPickModel }: InputBarProps) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!busy) inputRef.current?.focus()
  }, [busy])

  const submit = (): void => {
    if (busy) return
    const text = value
    if (!text.trim()) return
    onSend(text)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <footer className="input-bar">
      <div className="input-pill">
        <button type="button" className="attach-btn" aria-label="Attach" tabIndex={-1}>
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
