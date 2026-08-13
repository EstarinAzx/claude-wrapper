# Wave 11 critic + smoothing reports

Six judging agents. Four critics returned first time; **the Chat critic stalled at 209s and returned on retry 1** (workflow log: `[stall] agent "critic:Chat" stalled (no progress) after 209s — retrying (1/5)`). Zero agent errors, zero empty results. Smoothing returned first time.

Live critic route at boot **and again at launch**: `sonnet -> xai/grok-4.6`. SAME landing as waves 9 and 10. Family name stayed `sonnet`; Target did not move inside the plateau window. `critic_degraded: false`. Zero SPEC BREAKs.

⚠️ **THE ROUTE MOVED AFTER THE WAVE.** Re-resolved immediately after the six agents returned: **every family now points at Anthropic** (`opus -> anthropic/claude-opus-5`, `sonnet -> anthropic/claude-fable-5`, `haiku -> anthropic/claude-haiku-4-5`, `fable -> anthropic/claude-fable-5`). Wave 11's verdicts were produced on `xai/grok-4.6` and are unaffected. Wave 12 is the piece at risk — see 11.11.

CRITIC_SHARED byte-identical to wave 10 (`shared-eq true`, extracted length 4799 under LF normalisation; wave 10's own file is CRLF, which is why the recorded length differs from wave 10's note of 4823 — the *content* is identical). BAR_WIN byte-identical to wave 10 (length 395). Bar nine files match wave 10 hash-for-hash.

**Verdict spread: 3 `BAR WINS`, 2 `TOO CLOSE`. Two pieces ROSE on a capture that is 12/12 byte-identical to wave 10 and 0 RGB pixels different.**

| piece | wave 10 | wave 11 | movement |
|---|---|---|---|
| Welcome | BAR WINS | BAR WINS | held |
| Titlebar | BAR WINS | BAR WINS | held |
| Sidebar | BAR WINS | BAR WINS | held |
| Chat | BAR WINS | **TOO CLOSE** | **ROSE** |
| InputBar | BAR WINS | **TOO CLOSE** | **ROSE** |

---

## Critic: Welcome -> BAR WINS

Agent: `afe073ddb7c1be455` (first time, 315.6s, 8 tool calls)

### PART A literals

welcome.png is 1440×852 RGBA. window-welcome.png is 1440×900 RGBA (same surface plus a full-width titlebar; 900−48=852). linear-method.png is 1680×1050 RGB.

Welcome crop (welcome.png): one dark field, no rail, no dock, no composer, no footer. A single vertical stack sits in the horizontal middle of the frame, a little above geometric center (more empty field below the button than above the mark). Internally the stack is left-aligned. Top to bottom: one solid mint rounded square with no glyph; headline "Start a session"; two lines of smaller muted support, "Claude reads and edits the files in the folder you open," then "and it keeps working there until you switch to another."; one mint pill with dark ink, "Pick a project folder". The pill is shorter than either support line. No other text. I cannot read sizes off the type.

Window (window-welcome.png): titlebar across the top. Left: a second solid mint rounded square (smaller than the hero), then "Claude Wrapper", then two compact pills "Wisped" and "Bypass". Center: "New session". Right: three window controls only (− □ ×). I cannot see any dock-toggle glyphs. Below the titlebar the welcome stack is the same as the crop. Mint rounded squares on screen: 2. Titlebar pills: 2. Window controls: 3. No left sessions rail, no right dock, no input bar, no footer line.

Reference (linear-method.png): top nav — left, a circular mark plus wordmark "Linear"; right, six items "Product" "Resources" "Customers" "Pricing" "Now" "Contact", a hairline, then "Log in" and a light pill "Sign up". A hairline under the nav. Centered stack: small caps "THE LINEAR METHOD"; two-line display "Practices" / "for building"; three muted lines "There is a lost art of building true quality software." / "To bring back the right focus, here are the" / "foundational ideas Linear is built on." Lower third: two large overlapping dotted circles, intersection hatched, right arc brighter; they run off the bottom edge.

### PART C gap

The welcome stack is a left-aligned island whose pill is about half the width of the support copy, so the 1440×852 field has a left edge and no spine. Center-align the mark, "Start a session", the two support lines and the button on one vertical axis, and make the button the same width as the longer support line ("Claude reads and edits the files in the folder you open,").

