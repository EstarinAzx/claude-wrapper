# Wave 10 critic + smoothing reports

Five critics returned first time. Smoothing returned first time. Six of six, no retry.

Live critic route at launch: `sonnet -> xai/grok-4.6`. SAME landing as wave 9. Family name stayed `sonnet`; Target did not move inside the plateau window. `critic_degraded: false`. Zero SPEC BREAKs.

CRITIC_SHARED byte-identical to wave 9 (`shared-eq true`, extracted length 4823). Bar nine files match wave 9 hash-for-hash.

---

## Critic: Welcome -> BAR WINS

Agent: `a56a461a963bb061f`

### PART A literals

welcome.png is 1440×852. A near-black field with one centered column and nothing else — no composer, no rail, no footer, no second action. Content bounding box x=514–926, y=242–488 (412×246). Left margin 514px equals right margin 514px. Top empty band 242px; bottom empty band 364px. Four blocks, all flush-left to x≈514: (1) solid mint rounded square, no glyph, ≈42×47 at y≈240–287; (2) headline “Start a session” at y≈304–343, ≈282px wide; (3) two-line supporting copy at y≈368–415, ≈412px wide, the widest element; (4) mint pill button at y≈432–495, ≈198×64. Readable text, verbatim: “Start a session” / “Claude reads and edits the files in the folder you open,” / “and it keeps working there until you switch to another.” / “Pick a project folder”. One headline, one paragraph (2 lines), one button, one mark. No other strings.

window-welcome.png is 1440×900 — same surface under a ≈48px titlebar (852+48=900). Titlebar left: the same solid mint rounded square + “Claude Wrapper” + mint pill “Wisped” + darker pill “Bypass”. Titlebar center: “New session”. Titlebar right: three window-control glyphs (minimize, maximize, close). Zero dock toggles visible. The welcome stack is the same four blocks shifted +48px (mark y≈288–335; cluster y≈288–536). Identity mark appears twice in this frame (titlebar and hero). No other readable text.

linear-method.png is 1680×1050. Top nav: Linear mark + wordmark; six links “Product” “Resources” “Customers” “Pricing” “Now” “Contact”; a vertical rule; “Log in”; pill “Sign up”. Centered page: eyebrow “THE LINEAR METHOD”; two-line serif display “Practices” / “for building”; three-line body “There is a lost art of building true quality software.” / “To bring back the right focus, here are the” / “foundational ideas Linear is built on.” Lower third: two large overlapping dotted circles. No in-body button.

### PART C gap

Make the headline the measure of the column. Either lengthen “Start a session” so it sets the same ~412px width as the supporting copy at the existing display size, or narrow that copy to the headline’s current ~282px. As shot the paragraph is the widest element, so the mark and title hang off its left edge and the 412×246 stack cannot hold a 1440×852 pane (364px of uncomposed void below).

### PART D

NONE


---

## Critic: Titlebar -> BAR WINS

Agent: `a5aaee72e5e07e1ef`

### PART A literals

titlebar.png is 1440×48 px, RGBA. window-session.png is 1440×900 px, RGBA; the same 48px strip is the full-width top edge of that window, flush above the sessions rail and the chat, with no second header. linear-features.png is 1680×1050 px, RGB.

Readable text on the titlebar, left to right: "Claude Wrapper", "Wisped", "Bypass", "inspect-ws". No other words. I cannot read tooltips or confirm hit-target boxes from a still.

Counts on the strip: 1 solid mint rounded-square mark; 1 app name; 2 status pills; 1 centered session title; 3 outline glyphs (a forward slash, a share/nodes mark, a circled i); 1 vertical hairline; 3 window controls (minus, empty square, ×); 1 full-width 1px rule on the bottom row (y=47).

Block positions on the 1440×48 crop (x,y inclusive): mark 14–35 × 13–34 (22×22); name 45–140 × 18–30; Wisped pill 158–216 × 13–33 (59×21, filled); Bypass pill 221–275 × 13–33 (55×21, outline); 5px gap between the two pills; session title 686–754 × 18–32 (midpoint ~720 on a 1440 bar); slash 1218–1223 × 18–29; share 1245–1256 × 18–29; info 1275–1286 × 18–29; separator at x=1310; minimize 1335–1344 × 23–24 (10×2); maximize 1375–1384 × 19–28 (10×10); close 1416–1423 × 20–27. First content at x=14, last at x=1423. Toggle glyph centers sit ~30px apart; window-control glyph centers sit ~40px apart.

