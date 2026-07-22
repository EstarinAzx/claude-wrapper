---
type: decision
project: claude-wrapper
updated: 2026-07-22
tags: [context, decisions, ui, design]
---

# Visual identity: Frost Mono + acrylic

**Decision:** The UI follows the "Frost Mono" reference (`docs/design/frost-mono-reference.png`) with acrylic translucency added. Language: near-black heavy monochrome, editorial and calm, exactly one quiet mint/frost accent. Concretely: rounded window with custom titlebar (app name left · session title center · window controls right); centered date divider (e.g. TODAY); user prompts as dark rounded bubbles right-aligned; assistant messages as bubble-less text with a mint circular avatar; typing-dots indicator; bottom pill input with attach icon and circular mint send button; footer disclaimer line. Windows 11 native acrylic (`BrowserWindow` `backgroundMaterial: 'acrylic'`) supplies the glass. Design pass runs through the impeccable skill at build time.
**Why:** User-supplied reference image; the custom-UI path exists to look better than a terminal.
**Reversibility:** easy

## Related

- [[decisions]] — index
- [[2026-07-22-custom-chat-ui-headless-engine]]
- [[2026-07-22-react-vite-ts7]]