### PART D

NONE

---

## Critic: Titlebar -> BAR WINS

Agent: `a41c81e36d302eedd` (first time, 248.0s, 8 tool calls)

### PART A literals

titlebar.png is 1440×48. window-session.png is 1440×900; the same strip is the top 48px of that window, full width. linear-features.png is 1680×1050.

APP TITLEBAR — readable text, verbatim, left to right: "Claude Wrapper", "Wisped", "Bypass", "inspect-ws". No other words. The three right-side toggles and the three window controls are icon-only; no labels or tooltips are visible.

APP TITLEBAR — counts: 1 solid mint rounded-square mark with no glyph; 1 wordmark; 2 status pills; 1 session title; 3 icon toggles; 1 vertical hairline; 3 window controls (minimize dash, maximize square, close ×).

APP TITLEBAR — block positions on the 1440×48 crop (x from left): mark 14–35 (22px wide); wordmark 45–140; the two pills as one run 158–275; session title 685–754, vertically centered, optically on the window midline (720); right run 1218–1423, with a 1px hairline at x≈1310 splitting the three toggles from min/max/close. First toggle is a slash; second is two nodes joined by a stroke; third is a circled i.

WINDOW CONTEXT: the strip sits above a left SESSIONS rail and a chat column. The title "inspect-ws" is the project/folder name, not the selected session's question. Composer and transcript sit below; they are not in the titlebar.

LINEAR REFERENCE HEADER: left lockup is a spherical mark plus the word "Linear"; center is six peer links, verbatim "Product", "Resources", "Customers", "Pricing", "Now", "Contact"; right is the text "Log in" then a filled "Sign up" pill; a hairline runs under the whole bar. One primary, even rhythm, nothing rides next to the wordmark.

### PART C gap

Pull "Wisped" and "Bypass" out of the identity lockup. They sit 18px after the 600 wordmark at the same vertical measure as the name, so mark + "Claude Wrapper" never reads as a lockup. Keep the left slot as mark + name only: drop both pills to the 11px micro rung and put at least 32px between the wordmark and the first chip (or park both chips with the session title).

### PART D

NONE

---

## Critic: Sidebar -> BAR WINS

Agent: `a74ac1b7d9fb2222b` (first time, 276.5s, 9 tool calls)

### PART A literals

sidebar.png is 248×852 (32-bit). Top to bottom, every readable string: "SESSIONS"; "Background sessions"; "Refresh"; "None running here"; "Scoped to the open project."; "Filter sessions..."; "This project"; "All projects"; "C:\Users\S.D\AppData\Local\Temp\inspect..."; "Why does the sessions rail go empty after I flip the backend..."; "1h"; "Rewriting the tool card so a long Read result truncates instead o..."; "3h"; "Add the queued send flag to the draft rather than a copy of it"; "7h"; "Why does the Agents dock blank while it refreshes?"; "2d"; "Window bounds are remembered but a close inside..."; "5d"; "12 sessions outside this project"; "Show all projects". Header band ~44px: "SESSIONS" at left, four icon-only controls at right (circular arrows, a folder-like glyph, a plus, a left chevron). Next ~100px is the Background sessions block: label + pill "Refresh" on one row, then the two empty-state lines. Full-width search field. Two-item scope control ("This project" filled, "All projects" plain). One truncated path line. Then five session rows (title up to two lines + a relative time); the first is selected (rounded fill, ~2px mint bar on the left edge). After the fifth row, ~215px of empty column (no text, no scrollbar visible). Hairline, then a pinned footer (count line + outlined "Show all projects"). No resize grip readable in the crop.