Reference top bar (linear-features.png): left lockup is a circular mark with a folded-plane glyph plus the word "Linear"; right cluster is the words Product, Resources, Customers, Pricing, Now, Contact, then a hairline, then "Log in" and a filled "Sign up" pill. One hairline under the whole bar. No session title, no window controls. Hero below reads "The system for modern product development" and "Linear streamlines work across the entire development cycle, from roadmap to release."

### PART C gap

Separate the identity lockup from the two status chips: shrink Wisped and Bypass from 21px tall (they match the 22px mark) to 16px, and move the pair 12px farther right of the wordmark (name ends at x=140, Wisped starts at x=158). Mark + "Claude Wrapper" should read as one unit; the pills as a trailing status group, not a second lockup.

### PART D

NONE


---

## Critic: Sidebar -> BAR WINS

Agent: `a32a3dc5bca8dea02`

### PART A literals

SURFACE CROP (.gauntlet/waves/core-after-docks/10/sidebar.png): 248 × 852 px, 32-bit ARGB. A single full-height column, no titlebar in this crop.

Blocks, top to bottom:
1. Head row: left-aligned label SESSIONS (uppercase, muted, slightly tracked). Right: four unlabeled icon buttons in a tight run — circular-arrow, a folder-shaped outline, a plus, a chevron pointing left.
2. Background-sessions block: label Background sessions with a small outlined pill Refresh on the same row. Two lines of copy under it: None running here / Scoped to the open project.
3. Search field, full column width, placeholder Filter sessions...
4. Two-segment control: This project (filled/selected) | All projects (unfilled).
5. One truncated path line: C:\Users\S.D\AppData\Local\Temp\inspect...
6. Session list — five rows. Each row is a wrapped title plus a relative-time line under it.
   - SELECTED (first): Why does the sessions rail go empty after I flip the backend... / 1h. This row is a rounded inset card with a mint left stripe.
   - Rewriting the tool card so a long Read result truncates instead o... / 3h
   - Add the queued send flag to the draft rather than a copy of it / 7h
   - Why does the Agents dock blank while it refreshes? / 2d
   - Window bounds are remembered but a close inside... / 5d
7. A large empty remainder (no more rows, no placeholder mark).
8. Hairline, then 12 sessions outside this project, then an outlined button Show all projects.

Counts: 4 head icons, 1 text Refresh, 1 filter field, 2 scope segments, 1 path line, 5 session rows (1 selected), 1 footer count, 1 footer button. Cannot make out the exact metaphor of the second head icon beyond “folder-shaped,” or the untruncated rest of the path / the three ellipsized titles.

WINDOW (.gauntlet/waves/core-after-docks/10/window-session.png): 1440 × 900 px. The rail is the left column under a full-width titlebar (~48 px), ~248 px wide, hairline on its right edge, running to the window bottom. Titlebar (not the piece, placement only): mint rounded-square mark, Claude Wrapper, Wisped, Bypass, centered inspect-ws, three right-slot toggles, min/max/close. Chat column fills the remaining width (user bubble matching the selected title, assistant reply, two tool cards, composer Message Claude..., footer Claude can make mistakes. Verify important information.). Rail footer sits roughly level with the composer’s Effort/Model row.

REFERENCE (.gauntlet/waves/core-after-docks/1/bar-half/linear-home-hero.png): 1680 × 1050 px, 24-bit RGB. Marketing page: Linear wordmark; Product / Resources / Customers / Pricing / Now / Contact / Log in / Sign up. Headline The product development system for teams and agents. Subline Purpose-built for planning and building products. Designed for the AI era. Link New Coding Sessions →. Below, a product screenshot whose left rail is one icon+label list (Inbox, My issues, Reviews, Pulse; Workspace: Initiatives, Projects, More; Favorites: Faster app launch selected, Agent tasks, UI Refresh, Agents Insights) beside issue Faster app launch.

