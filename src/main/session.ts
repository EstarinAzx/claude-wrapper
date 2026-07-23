let sessionCwd: string | null = null

export const getSessionCwd = (): string | null => sessionCwd

export const setSessionCwd = (cwd: string): void => {
  sessionCwd = cwd
}
