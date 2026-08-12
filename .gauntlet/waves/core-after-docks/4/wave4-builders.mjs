export const meta = {
  name: 'gauntlet-wave4-builders',
  description: 'Wave 4 builders: Titlebar mark depth, Sidebar pre-list compression, InputBar composer seam',
  phases: [{ title: 'Build', detail: 'Sidebar parallel; Titlebar then InputBar serialized on chat.css' }],
}

const DECL = {
  type: 'object',
  required: ['piece', 'landed', 'files', 'declarations', 'arithmetic', 'comments_updated', 'ran_npm', 'risks'],
  properties: {
    piece: { type: 'string' },
    landed: { type: 'boolean' },
    files: { type: 'array', items: { type: 'string' } },
    declarations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'selector', 'change'],
        properties: {
          file: { type: 'string' },
          selector: { type: 'string' },
          change: { type: 'string' },
        },
      },
    },
    arithmetic: { type: 'string', description: 'The numbers that justify the value chosen. Show the working.' },
    comments_updated: { type: 'string', description: 'Which authored comments your change falsified and how you repaired them, or NONE and why.' },
    ran_npm: { type: 'boolean', description: 'Must be false.' },
    risks: { type: 'string', description: 'What could red in the gate, and any claim you could not verify.' },
    deviation: { type: 'string', description: 'If you did not take the recommended form, the reason.' },
  },
}

const COMMON = `
You are a BUILDER in a design gauntlet on an Electron app (claude-wrapper). The artifact already works;
this pass raises it against an external bar. Close EXACTLY ONE named gap. Do not redesign. Do not
touch other pieces.

## Hard rules — these cost two dead builders last wave, read them

1. **DO NOT run npm, npx, node, vitest, or any test/build/lint command.** Three builders share ONE
   working tree this wave. A concurrent test run measures nothing, and the wave gates centrally after
   every builder returns. Running one is a failed build even if your CSS is right.
2. **DO NOT open any file under \`.claude/\`, any \`tests/gui/*.mjs\`, or \`inspect.mjs\`.** Every
   driver and measurement fact you need is stated below AS GIVEN. Do not go verify them. Last wave two
   builders spent their entire window reading instrument source and never made an edit; a third burned
   its budget reading a 992-line stylesheet in chunks. The source you must edit is inlined below.
3. **Edit only the files in YOUR file list, and only the selectors named as yours.** Ownership is
   proven disjoint before this fan-out; stepping outside it corrupts the wave's pixel attribution.
4. Prefer the SHORTEST change that closes the gap. One declaration is the target; the last three
   builders each landed in one.

## Binding constraints (D3) — literal-text test pins, brittle by nature

- No CSS comment may contain a closing brace \`}\`. Three tests scan the whole \`styles/\` directory as text.
- \`.bubble {\` must stay the FIRST literal occurrence of that string in \`chat.css\`.
- \`.bubble\` and \`.message-input\` stay ungrouped (never add them to a selector list).
- Exactly ONE \`backdrop-filter\` exists in all of \`styles/\` and it is \`subagent.css:122\`. Do not add one.
- No scrollbar PSEUDO-ELEMENT rule (\`::-webkit-scrollbar*\`) may be component-scoped. They live in \`base.css\`.
- The \`@import\` order in \`styles.css\` IS the cascade. Add rules inside a file; never reorder imports.
- \`theme.test.ts\` forbids moving any token's lightness or alpha. Do not edit \`--color-mint\`.
- Any new font-size must land within half a pixel of \`15 x 1.15^k\` for whole k. That half pixel is not slack.
- Do not edit \`DESIGN.md\`. Do not edit anything under \`.gauntlet/\`.

## Comments are load-bearing here

This codebase's CSS comments carry the arithmetic that justifies each value, and later waves read them
as evidence. **If your change falsifies a comment, repair the comment in the same edit.** Leaving a
false comment behind is worse than the defect you closed. Say what you repaired in your report.

Return the structured report. \`ran_npm\` must be false.
`

