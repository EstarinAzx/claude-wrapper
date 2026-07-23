import { useCallback, useEffect, useRef, useState } from 'react'
import type { EngineEvent, PermissionDecision } from '../../shared/engine-types'
import { resultSummary } from './toolSummaries'

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string }
  | { id: string; role: 'error'; text: string }
  | {
      id: string
      role: 'tool'
      toolUseId: string
      name: string
      input: Record<string, unknown>
      result: string | null
      isError: boolean
      permission: 'pending' | 'denied' | null
    }

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
        if (assistantIdRef.current === null) {
          const id = uid()
          assistantIdRef.current = id
          setMessages((prev) => [...prev, { id, role: 'assistant', text: e.text }])
        } else {
          const id = assistantIdRef.current
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id && m.role === 'assistant'
                ? { ...m, text: m.text + e.text }
                : m
            )
          )
        }
      } else if (e.type === 'tool-use' || e.type === 'permission-request') {
        // Both events upsert one card by toolUseId, so arrival order can't duplicate it
        const pending = e.type === 'permission-request'
        assistantIdRef.current = null
        setMessages((prev) => {
          const existing = prev.find(
            (m): m is Extract<ChatMessage, { role: 'tool' }> =>
              m.role === 'tool' && m.toolUseId === e.id
          )
          if (existing) {
            return prev.map((m) =>
              m === existing
                ? {
                    ...m,
                    name: e.name || m.name,
                    input: Object.keys(e.input).length ? e.input : m.input,
                    permission: pending ? ('pending' as const) : m.permission
                  }
                : m
            )
          }
          return [
            ...prev,
            {
              id: uid(),
              role: 'tool' as const,
              toolUseId: e.id,
              name: e.name,
              input: e.input,
              result: null,
              isError: false,
              permission: pending ? ('pending' as const) : null
            }
          ]
        })
      } else if (e.type === 'tool-result') {
        setMessages((prev) =>
          prev.map((m) =>
            m.role === 'tool' && m.toolUseId === e.id
              ? m.permission === 'denied'
                ? m
                : {
                    ...m,
                    result: resultSummary(e.text),
                    isError: e.isError,
                    permission: null
                  }
              : m
          )
        )
      } else if (e.type === 'turn-end') {
        assistantIdRef.current = null
        setBusy(false)
      } else if (e.type === 'error') {
        assistantIdRef.current = null
        setMessages((prev) => [
          ...prev.map((m) =>
            m.role === 'tool' && m.result === null
              ? { ...m, permission: 'denied' as const, result: 'Cancelled' }
              : m
          ),
          { id: uid(), role: 'error', text: e.message }
        ])
        setBusy(false)
      }
    })
    return unsub
  }, [])

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || busy) return
      assistantIdRef.current = null
      setMessages((prev) => [...prev, { id: uid(), role: 'user', text }])
      setBusy(true)
      window.api.sendPrompt(text)
    },
    [busy]
  )

  const respondToPermission = useCallback(
    (toolUseId: string, decision: PermissionDecision) => {
      window.api.respondToPermission(toolUseId, decision)
      setMessages((prev) =>
        prev.map((m) => {
          if (m.role !== 'tool' || m.toolUseId !== toolUseId) return m
          if (decision === 'allow') {
            return { ...m, permission: null }
          }
          return { ...m, permission: 'denied', result: 'Denied' }
        })
      )
    },
    []
  )

  return { messages, busy, send, respondToPermission }
}
