export type EngineEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'tool-use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool-result'; id: string; text: string; isError: boolean }
  | { type: 'turn-end' }
  | { type: 'error'; message: string }

export interface Engine {
  runTurn(prompt: string, onEvent: (e: EngineEvent) => void): Promise<void>
}