window-session.png is 1440×900. The rail is the full-height left column under a ~48px titlebar, 248px wide. [titlebar and chat literals as recorded by the critic — unchanged from wave 10's reading]

linear-home-hero.png is 1680×1050. Marketing page: Linear mark + wordmark; nav "Product" "Resources" "Customers" "Pricing" "Now" "Contact" "Log in" "Sign up"; headline "The product development system for teams and agents"; sub "Purpose-built for planning and building products. Designed for the AI era."; "New" "Coding Sessions →"; product still with a left nav (Inbox, My issues, Reviews, Pulse, Workspace, Favorites) of even icon+label rows and a selected "Faster app launch" row.

### PART C gap

The idle Background sessions block (heading, Refresh, "None running here", "Scoped to the open project.") spends ~100px above the list while empty. Collapse it to one 28px row, or park it under the session list, so the first session title sits within ~120px of the SESSIONS header instead of ~210px.

### PART D

NONE

---

## Critic: Chat -> TOO CLOSE

Agent: `a7344352d66979b2a` (**attempt 2** — attempt `a7fa0650221354b59` stalled with no progress at 209s; 779.3s total, 17 tool calls)

### PART A literals

chat.png is 1192×721 (32-bit ARGB). window-session.png is 1440×900 (same ARGB). linear-changelog.png is 1680×1050 (24-bit RGB).

chat.png, top to bottom, every readable string:
1) Right-aligned user bubble: "Why does the sessions rail go empty after I flip the backend pill?"
2) Assistant prose: "Flipping the pill discards the engine, and both list handlers read straight off that handle, so the menu asks a null engine and gets an empty array back. The list is not cached anywhere, which is deliberate: the answer genuinely differs between backends, so a cache would be wrong rather than merely stale."
3) Tool card: label "Read", path "src/main/list-engine.ts", preview "export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {", then two chevron rows "SHOW INPUT" and "SHOW OUTPUT".
4) Assistant prose: "Rebuilding lazily at the two read handlers, rather than eagerly when the engine is discarded. Eager costs every user a rebuild on every pill click, including the one who never opens a menu."
5) Tool card: label "Edit", path "src/main/index.ts", status "The file src/main/index.ts has been updated.", then two chevron rows "SHOW DIFF" and "SHOW INPUT".
6) Right-aligned user bubble: "Makes sense. Add a regression test for the rebuild path."
7) Assistant prose: "Added. It drives a flip, then reads both lists back and asserts neither is empty."

Counts in the crop: 2 user bubbles, 2 mint-circle avatars (no glyph inside either), 3 assistant prose blocks, 2 tool cards, 4 collapsed SHOW rows, 1 thin vertical scrollbar at the far right. No date divider, no timestamp, no typing dots, no list markers.

Measured blocks on chat.png (content column x=211–970 = 760px wide):
- user bubble 1: x=515 y=5, 456×72 (right edge 970)
- avatar 1: x=211 y=103, 28×28
- Read card: x=252 y=214, 568×112 (right edge 819)
- Edit card: x=252 y=432, 568×113 (right edge 819)
- user bubble 2: x=571 y=586, 400×48 (right edge 970)
- avatar 2: x=211 y=660, 28×28
- scrollbar: x=1185–1188

Empty vertical gaps between those fill boxes: ~27px (bubble1→avatar1), ~24px (prose1→Read), ~24px (Read→prose2), ~24px (prose2→Edit), ~42px (Edit→bubble2), ~27px (bubble2→avatar2).

window-session.png places that same column in the workspace right of a sessions rail (~x=0–247) and above the composer. Avatars land at window x=459; user bubble 1 at x=763–1218; last avatar at y=708; composer pill around y=784–828, x≈463–1207.

linear-changelog.png (reference): top nav "Linear" / Product / Resources / Customers / Pricing / Now / Contact / Log in / Sign up; left-rail date "July 30, 2026"; headline clipped at the top of the frame so its first word is unreadable, remainder "coding sessions on mobile"; phone video still (visible UI: 5:46, Linear, Agent, Changes, 00:00, −00:20); three body paragraphs; lower phone still ("9:41", "My issues", Assigned / Created / Subscribed).

### PART C gap

On each tool card, drop the two full-width empty SHOW * tracks (they eat ~40px of the card's 112–113px height and read as vacant fields). Leave a single 13px inline disclosure line so a rest-state card is verb + path + one preview line at about 64px.

### PART D

NONE

---

## Critic: InputBar -> TOO CLOSE

Agent: `aa7b8f91a62aff8d8` (first time, 321.4s, 9 tool calls)

### PART A literals

input-bar.png is 1192×132. Content lives in a 760×104 box from (211,12) to (970,115), centered in the crop. Three stacked bands:

1) Input pill, full 760px wide, top of the box (~y 12–60). Left: paperclip glyph. Placeholder text: "Message Claude..." (cannot tell U+2026 from three periods at this resolution). Right: mint circle 36×36 at (926,19)–(961,54) with a dark ↑. No typed value; empty/placeholder state.