### PART C gap

The five stacked bands above the first session (head, background-sessions empty, filter, scope tabs, filesystem path) eat ~240 px of the 852 px rail, so the list the column exists for occupies less than a third of it and then dies into a void. Collapse that preamble to the 44 px head plus one find/scope row so the first session starts by ~100 px.

### PART D

NONE


---

## Critic: Chat -> BAR WINS

Agent: `a95173df8b367e2cd`

### PART A literals

chat.png is 1192×721 px, RGBA. It is a dark reading column with no titlebar, no composer, no rail.

Verbatim text, top to bottom:
- "Why does the sessions rail go empty after I flip the backend pill?"
- "Flipping the pill discards the engine, and both list handlers read straight off that handle, so the menu asks a null engine and gets an empty array back. The list is not cached anywhere, which is deliberate: the answer genuinely differs between backends, so a cache would be wrong rather than merely stale."
- "Read" then "src/main/list-engine.ts"
- "export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {"
- "> SHOW INPUT"
- "> SHOW OUTPUT"
- "Rebuilding lazily at the two read handlers, rather than eagerly when the engine is discarded. Eager costs every user a rebuild on every pill click, including the one who never opens a menu."
- "Edit" then "src/main/index.ts"
- "The file src/main/index.ts has been updated."
- "> SHOW DIFF"
- "> SHOW INPUT"
- "Makes sense. Add a regression test for the rebuild path."
- "Added. It drives a flip, then reads both lists back and asserts neither is empty."

Counts: 2 right-aligned user bubbles; 2 solid mint-circle avatars; 2 assistant turns that open with an avatar; 1 continuation paragraph with no avatar; 2 rounded tool cards; 4 collapsed disclosure rows (2 per card); 1 thin scrollbar on the far right. No date divider, no timestamps, no list markers, no composer in this crop. Nothing in this crop is illegible.

Block positions: user bubble 1 sits top-right. Assistant turn 1 sits below it, avatar on the left, prose to the right spanning most of the column. The Read card sits under that prose, left-aligned with the text (inset from the avatar), stacked as label+path, one code line, then two full-width disclosure bars. Continuation prose sits on the same left edge as the first paragraph. The Edit card repeats that card stack (label+path, one status line, two disclosure bars). User bubble 2 sits lower-right. Assistant turn 2 sits at the bottom-left of the frame (avatar + one line). Empty column below that last line.

window-session.png is 1440×900 px, RGBA. Same transcript sits in the main column between a left sessions rail and the right window edge. The first user bubble starts just under the titlebar; the last assistant line sits well above a pill composer. The column is inset, not full-bleed; a thin scrollbar runs the column's right edge.

linear-changelog.png (reference) is 1680×1050 px, RGB. Whole page: Linear wordmark and nav (Product, Resources, Customers, Pricing, Now, Contact, Log in, Sign up); date "July 30, 2026" with a small dot; heading clipped at the top of the frame to "...oding sessions on mobile"; a large framed video still; three body paragraphs; a phone photograph at the bottom. Video chrome readable in part (5:46, Linear, Agent, Changes, 00:00, −00:20). Some phone-UI type at the bottom of the photo is too small to read in full.

### PART C gap

On every tool card, do not paint the two stacked empty disclosure bars (SHOW INPUT / SHOW OUTPUT, or SHOW DIFF / SHOW INPUT) in the default reading state — they add two full-width control rows of chrome and no content under each card. Keep one collapsed control, or show those rows only once expanded.

### PART D

NONE


---

## Critic: InputBar -> BAR WINS

Agent: `a7a43c92bc727c2e3`

### PART A literals

input-bar.png: 1192×132 px, RGBA.

Three stacked bands, top to bottom, on a dark ground:

1) Input pill (upper band, stadium/pill outline, inset from the crop’s left and right edges). Left inside: outline paperclip icon. Then placeholder: "Message Claude...". Right inside: filled circular send control containing an up-arrow.

