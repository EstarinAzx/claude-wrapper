import { describe, test, expect } from 'vitest'
import {
  getPermissionMode,
  setPermissionMode,
  toPermissionOptions
} from '../src/main/permission-mode'

describe('permission-mode state', () => {
  // Runs first, before any set — asserts the module's initial value.
  test('starts at bypassPermissions (owner default)', () => {
    expect(getPermissionMode()).toBe('bypassPermissions')
  })

  test('setPermissionMode changes the live mode', () => {
    setPermissionMode('acceptEdits')
    expect(getPermissionMode()).toBe('acceptEdits')
    setPermissionMode('default')
    expect(getPermissionMode()).toBe('default')
    setPermissionMode('bypassPermissions')
    expect(getPermissionMode()).toBe('bypassPermissions')
  })
})

describe('toPermissionOptions', () => {
  test('bypass carries the explicit danger flag the SDK requires', () => {
    expect(toPermissionOptions('bypassPermissions')).toEqual({
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true
    })
  })

  test('acceptEdits maps to just the mode — no danger flag', () => {
    expect(toPermissionOptions('acceptEdits')).toEqual({ permissionMode: 'acceptEdits' })
  })

  test('default maps to just the mode', () => {
    expect(toPermissionOptions('default')).toEqual({ permissionMode: 'default' })
  })
})