const TITLEBAR = `${COMMON}
# YOUR PIECE: Titlebar — ONE GAP: give the identity mark depth

The critic's gap, verbatim: *"Give the 22px identity mark one restrained depth cue so it reads as an
intentional brand object rather than a flat UI swatch; keep the mark solid and glyph-free."*

## Given facts — stated, not to be verified

- The identity mark paints at **THREE sites**, and all three measure mathematically flat. Interior
  mint standard deviation: titlebar mark **0.00 / 0.00 / 0.00**, welcome mark **0.05**, assistant
  avatar **0.09**. The identity reference the app is judged against measures **9.02 / 7.01 / 3.65**
  and **9.40 / 7.33 / 3.83** at its equivalent marks — roughly a 45-level gradient across the face.
- **Treating one site only creates a NEW inconsistency.** All three must move together. This is why
  your file list crosses two stylesheets.
- The mark is **SOLID BY DESIGN and glyph-free, permanently**. Do not add a glyph, a letter, an icon
  or an inner shape. That question is closed and has been answered three ways in source. *Depth* is
  the one axis left open, which is why this gap is admissible.
- **GUARD — no second mint hue.** The app's identity floor is measured at ONE hue (~180 degrees) and a
  smoothing pass counts mint pixels by hue. A depth treatment must vary **lightness** while preserving
  hue. Compositing black over the mint preserves the hue angle exactly (scaling RGB toward zero).
  Introducing \`--mint-press\` (hue 182) as a gradient stop would NOT — it is a second hue. Do not use it.
- **GUARD — #140 allows exactly ONE \`box-shadow\` in the app with a nonzero HORIZONTAL offset**, and it
  is the sidebar selection stripe. If you reach for box-shadow, its horizontal offset must be \`0\`. A
  background gradient sidesteps the question entirely and is the recommended form.
- A custom property with three callers is a system by this codebase's own stated rule (see tokens.css's
  note that a token with one caller is indirection). Only \`theme.test.ts\` reads \`tokens.css\`, and it
  validates *palette* keys against defined tokens — so adding a non-\`--color-*\` custom property to the
  \`:root\` alias block is safe. Adding it to the \`@theme\` block is not necessary.

## RECOMMENDED FORM (deviate only with a stated reason)

Define the depth once in \`tokens.css\`'s \`:root\` block as a gradient layer, then composite it over the
existing \`var(--mint)\` fill at all three sites, e.g. the shape:

    background: <depth layer>, var(--mint);

A pure-black ramp from transparent to a small alpha darkens the lower face and leaves the upper face at
the authored mint, which reads as a lit object without touching hue. **State your arithmetic**: for a
linear ramp the interior standard deviation is approximately \`range / sqrt(12)\`, and \`range ~= alpha *
255 * L\` where L is the mint's own lightness (~0.87). Land the predicted stddev inside the reference's
observed 3.5-10 band and say which end you aimed at and why.

## YOUR FILE LIST

- \`src/renderer/src/styles/tokens.css\` — the whole \`:root\` alias block is yours.
- \`src/renderer/src/styles/titlebar.css\` — you own \`.logo-mark\` ONLY.
- \`src/renderer/src/styles/chat.css\` — you own EXACTLY TWO rules: \`.welcome-mark\` and \`.avatar\`.

**CRITICAL, chat.css is SHARED this wave.** Another builder edits the \`.chat\` rule (the first rule in
that file) AFTER you return. Touch nothing in \`chat.css\` except those two rules. Do not reflow, reformat
or reorder that file.

## The source you must edit, inlined verbatim

\`src/renderer/src/styles/tokens.css\` — relevant lines from the two blocks:

    @theme {
      --color-mint: oklch(0.87 0.07 180);
      --color-mint-press: oklch(0.8 0.08 182);
      --color-mint-ink: oklch(0.25 0.02 200);
      --color-mint-wash: oklch(0.87 0.07 180 / 0.1);
      --radius-mark: 7px;
    }

    :root {
      --mint: var(--color-mint);
      --mint-press: var(--color-mint-press);
      --mint-ink: var(--color-mint-ink);
      --mint-wash: var(--color-mint-wash);
      --r-mark: var(--radius-mark);
    }

\`src/renderer/src/styles/titlebar.css\`, \`.logo-mark\` (its authored comment above it explains that the
14px margin is the WINDOW's left inset and must not be spent — leave that margin alone):

    .logo-mark {
      display: block;
      margin-left: 14px;
      width: 22px;
      height: 22px;
      border-radius: var(--r-mark);
      background: var(--mint);
      flex-shrink: 0;
    }

\`src/renderer/src/styles/chat.css\`, \`.avatar\` (28px circle, the assistant turn's mark):

    .avatar {
      display: block;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--mint);
      flex-shrink: 0;
      margin-top: 2px;
    }

\`src/renderer/src/styles/chat.css\`, \`.welcome-mark\` (44px, exactly twice the titlebar mark, and its
corner is stated as arithmetic on the token so the pair cannot drift — preserve that relationship):

    .welcome-mark {
      display: block;
      width: 44px;
      height: 44px;
      border-radius: calc(var(--r-mark) * 2);
      background: var(--mint);
      ...more declarations follow in this rule; leave them alone...
    }

Note \`.welcome-mark\` has further declarations after \`background\` that you must not disturb. Read the
rule in place before editing it, and change only what the gap needs.
`

