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

  // The labels asserted here are the CLI's own displayName values, not names
  // this app invents — "Opus (1M context)", not "Opus". Rendering the CLI's
  // string is the contract; a prettified label would be this app deciding what
  // the model is called again.
  test('opening the pill lists the CLI’s rows (fetched on demand)', async () => {
    await startSession()
    fireEvent.click(pill())
    expect(harness.api.listModels).toHaveBeenCalled()
    await screen.findByRole('menuitem', { name: 'Opus (1M context)' })
    for (const label of [
      'Default (recommended)',
      'Sonnet 5 (1M context)',
      'Fable',
      'terra — gpt-5.6-terra'
    ]) {
      expect(screen.getByRole('menuitem', { name: label })).toBeTruthy()
    }
  })

  // Whatever the CLI advertises is what the menu shows — there is no app-side
  // list to fall back to, so an empty list must render an empty menu rather
  // than four resurrected family tokens.
  test('an empty CLI list yields an empty menu, not a hardcoded fallback', async () => {
    harness.api.listModels.mockResolvedValue({ models: [], current: null })
    await startSession()
    fireEvent.click(pill())
    await screen.findByRole('menuitem', { name: 'Default' })
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
  })

  test('rows the CLI adds appear without an app change', async () => {
    const extra: ModelOption[] = [{ id: 'claude-wisp-grok', label: 'grok — grok-4.5' }]
    harness.api.listModels.mockResolvedValue({ models: extra, current: null })
    await startSession()
    fireEvent.click(pill())
    await screen.findByRole('menuitem', { name: 'grok — grok-4.5' })
  })

  test('picking a model asks main to set it and KEEPS the conversation', async () => {
    await startSession()
    send('keep this going')
    harness.emit({ type: 'text-delta', text: 'still here' })
    harness.emit({ type: 'turn-end' })
    expect(screen.getByText('keep this going')).toBeTruthy()

    fireEvent.click(pill())
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Opus (1M context)' }))
    // the CLI's own `value` goes back verbatim — bracket suffix and all
    expect(harness.api.setModel).toHaveBeenCalledWith('opus[1m]')
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

  // #52, the reported bug: `/model` is typed into the composer, so nothing ever
  // clicks the pill. Before this, the label kept showing the last pick.
  test('a CLI-side model change moves the pill with no pick at all', async () => {
    await startSession()
    fireEvent.click(pill())
    fireEvent.click(await screen.findByRole('menuitem', { name: 'terra — gpt-5.6-terra' }))
    expect(pill().textContent).toBe('terra — gpt-5.6-terra')

    // user types `/model opus[1m]`; main hears it from the CLI and broadcasts
    send('/model opus[1m]')
    harness.emit({ type: 'turn-end' })
    harness.emitModel('opus[1m]')
    expect(pill().textContent).toBe('Opus (1M context)')
    // and the pill was never touched to get there
    expect(harness.api.setModel).toHaveBeenCalledTimes(1)
  })

  test('the broadcast from main re-renders the pill label', async () => {
    await startSession()
    // open once so the option labels are loaded for id→label mapping
    fireEvent.click(pill())
    await screen.findByRole('menuitem', { name: 'Opus (1M context)' })
    harness.emitModel('opus[1m]')
    expect(pill().textContent).toBe('Opus (1M context)')
  })
})
