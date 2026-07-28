import { useCallback, useEffect, useRef, useState } from 'react'
import type { Attachment } from '../../shared/attachment-types'
import type { EngineEvent, PermissionDecision } from '../../shared/engine-types'
import type { AttachmentMarker, TranscriptMessage } from '../../shared/session-types'
import type { LiveAgent } from '../../shared/subagent-types'
import { resultSummary } from './toolSummaries'

export type ChatMessage =
  // `attachments` holds live image bytes and renders thumbnails;
  // `attachmentMarkers` holds replay-only kinds/names and renders chips. Two
  // fields, not one, because the payload is deliberately not replayed on
  // reopen. Both are absent — not empty — when there is nothing to show, so an
  // ordinary text message renders byte-identically to before either existed.
  | {
      id: string
      role: 'user'
      text: string
      attachments?: Attachment[]
      attachmentMarkers?: AttachmentMarker[]
    }
  | { id: string; role: 'assistant'; text: string }
  | { id: string; role: 'error'; text: string }
  | { id: string; role: 'notice'; text: string }
  // Local slash-command output — CLI-produced markdown, rendered without an
  // avatar so it is never attributed to Claude.
  | { id: string; role: 'command'; text: string }
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
  if (m.role === 'user') {
    const msg: Extract<ChatMessage, { role: 'user' }> = {
      id: uid(),
      role: 'user',
      text: m.text
    }
    // Replay markers only — live bytes never cross IPC on reopen.
    if (m.attachments && m.attachments.length) {
      msg.attachmentMarkers = m.attachments
    }
    return msg
  }
  return { id: uid(), role: m.role, text: m.text }
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([])
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
        // Upsert into the live-agents list. Only defined event fields are written
        // — omission means "this tick said nothing", not "clear the prior value".
        setLiveAgents((prev) => {
          const idx = prev.findIndex((a) => a.parentToolUseId === e.parentToolUseId)
          const patch: LiveAgent = { parentToolUseId: e.parentToolUseId, status: e.status }
          if (e.taskId !== undefined) patch.taskId = e.taskId
          if (e.agentType !== undefined) patch.agentType = e.agentType
          if (e.description !== undefined) patch.description = e.description
          if (e.totalTokens !== undefined) patch.totalTokens = e.totalTokens
          if (e.toolUses !== undefined) patch.toolUses = e.toolUses
          if (e.durationMs !== undefined) patch.durationMs = e.durationMs
          if (e.lastToolName !== undefined) patch.lastToolName = e.lastToolName
          if (idx === -1) return [...prev, patch]
          return prev.map((a, i) => (i === idx ? { ...a, ...patch } : a))
        })
      } else if (e.type === 'command-output') {
        // A later delta must start a fresh assistant bubble, never append here.
        assistantIdRef.current = null
        setMessages((prev) => [...prev, { id: uid(), role: 'command', text: e.text }])
      } else if (e.type === 'notice') {
        assistantIdRef.current = null
        setMessages((prev) => [...prev, { id: uid(), role: 'notice', text: e.text }])
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

  // "look at this" with an image and no words is a message, so attachments alone
  // are enough to send. The composer has already run them through the attachment
  // policy; this is the last stop before the IPC boundary re-checks them.
  const send = useCallback(
    (raw: string, attachments: Attachment[] = []) => {
      const text = raw.trim()
      if ((!text && attachments.length === 0) || busy) return
      assistantIdRef.current = null
      const message: Extract<ChatMessage, { role: 'user' }> = { id: uid(), role: 'user', text }
      if (attachments.length) message.attachments = attachments
      setMessages((prev) => [...prev, message])
      setBusy(true)
      window.api.sendPrompt({ text, attachments })
    },
    [busy]
  )

  const stop = useCallback(() => {
    if (!busy) return
    window.api.stopTurn()
  }, [busy])

  // Replay a session into the pane and make it the active one. NO engine call:
  // used after a workspace switch (#47), where main has already run the whole
  // transition and warmed a fresh engine on the target. Calling `targetSession`
  // here would close that engine and undo the warm-up.
  //
  // `null` adopts NO session — an empty pane, still without an engine call. That
  // is the folder-picker case (#48) and mirrors `SwitchRequest.resumeId: null`
  // exactly, so a switch runs one code path whether or not it resumes anything.
  // `newChat` is NOT that path: it sends `targetSession(null)`, which closes and
  // nulls the engine the transaction has just rebuilt and warmed, and it is
  // gated on the renderer's own `busy` — a second opinion that would silently
  // skip the reset main already said `ok` to.
  const adoptSession = useCallback(async (id: string | null) => {
    const transcript = id === null ? [] : await window.api.loadTranscript(id)
    assistantIdRef.current = null
    setBusy(false)
    setMessages(transcript.map(toChatMessage))
    setLiveAgents([])
    setActiveSessionId(id)
  }, [])

  // Open a past session in the CURRENT project: replay its transcript
  // (read-only history) and point the engine at it so the next turn continues
  // in place (resume), not a fork.
  const openSession = useCallback(
    async (id: string) => {
      if (busy) return
      await adoptSession(id)
      window.api.targetSession(id)
    },
    [busy, adoptSession]
  )

  // Start a fresh conversation: clear the pane and drop any resume target.
  const newChat = useCallback(() => {
    if (busy) return
    assistantIdRef.current = null
    setBusy(false)
    setMessages([])
    setLiveAgents([])
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

  return {
    messages,
    busy,
    activeSessionId,
    liveAgents,
    send,
    stop,
    respondToPermission,
    openSession,
    adoptSession,
    newChat
  }
}