const SIDEBAR = `${COMMON}
# YOUR PIECE: Sidebar — ONE GAP: compress the pre-list stack

The critic's gap, verbatim: *"The rail's primary content does not begin until about y=225, so roughly
26% of its 852px height is spent on pre-list status and controls; compress that stack to about
150-160px so the first session moves up by roughly 65-75px."*

## Given facts — stated, not to be verified

- The rail is **248px wide by 852px tall**. The first session row's top edge measures **y225**, which is
  **26.4%** of the rail's height. Target: **150-160px**, i.e. save **65-75px**.
- The stack in DOM order, with each band's derived height:

  | band | selector | derived height | note |
  |---|---|---|---|
  | 1 | \`.sidebar-head\` | 44 + 1px hairline = **45** | **DO NOT CHANGE.** DESIGN.md pins the Agents dock as mirroring this rail with the "same 44px head". |
  | 2 | \`.bg-sessions\` | **~73** | head 6+21+2, empty band 2+14+3+14+4, padding-bottom 6, hairline 1. **This is the fat.** |
  | 3 | \`.sidebar-filter\` | 34 input + 1px hairline = **35** | |
  | 4 | \`.session-scope\` | 8 + 21 chip + 2 = **31** | |
  | 5 | \`.session-group-head\` | 4 + 13 + 4 = **21** | \`gui-95\` already times out waiting for this element. Do not remove or rename it. |

  Derived sum ~205; the remaining ~20px to the measured 225 is list padding and the group wrapper.
- **Band 2 is the whole finding.** It is an EMPTY state — it renders "Background sessions" + a
  \`Refresh\` action, then "None running here" and "Scoped to the open project." So ~73px of the rail,
  permanently above the primary content, is spent saying nothing is running.
- **You may NOT delete the empty state's copy or its action.** The standard this run is judged against
  says every empty state must be "authored copy plus a real action rather than a placeholder mark."
  Removing the words or the \`Refresh\` button would win the pixels and lose the bar. **Recompose it;
  do not strip it.** Folding the status onto the head row beside \`Refresh\` keeps copy, action and
  every class present while collapsing a three-band block to one.
- **DO NOT remove or rename any element or className.** GUI drivers query this rail by class, and two
  of them (\`gui-49\`, \`gui-95\`) are ALREADY RED for environment reasons unrelated to you. Renaming
  anything hands them a second cause and makes your build unattributable.
- **DO NOT touch \`shared.css\`.** The two-line title clamp lives there, it is shared with the Agents and
  Commands dock rows, and \`gui-94\` pins \`.command-row-desc\`'s line box and row height. It is already
  red; keep it at exactly one cause.
- **Do not undo the two-line session-title clamp.** It was measured as a real improvement: row pitch
  spread tightened from 1.76px to 1.41px.
- Do not change \`.session-row-btn\`'s \`border-radius\` — a separate consistency repair owns it this wave.

## YOUR FILE LIST

- \`src/renderer/src/styles/rails.css\`
- \`src/renderer/src/components/Sidebar.tsx\`

Nobody else edits either file this wave.

## The source you must edit, inlined verbatim

    .sidebar-head,
    .agents-dock-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 44px;
      flex-shrink: 0;
      padding: 0 8px 0 16px;
      border-bottom: 1px solid var(--border);
    }

    .bg-sessions {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      max-height: 40%;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }

    .bg-sessions-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 8px;
      padding: 6px 8px 2px 16px;
    }

    .bg-sessions-empty {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 2px 16px 4px;
      font-size: var(--fs-micro);
      color: var(--text-faint);
    }

    .sidebar-filter {
      flex-shrink: 0;
      padding: 0 8px 0 16px;
      border-bottom: 1px solid var(--border);
      transition: border-color 150ms var(--ease);
    }

    .sidebar-filter-input {
      width: 100%;
      height: 34px;
      ...more declarations; leave them alone...
    }

    .session-scope {
      flex-shrink: 0;
      display: flex;
      gap: 4px;
      padding: 8px 8px 2px;
    }

    .session-group-head {
      margin: 0;
      padding: 4px 10px;
      font-size: var(--fs-micro);
      ...more declarations; leave them alone...
    }

The relevant JSX order in \`Sidebar.tsx\` (roughly lines 458-700): \`.sidebar\` wraps \`.sidebar-head\`,
then \`section.bg-sessions\` (containing \`.bg-sessions-head\` with \`.bg-sessions-title\` and the
\`.sidebar-empty-retry.bg-sessions-refresh\` button, then either \`.bg-sessions-empty\` or
\`ul.bg-session-list\`), then \`.sidebar-filter\`, then \`.session-scope\`, then the groups. Read the real
file before editing; the line numbers above are approximate and only orient you.

**16px is the rail's shared left edge** — the head, the filter placeholder, the group headings and the
row titles all land on it. Several authored comments say so explicitly. Whatever you recompose must keep
that edge, and if you change a padding that produces it, repair the comment that claims it.
`

