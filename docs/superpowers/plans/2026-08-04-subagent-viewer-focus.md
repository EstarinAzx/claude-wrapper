# Subagent Viewer Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the modal subagent viewer take focus on open, contain forward and reverse Tab navigation, and restore the previously focused control on every close path.

**Architecture:** Keep focus ownership inside `SubagentDrawer`, where open and close already map to mount and unmount. Capture the previously focused element in a `useLayoutEffect`, focus the existing close button before paint, and restore the captured element from cleanup when it remains connected. Handle `Tab` only on `.subagent-drawer-root`, deriving its current enabled tab stops from the live DOM so the trap covers loading, empty, and transcript states without app-level coordination.

**Tech Stack:** React 19, TypeScript 7, Vitest 4, Testing Library, Electron 43, Playwright Core.

## Global Constraints

- No visual change, focus-ring change, scrim change, or Escape behavior change.
- Keep `.subagent-drawer-backdrop` at `aria-hidden="true"` and `tabIndex={-1}`.
- Add no dependency; use DOM APIs and React only.
- Initial focus must be positively inside `.subagent-drawer-root`.
- Forward `Tab` and reverse `Shift+Tab` must never escape the open viewer.
- Restore the element focused immediately before open after close button, Escape, and scrim-click exits, when that element remains connected.
- `gui-95.mjs` must use real key presses, break a cycle when its own first stop recurs, and positively prove the composer textarea is absent from the walk.
- Do not change `src/renderer/src/styles/subagent.css`, `.subagent-drawer-close` focus treatment, or either scrim.

---

### Task 1: Pin initial focus and restoration

**Files:**
- Modify: `tests/subagent-viewer.test.tsx:76-116`
- Modify: `src/renderer/src/components/SubagentDrawer.tsx:1-109`

**Interfaces:**
- Consumes: existing `SubagentDrawerProps.onClose: () => void`; existing `.subagent-drawer-close` button.
- Produces: component mount focuses `.subagent-drawer-close`; component cleanup calls `focus()` on captured `HTMLElement` only while `isConnected`.

- [ ] **Step 1: Add failing lifecycle tests**

Add a helper that opens the viewer from the real `.subagent-row`:

```tsx
const openViewer = async () => {
  harness.api.currentSessionId.mockResolvedValue('sess-1')
  harness.api.subagentTranscript.mockResolvedValue([{ role: 'assistant', text: 'hi from sub' }])
  spawnTask()
  const opener = document.querySelector('.subagent-row') as HTMLButtonElement
  opener.focus()
  fireEvent.click(opener)
  await screen.findByText('hi from sub')
  return opener
}
```

Add one positive initial-focus test:

```tsx
test('opening the viewer moves focus inside it', async () => {
  await startSession()
  await openViewer()

  const root = screen.getByRole('dialog', { name: 'Subagent Explore' })
  expect(root.contains(document.activeElement)).toBe(true)
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close viewer' }))
})
```

Add a table test covering all three exits and restoration:

```tsx
test.each([
  ['close button', () => fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }))],
  ['Escape', () => fireEvent.keyDown(window, { key: 'Escape' })],
  ['scrim click', () => fireEvent.click(document.querySelector('.subagent-drawer-backdrop') as Element)]
])('restores the opener after %s', async (_name, close) => {
  await startSession()
  const opener = await openViewer()

  close()

  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(opener)
})
```

- [ ] **Step 2: Run focused tests and verify red**

Run:

```bash
npm test -- tests/subagent-viewer.test.tsx
```

Expected: initial-focus test fails because focus remains on `.subagent-row`; restoration rows fail because unmount leaves focus on `body`.

- [ ] **Step 3: Implement minimal focus lifecycle**

