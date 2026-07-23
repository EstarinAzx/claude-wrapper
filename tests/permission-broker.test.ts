import { describe, expect, test } from 'vitest'
import { createPermissionBroker } from '../src/main/permission-broker'

describe('permission broker', () => {
  test('renderer response resolves matching pending permission', async () => {
    const broker = createPermissionBroker()
    const decision = broker.request({
      toolUseId: 'tu-1',
      signal: new AbortController().signal
    })

    expect(broker.respond('tu-1', 'allow')).toBe(true)
    await expect(decision).resolves.toBe('allow')
  })

  test('rejects malformed renderer responses without settling permission', async () => {
    const broker = createPermissionBroker()
    const controller = new AbortController()
    const decision = broker.request({ toolUseId: 'tu-1', signal: controller.signal })

    expect(broker.respond('tu-1', 'maybe')).toBe(false)
    controller.abort()
    await expect(decision).resolves.toBe('deny')
  })

  test('cancelAll denies pending permissions before replacing an engine', async () => {
    const broker = createPermissionBroker()
    const first = broker.request({
      toolUseId: 'tu-1',
      signal: new AbortController().signal
    })
    const second = broker.request({
      toolUseId: 'tu-2',
      signal: new AbortController().signal
    })

    broker.cancelAll()

    await expect(first).resolves.toBe('deny')
    await expect(second).resolves.toBe('deny')
    expect(broker.respond('tu-1', 'allow')).toBe(false)
  })
})
