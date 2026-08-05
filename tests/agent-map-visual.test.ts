import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #126 — the map's visual pass, pinned in the GATE.
//
// Same reason `subagent-material.test.ts` exists: `gui-126.mjs` asserts all of
// this positively on the live window, but no driver runs in `npm test`, so on
// its own the pass is protected by a check nobody runs. The specific risk here
// is a tidy-up that "restores consistency" by pulling the map's paint back onto
// the tint ladder — which is exactly what made it unreadable, and which would
// look like a conformance improvement in review.
//
// What this file CANNOT do: jsdom loads no CSS, so a raw-text pin proves a rule
// was WRITTEN, never that the cascade delivers it. That the values reach the
// mounted elements is `gui-126`'s computed-style criterion. That the result
// looks better is a screenshot on the ticket and nothing here claims it.
//
// Comments are stripped before every scan, or this file's own prose in
// `agent-map.css` counts as a declaration.

const REPO = path.resolve(import.meta.dirname, '..')
const CSS = readFileSync(path.join(REPO, 'src/renderer/src/styles/agent-map.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  ''
)

// Bodies in this sheet do not nest, so a non-greedy run to the first closing
// brace is the whole rule.
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const found = new RegExp(`(^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(CSS)
  return found?.[2] ?? ''
}

describe('the map edge is a line, not a hairline artefact', () => {
  test('the edge rule was found at all', () => {
    expect(rule('.agent-map-edge').trim()).not.toBe('')
  })

  // Stroke width in an SVG is in VIEWBOX UNITS, and this viewBox is 240 wide
  // scaled into ~151px at the dock's clamp floor. A width of 1 therefore landed
  // at roughly 0.6 of a device pixel and read as a scratch. The floor asserted
  // here is what keeps it above one physical pixel at the narrowest panel.
  test('the edge is at least 1.4 viewBox units wide', () => {
    const width = /stroke-width:\s*([\d.]+)/.exec(rule('.agent-map-edge'))?.[1]
    expect(width).toBeDefined()
    expect(Number(width)).toBeGreaterThanOrEqual(1.4)
  })

  // The tint ladder tops out at 20% alpha of a near-white over a near-black
  // ground, which cannot carry a structural line here however wide it is drawn.
  // Nesting is the one thing this view exists to show, so its edges are content.
  test('the edge does not take a tint-ladder step', () => {
    expect(rule('.agent-map-edge')).toMatch(/stroke:\s*var\(--text-faint\)/)
    expect(rule('.agent-map-edge')).not.toMatch(/stroke:\s*var\(--tint-/)
  })
})

describe('settled marks are solid, and only absence is hollow', () => {
  // A finished agent is inert, not missing. Before this pass both `done` and
  // `unknown` were outlines and read as the same mark at a 180px panel.
  test('a finished agent and the session both take a solid fill', () => {
    expect(rule('.agent-map-node--done .agent-map-glyph')).toMatch(/fill:\s*var\(--text-faint\)/)
    expect(rule('.agent-map-node-session rect')).toMatch(/fill:\s*var\(--text-faint\)/)
  })

  test('a failed agent keeps the danger fill', () => {
    expect(rule('.agent-map-node--failed .agent-map-glyph')).toMatch(/fill:\s*var\(--danger-dot\)/)
  })

  test('a live agent keeps the accent, and it is the only accent fill', () => {
    expect(rule('.agent-map-node--running .agent-map-glyph')).toMatch(/fill:\s*var\(--mint\)/)
  })

  // The discrimination pin. Filling every glyph would satisfy every assertion
  // above while collapsing the one distinction they exist to protect, so the
  // status that genuinely means "no information" is pinned hollow.
  test('an unknown agent stays a hollow outline', () => {
    const unknown = rule('.agent-map-node--unknown .agent-map-glyph')
    expect(unknown).toMatch(/fill:\s*none/)
    expect(unknown).toMatch(/stroke-dasharray/)
  })
})

describe('the map does not inflate with the panel', () => {
  // The viewBox scales into whatever width it is given, and the dock resizes to
  // 480px. Uncapped, a seven-node tree renders as fifty-pixel blobs there.
  test('the svg caps its rendered width and centres in the leftover space', () => {
    const svg = rule('.agent-map-svg')
    expect(svg).toMatch(/max-width:\s*\d+px/)
    expect(svg).toMatch(/margin-inline:\s*auto/)
  })
})

describe('the halo keeps its alpha in the fill', () => {
  // Carried over from the map's ADR rather than re-derived: `subagent-pulse`
  // animates opacity 1 to 0.35, so an opacity-based tint is overridden and the
  // halo flashes near-solid. #126 rescaled the halo's radius and this is the
  // rule that makes that edit unable to quietly reintroduce the defect.
  test('the halo tints through color-mix, never through opacity', () => {
    const halo = rule('.agent-map-halo')
    expect(halo).toMatch(/fill:\s*color-mix\(/)
    expect(halo).not.toMatch(/^\s*opacity\s*:/m)
  })
})
