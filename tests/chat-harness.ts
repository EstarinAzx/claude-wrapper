import { vi } from 'vitest'
import { act } from '@testing-library/react'
import type { EngineEvent } from '../src/shared/engine-types'

// Test-side stand-in for preload+main plumbing: the scripted engine seam.
// Tests drive `emit` as the fake engine's event stream.
export function fakeChatApi(folder = 'D:\\projects\\demo') {
  const prompts: string[] = []
  const listeners = new Set<(e: EngineEvent) => void>()
  const api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn<() => Promise<string | null>>().mockResolvedValue(folder),
    sendPrompt: (text: string): void => {
      prompts.push(text)
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
  return { api, prompts, emit }
}
