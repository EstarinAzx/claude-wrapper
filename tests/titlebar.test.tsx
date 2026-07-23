import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
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
