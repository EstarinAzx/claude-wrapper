---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# Backdrop offers Mica, which is not persistent acrylic

**Decision:** The Appearance panel gets a **Backdrop** control with exactly two values — **Acrylic** (default) and **Mica** — applied at runtime via `win.setBackgroundMaterial()`. The word **"persistent" is banned from the UI copy and from the spec title.**

**The honesty this ADR exists to record.** The request was "a toggle for persistent acrylic … which is a OS level as default isnt". Literal persistent acrylic is not what ships. Blur-behind that survives losing focus needs `SetWindowCompositionAttribute` through `electron-acrylic-window` or a koffi FFI call, and [[2026-07-23-persistent-glass-deferred]]'s rejection of that route — undocumented API, drag/resize lag, fragile across Electron upgrades — has not changed.

What ships is Mica: native, always-on, no dependency, stable — and **wallpaper-tinted rather than blurring**. That is *persistent* without being *acrylic*: a real substitution, not a technicality. The owner's word for the **problem** must not become the product's word for the **solution**, or someone later reads "persistent glass shipped" and expects blur-behind that never flips.

So the option descriptions carry the trade in plain terms:
- **Acrylic** — "blurs what's behind the window; Windows flattens it when the window loses focus."
- **Mica** — "a steady tint from your wallpaper; doesn't blur, doesn't flatten."

**This does not reverse or close [[2026-07-23-persistent-glass-deferred]].** That ADR priced two routes and pre-approved Mica as the free one; this takes it. The native-dep route stays rejected on unchanged grounds and that ADR stays live for it.

## Why two values and not five

Electron's union is `'auto' | 'none' | 'mica' | 'acrylic' | 'tabbed'`. The other three are cut, each for its own reason:

- **`none`** is an unspecified rendering state, not a setting. With `backgroundColor: '#00000000'` and `html, body { background: transparent }`, the 64%-alpha wash is the only paint in the stack — `none` yields either a see-through window or a black one. That is a bug report.
- **`auto`** hands the app's identity to a system preference, contradicting PRODUCT.md:28 outright.
- **`tabbed`** is Mica Alt: still wallpaper-tinted, still persistent, differing from `mica` by an amount you would struggle to see under a near-black wash. Shipping two options that differ subtly for no recorded reason is exactly the `--color-tint-1` / `--color-tint-2` drift this codebase already regrets in writing.

Concrete win: two values keep the IPC trust boundary a **two-string whitelist**, the same shape as `clampZoom` and `normalizeSendPayload`. Passing Electron's five-member union through to `setBackgroundMaterial` widens that boundary for zero product gain.

## Backdrop does not touch the palette

DESIGN.md:47 said the neutrals were deepened "(the desktop bleeds through the acrylic **until the persistent-glass follow-up lands**)", which reads as a promise that this work would re-tune them. It is not honoured, for two reasons.

**The clause is factually wrong.** Acrylic *always* shows the desktop — blur-behind is what acrylic **is** — and no follow-up was ever going to change that. What the follow-up was about is the unfocused flip to flat. The clause commits us to nothing because the condition it names never had an end date. It is retired loudly here rather than quietly, on the grounds that it describes a mechanism that does not exist.

**And coupling them would make Backdrop a second theme axis.** If backdrop implied neutrals, then backdrop × theme would be two independent controls writing the same three custom properties, in a codebase with one `:root` block and a suite that loads no CSS. That collision is invisible by construction — the silent-restyle class [[2026-07-30-the-import-order-is-the-cascade]] names — and it would fuse two tickets with no other reason to touch.

**Concession on record:** if Mica reads too dark in the real window, that is a *theme* problem in [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]]'s vocabulary, or a defect — not a coupling to build now. And it cannot be judged from a driver screenshot: `--disable-gpu` flattens acrylic, already a recorded trap. This one gets eyeballed in a real window or not at all.

## Doc changes this work owns

**DESIGN.md is edited; the clause is rewritten, not deleted.** Deleting it loses the reason the neutrals sit where they do, and the predictable end of that is a future agent "restoring" 0.16/0.24/0.29 as a tidy-up against a reference nobody re-checked. The rewrite states these values **are** the design, records that they were tuned against acrylic with the desktop showing through and matched to `docs/design/frost-mono-reference.png`, says explicitly they are **not** re-tuned per backdrop and why, and corrects the mechanism error. One line is added to the surface section naming the Backdrop control and its two values, Acrylic as default and identity.

**PRODUCT.md is not touched.** "Acrylic is the identity, not a garnish" stays true — Mica is an opt-out from the identity, not a replacement for it.

**No `process.platform` branch.** `backgroundMaterial` is win32-only and this is a Win11 app by identity; a capability probe is speculative abstraction for a platform we do not ship to.

**Reversibility:** easy.

## Related

- [[decisions]]
- [[2026-07-23-persistent-glass-deferred]] — priced this and pre-approved the Mica route; still live for the native-dep route
- [[2026-07-22-glassy-acrylic-visual]] — the identity Acrylic defends
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — where the control lives
- [[2026-07-31-a-preference-lives-where-it-is-read]] — how the value reaches main
