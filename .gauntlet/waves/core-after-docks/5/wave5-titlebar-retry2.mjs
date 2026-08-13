export const meta = {
  name: 'gauntlet-wave5-titlebar-retry2',
  description: 'Gauntlet run 3 wave 5: Titlebar builder, third brief shape — emission minimised to one line',
  phases: [{ title: 'Build', detail: 'one builder, one declaration, no comment rewrite' }],
}

const ROOT = 'D:/.claude/claude projects/playground/4'

// TWELVE STALLS ACROSS TWO BRIEF SHAPES, and the transcripts name the cause.
// Every attempt that got past its first read did the identical thing: emitted
// "I'll make the edit first, then justify it", made ONE bounded Read of
// tokens.css, and then stalled with no further output. It never reached the
// Edit call.
//
// What that Edit had to contain: a rewritten ~20-line authored comment, verbatim
// in BOTH old_string and new_string, plus a derived colour value. That is a very
// long single emission behind a 180s no-progress window. Wave 3 diagnosed the
// same signature on its Chat critic — it stalled twice because PART A asked for
// 923 characters of verbatim text where the other four surfaces asked for under
// 150, and it was emission length rather than payload weight.
//
// So this brief removes the emission, not the thinking: ONE line changed, the
// comment left alone for the leg to repair. Third shape, and the last attempt
// this wave — if it stalls, Titlebar gets no builder and the stall is the record.

phase('Build')

const BRIEF = `You are a BUILDER on a shipping Electron app at ${ROOT}.

## THE ENTIRE TASK: CHANGE ONE LINE

File: \`src/renderer/src/styles/tokens.css\`. Line 131. It reads exactly:

\`\`\`
  --mark-depth: linear-gradient(rgb(0 0 0 / 0), rgb(0 0 0 / 0.1));
\`\`\`

Your \`Edit\` must use THAT ONE LINE as \`old_string\` and your new declaration as
\`new_string\`. **Do not touch the comment above it. Do not read it. Do not rewrite it.** The
comment is stale and somebody else is repairing it — if you spend your output rewriting it you
will run out of time, which is exactly how twelve previous attempts at this task died. Keep your
edit to one line. Make it your FIRST action. Justify it afterwards in your report.

## WHAT THE LINE DOES

It is a gradient layer painted over a flat mint fill at three sites, always as
\`background: var(--mark-depth), var(--mint);\` — a 22px rounded square, a 44px rounded square and
a 28px circle. The mint under it is \`oklch(0.87 0.07 180)\`; the mark's top row measures
RGB(160, 226, 212) and its bottom row RGB(144, 204, 192).

## THE GAP

The ramp is pure BLACK, so it darkens all three channels in proportion and the mark never changes
character as it descends. The design reference this app is judged against shifts CHROMA down its
marks. Interior standard deviation per channel, measured:

- app:       R 3.49   G 4.81   B 4.66
- reference: R 9.40   G 7.06   B 4.02

The app **matches on B**, is ~45% short on G, and ~3x short on R. Raising the black alpha cannot
fix that: it scales all three together, so matching G overshoots B by 70% and still leaves R at
half. It is a SHAPE problem.

## THE MECHANISM TO USE

Make the ramp's dark stop a **darker, more chromatic colour at the SAME hue as the mint** instead
of neutral black. At hue ~180 the red channel sits furthest from the other two, so increasing
chroma while dropping lightness pulls R down fastest and B least — the reference's signature.

Fill in this form, or an sRGB equivalent if you trust the notation more:

\`\`\`
  --mark-depth: linear-gradient(oklch(0.87 0.07 180 / 0), oklch(L C 180 / A));
\`\`\`

Choose **L** (clearly darker than 0.87), **C** (above the mint's 0.07) and **A** (same order as
today's 0.1). Both stops must sit at hue **180**.

## THE ONE HARD GUARD

**EXACTLY ONE MINT HUE.** The accent floor is verified by counting mint pixels at a single hue
angle. Pinning both stops to 180 is what protects it — that is why the form above does. If you
believe your value cannot hold one hue, ship a smaller step in the same direction and say so.

## PINNED BY NOTHING — so a broken value fails silently

No test and no driver reads this token or measures a mark's interior, and jsdom loads no CSS. An
unparseable value paints flat mint with the whole suite still green. Use a notation you are
confident Chromium parses.

## DO NOT

Do not edit any other file — two other builders have already edited two other stylesheets in this
tree. Do not run npm, any build, or any test. Do not open \`.claude/\`, any \`gui-*.mjs\`, or
\`inspect.mjs\`. Do not read another stylesheet.

## REPORT, AFTER THE EDIT IS WRITTEN

The value you shipped, why those three numbers, your predicted per-channel interior stddev at the
three sites, and how confident you are that the hue holds.`

const out = await agent(BRIEF, { label: 'build:Titlebar-retry2', phase: 'Build' })
return { titlebar: out }
