let sessionCwd: string | null = null

export function getSessionCwd(): string | null {
  return sessionCwd
}

export function setSessionCwd(cwd: string): void {
  sessionCwd = cwd
}
