import { describe, test, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import Titlebar from '../src/renderer/src/components/Titlebar'

afterEach(() => cleanup())

describe('titlebar backend pill', () => {
  test('renders no pill until backend info has loaded', () => {
    render(<Titlebar cwd={null} backend={null} />)
    expect(screen.queryByLabelText('Backend mode')).toBeNull()
  })

  test('native mode reads "Native"', () => {
    render(<Titlebar cwd={null} backend={{ mode: 'native', wispedAvailable: true }} />)
    const pill = screen.getByLabelText('Backend mode')
    expect(pill.textContent).toBe('Native')
    expect(pill.className).not.toContain('backend-pill--wisped')
  })

  test('wisped mode reads "Wisped" and takes the mint accent', () => {
    render(<Titlebar cwd={null} backend={{ mode: 'wisped', wispedAvailable: true }} />)
    const pill = screen.getByLabelText('Backend mode')
    expect(pill.textContent).toBe('Wisped')
    expect(pill.className).toContain('backend-pill--wisped')
  })

  test('when wisped is unavailable the pill is locked to Native with an explanatory title', () => {
    render(<Titlebar cwd={null} backend={{ mode: 'native', wispedAvailable: false }} />)
    const pill = screen.getByLabelText('Backend mode')
    expect(pill.textContent).toBe('Native')
    expect(pill.getAttribute('title')).toBe('Launched without Wisp routing — native only')
  })
})

describe('titlebar backend pill — click to flip', () => {
  test('clicking a Native pill requests a flip to wisped', () => {
    const onFlip = vi.fn()
    render(
      <Titlebar
        cwd={null}
        backend={{ mode: 'native', wispedAvailable: true }}
        busy={false}
        onFlip={onFlip}
      />
    )
    fireEvent.click(screen.getByLabelText('Backend mode'))
    expect(onFlip).toHaveBeenCalledWith('wisped')
  })

  test('clicking a Wisped pill requests a flip to native', () => {
    const onFlip = vi.fn()
    render(
      <Titlebar
        cwd={null}
        backend={{ mode: 'wisped', wispedAvailable: true }}
        busy={false}
        onFlip={onFlip}
      />
    )
    fireEvent.click(screen.getByLabelText('Backend mode'))
    expect(onFlip).toHaveBeenCalledWith('native')
  })

  test('the pill is disabled and cannot flip while a turn is streaming', () => {
    const onFlip = vi.fn()
    render(
      <Titlebar
        cwd={null}
        backend={{ mode: 'native', wispedAvailable: true }}
        busy={true}
        onFlip={onFlip}
      />
    )
    const pill = screen.getByLabelText('Backend mode') as HTMLButtonElement
    expect(pill.disabled).toBe(true)
    fireEvent.click(pill)
    expect(onFlip).not.toHaveBeenCalled()
  })

  test('the pill is disabled and cannot flip when wisped is unavailable', () => {
    const onFlip = vi.fn()
    render(
      <Titlebar
        cwd={null}
        backend={{ mode: 'native', wispedAvailable: false }}
        busy={false}
        onFlip={onFlip}
      />
    )
    const pill = screen.getByLabelText('Backend mode') as HTMLButtonElement
    expect(pill.disabled).toBe(true)
    fireEvent.click(pill)
    expect(onFlip).not.toHaveBeenCalled()
  })
})

describe('titlebar permission pill', () => {
  test('renders no pill until the mode has loaded', () => {
    render(<Titlebar cwd={null} backend={null} permission={null} />)
    expect(screen.queryByLabelText('Permission mode')).toBeNull()
  })

  test('each mode reads its label', () => {
    const cases: Array<[import('../src/shared/engine-types').PermissionMode, string]> = [
      ['bypassPermissions', 'Bypass'],
      ['acceptEdits', 'Accept Edits'],
      ['default', 'Ask']
    ]
    for (const [mode, label] of cases) {
      render(<Titlebar cwd={null} backend={null} permission={mode} />)
      expect(screen.getByLabelText('Permission mode').textContent).toBe(label)
      cleanup()
    }
  })

  test('bypass takes the danger accent; other modes do not', () => {
    render(<Titlebar cwd={null} backend={null} permission="bypassPermissions" />)
    expect(screen.getByLabelText('Permission mode').className).toContain('perm-pill--bypass')
    cleanup()
    render(<Titlebar cwd={null} backend={null} permission="acceptEdits" />)
    expect(screen.getByLabelText('Permission mode').className).not.toContain('perm-pill--bypass')
  })

  test('clicking cycles Bypass → Accept Edits → Ask → Bypass', () => {
    const onCycle = vi.fn()
    const next = (mode: import('../src/shared/engine-types').PermissionMode) => {
      onCycle.mockClear()
      render(
        <Titlebar
          cwd={null}
          backend={null}
          permission={mode}
          busy={false}
          onCyclePermission={onCycle}
        />
      )
      fireEvent.click(screen.getByLabelText('Permission mode'))
      cleanup()
      return onCycle.mock.calls[0][0]
    }
    expect(next('bypassPermissions')).toBe('acceptEdits')
    expect(next('acceptEdits')).toBe('default')
    expect(next('default')).toBe('bypassPermissions')
  })

  test('disabled and cannot cycle while a turn is streaming', () => {
    const onCycle = vi.fn()
    render(
      <Titlebar
        cwd={null}
        backend={null}
        permission="bypassPermissions"
        busy={true}
        onCyclePermission={onCycle}
      />
    )
    const pill = screen.getByLabelText('Permission mode') as HTMLButtonElement
    expect(pill.disabled).toBe(true)
    fireEvent.click(pill)
    expect(onCycle).not.toHaveBeenCalled()
  })
})
