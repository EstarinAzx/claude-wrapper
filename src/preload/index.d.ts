export interface WindowControlsApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
}

declare global {
  interface Window {
    api: WindowControlsApi
  }
}
