# PRODUCT.md

register: product

## Product Purpose

claude-wrapper: an Electron app for Windows 11 that wraps the Claude Code CLI. Claude Code runs headlessly (Claude Agent SDK in the main process); a custom chat UI replaces the raw terminal. The UI is the product: the whole reason it exists is to present a Claude Code session as a calm, legible chat instead of terminal scrollback.

## Users

One user: the app owner, a developer on Windows 11, running Claude Code sessions on their own projects day-to-day, often at night over a dark desktop. Fluent in Claude/ChatGPT-class chat tools and dev tools (VS Code, Linear); expects that bar of polish.

## Brand & Tone

"Frost Mono": heavy near-black monochrome, editorial and calm, exactly one quiet mint/frost accent. Premium native Win11 surface, glass supplied by the OS acrylic window material. The canonical reference image is `docs/design/frost-mono-reference.png`; the distilled spec lives in `.context/decisions/2026-07-22-glassy-acrylic-visual.md`.

## Anti-references

- Terminal emulators and TUI chrome (the thing being replaced).
- Neon "AI product" gradients, glow, purple-on-black.
- SaaS dashboard cream, card grids, hero metrics.
- Webpage-in-a-frame Electron feel: default OS titlebar, opaque flat background.

## Strategic principles

- The tool disappears into the task: chat reads chronologically, controls are where chat apps put them.
- One accent, spent only on identity (logo mark, avatar, send) and primary action, never decoration.
- Acrylic is the identity, not a garnish: surfaces stay translucent, layered, quiet.
- Win11-only; lean on native materials and Segoe UI Variable rather than imported chrome.
