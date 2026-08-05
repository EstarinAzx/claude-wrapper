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

const slider = (): HTMLInputElement => screen.getByLabelText('Effort') as HTMLInputElement

// The visible readout — what the control claims will actually be sent.
const readout = (): string => document.querySelector('.effort-value')?.textContent ?? ''

const send = (text: string) => {
  const input = screen.getByPlaceholderText('Message Claude…') as HTMLInputElement
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

/** A CLI model list of exactly one row, made current. */
const oneRow = (row: ModelOption) => {
  harness.api.listModels.mockResolvedValue({ models: [row], current: row.id, effort: null })
}

describe('the effort control (#124)', () => {
  test('starts on the CLI default — no level claimed', async () => {
    await startSession()
    expect(readout()).toBe('Default')
    // The screen-reader value has to carry the same truth as the readout; the
    // raw thumb index means nothing to AT.
    expect(slider().getAttribute('aria-valuetext')).toBe('Default')
    expect(harness.api.setEffort).not.toHaveBeenCalled()
  })

  // Five LEVELS plus the Default stop, so max is 5. An off-by-one here makes
  // the top level unreachable, which no other assertion would catch.
  test('offers the five levels, plus a stop for the CLI default', async () => {
    await startSession()
    expect(slider().min).toBe('0')
    expect(slider().max).toBe('5')
    expect(slider().step).toBe('1')
  })

  test('moving it asks main to set that level', async () => {
    await startSession()
    fireEvent.change(slider(), { target: { value: '4' } })
    expect(harness.api.setEffort).toHaveBeenCalledWith('xhigh')
    expect(readout()).toBe('xhigh')
  })

  test('each stop maps to its own level, in ascending order', async () => {
    await startSession()
    for (const [index, level] of ['low', 'medium', 'high', 'xhigh', 'max'].entries()) {
      fireEvent.change(slider(), { target: { value: String(index + 1) } })
      expect(harness.api.setEffort).toHaveBeenLastCalledWith(level)
    }
  })

  // THE REGRESSION THIS SHAPE EXISTS FOR. With five bare stops the unset pick
  // parked the thumb on position 0, and a range fires no change event when the
  // thumb is already where the gesture put it — so clicking the leftmost
  // position on a fresh launch did nothing and `low` could not be chosen in one
  // move. Both directions are pinned because only the pair proves the stop for
  // "no level" is separate from the stop for the lowest one.
  test('the lowest level is reachable in one move from the unset state', async () => {
    await startSession()
    expect(readout()).toBe('Default')
    fireEvent.change(slider(), { target: { value: '1' } })
    expect(harness.api.setEffort).toHaveBeenCalledWith('low')
    expect(readout()).toBe('low')
  })

  test('stop 0 is Default — it clears the pick rather than sending a level', async () => {
    await startSession()
    fireEvent.change(slider(), { target: { value: '5' } })
    expect(readout()).toBe('max')
    fireEvent.change(slider(), { target: { value: '0' } })
    expect(harness.api.setEffort).toHaveBeenLastCalledWith(null)
    expect(readout()).toBe('Default')
  })

  // #53's rule, one layer up: the positions are the CLI's answer for THIS model,
  // never a literal five in the renderer. A model advertising three levels gets
  // three positions, and position 1 is the middle of THOSE three.
  describe('the positions come from the CLI, not from a literal', () => {
    test('a row advertising three levels yields three positions', async () => {
      oneRow({
        id: 'thrifty',
        label: 'Thrifty',
        supportsEffort: true,
        supportedEffortLevels: ['low', 'high', 'max']
      })
      await startSession()
      // three levels + the Default stop
      expect(slider().max).toBe('3')
      fireEvent.change(slider(), { target: { value: '2' } })
      expect(harness.api.setEffort).toHaveBeenCalledWith('high')
    })

    test('a row advertising one level yields one position', async () => {
      oneRow({
        id: 'fixed',
        label: 'Fixed',
        supportsEffort: true,
        supportedEffortLevels: ['medium']
      })
      await startSession()
      expect(slider().max).toBe('1')
      fireEvent.change(slider(), { target: { value: '1' } })
      expect(harness.api.setEffort).toHaveBeenCalledWith('medium')
    })

    // The row is found through the same matching the pill's label uses, so a
    // CLI-REPORTED resolved id still lands on the row that covers it. Without
    // this the control would silently fall back to the full scale the moment
    // the CLI announced what it was running.
    test('a reported resolved id still finds its row’s levels', async () => {
      harness.api.listModels.mockResolvedValue({
        models: [
          {
            id: 'thrifty',
            label: 'Thrifty',
            resolvedModel: 'claude-thrifty-1',
            supportsEffort: true,
            supportedEffortLevels: ['low', 'high']
          }
        ],
        current: null,
        effort: null
      })
      await startSession()
      // no row matched before the report → the full scale; after it, the row's two
      expect(slider().max).toBe('5')
      harness.emitModel('claude-thrifty-1')
      expect(slider().max).toBe('2')
    })
  })

  // The acceptance criterion: one of the fifteen measured rows reports
  // supportsEffort: false. It must degrade VISIBLY — a control that silently
  // vanishes reads as a bug, and one that offers five positions would be
  // sending levels the model rejects.
  describe('a model that takes no effort level', () => {
    beforeEach(() => {
      oneRow({ id: 'legacy', label: 'Legacy', supportsEffort: false })
    })

    test('shows a visible reason instead of a control', async () => {
      await startSession()
      expect(screen.queryByLabelText('Effort')).toBe(null)
      const none = document.querySelector('.effort-none')
      expect(none?.textContent).toBe('Effort n/a')
      expect(none?.getAttribute('title')).toBe('This model does not accept an effort level')
    })

    test('offers nothing to set', async () => {
      await startSession()
      expect(document.querySelector('.effort-range')).toBe(null)
      expect(harness.api.setEffort).not.toHaveBeenCalled()
    })
  })

  test('disabled while a turn streams, like the model pill', async () => {
    await startSession()
    send('a long one')
    expect(slider().disabled).toBe(true)
  })

  // Main is the authority; the pick can move without this control being touched
  // (a rebuild, another window, a future CLI-side report).
  test('a broadcast from main moves the control with no interaction', async () => {
    await startSession()
    harness.emitEffort('max')
    expect(readout()).toBe('max')
    expect(slider().value).toBe('5')
    expect(harness.api.setEffort).not.toHaveBeenCalled()
  })

  test('a broadcast back to null returns the readout to Default', async () => {
    await startSession()
    harness.emitEffort('high')
    expect(readout()).toBe('high')
    harness.emitEffort(null)
    expect(readout()).toBe('Default')
  })

  // A pick that is not on the CURRENT model's scale. A range has nowhere to put
  // the thumb, so the readout — not the thumb — is what may not lie: it keeps
  // showing what main will actually send, and the control marks itself as
  // not standing for the value.
  describe('a pick the current model does not offer', () => {
    beforeEach(() => {
      harness.api.listModels.mockResolvedValue({
        models: [
          {
            id: 'thrifty',
            label: 'Thrifty',
            supportsEffort: true,
            supportedEffortLevels: ['low', 'medium']
          }
        ],
        current: 'thrifty',
        effort: 'max'
      })
    })

    test('the readout still names the real pick', async () => {
      await startSession()
      expect(readout()).toBe('max')
      expect(slider().getAttribute('aria-valuetext')).toBe('max')
    })

    test('the control marks itself off-scale rather than claiming a position', async () => {
      await startSession()
      expect(document.querySelector('.effort-control--offscale')).toBeTruthy()
      expect(document.querySelector('.effort-control')?.getAttribute('title')).toBe(
        'Effort: max — the current model does not offer this level'
      )
    })

    test('it is still usable — moving it picks a level that IS offered', async () => {
      await startSession()
      fireEvent.change(slider(), { target: { value: '2' } })
      expect(harness.api.setEffort).toHaveBeenCalledWith('medium')
      expect(document.querySelector('.effort-control--offscale')).toBe(null)
    })
  })

  // The mount read carries the pick as well as the rows, so a control that
  // opened on "Default" after a rebuild would be misreporting main's state.
  test('an effort already set in main shows on first render', async () => {
    harness.api.listModels.mockResolvedValue({ models: [], current: null, effort: 'high' })
    await startSession()
    expect(readout()).toBe('high')
    // third level, one stop along from Default
    expect(slider().value).toBe('3')
  })
})
