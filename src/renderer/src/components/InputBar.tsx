import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

interface InputBarProps {
  busy: boolean
  onSend: (text: string) => void
  onStop: () => void
}

const InputBar = ({ busy, onSend, onStop }: InputBarProps) => {
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
      <p className="footer-line">Claude can make mistakes. Verify important information.</p>
    </footer>
  )
}

export default InputBar
