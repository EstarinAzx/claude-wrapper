export interface WrapperApi {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  pickFolder: () => Promise<string | null>
}

declare global {
  interface Window {
    api: WrapperApi
  }
}