const INPUTBAR = `${COMMON}
# YOUR PIECE: InputBar — ONE GAP: the 5px seam at the composer

The gap, from a whole-artifact measurement pass: **the app's most-repeated measure jogs 5px at the
composer seam.** The transcript column and the composer pill are both exactly 760px wide, sit directly
one above the other, and their left edges are 5px apart (and their right edges 5px apart).

## Given facts — the arithmetic, stated and already verified. Do not re-derive it.

- \`.chat\` is the scroll container: \`overflow-y: auto\`, \`padding: 0 24px\`. The pane is **1192px** wide.
  The app's global scrollbar reserves **10px** on the right, so \`.chat\`'s content box is 1182px:
  \`1182 - 48 = 1134\`, and the 760px column centres at \`24 + (1134 - 760) / 2 = 211\`. In the window
  frame (the 248px rail to its left) that is **x459..1218**.
- \`.input-bar\` has \`padding: 12px 24px 16px\` and no scrollbar: \`1192 - 48 = 1144\`, and the 760px pill
  centres at \`24 + (1144 - 760) / 2 = 216\` → **x464..1223**.
- **So the jog is exactly half the 10px scrollbar reserve.** Each box is correctly centred in its own
  pane; the panes differ in width. Two locally-correct centrings producing one globally visible
  misalignment of the measure the app repeats four times.

## RECOMMENDED FORM (deviate only with a stated reason)

Put \`scrollbar-gutter: stable both-edges\` on \`.chat\`. One declaration, a native CSS platform feature,
and **no magic number** — it reserves the gutter on BOTH sides, so \`.chat\`'s content box becomes
symmetric about its pane and the 760px column centres in the pane exactly as the pill does:
\`10 + 24 + (1172 - 48 - 760) / 2 = 216\` → **x464**, sharing one axis with the pill. Both boxes end up
centred in the same 1192px pane rather than one of them being nudged off its own centre.

The alternative — padding the composer's right side by 10px to imitate the scrollbar — was considered
and is worse: it deliberately off-centres the pill in its own pane and hard-codes a number that must
track the scrollbar width forever. Take it only if you find the recommended form does not hold, and say why.

## Given facts that clear the recommended form — verified, do not re-check

- \`.welcome\` renders **OUTSIDE** \`.chat\`. \`Chat.tsx\` renders only \`.chat-column\` inside
  \`<main className="chat">\`, so this change cannot move the Welcome surface and cannot disturb the
  hero's pinned 480px measure.
- **No \`gui-*\` driver references \`.chat-column\`.**
- The scrollbar text-scan test inspects only lines containing \`::-webkit-scrollbar\`. \`scrollbar-gutter\`
  is a property, not a pseudo-element rule, so it does not count as a component-scoped scrollbar rule.

## HARD REFUSAL — do not touch control distribution

The Effort/Model arrangement axis is **EXHAUSTED**: four independent critics across two runs asked for
four different arrangements of that strip, and the last request is refused against the spec itself,
which authorises "Chat column: max-width 760px, centered". Do not centre, cluster, redistribute or
resize those controls. \`.message-input\` stays ungrouped. The disclaimer is already centred on its own
line and that was a previously fixed spec break — leave it.

## YOUR FILE LIST

- \`src/renderer/src/styles/chat.css\` — you own EXACTLY the \`.chat\` rule, which is the first rule in the
  file:

      .chat {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 0 24px;
      }

**CRITICAL, chat.css is SHARED this wave.** Another builder has ALREADY edited \`.welcome-mark\` and
\`.avatar\` in this file before you were started. Do not touch, reflow or reformat anything else in it.
If you need the composer side after all, \`src/renderer/src/styles/composer.css\` is also yours and is
uncontended — but justify choosing it.
`

phase('Build')

const [sidebar, chain] = await parallel([
  () => agent(SIDEBAR, { label: 'build:Sidebar', phase: 'Build', schema: DECL }),
  async () => {
    const tb = await agent(TITLEBAR, { label: 'build:Titlebar', phase: 'Build', schema: DECL })
    const ib = await agent(INPUTBAR, { label: 'build:InputBar', phase: 'Build', schema: DECL })
    return { titlebar: tb, inputbar: ib }
  },
])

return {
  sidebar,
  titlebar: chain?.titlebar ?? null,
  inputbar: chain?.inputbar ?? null,
}
