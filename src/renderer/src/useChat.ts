import { useCallback, useEffect, useRef, useState } from 'react'
import type { EngineEvent, PermissionDecision } from '../../shared/engine-types'
import type { TranscriptMessage } from '../../shared/session-types'
import { resultSummary } from './toolSummaries'

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string }
  | { id: string; role: 'error'; text: string }
  | { id: string; role: 'notice'; text: string }
  | {
      id: string
      role: 'tool'
      toolUseId: string
      name: string
      input: Record<string, unknown>
      result: string | null
      isError: boolean
      permission: 'pending' | 'denied' | null
      // Set when this tool call is a Task that spawned a subagent, tracking its
      // live status. Absent for ordinary tools. Drives the subagent row + drawer.
      subagent?: 'running' | 'done' | 'failed'
    }

let nextId = 0
const uid = (): string => {
  nextId += 1
  return String(nextId)
}

// Map a parsed transcript message to the renderer's ChatMessage. Tool results
// are summarised the same way the live tool-result event is, so a replayed
// tool card reads identically to a live one; historical permission is null.
// Exported so the subagent drawer renders a loaded transcript identically.
export const toChatMessage = (m: TranscriptMessage): ChatMessage => {
  if (m.role === 'tool') {
    return {
      id: uid(),
      role: 'tool',
      toolUseId: m.toolUseId,
      name: m.name,
      input: m.input,
      result: m.result === null ? null : resultSummary(m.result),
      isError: m.isError,
      permission: null
    }
  }
  return { id: uid(), role: m.role, text: m.text }
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
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
      } else if (e.type === 'subagent') {
        // Stamp the parent Task card with its subagent's live status. Keyed by
        // parentToolUseId (== the Task card's toolUseId); the card renders a
        // clickable subagent row from this field.
        setMessages((prev) =>
          prev.map((m) =>
            m.role === 'tool' && m.toolUseId === e.parentToolUseId
              ? { ...m, subagent: e.status }
              : m
          )
        )
      } else if (e.type === 'turn-end') {
        assistantIdRef.current = null
        setBusy(false)
        void window.api.currentSessionId().then((id) => {
          if (id) setActiveSessionId(id)
        })
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
      } else if (e.type === 'turn-aborted') {
        assistantIdRef.current = null
        setMessages((prev) => [
          ...prev.map((m) =>
            m.role === 'tool' && m.result === null
              ? { ...m, permission: 'denied' as const, result: 'Cancelled' }
              : m
          ),
          { id: uid(), role: 'notice', text: 'Stopped' }
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

  const stop = useCallback(() => {
    if (!busy) return
    window.api.stopTurn()
  }, [busy])

  // Open a past session: replay its transcript (read-only history) and point the
  // engine at it so the next turn continues in place (resume), not a fork.
  const openSession = useCallback(async (id: string) => {
    if (busy) return
    const transcript = await window.api.loadTranscript(id)
    assistantIdRef.current = null
    setBusy(false)
    setMessages(transcript.map(toChatMessage))
    setActiveSessionId(id)
    window.api.targetSession(id)
  }, [busy])

  // Start a fresh conversation: clear the pane and drop any resume target.
  const newChat = useCallback(() => {
    if (busy) return
    assistantIdRef.current = null
    setBusy(false)
    setMessages([])
    setActiveSessionId(null)
    window.api.targetSession(null)
  }, [busy])

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

  return { messages, busy, activeSessionId, send, stop, respondToPermission, openSession, newChat }
}
