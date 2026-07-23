export function isTrustedRendererUrl(
  url: string,
  devUrl = process.env['ELECTRON_RENDERER_URL'],
  packagedUrl?: string
): boolean {
  try {
    if (packagedUrl) {
      const candidate = new URL(url)
      const packaged = new URL(packagedUrl)
      if (
        candidate.protocol === packaged.protocol &&
        candidate.host === packaged.host &&
        candidate.pathname === packaged.pathname
      ) {
        return true
      }
    }
    if (!devUrl) return false
    return new URL(url).origin === new URL(devUrl).origin
  } catch {
    return false
  }
}
