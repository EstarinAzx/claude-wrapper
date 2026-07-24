import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import type { ModelOption } from '../src/shared/model-types'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => cleanup())

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const pill = (): HTMLButtonElement => screen.getByLabelText('Model') as HTMLButtonElement

const send = (text: string) => {
  const input = screen.getByPlaceholderText('Message Claude…') as HTMLInputElement
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('input-box model picker', () => {
  test('starts on the CLI default', async () => {
    await startSession()
    expect(pill().textContent).toBe('Default')
  })

  test('opening the pill lists the families (fetched on demand)', async () => {
    await startSession()
    fireEvent.click(pill())
    expect(harness.api.listModels).toHaveBeenCalled()
    await screen.findByRole('menuitem', { name: 'Opus' })
    for (const label of ['Sonnet', 'Haiku', 'Fable']) {
      expect(screen.getByRole('menuitem', { name: label })).toBeTruthy()
    }
  })

  test('wisped mode adds the router aliases to the list', async () => {
    const wisped: ModelOption[] = [
      { id: 'opus', label: 'Opus', group: 'family' },
      { id: 'grok-4.5', label: 'grok', group: 'alias' }
    ]
    harness.api.listModels.mockResolvedValue({ models: wisped, current: null })
    await startSession()
    fireEvent.click(pill())
    await screen.findByRole('menuitem', { name: 'grok' })
  })

  test('picking a model asks main to set it and KEEPS the conversation', async () => {
    await startSession()
    send('keep this going')
    harness.emit({ type: 'text-delta', text: 'still here' })
    harness.emit({ type: 'turn-end' })
    expect(screen.getByText('keep this going')).toBeTruthy()

    fireEvent.click(pill())
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Opus' }))
    expect(harness.api.setModel).toHaveBeenCalledWith('opus')
    // like the permission pill, the pane keeps its history
    expect(screen.getByText('keep this going')).toBeTruthy()
    expect(screen.getByText('still here')).toBeTruthy()
  })

  test('cannot pick mid-stream (disabled while busy)', async () => {
    await startSession()
    send('a long one')
    expect(pill().disabled).toBe(true)
    fireEvent.click(pill())
    expect(harness.api.setModel).not.toHaveBeenCalled()
  })

  test('the broadcast from main re-renders the pill label', async () => {
    await startSession()
    // open once so the option labels are loaded for id→label mapping
    fireEvent.click(pill())
    await screen.findByRole('menuitem', { name: 'Opus' })
    harness.emitModel('opus')
    expect(pill().textContent).toBe('Opus')
  })
})