2) Utility row (~y 66–86), same 760px span. Left cluster: label "Effort" (~x 211–237), a short horizontal slider (~x 243–310, width 68; thumb at the LEFT end of the track), then a rounded chip "Default" (~x 333–370). Right cluster: label "Model" (~x 876–906) and a matching rounded chip "Default" (~x 923–960). The mid-span between the two clusters is empty.

3) Disclaimer, centered under the row (~y 108–115): "Claude can make mistakes. Verify important information."

Counts on this crop: 1 pill, 1 paperclip, 1 send, 1 slider, 2 labels (Effort, Model), 2 chips both reading "Default", 1 disclaimer line. No other readable text.

window-session.png is 1440×900. Same composer sits as the chat-column footer, right of a sessions rail, not full window width. Composer does not overlap the transcript.

linear-home-product.png is 1680×1050. Product shot includes an inset composer "Tell Linear what to do next..." with three same-size circular icons (cycle, paperclip, ↑) inside one field, **no second row**.

### PART C gap

The Effort control is two grammars that do not agree: a 68px slider with the thumb parked at the left end of the track, then a separate "Default" chip. Drop the stub slider and make Effort a labeled chip like Model (then left-pack both chips under the pill with a 16–24px gap), or keep one slider at least ~160px wide whose thumb sits on the Default stop and whose value is not restated as a second chip.

### PART D

NONE

---

## Whole-artifact smoothing pass

Agent: `a51ca60eabe347710` (first time, 365.9s, 52 tool calls, 129,750 tokens). Instruments written this wave: `.gauntlet/scratch/w8smooth/w11-candidates.mjs`, `w11-remeasure.mjs`.

### seams

SEAMS VISIBLE

### nullControl

12/12 wave-11 PNGs are byte-identical to the matching files in wave 10, and RGB differ is 0 on every file (welcome 1440x852, window-welcome 1440x900, welcome-min-window 640x432, titlebar 1440x48, sidebar 248x852, chat 1192x721, input-bar 1192x132, window-session 1440x900, window-session-short 1440x1017, agents-dock 248x852, commands-dock 248x852, appearance-dock 248x852). `rgb_changed_total=0`. Nonzero would have outranked every other claim; it did not occur. **This is the third consecutive zero-pixel wave (9=10=11).**

### identityFloor

HOLDS. Worst chromatic-mint share is 3.99% on welcome-min-window.png (11043/276480). All twelve surfaces sit under the 10% ceiling (welcome 0.90, window-welcome 0.96, titlebar 2.08, sidebar 0.07, chat 0.14, input-bar 0.62, window-session 0.29, window-session-short 0.26, appearance-dock 0.27, agents-dock 0.00, commands-dock 0.00). Dominant family 178–183° holds 46479 px = 95.88% of chromatic mass (total 48476). Secondary families are 21–27° at 2.33% (1128 px, Bypass/danger) and three swatch families at 0.59–0.60%. No second identity hue.

### typeScale

HOLDS. Declared rungs vs 15×1.15^k, verified in tokens.css (--text-micro 11, --text-ui 13, --text-body 15, --text-display 46) and subagent.css `.subagent-drawer-close { font-size: 20px }`: 11 vs 11.342 (k=−2, 0.342), 13 vs 13.043 (k=−1, 0.043), 15 vs 15.000 (k=0, 0.000), 20 vs 19.837 (k=2, 0.163), 46 vs 45.885 (k=8, 0.115). Max deviation 0.342 px against the 0.35 px tolerance; 0 off-ladder rungs.

### titlebarControl

Painted left intervals are mark→name 9 px, name→pill1 16 px, pill1→pill2 4 px (sum 29 under the 33 px ceiling). Break ratio 16/9 = 1.78x, above the 1.63x threshold. Left group ends at x275 (+28 vs rail divider x247). Session-title ink x685..754, midpoint 720.00 against window centre 720.00 (0.00 px displacement). Mark is 22×22 at x14..35, y13..34. Pills paint 59×21 (x158..216) and 55×21 (x221..275).

### toolCardControl

chat.png card inners are 112 px (y213..326 outer 114) and 113 px (y431..545 outer 115). Body-to-row-1 / row-1-to-row-2 clearances are 9 / 6 in both cards. Exact resting ground in the four 540×17 row boxes is 34935 px (fill rgb(8,12,14) 30607 + outline rgb(25,29,31) 4328; other/AA 1785). Prose ink starts at x266; caret/label ink starts at x277 on all four rows (+11 px).