2) Utility row (middle band), pinned to the pill’s two ends with empty space between:
   - Left cluster: label "Effort", a short horizontal slider (round thumb at the left end of a thin track; no numeric label, ticks, or scale visible), then a small rounded chip "Default".
   - Right cluster: label "Model", then a matching rounded chip "Default".

3) Footer line (bottom band, centered): "Claude can make mistakes. Verify important information."

Counts on this crop: 1 paperclip, 1 send circle, 1 slider (1 thumb, 1 track), 2 chips both reading "Default", 2 field labels, 1 placeholder, 1 disclaimer sentence. No other controls or text. Cannot make out a slider value or whether the placeholder ellipsis is U+2026 or three periods.

window-session.png: 1440×900 px, RGBA. Same composer pinned to the bottom of the chat column (right of a sessions rail, under the last assistant reply "Added. It drives a flip, then reads both lists back and asserts neither is empty."). Pill width matches the chat column, not the window. Utility row and disclaimer sit under that pill in the same left/right/center arrangement as the crop. Surrounding chrome, not this piece: titlebar (mint mark, "Claude Wrapper", "Wisped", "Bypass", "inspect-ws", three icon toggles, min/max/close); left rail headed "SESSIONS" with five session titles; transcript bubbles and two tool cards above the composer; a vertical scrollbar on the chat’s right edge.

linear-home-product.png: 1680×1050 px, RGB. Marketing page. Nav: Linear mark + "Linear"; links Product, Resources, Customers, Pricing, Now, Contact; "Log in"; pill "Sign up". Hero product shot contains a composer card: placeholder "Tell Linear what to do next..."; three small circular icon buttons clustered at that card’s bottom-right interior (cycle, paperclip, up-arrow send). No utility row and no disclaimer under that card. Below the hero: logo row Vercel, CURSOR, OSCAR, OpenAI, coinbase, Cash App, BOOM, ramp. Display headline: "A new species of product tool. Purpose-built for modern teams with AI workflows at its core, Linear sets a new standard for planning and building products." Figure labels FIG 0.2, FIG 0.3, FIG 0.4 along the bottom.

### PART C gap

Pull the Effort slider+chip and the Model chip into one left-aligned cluster under the pill, 12–16px apart, instead of justifying them to opposite ends and leaving a several-hundred-pixel empty span between two unequally structured control groups.

### PART D

NONE


---

## Whole-artifact smoothing pass

Agent: `a8c75bd85cac573d7` (first time)

### seams

SEAMS VISIBLE

### nullControl

12/12 wave-10 PNGs under D:\.claude\claude projects\playground\4\.gauntlet\waves\core-after-docks\10 are byte-identical to the matching files in D:\.claude\claude projects\playground\4\.gauntlet\waves\core-after-docks\9, and RGB differ is 0 on every file (welcome 1440x852, window-welcome 1440x900, welcome-min-window 640x432, titlebar 1440x48, sidebar 248x852, chat 1192x721, input-bar 1192x132, window-session 1440x900, window-session-short 1440x1017, agents-dock 248x852, commands-dock 248x852, appearance-dock 248x852). rgb_changed_total=0. Nonzero would have outranked every other claim; it did not occur.

### identityFloor

HOLDS. Worst chromatic-mint share is 3.99% on welcome-min-window.png (11043/276480). All twelve surfaces sit under the 10% ceiling (welcome 0.90, window-welcome 0.96, titlebar 2.08, sidebar 0.07, chat 0.14, input-bar 0.62, window-session 0.29, window-session-short 0.26, appearance-dock 0.27, agents-dock 0.00, commands-dock 0.00). Dominant family 178–183° holds 46479 px = 95.88% of chromatic mass (total 48476). Secondary families are 21–27° at 2.33% (1128 px, Bypass/danger) and three swatch families at 0.59–0.60% (70–73° 288, 130–134° 293, 240–243° 288). No second identity hue.

### typeScale