Change the React import and add refs:

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
```

Inside `SubagentDrawer`, before effects:

```tsx
const rootRef = useRef<HTMLDivElement>(null)
const closeRef = useRef<HTMLButtonElement>(null)
```

Add the mount/unmount lifecycle before the transcript effect:

```tsx
useLayoutEffect(() => {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  closeRef.current?.focus()
  return () => {
    if (previous?.isConnected) previous.focus()
  }
}, [])
```

Bind `ref={rootRef}` to `.subagent-drawer-root` and `ref={closeRef}` to `.subagent-drawer-close`.

- [ ] **Step 4: Run focused tests and verify green**

Run:

```bash
npm test -- tests/subagent-viewer.test.tsx
```

Expected: all subagent-viewer tests pass.

- [ ] **Step 5: Mutation-verify restoration**

Temporarily remove `previous.focus()` and rerun:

```bash
npm test -- tests/subagent-viewer.test.tsx
```

Expected: all three restoration rows fail with `document.activeElement` equal to `body`, not the opener. Restore the line and rerun to green.

### Task 2: Pin and implement Tab containment

**Files:**
- Modify: `src/renderer/src/components/SubagentDrawer.tsx:20-109`
- Modify: `.claude/skills/run-desktop/gui-95.mjs:1-274`

**Interfaces:**
- Consumes: `rootRef: React.RefObject<HTMLDivElement | null>` from Task 1; live descendants under `.subagent-drawer-root`.
- Produces: `onKeyDown` handler on dialog root that contains `Tab` and `Shift+Tab`; no exported API.

- [ ] **Step 1: Update the real-key driver before implementation**

Add constants:

```js
const ROOT = '.subagent-drawer-root'
const COMPOSER = '.message-input'
```

After opening, record and assert that initial focus is in the root. Replace the anchor-based walk with a root-local cycle:

```js
const firstStop = await page.evaluate(() => {
  const root = document.querySelector('.subagent-drawer-root')
  const el = document.activeElement
  return {
    inside: !!root && el instanceof HTMLElement && root.contains(el),
    stop: el
      ? {
          tag: el.tagName,
          cls: typeof el.className === 'string' ? el.className : '',
          label: el.getAttribute?.('aria-label') ?? null
        }
      : null
  }
})
check('criterion 4: opening moves focus inside the viewer', firstStop.inside, firstStop)
```

Walk forward until the walk's own first stop recurs, not until `.subagent-row` recurs. Record each stop with an `insideRoot` field derived from `root.contains(el)`. Add positive assertions:

```js
check('criterion 5: every forward Tab stop stays inside the viewer',
  stops.length > 0 && stops.every((s) => s.insideRoot),
  { stops: stops.length, escapedAt: stops.findIndex((s) => !s.insideRoot) + 1 || null }
)
check('criterion 6: the contained walk never reaches the composer textarea',
  stops.length > 0 && !hit(COMPOSER),
  { stops: stops.length, composerStop: stopOf(COMPOSER) }
)
```

Add a reverse walk starting on the first stop and pressing `Shift+Tab`, then assert every reverse stop remains in the root and returns to the first stop. Keep existing scrim absence, close-button presence, and scrim-click close criteria.

- [ ] **Step 2: Build and red-verify the driver against untrapped code**

Run:

```bash
npm run build
node .claude/skills/run-desktop/gui-95.mjs
```

Expected: nonzero exit. Forward containment fails after close button when focus reaches controls behind the scrim; composer-exclusion fails when `.message-input` appears in the recorded walk. Initial focus may already pass from Task 1.

- [ ] **Step 3: Implement a root-local Tab handler**

In `SubagentDrawer.tsx`, add a local selector and handler:

```tsx
const TAB_STOP =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>): void => {
  if (e.key !== 'Tab') return
  const root = rootRef.current
  if (!root) return
  const stops = [...root.querySelectorAll<HTMLElement>(TAB_STOP)].filter(
    (el) => el.tabIndex >= 0 && !el.hidden
  )
  if (stops.length === 0) {
    e.preventDefault()
    root.focus()
    return
  }
  const first = stops[0]
  const last = stops[stops.length - 1]
  const active = document.activeElement
  if (e.shiftKey ? active === first || !root.contains(active) : active === last || !root.contains(active)) {
    e.preventDefault()
    ;(e.shiftKey ? last : first).focus()
  }
}
```

Bind `onKeyDown={trapFocus}` and `tabIndex={-1}` to `.subagent-drawer-root`. The root fallback is programmatically focusable but never enters sequential tab order. Keep the existing window Escape listener unchanged.

- [ ] **Step 4: Run focused tests, typecheck, build, and real-key driver**

Run:

```bash
npm test -- tests/subagent-viewer.test.tsx
npm run typecheck
npm run build
node .claude/skills/run-desktop/gui-95.mjs
```

Expected: all commands exit 0. Driver reports initial focus inside root, forward and reverse cycles contained, composer absent, close present, scrim absent from tab order, and scrim click closes.

- [ ] **Step 5: Mutation-verify containment**

Temporarily remove `onKeyDown={trapFocus}`, rebuild, and rerun `gui-95.mjs`.

Expected: nonzero exit with forward containment and composer exclusion red. Restore handler, rebuild, rerun, and require `ALL GREEN`.

### Task 3: Full gate and ticket landing evidence

**Files:**
- Modify: none unless gate exposes a ticket-scope defect.
- Verify: `src/renderer/src/components/SubagentDrawer.tsx`
- Verify: `tests/subagent-viewer.test.tsx`
- Verify: `.claude/skills/run-desktop/gui-95.mjs`
- Verify: `.claude/skills/run-desktop/gui-93.mjs`
- Verify: `.claude/skills/run-desktop/gui-96.mjs`

**Interfaces:**
- Consumes: completed focus lifecycle and trap.
- Produces: gate evidence required by issue #99.

- [ ] **Step 1: Run full automated gate**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected: typecheck clean; at least 982 tests across 64 files; build clean.

- [ ] **Step 2: Run all affected real-window drivers**

Run:

```bash
node .claude/skills/run-desktop/gui-95.mjs
node .claude/skills/run-desktop/gui-93.mjs
node .claude/skills/run-desktop/gui-96.mjs
```

Expected: each exits 0 and prints `ALL GREEN`.

- [ ] **Step 3: Review exact diff for forbidden scope**

Run:

```bash
git diff --check
git diff -- src/renderer/src/components/SubagentDrawer.tsx tests/subagent-viewer.test.tsx .claude/skills/run-desktop/gui-95.mjs docs/superpowers/plans/2026-08-04-subagent-viewer-focus.md
```

Require: no CSS diff, no scrim attribute change, no Escape propagation change, no dependency change, no unrelated refactor.

- [ ] **Step 4: Commit ticket branch**

```bash
git add src/renderer/src/components/SubagentDrawer.tsx tests/subagent-viewer.test.tsx .claude/skills/run-desktop/gui-95.mjs docs/superpowers/plans/2026-08-04-subagent-viewer-focus.md
git commit -m "fix(subagent): keep focus inside viewer (#99)"
```

- [ ] **Step 5: Prepare landing evidence**

Record exact typecheck/test/build results, gui-95 forward/reverse stop counts, gui-93/gui-96 results, mutation-red evidence, and final commit SHA in issue #99's closing comment. Squash-merge branch to `main`, push, delete branch, then perform relay context wrap-up on `main`.
