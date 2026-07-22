import { useCallback, useEffect, useRef, useState } from 'react'
import type { EngineEvent } from '../../shared/engine-types'

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string }
  | { id: string; role: 'error'; text: string }

let nextId = 0
function uid(): string {
  nextId += 1
  return String(nextId)
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  // Track the live assistant message id without stale closures on event handlers
  const assistantIdRef = useRef<string | null>(null)

  useEffect(() => {
    const unsub = window.api.onChatEvent((e: EngineEvent) => {
      if (e.type === 'text-delta') {
        const id = assistantIdRef.current
        if (!id) return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id && m.role === 'assistant'
              ? { ...m, text: m.text + e.text }
              : m
          )
        )
      } else if (e.type === 'turn-end') {
        assistantIdRef.current = null
        setBusy(false)
      } else if (e.type === 'error') {
        const emptyId = assistantIdRef.current
        assistantIdRef.current = null
        setMessages((prev) => {
          const cleaned =
            emptyId != null
              ? prev.filter(
                  (m) => !(m.id === emptyId && m.role === 'assistant' && m.text === '')
                )
              : prev
          return [...cleaned, { id: uid(), role: 'error', text: e.message }]
        })
        setBusy(false)
      }
    })
    return unsub
  }, [])

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || busy) return
      const assistantId = uid()
      assistantIdRef.current = assistantId
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text },
        { id: assistantId, role: 'assistant', text: '' }
      ])
      setBusy(true)
      window.api.sendPrompt(text)
    },
    [busy]
  )

  return { messages, busy, send }
}