HOLDS. Declared rungs vs 15×1.15^k, verified in tokens.css (--text-micro 11, --text-ui 13, --text-body 15, --text-display 46) and subagent.css .subagent-drawer-close { font-size: 20px }: 11 vs 11.342 (k=-2, 0.342), 13 vs 13.043 (k=-1, 0.043), 15 vs 15.000 (k=0, 0.000), 20 vs 19.837 (k=2, 0.163), 46 vs 45.885 (k=8, 0.115). Max deviation 0.342 px against the 0.35 px tolerance; 0 off-ladder rungs. App-name ink in titlebar.png remains y18..30 (13 px, x45..141). Disclosure-label ink in chat.png remains 8 px high (y280..287).

### titlebarControl

Painted left intervals on titlebar.png are mark→name 9 px, name→pill1 16 px, pill1→pill2 4 px (sum 29 under the 33 px ceiling). Break ratio 16/9 = 1.78x, above the 1.63x threshold. Left group ends at x275 (+28 vs rail divider x247). Session-title ink x685..754, midpoint 720.00 against window centre 720.00 (0.00 px displacement). Mark is 22×22 at x14..35, y13..34. Pills paint 59×21 (x158..216) and 55×21 (x221..275).

### toolCardControl

chat.png card inners are 112 px (y213..326 outer 114) and 113 px (y431..545 outer 115). Body-to-row-1 / row-1-to-row-2 clearances are 9 / 6 in both cards (full band gaps 11/11/9/6/7 and 11/13/9/6/7). Exact resting ground in the four 540×17 row boxes is 34935 px (fill rgb(8,12,14) 30607 + outline rgb(25,29,31) 4328; other/AA 1785). Prose ink starts at x266; caret/label ink starts at x277 on all four rows (+11 px).

### groundVocabularySeam

Still two grammars. Rail filter: fill rgb(29,34,35) = var(--border), L=0.2473, +0.0823 OKLCH L over rail ground rgb(11,15,17) L=0.1650, r8 (left edge reaches x16 on 5 of 28 rows), placeholder ink flush at x16 (inset 0, x16..238 y116..143). Tool disclosures: fill rgb(8,12,14) = var(--well), L=0.1507, −0.0142 L plus outline rgb(25,29,31) L=0.2274 (+0.0625 L), r4, label +11. Command-row outline rgb(25,30,32) L=0.2308 is +0.0033 L from the tool outline and is the same target-weight hairline family, not a third grammar.

### pathTreatment

One cwd, two treatments. Titlebar basename “inspect-ws” inks x685..754 (70 px, y18..32). Rail heading inks x16..228 (213 px, y186..197, 859 px) inside the 216 px content box (98.6%) under rtl/plaintext head truncation. Driver preservation of the full path remains sound; the semantic-role split is unchanged and owner-shaped.

### dateDividerControl

window-session-short.png: label ink x823..862, midpoint 843.00 vs column/gap centre 844.00 = 1.00 px tracking debt. Rule segments 348 / 348 (0 px asymmetry), gap 64 px centred at 844.00. Ink clearance 45 px above and 45 px below (block y93..100; next ink y146). Authored 40 px is the y88..105 line box (y48..87 and y106..145); 5 px internal half-leading on each side makes 45. Not a spec break.

### jogControl

Short frame (window-session-short.png, scrollbar absent): transcript x464..1223 vs composer x459..1218 = −5 px on both edges. Overflowing frame (window-session.png, scrollbar x1433..1436): both x459..1218 = 0.00 px. Real, conditional on the gutter, owner-shaped.

### markControl

Every identity mark is byte-identical to wave 9: titlebar 0/484, welcome 0/1936, welcome-min-window entire 0/276480, chat avatar1 0/784, chat avatar2 0/784. Painted sizes unchanged: titlebar 22×22 (436 mint px, x14..35 y13..34), welcome 44×44 (1764, x513..556 y242..285), chat avatars 28×28 (612 each, x211..238 at y103..130 and y660..687). window-welcome repeats the same 22×22 titlebar mark and 44×44 hero mark.

### findings

