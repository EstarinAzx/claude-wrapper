import type { PermissionDecision } from '../shared/engine-types'

type RendererDecision = PermissionDecision | string

type Pending = {
  settle: (decision: PermissionDecision) => void
  signal: AbortSignal
  onAbort: () => void
}

export const createPermissionBroker = () => {
  const pending = new Map<string, Pending>()

  const respond = (toolUseId: string, decision: RendererDecision): boolean => {
    if (decision !== 'allow' && decision !== 'deny') return false
    const request = pending.get(toolUseId)
    if (!request) return false
    request.settle(decision)
    return true
  }

  const request = ({
    toolUseId,
    signal
  }: {
    toolUseId: string
    signal: AbortSignal
  }): Promise<PermissionDecision> =>
    new Promise((resolve) => {
      const settle = (decision: PermissionDecision): void => {
        const current = pending.get(toolUseId)
        if (!current || current.settle !== settle) return
        pending.delete(toolUseId)
        signal.removeEventListener('abort', onAbort)
        resolve(decision)
      }
      const onAbort = (): void => settle('deny')
      pending.set(toolUseId, { settle, signal, onAbort })
      if (signal.aborted) onAbort()
      else signal.addEventListener('abort', onAbort, { once: true })
    })

  const cancelAll = (): void => {
    for (const { settle } of [...pending.values()]) settle('deny')
  }

  return { request, respond, cancelAll }
}
