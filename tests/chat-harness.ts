import { vi } from 'vitest'
import { act } from '@testing-library/react'
import { createPermissionBroker } from '../src/main/permission-broker'
import type { EngineEvent, PermissionDecision, PermissionMode } from '../src/shared/engine-types'
import type { BackendInfo } from '../src/shared/backend-types'
import type { ModelInfo, ModelOption } from '../src/shared/model-types'

const FAMILY_MODELS: ModelOption[] = [
  { id: 'opus', label: 'Opus', group: 'family' },
  { id: 'sonnet', label: 'Sonnet', group: 'family' },
  { id: 'haiku', label: 'Haiku', group: 'family' },
  { id: 'fable', label: 'Fable', group: 'family' }
]

// Test-side stand-in for preload+main plumbing: the scripted engine seam.
// Tests drive `emit` as the fake engine's event stream; permission responses
// settle through the real main-process broker.
export const fakeChatApi = (folder = 'D:\\projects\\demo') => {
  const prompts: string[] = []
  const permissionResponses: Array<{ toolUseId: string; decision: PermissionDecision }> =
    []
  const broker = createPermissionBroker()
  const listeners = new Set<(e: EngineEvent) => void>()
  const backendListeners = new Set<(info: BackendInfo) => void>()
  const permListeners = new Set<(mode: PermissionMode) => void>()
  const modelListeners = new Set<(model: string | null) => void>()
  const api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn<() => Promise<string | null>>().mockResolvedValue(folder),
    listSessions: vi.fn().mockResolvedValue([]),
    loadTranscript: vi.fn().mockResolvedValue([]),
    targetSession: vi.fn(),
    currentSessionId: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
    backendMode: vi.fn().mockResolvedValue({ mode: 'native', wispedAvailable: false }),
    setBackendMode: vi.fn(),
    setZoom: vi.fn(),
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
    },
    onBackendChanged: (cb: (info: BackendInfo) => void): (() => void) => {
      backendListeners.add(cb)
      return () => backendListeners.delete(cb)
    },
    permissionMode: vi
      .fn<() => Promise<PermissionMode>>()
      .mockResolvedValue('bypassPermissions'),
    setPermissionMode: vi.fn(),
    onPermissionChanged: (cb: (mode: PermissionMode) => void): (() => void) => {
      permListeners.add(cb)
      return () => permListeners.delete(cb)
    },
    listModels: vi
      .fn<() => Promise<ModelInfo>>()
      .mockResolvedValue({ models: FAMILY_MODELS, current: null }),
    setModel: vi.fn(),
    onModelChanged: (cb: (model: string | null) => void): (() => void) => {
      modelListeners.add(cb)
      return () => modelListeners.delete(cb)
    }
  }
  const emit = (e: EngineEvent): void => {
    act(() => {
      listeners.forEach((l) => l(e))
    })
  }
  const emitBackend = (info: BackendInfo): void => {
    act(() => {
      backendListeners.forEach((l) => l(info))
    })
  }
  const emitPermission = (mode: PermissionMode): void => {
    act(() => {
      permListeners.forEach((l) => l(mode))
    })
  }
  const emitModel = (model: string | null): void => {
    act(() => {
      modelListeners.forEach((l) => l(model))
    })
  }
  const waitForPermission = (toolUseId: string): Promise<PermissionDecision> =>
    broker.request({ toolUseId, signal: new AbortController().signal })
  return {
    api,
    prompts,
    permissionResponses,
    emit,
    emitBackend,
    emitPermission,
    emitModel,
    waitForPermission
  }
}