### groundVocabularySeam

Still two grammars. Rail filter: fill rgb(29,34,35) = var(--border), L=0.2473, +0.0823 OKLCH L over rail ground, r8, placeholder ink flush at x16. Tool disclosures: fill rgb(8,12,14) = var(--well), L=0.1507, −0.0142 L plus outline rgb(25,29,31) (+0.0625 L), r4, label +11. Command-row outline rgb(25,30,32) is +0.0033 L from the tool outline and is the same target-weight hairline family, not a third grammar.

### pathTreatment

One cwd, two treatments. Titlebar basename "inspect-ws" inks x685..754 (70 px). Rail heading inks x16..228 (213 px) inside the 216 px content box (98.6%) under head truncation. Semantic-role split unchanged and owner-shaped.

### dateDividerControl

Label ink midpoint 843.00 vs centre 844.00 = 1.00 px tracking debt. Rule segments 348/348 (0 px asymmetry), gap 64 px. Ink clearance 45/45, explained exactly by 40 px box + 5 px internal half-leading. Not a spec break.

### jogControl

Short frame (scrollbar absent): transcript x464..1223 vs composer x459..1218 = −5 px on both edges. Overflowing frame (scrollbar x1433..1436): both x459..1218 = 0.00 px. Real, conditional on the gutter, owner-shaped.

### markControl

Every identity mark is byte-identical to wave 10: titlebar 0/484, welcome 0/1936, welcome-min-window entire 0/276480, chat avatar1 0/784, chat avatar2 0/784. Painted sizes unchanged.

### findings

1. Null control holds: 12/12 captures byte-identical to wave 10 and 0 RGB pixels changed. The artifact did not move. Third consecutive zero-pixel wave.
2. Quiet-control vocabulary seam still measurable on the same pixels: rail filter +0.0823 L / var(--border) / r8 / flush x16 vs tool rows −0.0142 L fill +0.0625 L outline / r4 / label x277 (+11). Both paint; they do not share one operability grammar.
3. Cwd presentation seam still measurable: titlebar basename ink 70 px vs rail full-path ink 213/216 px (98.6%) with head truncation. One value, two roles.

### notFindings

1. Titlebar break remains above threshold: 16/9 = 1.78x > 1.63x; intervals 9/16/4; group edge x275; interval sum 29 px under the 33 px ceiling.
2. Session-title midpoint remains 720.00 with 0.00 px displacement; mark remains 14 px inset and 22×22.
3. Tool-card inners remain 112/113 with 9/6 disclosure clearances and 34935 px exact fill-or-border ground. Label inset remains +11 px on all four rows. Settled, not new.
4. Date-divider 45/45 ink clearance is 40 px box + 5 px half-leading; rule symmetry 348/348; only the known 1.00 px tracking debt remains.
5. Short-frame −5 px jog unchanged and scrollbar-conditional; overflowing frame 0.00 px.
6. Identity floor holds (worst mint 3.99%, dominant family 95.88%). Type ladder max deviation 0.342 px within 0.35 px.
7. Marks did not move: 0 differing box pixels vs wave 10 at every site.
8. Dock-row outline split is not a new seam — the authored stateless-picker vs stateful-list contract `rails.css` already names.
9. Selected-row wash is shared, not split: appearance Frost rgb(28,39,39) = session selected wash. All four rail/dock heads cut their first full hairline at y43.
10. Welcome stack centring remains +0.50 px (content x513..927, mid 720.50 vs 720.00). Composer Default chips vs titlebar pills are different control classes, not a new cross-surface contract.
11. window-session-short.png reproduces the same divider, jog and identity numbers as wave 10.

### newPieceProposal

NONE. Third consecutive zero-pixel wave. The two remaining measurable cross-surface seams are the same settled/owner-shaped axes waves 8–10 already filed. A stationary artifact does not mint speculative work.

⚠️ **The smoothing pass ended its proposal with "Plateau 2 → 3". That arithmetic is WRONG and it was not authorised to make it** — the smoothing pass never sees a critic verdict, by design, so it was extrapolating from the null control alone. The plateau is scored from the five ordinals, and two of them rose. See adjudication 11.1.
