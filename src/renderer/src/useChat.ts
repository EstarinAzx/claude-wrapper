import { useCallback, useEffect, useRef, useState } from 'react'
import type { TurnOutcome } from '../../shared/announce'
import type { LastTurn } from '../../shared/queued-send'
import type { Attachment } from '../../shared/attachment-types'
import type { EngineEvent, PermissionDecision } from '../../shared/engine-types'
import type { AttachmentMarker, TranscriptMessage } from '../../shared/session-types'
import type { LiveAgent } from '../../shared/subagent-types'
import type { BackgroundTask } from '../../shared/background-tasks'

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

// Record how a turn ended (#80). Written once rather than three times: the nonce
// arithmetic being wrong in one of the three terminal branches would surface
// only as "the second queued prompt never fires", which is a bad way to find out.
const endedTurn =
  (outcome: TurnOutcome) =>
  (prev: LastTurn | null): LastTurn => ({ outcome, nonce: (prev?.nonce ?? 0) + 1 })

// Map a parsed transcript message to the renderer's ChatMessage. The tool
// result is carried across COMPLETE, exactly as the live tool-result event is
// (#61): summarising is a rendering concern, and doing it here would discard
// the text the card's disclosure exists to show. `null` still means "no result
// yet", which is not the same as an empty one. Historical permission is null.
// Exported so the subagent drawer renders a loaded transcript identically.
export const toChatMessage = (m: TranscriptMessage): ChatMessage => {
  if (m.role === 'tool') {
    return {
      id: uid(),
      role: 'tool',
      toolUseId: m.toolUseId,
      name: m.name,
      input: m.input,
      result: m.result,
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
  // The session whose transcript could not be READ (#60), or null. Held as the
  // id rather than a boolean so the retry re-reads the session that actually
  // failed, not whatever happens to be active by the time it is pressed.
  const [failedTranscript, setFailedTranscript] = useState<string | null>(null)
  // The engine went terminal (#73): the CLI died under us, so every later turn
  // fails with the stored error and nothing recovers in place. Separate from the
  // error MESSAGE, which arrives on the chat stream and reads identically to a
  // per-turn failure — this is the one bit that says the conversation needs
  // rebuilding rather than another prompt.
  const [engineDead, setEngineDead] = useState(false)
  // How the last turn ENDED (#80). Deliberately not a second busy flag: `busy`
  // stays the one reading of whether a turn is running, and this is a record of
  // what happened when one stopped. The composer's queued send needs the
  // difference, because all three terminal outcomes clear `busy` and only one of
  // them has earned a send.
  const [lastTurn, setLastTurn] = useState<LastTurn | null>(null)
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([])
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([])
  // Track the live assistant message id without stale closures on event handlers
  const assistantIdRef = useRef<string | null>(null)
  // Live-tail (#57) eligibility: the session we are WATCHING, which is not the
  // same thing as the session we have open. Adopting sets it; sending or
  // starting a new chat clears it, because from then on we are driving and our
  // own stream keeps the pane current — a reload would clobber it, and would
  // swap live attachment thumbnails for replay chips.
  const tailIdRef = useRef<string | null>(null)
  const busyRef = useRef(false)
  const messagesRef = useRef<ChatMessage[]>([])
  // One reload in flight at a time, with a trailing re-run so the last write
  // before quiet is never missed.
  const reloadingRef = useRef(false)
  const pendingReloadRef = useRef(false)

  useEffect(() => {
    busyRef.current = busy
  }, [busy])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

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
                    // Stored complete (#61); the card derives its one line at
                    // render time and mounts the rest only when expanded.
                    ...m,
                    result: e.text,
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
        setLastTurn(endedTurn('turn-end'))
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
        setLastTurn(endedTurn('error'))
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
        setLastTurn(endedTurn('turn-aborted'))
      }
    })
    return unsub
  }, [])

  // The engine died (#73). Two things happen, and the second is the one that is
  // easy to miss: the resumable id is re-read from MAIN.
  //
  // `activeSessionId` is only written at turn-end, so a stream that dies mid
  // first-turn leaves it null here while main has held the id since `init`
  // (engine.ts captures it from any message once a turn has run). Trusting the
  // local null would offer "there is nothing to resume" for a conversation that
  // is perfectly resumable — the #54 fallback firing on a case it is not for.
  useEffect(() => {
    return window.api.onEngineTerminal(() => {
      setEngineDead(true)
      void window.api.currentSessionId().then((id) => {
        if (id) setActiveSessionId(id)
      })
    })
  }, [])

  // The CLI's live background-task set (#83). REPLACE, never append: each
  // payload is the whole membership, so a dropped message costs one frame of
  // accuracy instead of wedging a finished task on screen for good.
  //
  // Held HERE rather than in AgentsDock because the dock unmounts every time the
  // user closes the panel, and the level only re-fires when membership CHANGES —
  // a set living in the component would be lost on close with no way to get it
  // back until the next task started or ended.
  //
  // `[]` also arrives on every engine rebuild (the engine's own close() sends
  // it), which is the per-process reset: nothing is running once the CLI is gone.
  useEffect(() => {
    return window.api.onBackgroundTasks(setBackgroundTasks)
  }, [])

  // Re-read the watched session's transcript and replace the pane with it. The
  // read is the SAME channel a reopen uses — no new parsing surface — so a
  // tailed pane and a reopened one can never diverge.
  const reload = useCallback(async (id: string) => {
    if (reloadingRef.current) {
      pendingReloadRef.current = true
      return
    }
    reloadingRef.current = true
    // What the pane holds as far as this loop is concerned. `messagesRef` is
    // written by a passive effect, so between two iterations it still reports
    // the PRE-reload pane — reading it in the emptiness guard below would let a
    // transient [] wipe the transcript the previous iteration just applied.
    let paneLength = messagesRef.current.length
    try {
      do {
        pendingReloadRef.current = false
        const transcript = await window.api.loadTranscript(id)
        // Re-checked AFTER the await, not only before it: a send or a session
        // change during the read makes this result stale, and applying it would
        // clobber the live turn the user started meanwhile. Eligibility is the
        // mutation-verified half — the busy half is the spec's third condition
        // and is currently reachable only if a future path lets a turn start
        // without clearing eligibility.
        if (tailIdRef.current !== id || busyRef.current) break
        // A failed read (#60) is skipped, never applied and never announced: a
        // tail re-reads something already on screen, so the honest response to
        // "could not read it this time" is to leave the last good pane alone.
        // `continue`, not `break` — a re-run queued behind this one is a fresh
        // attempt and must still get its turn.
        if (transcript === null) continue
        // A tailed transcript never legitimately shrinks to nothing, so an empty
        // result against a non-empty pane is a hiccup (a truncated or
        // mid-rotation file), not a cleared conversation.
        if (transcript.length === 0 && paneLength > 0) continue
        assistantIdRef.current = null
        paneLength = transcript.length
        // Adoption arms the watch even when its own read failed, so this is the
        // path a recovered file arrives by. Applying it retires the notice: the
        // conversation it warns about is now on screen.
        setFailedTranscript(null)
        setMessages(transcript.map(toChatMessage))
      } while (pendingReloadRef.current)
    } finally {
      reloadingRef.current = false
    }
    // A signal that arrived while this loop was reading a session the user has
    // since left belongs to the session they are on NOW. Dropping it would hold
    // the new pane stale until its next write — and if that was the last write
    // before quiet, forever.
    if (pendingReloadRef.current) {
      const current = tailIdRef.current
      pendingReloadRef.current = false
      if (current && !busyRef.current) void reload(current)
    }
  }, [])

  // A change signal is only ever a signal: the id that changed. Subscribed on
  // mount, for the lifetime of the pane.
  useEffect(() => {
    return window.api.onSessionChanged((id: string) => {
      if (id !== tailIdRef.current || busyRef.current) return
      void reload(id)
    })
  }, [reload])

  // Stop tailing: eligibility first, then the watch itself. Order matters — a
  // signal already in flight must find eligibility already gone.
  const stopTail = useCallback(() => {
    tailIdRef.current = null
    pendingReloadRef.current = false
    window.api.watchSession(null)
  }, [])

  // "look at this" with an image and no words is a message, so attachments alone
  // are enough to send. The composer has already run them through the attachment
  // policy; this is the last stop before the IPC boundary re-checks them.
  const send = useCallback(
    (raw: string, attachments: Attachment[] = []) => {
      const text = raw.trim()
      if ((!text && attachments.length === 0) || busy) return
      // From here on we are driving this session, not watching it.
      stopTail()
      assistantIdRef.current = null
      // Typing into a session whose history would not load starts a real
      // conversation; the unread history is no longer what the pane is about.
      setFailedTranscript(null)
      const message: Extract<ChatMessage, { role: 'user' }> = { id: uid(), role: 'user', text }
      if (attachments.length) message.attachments = attachments
      setMessages((prev) => [...prev, message])
      setBusy(true)
      window.api.sendPrompt({ text, attachments })
    },
    [busy, stopTail]
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
  //
  // Adoption is also what makes a session tail-eligible (#57): we are looking
  // at it, not driving it, which is exactly the case live-tail is for.
  const adoptSession = useCallback(async (id: string | null) => {
    const transcript = id === null ? [] : await window.api.loadTranscript(id)
    assistantIdRef.current = null
    setBusy(false)
    busyRef.current = false
    // Every adoption path arrives on a rebuilt or freshly-targeted engine — the
    // workspace transaction rebuilds it, `targetSession` closes and nulls it so
    // the next send builds one. Either way the dead engine this flag described
    // is gone, so the control that offers to rebuild it must go with it.
    setEngineDead(false)
    // A failed read still clears the pane: leaving the previous conversation up
    // beside a notice about a different one is the stale-pane bug in miniature.
    // The notice plus its retry is what replaces it — never an empty pane, which
    // is the "corrupt session reads as an empty conversation" state itself.
    setFailedTranscript(transcript === null ? id : null)
    setMessages((transcript ?? []).map(toChatMessage))
    setLiveAgents([])
    setActiveSessionId(id)
    tailIdRef.current = id
    pendingReloadRef.current = false
    // ponytail: the watch is installed AFTER the read, so a write landing in
    // that window is only picked up by the next one. Installing it first would
    // close the gap but opens a worse race — a reload could resolve before this
    // adoption's own (older) read and be overwritten by it. Fix by routing the
    // adoption read through `reload` with an authoritative first pass if a
    // missed write is ever actually observed.
    window.api.watchSession(id)
  }, [])

  // Try the failed read again. The whole adoption is re-run rather than just the
  // read: a failure left no watch worth keeping, and re-adopting is the one path
  // that re-arms live-tail (#57) as well as refilling the pane.
  const retryTranscript = useCallback(() => {
    if (failedTranscript) void adoptSession(failedTranscript)
  }, [failedTranscript, adoptSession])

  // Open a past session in the CURRENT project: replay its transcript
  // (read-only history) and point the engine at it so the next turn continues
  // in place (resume), not a fork.
  const openSession = useCallback(
    async (id: string) => {
      if (busy) return
      // The conversation you are already in is a row now: until the listing
      // stopped hiding this app's own sessions it could never appear, so this
      // click was unreachable. Re-adopting it would stomp the live pane with a
      // disk read of a transcript that is still being written.
      if (id === activeSessionId) return
      await adoptSession(id)
      window.api.targetSession(id)
    },
    [busy, activeSessionId, adoptSession]
  )

  // Start a fresh conversation: clear the pane and drop any resume target.
  const newChat = useCallback(() => {
    if (busy) return
    stopTail()
    assistantIdRef.current = null
    setBusy(false)
    setFailedTranscript(null)
    setEngineDead(false)
    setMessages([])
    setLiveAgents([])
    setActiveSessionId(null)
    window.api.targetSession(null)
  }, [busy, stopTail])

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
    lastTurn,
    activeSessionId,
    liveAgents,
    backgroundTasks,
    engineDead,
    transcriptFailed: failedTranscript !== null,
    retryTranscript,
    send,
    stop,
    respondToPermission,
    openSession,
    adoptSession,
    newChat
  }
}
