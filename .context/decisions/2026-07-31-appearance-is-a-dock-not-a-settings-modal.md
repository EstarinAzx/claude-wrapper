---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# Appearance is a dock, not a settings modal

**Decision:** The preferences surface is a third member of the existing right-dock union — `openDock: 'agents' | 'commands' | 'settings'` (`src/renderer/src/App.tsx:35`) — rendered where its two siblings render, toggled by a third titlebar button. It is titled **Appearance**, not Settings. It is `cwd`-gated like the other two. It holds **no draft state**: no Save, no Apply, no dirty flag; every control commits on change.

**Why a dock:** It reuses the single-slot mutual exclusion already written and commented, adds no new surface type, and adds no glass layer. A centred modal is the conventional shape, but it is a new overlay pattern, a new focus trap, and it paints a decorative glass layer inside the window — which DESIGN.md bans outright ("no decorative extra glass layers inside the window (the OS acrylic is the one glass)"), and which `rails.css:270` records as the reason the session-group heading is deliberately not sticky.

**Why `cwd`-gated:** Exempting it is not "loosening a prop". The docks are unreachable from `Welcome` because `App.tsx:173` is a ternary — `{cwd ? <div className="workspace">…</div> : <Welcome/>}` — and the whole `.workspace` div is one branch. An ungated Appearance panel would be a **second render site**, outside `.workspace`, outside the flex row the dock shell lays out in, with a different lifetime from its two union siblings: a three-member union whose third member shares nothing with the others but a variable name. The exemption also buys nothing, because **Welcome is a preview of nothing** — the panel's subject is appearance, and appearance is judged against bubbles, tool cards and the rails, none of which exist on the folder picker.

**Why no draft state — this one is load-bearing.** `switchWorkspace` clears `openDock` on its `ok` branch (`App.tsx:106`), so the panel closes itself on a project switch. A Save button behind a self-closing panel is a silent data-loss bug. Commit-on-change is also what the permission, backend and model pills already do, so it is the app's existing idiom rather than a new rule.

**Why "Appearance":** a name that has to be *remembered* as "appearance only" is the failure with an extra step. A panel titled Appearance makes the next person who wants "reset all preferences" or an About section argue with the heading first. If a genuinely non-appearance preference ever needs a home, that is the moment to rename and add sections.

**Contents — three controls, all appearance:** theme, backdrop material, and **zoom**. Zoom was not one of the four requests and is included deliberately as debt paydown: it is a persisted preference with no discoverable control at all (`useZoom` binds `Ctrl +/-/0` and nothing else), and the app's current answer to "make it bigger" has already cost a source change to `DEFAULT_ZOOM`, a versioned storage key, a pinning test, and a standing landmine instructing the next agent to bump the key again. One stepper pair retires that permanently. Shape is minus / readout / plus calling `nextZoom` verbatim — **no reset button** (stepping reaches the default) and no slider or select (either invents a value list the stepping logic does not have).

Explicitly out: no mirror of permission mode or backend (they have homes; a second control for one state is two winners in one niche), no sidebar-scope duplicate, no session-data section (deletion belongs on the row — see [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]]), no reset-all, no About, and **no `process.platform` branch** on the material control — `backgroundMaterial` is win32-only and this is a Win11 acrylic app by identity, so a capability probe is speculative abstraction for a platform we do not ship to.

**Known cost, not a blocker:** the titlebar reaches app name + session title + two pills + three dock buttons + window controls, and each button also eats drag region. Flagged for an impeccable pass rather than solved here — but it must not silently become a seventh control nobody costed.

**Implementation note:** the zoom level currently lives in a `useEffect` closure (`let level`, `useZoom.ts:22`). A readout requires lifting it to React state, and that lift must not disturb the first-mount persist — "a stored level always wins over the default" is the entire reason `zoom-level-v2` is versioned.

**Reversibility:** easy.

## Related

- [[decisions]]
- [[2026-07-31-a-preference-lives-where-it-is-read]] — where the panel's values are stored
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] · [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]]
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — the same naming argument, one surface earlier
- [[2026-07-22-mvp-bare-core]] — the scope instinct the out-list follows
