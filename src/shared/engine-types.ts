export type EngineEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'turn-end' }
  | { type: 'error'; message: string }

export interface Engine {
  runTurn(prompt: string, onEvent: (e: EngineEvent) => void): Promise<void>
}
