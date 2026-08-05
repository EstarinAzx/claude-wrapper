---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# The parser writes the alignment, and emits no wrapper

**Decision:** #121 (`ef6ef22`) styles GFM tables in `markdown.css` alone — 41
lines, all descendants of `.assistant-body`. No plugin, no dependency, no
`Chat.tsx` change, no `components` override, no `@import` touched.

The two rules that carry the feature were **measured off the rendered DOM**, not
chosen. A three-alignment table pushed through the real pipeline
(`react-markdown` 10 + `remark-gfm` 4 + `rehype-highlight`) emits:

```html
<table><thead><tr>
  <th style="text-align: left;">Left</th>
  <th style="text-align: center;">Middle</th>
  <th style="text-align: right;">Right</th>
</tr></thead>...
```

## Two constraints fall out of that, and both bind future work

1. **Alignment is an INLINE style.** It therefore beats every stylesheet rule for
   free — "honour the alignment" costs nothing. The inverse is the trap: one
   `!important` on `text-align` anywhere in the cascade silently collapses all
   three columns to the left, with the DOM test still green because the inline
   attribute is still there. `tests/markdown-tables.test.tsx` pins the absence of
   that `!important`, which is the only reason the pin is worth having.

2. **There is no wrapper element around the table.** So the scroll for an
   over-wide table has to sit on the `<table>` itself — and a table box cannot
   scroll. Hence `display: block; width: max-content; max-width: 100%;
   overflow-x: auto`: the block box scrolls, the rows still lay out inside an
   anonymous table box, and the table stays shrink-to-fit until it outgrows the
   760px `.chat-column`.

## Why this is worth writing down rather than leaving in the CSS

**#122 adds a `components` override to wrap `<pre>`.** The obvious next thought
is to wrap `<table>` the same way and move the overflow onto a div. That is not
needed and should not be done for this reason: the `display: block` route is
already measured working, and a wrapper would put a second scroll container
inside a message for no gain. If a wrapper ever arrives for another reason, the
table rule's `display: block` is what to delete — not the `overflow-x`.

## The verification half

jsdom loads no CSS, so the raw-text pin cannot show the rules *work*. The
measured markup was rendered against the **built** stylesheet (resolved tokens)
in a real Electron window: header border resolves to `--text-faint` against the
body's `--border`, cells pad `6px 12px`, all three alignments survive, a
14-column table scrolls at `scrollWidth 1841` inside a `.chat-column` that stays
`760/760` and does not overflow, and the document does not widen.

This is the same shape as the standing rule that a green jsdom suite is evidence
about the markup and never about the paint.

## Reversibility

**Easy.** The whole feature is 41 lines in one file with no caller. Deleting the
block returns tables to unstyled markup; nothing else reads these rules. The one
thing that is *not* free to change is the `!important` prohibition — that is a
property of how the parser emits alignment, not of this design, and it survives
any restyle.

## Related

- [[decisions]]
- [[active-work]]
