import { vi } from 'vitest'
import { act } from '@testing-library/react'
import { createPermissionBroker } from '../src/main/permission-broker'
import type { EngineEvent, PermissionDecision } from '../src/shared/engine-types'

// Test-side stand-in for preload+main plumbing: the scripted engine seam.
// Tests drive `emit` as the fake engine's event stream; permission responses
// settle through the real main-process broker.
export const fakeChatApi = (folder = 'D:\\projects\\demo') => {
  const prompts: string[] = []
  const permissionResponses: Array<{ toolUseId: string; decision: PermissionDecision }> =
    []
  const broker = createPermissionBroker()
  const listeners = new Set<(e: EngineEvent) => void>()
  const api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn<() => Promise<string | null>>().mockResolvedValue(folder),
    listSessions: vi.fn().mockResolvedValue([]),
    loadTranscript: vi.fn().mockResolvedValue([]),
    sendPrompt: (text: string): void => {
      prompts.push(text)
    },
    stopTurn: vi.fn(),
    respondToPermission: (toolUseId: string, decision: PermissionDecision): void => {
      permissionResponses.push({ toolUseId, decision })
      broker.respond(toolUseId, decision)
    },
    onChatEvent: (cb: (e: EngineEvent) => void): (() => void) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    }
  }
  const emit = (e: EngineEvent): void => {
    act(() => {
      listeners.forEach((l) => l(e))
    })
  }
  const waitForPermission = (toolUseId: string): Promise<PermissionDecision> =>
    broker.request({ toolUseId, signal: new AbortController().signal })
  return { api, prompts, permissionResponses, emit, waitForPermission }
}