1. Null control holds: 12/12 captures byte-identical to wave 9 and 0 RGB pixels changed (measured on D:\.claude\claude projects\playground\4\.gauntlet\waves\core-after-docks\10 vs \9). The artifact did not move. This is the second consecutive zero-pixel wave.
2. Quiet-control vocabulary seam is still measurable on the same pixels: rail filter +0.0823 L / var(--border) / r8 / flush x16 vs tool rows −0.0142 L fill +0.0625 L outline / r4 / label x277 (+11). Both paint; they do not share one operability grammar.
3. Cwd presentation seam is still measurable: titlebar basename ink 70 px (x685..754) vs rail full-path ink 213/216 px (98.6%) with head truncation. One value, two roles.

### notFindings

1. Titlebar break remains above threshold: 16/9 = 1.78x > 1.63x; intervals 9/16/4; group edge x275; interval sum 29 px under the 33 px ceiling.
2. Session-title midpoint remains 720.00 with 0.00 px displacement; mark remains 14 px inset and 22×22.
3. Tool-card inners remain 112/113 with 9/6 disclosure clearances and 34935 px exact fill-or-border ground (30607 fill + 4328 outline). Label inset remains +11 px on all four rows. These are settled, not new.
4. Date-divider 45/45 ink clearance is 40 px box + 5 px half-leading; rule symmetry 348/348, 0 px segment asymmetry; only the known 1.00 px tracking debt remains (label mid 843.00 vs 844.00).
5. Short-frame −5 px jog is unchanged and scrollbar-conditional; overflowing frame is 0.00 px (scrollbar x1433..1436).
6. Identity floor holds: worst mint 3.99% (11043/276480), dominant 178–183° family 95.88% of chromatic mass (46479/48476). Type ladder max deviation remains 0.342 px within 0.35 px. Source rungs still 11/13/15/20/46.
7. Marks did not move: 0 differing box pixels vs wave 9 at titlebar, welcome, both chat avatars, and the whole welcome-min-window capture.
8. Dock-row outline split is not a new seam. commands-dock.png has 7 resting tint-2 shells (heights 65/65/65/65/64/49/49, inter-row gap 6 px, outline rgb(25,30,32) L=0.2308, name ink x17). appearance-dock.png theme/backdrop options use the same outline colour and x17 inset at 4 px gaps (31/31/31/71). agents-dock.png and sidebar.png have 0 rgb(25,30,32) components ≥10 px; they paint state instead (session selected wash rgb(28,39,39) L=0.2624, 13060 px, plus 144 mint stripe px in x0..20). rails.css already names this as target-weight hairline for a stateless picker vs state fill for lists that keep a selection. Zoom remains a third silhouette by authorship (38 px head, stepper fill rgb(73,79,80)), not drift.
9. Selected-row wash is shared, not split: appearance Frost exact rgb(28,39,39) = session selected wash (6201 px vs 13060 px). Close marks on commands-dock.png and appearance-dock.png are 0/144 different in the 12×12 box x220..231 y16..27. All four rail/dock heads cut their first full hairline at y43.
10. Welcome stack centring remains +0.50 px (content x513..927, mid 720.50 vs 720.00). Composer Default chips (37×15 at x333..369 and x923..959) vs titlebar pills (59×21 and 55×21) are different control classes, not a new cross-surface contract. Filter flush-start (placeholder x16) is the already-recorded half of the quiet-control seam. Titlebar/rail/dock chrome ground is one colour (rgb(11,15,17) L=0.1650); chat/composer workspace ground is the other authored plane (rgb(3,6,6) L=0.1167) — not a new seam.
11. window-session-short.png (1440×1017, withheld from critics) reproduces the same divider, jog, and identity numbers as wave 9. Overlap with window-session.png differs by 379064 RGB px in the shared 1440×900 because the short frame has no scrollbar and inserts the date divider; that is the known short-frame contract, not a twelfth-capture-only seam.

### newPieceProposal

NONE. Wave 10 is a second consecutive zero-pixel wave (12/12 byte-identical to wave 9, 0 RGB changed). The two independently measurable cross-surface seams that remain — quiet-control ground (filter +0.0823 L / r8 / flush vs tool −0.0142 L + outline / r4 / +11) and cwd presentation (70 px basename vs 213/216 px full path) — are the same settled/owner-shaped axes waves 8 and 9 already filed. Dock outline presence vs absence is the authored stateless/stateful row contract, not a new piece. A stationary artifact does not mint speculative work.
