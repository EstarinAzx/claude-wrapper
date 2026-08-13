# Wave 7 critic + smoothing reports

All six judging agents returned first time.


---

## Critic: Welcome -> BAR WINS

### PART A literals

PART A — LITERALS

1. `welcome.png`: 1440 × 852 px. Readable text, verbatim: “Start a session”; “Claude reads and edits the files in the folder you open,”; “and it keeps working there until you switch to another.”; “Pick a project folder”. The only content is one left-aligned stack centered horizontally in the upper-middle of the surface: one rounded-square identity mark at about x=513, y=242; one large headline below it; one supporting paragraph split across 2 lines; and one pill-shaped action below the paragraph. Counts: 1 mark, 1 headline, 1 two-line paragraph, 1 action button.

2. `window-welcome.png`: 1440 × 900 px. Readable titlebar text, verbatim: “Claude Wrapper”; “Wisped”; “Bypass”; “New session”. The body repeats, verbatim: “Start a session”; “Claude reads and edits the files in the folder you open,”; “and it keeps working there until you switch to another.”; “Pick a project folder”. A 48 px titlebar spans the top. Its left group contains a small rounded-square mark, the app name, and 2 compact badges; “New session” is centered; 3 window-control glyphs sit at the far right. Below the titlebar, the welcome stack begins at about x=513, y=290 and is centered as an approximately 414 px-wide block while its contents remain left-aligned. Counts within the whole window: 2 rounded-square marks, 2 badges, 1 centered session title, 3 window controls, 1 welcome headline, 1 two-line supporting paragraph, 1 action button.

3. `linear-method.png`: 1680 × 1050 px. Readable text, verbatim: “Linear”; “Product”; “Resources”; “Customers”; “Pricing”; “Now”; “Contact”; “Log in”; “Sign up”; “THE LINEAR METHOD”; “Practices”; “for building”; “There is a lost art of building true quality software.”; “To bring back the right focus, here are the”; “foundational ideas Linear is built on.” A full-width header occupies the top, with the Linear mark and wordmark at left and 7 plain navigation links plus 1 “Sign up” button across the right; a vertical separator sits between “Contact” and “Log in”, and a horizontal hairline closes the header. The hero is centered: 1 eyebrow line above a very large 2-line headline, followed by a centered paragraph split across 3 lines. The lower portion contains 2 large overlapping outlined circles, both clipped by the bottom edge; their overlap is crosshatched, and the upper-right arc of the right circle is brighter than the remaining outlines.

### PART C gap

The 44 × 44 hero mark is the least resolved element: beside the strongly set 46 px headline it reads as a flat placeholder rather than an intentional anchor. Keep it solid and glyph-free, but add restrained non-glyph depth, such as a 1 px inset edge highlight and a tight 6–8 px shadow, so the welcome stack begins with an authored identity element.

### PART D

NONE


---

## Critic: Sidebar -> BAR WINS

### PART A literals

PART A — LITERALS

1. `D:\.claude\claude projects\playground\4\.gauntlet\waves\core-after-docks\7\sidebar.png` is 248 × 856 px. It shows a single 248 px-wide rail. At the top is a 44 px header with `SESSIONS` at left and four icon-only controls at right: a circular arrow, a folder, a plus, and a left-pointing chevron. Below it, the readable text from top to bottom is: `Background sessions`; `Refresh`; `None running here`; `Scoped to the open project.`; `Filter sessions...`; `This project`; `All projects`; `C:\Users\S.D\AppData\Local\Temp\inspect...`; `Why does the sessions rail go empty after I flip the backend...`; `1h`; `Rewriting the tool card so a long Read result truncates instead o...`; `3h`; `Add the queued send flag to the draft rather than a copy of it`; `7h`; `Why does the Agents dock blank while it refreshes?`; `2d`; `Window bounds are remembered but a close inside...`; `5d`; `12 sessions outside this project`; `Show all projects`. There is one background-session status block with one action button, one search field, two scope tabs, one truncated path line, five visible session rows, and five age labels. The first session row is selected and occupies a rounded rectangular block with a narrow left edge marker; the other four rows have no enclosing fill visible. The list occupies the upper-middle of the rail, followed by a large unused vertical area. A divider separates the bottom-anchored footer, whose count sits above its button.

2. `D:\.claude\claude projects\playground\4\.gauntlet\waves\core-after-docks\7\window-session.png` is 1438 × 906 px. A 48 px titlebar spans the top. At left it contains a solid rounded-square mark, `Claude Wrapper`, `Wisped`, and `Bypass`; `inspect-ws` is centered; the right side contains three icon-only panel controls, a separator, and minimize, maximize, and close controls. The same 248 px sessions rail occupies the full left side below the titlebar. The main transcript is centered in the remaining width, with a narrow scrollbar near the right edge, a composer near the bottom, control metadata beneath it, and a centered disclaimer at the bottom. In the transcript I can read the clipped tail `pill?`; `Flipping the pill discards the engine, and both list handlers read straight off that handle, so the menu asks a null engine and gets an empty array back. The list is not cached anywhere, which is deliberate: the answer genuinely differs between backends, so a cache would be wrong rather than merely stale.`; `Read`; `src/main/list-engine.ts`; `export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {`; `SHOW INPUT`; `SHOW OUTPUT`; `Rebuilding lazily at the two read handlers, rather than eagerly when the engine is discarded. Eager costs every user a rebuild on every pill click, including the one who never opens a menu.`; `Edit`; `src/main/index.ts`; `The file src/main/index.ts has been updated.`; `SHOW DIFF`; `SHOW INPUT`; `Makes sense. Add a regression test for the rebuild path.`; `Added. It drives a flip, then reads both lists back and asserts neither is empty.`; `Message Claude...`; `Effort`; `Default`; `Model`; `Default`; `Claude can make mistakes. Verify important information.` Two assistant avatar circles, two tool cards, one fully visible user bubble, and the bottom edge of one earlier user bubble are visible. The sessions rail repeats the same five rows and footer text listed for image 1.

3. `D:\.claude\claude projects\playground\4\.gauntlet\waves\core-after-docks\1\bar-half\linear-home-hero.png` is 1680 × 1050 px. A full-width header sits at the top; a large two-line hero occupies the left half of the upper-middle; a small linked callout sits to its right; and a large product mockup begins below them and extends past the bottom edge. The readable header and hero text is: `Linear`; `Product`; `Resources`; `Customers`; `Pricing`; `Now`; `Contact`; `Log in`; `Sign up`; `The product development system for teams and agents`; `Purpose-built for planning and building products. Designed for the AI era.`; `New`; `Coding Sessions →`. In the product mockup I can read: `Linear`; `Inbox`; `My issues`; `Reviews`; `Pulse`; `Workspace`; `Initiatives`; `Projects`; `More`; `Favorites`; `Faster app launch`; `Agent tasks`; `UI Refresh`; `Agents Insights`; another `Faster app launch`; `02 / 145`; `ENG-2703`; another `Faster app launch`; `Render UI before vehicle_state sync when minimum required state is present, instead of blocking on full refresh during iOS startup.`; `Activity`; `In Progress`; `High`; `jori`; `Linear`; `Linear created the issue via Slack on behalf of karri · 2min ago`; `Triage Intelligence added the label Performance and iOS · 2min ago`; `karri · 4 min ago`; `Right now we show a spinner forever, which makes it look like the card disappeared...`; `jori · just now`; `@Linear can you take a stab at this?`; `Linear`; `Opus 5`; `jori connected Linear to ENG-2703`; `Examining the startup path...`; `Thinking...`. At the bottom edge, a further line is only partly visible; I can read `Linear connected by jori · 2 min ago`. The mockup contains one left navigation rail with eleven labeled navigation/favorite rows, one central issue-detail pane, one right metadata pane, and one floating agent panel.

### PART C gap

PART C — THE SINGLE BIGGEST REMAINING GAP

The scope line is a raw Windows path clipped to `C:\Users\S.D\AppData\Local\Temp\inspect...`, so it reads like unfinished diagnostic output and still fails to identify the project. Replace it with the project basename in the existing 11 px metadata style, keep that scope row to roughly 24 px high, and expose the full path only on hover or focus.

### PART D

NONE


---

## Critic: InputBar -> TOO CLOSE

### PART A literals

PART A — LITERALS

1. `input-bar.png`: 1192 × 132 px. Readable text, verbatim: “Message Claude…”, “Effort”, “Default”, “Model”, “Default”, and “Claude can make mistakes. Verify important information.” One 760 px-wide rounded input pill occupies approximately x=210–971, y=13–62. It contains one paperclip glyph at the left, the placeholder immediately to its right, and one 36 px circular send control with an “↑” glyph at the right. A utility row sits directly below: one Effort group at the left with a horizontal track, one circular slider thumb, and one “Default” chip; one Model group at the right with a second “Default” chip. The disclaimer is centered on the bottom line. Counts: 1 composer pill, 1 attachment glyph, 1 send button, 2 utility groups, 2 “Default” chips, 1 slider, and 1 disclaimer.

2. `window-session.png`: 1437 × 906 px. Readable titlebar text: “Claude Wrapper”, “Wisped”, “Bypass”, and “inspect-ws”. The titlebar runs across y=0–48; its left identity group is at the far left, the session title is centered, and the right side contains 3 panel-toggle glyphs, a separator, and 3 window-control glyphs.

Readable Sessions-rail text, top to bottom: “SESSIONS”; “Background sessions”; “Refresh”; “None running here”; “Scoped to the open project.”; “Filter sessions…”; “This project”; “All projects”; “C:\Users\S.D\AppData\Local\Temp\inspect…”; “Why does the sessions rail go” / “empty after I flip the backend…” / “1h”; “Rewriting the tool card so a long” / “Read result truncates instead o…” / “3h”; “Add the queued send flag to the” / “draft rather than a copy of it” / “7h”; “Why does the Agents dock” / “blank while it refreshes?” / “2d”; “Window bounds are” / “remembered but a close inside…” / “5d”; “12 sessions outside this project”; and “Show all projects”. The rail occupies x=0–247 below the titlebar. It contains 4 header icon buttons, 2 scope tabs, 5 visible session rows with the first selected, and 1 bottom action.

Readable chat text, top to bottom: a clipped user bubble showing only “pill?”; “Flipping the pill discards the engine, and both list handlers read straight off that handle, so the menu asks a null engine and gets an empty array back. The list is not cached anywhere, which is deliberate: the answer genuinely differs between backends, so a cache would be wrong rather than merely stale.”; “Read”; “src/main/list-engine.ts”; “export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {”; “› SHOW INPUT”; “› SHOW OUTPUT”; “Rebuilding lazily at the two read handlers, rather than eagerly when the engine is discarded. Eager costs every user a rebuild on every pill click, including the one who never opens a menu.”; “Edit”; “src/main/index.ts”; “The file src/main/index.ts has been updated.”; “› SHOW DIFF”; “› SHOW INPUT”; “Makes sense. Add a regression test for the rebuild path.”; and “Added. It drives a flip, then reads both lists back and asserts neither is empty.” The transcript is in a centered column approximately x=459–1219. Counts: 2 visible user bubbles, one clipped; 2 assistant avatar circles; 2 tool cards; and 1 scrollbar at the far right.

The same composer appears at the bottom of that chat column at approximately x=459–1219, y=780–830. Its readable text is “Message Claude…”, “Effort”, “Default”, “Model”, “Default”, and “Claude can make mistakes. Verify important information.” The utility row is immediately beneath the pill and the disclaimer is centered below it.

3. `linear-home-product.png`: 1680 × 1050 px. Readable header text: “Linear”, “Product”, “Resources”, “Customers”, “Pricing”, “Now”, “Contact”, “Log in”, and “Sign up”. A full-width navigation bar occupies y=0–72, with the Linear mark at the left and the navigation/action run at the right.

Readable text in the partially shown product mockup: “Agents Insights” (partially clipped at the top); “@Linear can you take a stab at this?”; “Linear connected by jori · 2 min ago”; “Changed 2 files Draft PR awaiting your review · 2 min ago”; “Linear moved from Todo to In Progress · just now”; and “Tell Linear what to do next…”. The mockup fills the upper portion of the page. It shows 1 activity card containing 2 rows, 1 separate status row, and 1 compact composer at the lower right with 3 trailing icon controls.

A single horizontal brand row across the middle contains 8 readable marks: “Vercel”, “CURSOR”, “oscar”, “OpenAI”, “coinbase”, “Cash App”, “BOOM”, and “ramp”. Below it is one large three-line statement: “A new species of product tool. Purpose-built for modern teams with AI workflows at its core, Linear sets a new standard for planning and building products.” Along the bottom are 3 labels: “FIG 0.2”, “FIG 0.3”, and “FIG 0.4”.

### PART C gap

The utility row loses cohesion by pinning Effort and Model to opposite edges of the 760 px column, leaving roughly 490 px of empty span between related controls. Place the two groups in one compact right-aligned row with about 24 px between them directly beneath the pill, while keeping the disclaimer centered on its own line.

### PART D

NONE


---

## Critic: Chat -> BAR WINS

### PART A literals

PART A — LITERALS

1. `.gauntlet/waves/core-after-docks/7/chat.png` is 1192 × 721 px. The transcript column occupies the center, with assistant avatars at the left edge of the column, assistant prose and tool cards beside them, and user bubbles aligned to the right. A scrollbar sits on the far-right edge. There are 2 visible assistant avatar circles, 2 tool cards, 4 collapsed disclosure rows, 3 assistant prose blocks, and 2 user bubbles, one of which is clipped by the top edge.

Readable text, top to bottom:
- `pill?` (only the lower portion of this user bubble is visible)
- `Flipping the pill discards the engine, and both list handlers read straight off that handle, so the menu asks a null engine and gets an empty array back. The list is not cached anywhere, which is deliberate: the answer genuinely differs between backends, so a cache would be wrong rather than merely stale.`
- `Read  src/main/list-engine.ts`
- `export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {`
- `SHOW INPUT`
- `SHOW OUTPUT`
- `Rebuilding lazily at the two read handlers, rather than eagerly when the engine is discarded. Eager costs every user a rebuild on every pill click, including the one who never opens a menu.`
- `Edit  src/main/index.ts`
- `The file src/main/index.ts has been updated.`
- `SHOW DIFF`
- `SHOW INPUT`
- `Makes sense. Add a regression test for the rebuild path.`
- `Added. It drives a flip, then reads both lists back and asserts neither is empty.`

2. `.gauntlet/waves/core-after-docks/7/window-session.png` is 1440 × 900 px. A 48 px titlebar spans the top. A sessions rail about 248 px wide runs down the left. The remaining workspace contains the centered transcript column, approximately x=458–1220, with the composer directly beneath it and a centered footer below. A vertical scrollbar is at the workspace’s far-right edge. The titlebar contains 1 identity mark, 2 status pills, 3 glyph-only panel toggles, and 3 window controls. The rail contains 5 visible session rows, 1 selected row, 1 filter field, and 2 project tabs. The chat repeats the crop’s 2 assistant avatars, 2 tool cards, 4 disclosure rows, and 2 user bubbles, with the upper bubble clipped.

Additional readable window text:
- `Claude Wrapper`
- `Wisped`
- `Bypass`
- `inspect-ws`
- `SESSIONS`
- `Background sessions`
- `Refresh`
- `None running here`
- `Scoped to the open project.`
- `Filter sessions...`
- `This project`
- `All projects`
- `C:\Users\S.D\AppData\Local\Temp\inspect...`
- `Why does the sessions rail go empty after I flip the backend...`
- `1h`
- `Rewriting the tool card so a long Read result truncates instead o...`
- `3h`
- `Add the queued send flag to the draft rather than a copy of it`
- `7h`
- `Why does the Agents dock blank while it refreshes?`
- `2d`
- `Window bounds are remembered but a close inside...`
- `5d`
- `12 sessions outside this project`
- `Show all projects`
- `Message Claude...`
- `Effort`
- `Default`
- `Model`
- `Default`
- `Claude can make mistakes. Verify important information.`

The transcript text itself is the same text transcribed for image 1.

3. `.gauntlet/waves/core-after-docks/1/bar-half/linear-changelog.png` is 1680 × 1050 px. A horizontal navigation header spans the top. A dated timeline sits near the left at about x=209–224. The main reading column is centered at about x=528–1151: a partially occluded headline at the top, one video panel below it, 3 prose paragraphs, then the upper portion of a phone image entering from the bottom. There are 8 text navigation actions, 1 timeline marker, 1 video panel, 3 body paragraphs, and 1 partially visible phone image.

Readable text:
- `Linear`
- `Product`
- `Resources`
- `Customers`
- `Pricing`
- `Now`
- `Contact`
- `Log in`
- `Sign up`
- `Coding sessions on mobile` (the upper part of this heading is hidden behind the top header, but the wording is still readable)
- `July 30, 2026`
- Within the video image: `5:46`, `Linear`, `Agent`, `Changes`, `375`, and `376`; a longer identifier beginning with `AgentSessionActivity` is too blurred to transcribe fully.
- Video controls: `00:00` and `-00:20`
- `Your coding session doesn’t have to stop when you leave your desk. Use the Linear mobile app to review code changes, comment on specific lines, and iterate with Linear Agent.`
- `Open any diff and switch to the Changes tab to inspect the code. When you spot something to change, tap the relevant line to add it to your message to steer the coding session in the direction you want.`
- `We’ve also added section under My Issues → Assigned for your delegated issues. It shows the status of each coding session, and gives you a quick way back into active work.`
- On the partially visible phone: `9:41`, `My issues`, `Assigned`, `Created`, and `Subscribed`. Other phone-screen text is cut off or too small to read honestly.

### PART C gap

The two tool cards are the weakest hierarchy: each secondary, collapsed artifact occupies about 136 px of height, so the cards outweigh the surrounding prose without presenting a focal detail. Compress each to roughly 110–115 px by tightening only the vertical gaps between its header, summary, and disclosure rows, while retaining the existing type sizes and alignment.

### PART D

NONE


---

## Critic: Titlebar -> BAR WINS

### PART A literals

PART A — LITERALS

1. `titlebar.png` is 1440 × 48 px. A single 48px strip spans the full width, with a thin bottom hairline. At the far left, from approximately x=14 to x=272, are one 22px rounded-square identity mark, `Claude Wrapper`, and two pills labeled `Wisped` and `Bypass`. `inspect-ws` is centered in the strip. At the far right, approximately x=1207 to x=1439, are three panel-toggle glyphs (a slash, a branch/share-like glyph, and a split-circle glyph), one vertical separator, then three window controls (minimize, maximize, close). Counts: 1 identity mark, 1 app name, 2 status pills, 1 centered session title, 3 panel toggles, 1 separator, and 3 window controls. No other text is visible.

2. `window-session.png` is 1440 × 900 px. The same titlebar occupies y=0–47. A Sessions rail occupies x=0–247 below it; the transcript/composer occupies x=248–1439, with the main conversation column roughly x=459–1220 and a scrollbar at the far right. The rail shows 5 session rows. The transcript shows 2 assistant avatars, 2 tool cards, 2 user bubbles (the upper one is clipped by the top edge), 1 composer, and 1 vertical scrollbar.

Readable titlebar text: `Claude Wrapper`; `Wisped`; `Bypass`; `inspect-ws`.

Readable rail text, top to bottom: `SESSIONS`; `Background sessions`; `Refresh`; `None running here`; `Scoped to the open project.`; `Filter sessions...`; `This project`; `All projects`; `C:\Users\S.D\AppData\Local\Temp\inspect...`; `Why does the sessions rail go empty after I flip the backend...`; `1h`; `Rewriting the tool card so a long Read result truncates instead o...`; `3h`; `Add the queued send flag to the draft rather than a copy of it`; `7h`; `Why does the Agents dock blank while it refreshes?`; `2d`; `Window bounds are remembered but a close inside...`; `5d`; `12 sessions outside this project`; `Show all projects`.

Readable transcript/composer text, top to bottom: the clipped upper user bubble exposes only `pill?`; `Flipping the pill discards the engine, and both list handlers read straight off that handle, so the menu asks a null engine and gets an empty array back. The list is not cached anywhere, which is deliberate: the answer genuinely differs between backends, so a cache would be wrong rather than merely stale.`; `Read`; `src/main/list-engine.ts`; `export const ensureListEngine = async (ports: ListEnginePorts): Promise<Engine> => {`; `SHOW INPUT`; `SHOW OUTPUT`; `Rebuilding lazily at the two read handlers, rather than eagerly when the engine is discarded. Eager costs every user a rebuild on every pill click, including the one who never opens a menu.`; `Edit`; `src/main/index.ts`; `The file src/main/index.ts has been updated.`; `SHOW DIFF`; `SHOW INPUT`; `Makes sense. Add a regression test for the rebuild path.`; `Added. It drives a flip, then reads both lists back and asserts neither is empty.`; `Message Claude...`; `Effort`; `Default`; `Model`; `Default`; `Claude can make mistakes. Verify important information.` A paperclip glyph and an upward-arrow send glyph are also visible.

3. `linear-features.png` is 1680 × 1050 px. A navigation strip spans the top, with the `Linear` mark/name near the upper left, six central/right navigation links, and two account actions at the upper right. A centered two-line hero occupies roughly y=128–328. Below a large open interval, a centered feature-card stack begins around y=462; one card is fully visible and a second is cut off by the bottom edge. Counts: 1 brand lockup, 8 navigation/account actions, 1 hero heading, 1 supporting paragraph, 2 visible feature cards (1 complete, 1 partial), and 1 circular arrow control in the complete card.

Readable reference text: `Linear`; `Product`; `Resources`; `Customers`; `Pricing`; `Now`; `Contact`; `Log in`; `Sign up`; `The system for modern product development`; `Linear streamlines work across the entire development cycle, from roadmap to release.`; `Planning`; `Set the product direction with projects and initiatives`. At the lower edge, `Building` is only partially visible. The very faint microcopy embedded in the upper card graphic cannot be read reliably.

### PART C gap

The left side lacks a clean boundary between identity and state: the 22px mark, `Claude Wrapper`, and both status pills form one nearly continuous four-element run. Add about 16px between the app name and the pill pair, then treat the two pills as one compact state group; this would give the brand block the compositional clarity that Linear’s lockup has without changing the mark or the titlebar’s three-zone layout.

### PART D

NONE


---

## SMOOTHING PASS


### seams

SEAMS VISIBLE

### identityFloor

HOLDS. ONE mint hue family: OKLCH 178..183 deg carrying 95.88% of all chromatic mass app-wide (46,479 px of 48,476), centre 180 deg, in both waves. The other four families are content rather than chrome and all sit in appearance-dock.png's theme swatches plus the tool-card error red: 21..27 deg 2.33%, 70..73 deg 0.59%, 130..134 deg 0.60%, 240..243 deg 0.59%. Worst-case surface share: welcome-min-window.png at 3.99% (11,043 of 276,480), unchanged from wave 6, against the 10% ceiling. Mark sites unchanged: titlebar logo-mark hue spread 1.90 deg over 436 chromatic px, welcome-mark 3.08 over 1,764, chat avatar 3.11 over 612.

THE SPECIFIC WORRY IS ANSWERED AND ANSWERED NEGATIVELY. The brief flagged that a filter control gaining a resting ground is the class of change that moves a mint share. It did not: sidebar.png's mint is 144 px = 0.07% in BOTH waves, to the pixel, despite 6,171 px of new fill. The reason is measurable rather than lucky — the new ground is rgb(29,34,35), OKLCH chroma 0.0074, below the 0.05 chromatic threshold. The fill is achromatic, so it cannot touch a floor counted by hue. Titlebar mint moved 1,411 to 1,441 px (2.04% to 2.08%), which is the two accent pills translating 6px right and re-antialiasing, not a new site.

### typeScale

HOLDS, and unchanged — no font-size declaration was touched by any of the three builds. Declared rungs against 15 * 1.15^k: --text-micro 11 vs 11.342 (k=-2, dev 0.342), --text-ui 13 vs 13.043 (k=-1, dev 0.043), --text-body 15 vs 15.000 (k=0, dev 0.000), subagent.css literal 20 vs 19.837 (k=2, dev 0.163), --text-display 46 vs 45.885 (k=8, dev 0.115). MAX DEVIATION 0.342px against the 0.35 tolerance; zero off-ladder rungs. Identical to wave 6.

Confirmed from pixels rather than from the stylesheet, on all three changed elements: app-name ink height 13px and width 97px in both waves (it only translated x40..136 to x45..141, exactly the new 5px margin); disclosure-label ink 8px tall and 84px wide, x266..349 in both waves; filter placeholder ink x16..103, width 88px in both waves. Instrument caveat, mine: the placeholder's ink HEIGHT reads 11px at wave 6 and 20px at wave 7, which is not a size change — the new field's 8px corner arcs at x16 are antialiased into rows y121..123 and y138..140 and my non-ground test counts them. The width is the uncontaminated number and it is identical.

The unresolved role conflict (a UI label sitting on the prose rung) is untouched this wave and remains the owner's.

### chatResult

chat.png MOVED, for the first time since wave 4. The headline lands.

sha256 (first 16): w1 427c1fcded96d557 | w2=w3 00ac616eaa382cc4 | w4=w5=w6 3fccbdc4147bab5b | w7 63ad1ff9ba430a2a. That is a FOURTH distinct value in seven waves, and the wave-4/5/6 plateau — the three bytes over which the Chat critic returned TOO CLOSE, BAR WINS, TOO CLOSE — is broken.

Against wave 6: 129,167 changed pixels in 210 connected components, on a 1192x721 frame (15.0% of the surface). The four largest: 31,377 px at x251..820 y164..232; 30,019 px at x502..970 y0..84; 18,407 px at x251..820 y293..341; 15,842 px at x251..820 y405..446.

WHERE THE CHANGE SITS: entirely in the upper five sevenths. Changed rows span y0..y531. Changed pixels strictly below y545: ZERO. The second tool card's bottom border sits at y545 in BOTH waves, and both cards grew upward — card 1 y221..330 to y169..304, card 2 y435..545 to y409..545. The chat viewport is bottom-anchored, so 52px of new content height was absorbed by scrolling everything above the cards up, and the 210 components are that translation re-rendered, not 210 independent edits. Proof it is pure translation: the chat avatar at x211..238 y111..138 differs by 660 px compared in place, and by ZERO px compared at dy=-52. This is exactly the innocent-shift trap the brief warned about, and it is confirmed innocent — nothing below the cards moved by a pixel.

### toolCardCost

HEIGHTS. Inner heights (border row to border row, exclusive) went 108 -> 134 and 109 -> 135, i.e. +26px each, +24.1% and +23.9%. Outer boxes 110 -> 136 and 111 -> 137. WIDTH UNCHANGED at 568: the top and bottom border runs measure 548 and 549 px in both waves (the 12px radius eats ~10px per end), identical values.

DISCLOSURE ROWS: TWO per card, four in the frame. Confirmed by ink bands — card 1 carries a header band, a body band, then two 8px micro-caps label bands. Row pitch went 21px to 34px (28px min-height + 4px gap + 2px margin-top), so the natural row was 15px and each row gained exactly 13px. 2 rows x 13px x 2 cards = 52px, which is the whole growth. Zero remainder.

WHAT MOVED BELOW: nothing, in either frame, and the two frames disagree in the right direction. chat.png is bottom-anchored: card bottoms pinned (y545 both waves), 0 changed px below y545. window-session-short.png is top-anchored: card TOPS pinned (y354 both waves), 0 changed px in y201..353, and everything below translated +52 — card 1 bottom 463->489, card 2 594..730, composer pill 889..938 -> 941..990, page 1009 -> 1061. Two opposite anchors, one content-height change, no spacing rule moved.

WHAT IT COSTS THE COMPOSITION, which is what the Chat critic grades:
(1) align-self: stretch painted NOTHING. The label ink is x266..349 in both waves, same width, and the toggle keeps background: transparent and border: 0. The full-width row is invisible at rest; 100% of the visible change is negative space.
(2) The disclosure pair's grouping INVERTED. Clear between the card body and row 1, and between row 1 and row 2, was 13px / 13px (ratio 1.00x) at wave 6. It is now 20px / 26px on card 1 (1.30x) and 19px / 26px on card 2 (1.37x). The two rows are now further from each other than the first is from the content above, so they no longer read as a pair. titlebar.css records 1.30x as "far too weak to break the run" — this is that ratio, applied in reverse.
(3) The quiet rows now occupy 41.8% and 41.5% of card inner height, up from 27.8% and 27.5%.

### titlebarIntervals

Column clearance between painted extents, threshold-invariant from thr 1 through 24 (only at thr 48 does one interval shift by 1px):

interval          w5    w6    w7    declared w7
mark -> name       7     4     9     9   (gap 4 + new margin-left 5)
name -> pill 1    15    12    13    14.5 (gap 4 + margin 9 -> 10.5)
pill 1 -> pill 2   7     4     4     4   (gap 4, untouched)

Item boxes w7: mark x14..35, name x45..141, pill1 x155..213, pill2 x218..272. Declared sum 27.5px, painted sum 26px — both inside the 33px budget.

INSTRUMENT CORRECTION, MINE AND THE BRIEF'S. The brief carries "roughly 3 / 15 / 8.4" for wave 6. My instrument reads wave 6 as 4 / 12 / 4 and I can account for all three of the brief's numbers as a mix of sources rather than one measurement: the 3 is titlebar.css's own prose about the flat tick, not a pixel reading; the 15 is WAVE 5's name->pill1 clearance, not wave 6's; and the 8.4 is the analytic mean for the capped channel, 4 + 2r(1 - pi/4) with r ~ 10.15 = 8.36. My measured per-row mean over the pills' 21 rows is 7.19px, lower than 8.36 because antialiasing extends the cap past its geometric edge at my threshold. The optical claim is sound; the row of numbers was not a single wave's.

DOES IT NOW READ AS ONE RHYTHM WITH ONE DELIBERATE BREAK? No — it reads as three uneven intervals with no grouping. The file's structure is [mark name] BREAK [pill pill], and the break's ratio to the wider inside interval collapsed from 12/4 = 3.00x to 13/9 = 1.44x painted (14.5/9 = 1.61x declared). titlebar.css records its own thresholds: 1.3x is "far too weak to break the run", 1.63x is "enough". The retune put the group's break BELOW the ratio its own stylesheet accepts and just above the one it rejects. The tick got the air the critic asked for; the lockup it was protecting stopped reading as a lockup.

GROUP RIGHT EDGE: x272 (w6 x266, w5 x275). Overrun past the rail divider column x247 went +19 -> +25px, giving back 6 of the 9px wave 6 bought. The divider itself is unmoved: x247 rgb(29,34,35), x246 rgb(11,15,17), x248 rgb(3,6,6), identical in both waves. The leg withdrew this target, so it is not a violated fence — but it is a titlebar-local change regressing a titlebar-to-sidebar alignment by 6px, and no per-surface critic can see it.

MARK UNTOUCHED: left inset 14px, size 22x22, box x14..35 y13..34 — and titlebar.png has ZERO changed pixels in x0..x39.

### flankSymmetry

UNMOVED, for the fourth consecutive wave. Session title ink x685..754 (w=70) in waves 4, 5, 6 and 7 alike; ink midpoint 720.00 against a window centre of 720.00; DISPLACEMENT 0.00px.

This is the notable non-event of the titlebar build: the group's painted right edge moved +6px (x266 -> x272) and the centring did not budge by a hundredth. It holds because 267 is the left flank's min-content FLOOR while 272 is its painted extent, and at 1440 both flanks sit well above their floors, so neither freezes and the flex split is unchanged. The mechanism recorded in .titlebar-left's note survives the retune.

Mark: left inset 14px, size 22x22, box x14..35 y13..34 — all three untouched, and titlebar.png changed exactly 0 pixels in x0..x39, so the inset was not raided to pay for the new interval. The 5px came from a new margin on .app-name, spent rightward out of the group's own budget.

### filterBandFence

PASS. The first session row's top edge is at y202 in sidebar.png at waves 5, 6 AND 7 — the band measures y202..275 (74px tall) identically in all three. The pre-list stack did not grow by a pixel.

The build spent zero height, and the diff proves it geometrically as well as by outcome: sidebar.png's entire change is ONE connected component, 6,171 px in a 223x28 box at x16..238 y116..143. That box is exactly the 28px input's interior. The band's structural rules at y115 and y144 are unchanged, the input's declared height is still 28px, and nothing above or below y115..144 moved. The landed build reversed no earlier build.

### filterAffordance

WHAT LANDED: rails.css only — `background: transparent -> var(--border)` plus `border-radius: 8px` on .sidebar-filter-input. Sidebar.tsx was NOT modified (git status shows three changed files, all CSS), so no glyph and no new element. The builder chose a resting ground, not chrome.

DOES IT READ AS OPERABLE AT REST? Measurably yes, at a cost. The field gains a visible ground: rgb(29,34,35) at OKLCH L=0.25 against the rail ground rgb(11,15,17) at L=0.16, delta L +0.08 over 223x28 = 6,244 px. That is a real step and it is more than muted copy. But three measurements say it was paid for badly:

(1) THE FILL IS THE SAME TOKEN AS THE HAIRLINES IT TOUCHES. `var(--border)` renders rgb(29,34,35) — byte-identical to the two rules bounding the band. The band has zero vertical padding, so the 28px field occupies y116..143 flush between them. Column x120 now reads a CONTINUOUS 30-row block of rgb(29,34,35) from y115 to y144. At wave 6 that same column read two isolated 1-row rules with 27 rows of ground between. The field has no visible top edge and no visible bottom edge; its rounded corners read as small triangular notches bitten out under a rule rather than as a field.

(2) IT INVERTS THE HOUSE FORM. Every other resting input housing in the app is surface fill + 1px border: composer pill interior rgb(11,15,17) with border rgb(29,35,35); tool card interior rgb(11,15,17) with border rgb(29,35,35). The filter field is now the only control in the app whose resting ground is the border token, with no border. Its own comment block names the composer pill as its model.

(3) THE PLACEHOLDER HAS 0px INSET INSIDE ITS OWN GROUND. Field left edge x16, placeholder ink left edge x16, in both waves. At wave 6 that was correct — x16 was the shared content edge with the group headings and row titles, which I confirm still sit at x16. At wave 7 the box under the text became visible and the text now touches it.

RULE COUNT AND POSITIONS: THREE full-width (>=240 of 248 columns) border-coloured rows survive in the pre-list stack, at y43 (rail head), y115 (background-sessions section) and y144 (filter band bottom) — sidebar.png coordinates; add 48 for window-session. The declared count is unchanged. But only ONE of the three still READS as a rule: y115 and y144 are now the first and last rows of a single 30px block of their own colour. So the stack did not get denser, it got mushier — the build removed two hairlines from perception without removing them from the DOM.

CORNER: left-edge straight run 18 of 28 rows = 64.29% at r=8 (arc consumes 5 rows per end). The run's own r=8 evidence base measured 89.2% / 87.7% / 83.7% at heights 74 / 65 / 49. My instrument reproduces the 74px row at 89.19% against the recorded 89.2%, which validates it. A 28px box is roughly half the shortest height the 8px decision was ever tested on, and it reopens the straight-run spread from the 5.5 points that settled the token to 24.9 points. INSTRUMENT CORRECTION, MINE: my first pass read this as 5 of 28 rows because I tested "leftmost border-coloured pixel" and the placeholder glyphs at x16 are neither ground nor border, breaking the run. Reading "leftmost non-ground pixel" gives 18 and reproduces the comparator exactly.

### dateDividerControl

UNCHANGED, and confirmed stable rather than drifting. window-session-short.png rows y88..y106 contain ZERO changed pixels between waves 6 and 7 — the divider is byte-identical, so nothing this wave reached it.

Re-measured from the pixels rather than carried forward: rule segments x464..811 (348px) and x876..1223 (348px), asymmetry 0px; gap x812..875 (64px), gap midpoint 844.00 against a column centre of 844.00, displacement 0.00px; label ink x823..862 (w=40) y93..100, ink midpoint 843.00, DISPLACEMENT -1.00px. The 1.00px tracking debt is exactly where it was. Corroborated a second way: the label's air inside the gap is 11px on the left and 13px on the right, an asymmetry of 2px, which is 2 x 1.00px as it must be.

INSTRUMENT CORRECTION, MINE. My first run reported +1.50px and a 89px-wide label. Last wave's 03-divider.mjs excludes the rule row only OUTSIDE x800..890, which lets the two rule segments' inner ends (x801..811 and x876..889) into the label bounding box and inflates it from 40px to 89px. Excluding the rule row entirely recovers -1.00px. My coordinates run 0.5 above the brief's because I take a pixel's right edge as x+1; the DIFFERENCE, which is the debt, is -1.00px under either convention.

One carried-forward number I correct rather than confirm: the clear above and below the divider block measures 45px, not 40px (block y93..100; clear y48..92 above, y101..145 below). The symmetry claim holds exactly — 45 and 45.

### jogControl

UNCHANGED, on both frames, and the brief's distinction resolves cleanly.

window-session-short.png (non-overflowing, no scrollbar): TRANSCRIPT column ink x464..x1223 (w=760), COMPOSER column ink x459..x1218 (w=760), jog left -5px, right -5px, centre -5.00px — identical to wave 6 in every figure. window-session.png (overflowing, scrollbar present at columns 1433..1436): transcript and composer both x459..x1218, jog 0.00px, also identical to wave 6.

WHICH OF THE TWO AM I SEEING: the CONTENT moved, the COLUMN did not. The transcript column's left edge, right edge and width are the same three numbers as wave 6, to the pixel. What moved inside it is vertical only — the two tool cards grew +26px each and everything below them translated down exactly 52px (card 2 bottom 678 -> 730, composer pill 889..938 -> 941..990, page height 1009 -> 1061). No horizontal extent anywhere in the transcript changed. The tool-card build was capable of moving content without moving the column, and that is precisely what it did.

### ownershipControl

ALL CONTROLS PASS, and the attribution closes at zero remainder for the FIFTH consecutive wave — with three builds in play rather than two.

THE THREE NO-BUILDER CONTROLS, byte-identical to wave 6 (sha256 first 16):
  welcome.png            3ddc6cac8193ced8  (unchanged since wave 4)
  welcome-min-window.png a5b0f42b38233a63  (unchanged since wave 4)
  input-bar.png          83d7d2e31a958735  (unchanged since wave 5)

THE THREE DOCKS — the sharpest control on the Sidebar builder — byte-identical to wave 6:
  agents-dock.png        bd48b6dbded87cc4  (wave-1 bytes, every wave)
  appearance-dock.png    acddc564b236c680  (wave-1 bytes, every wave)
  commands-dock.png      b9fa0168d66ed862  (wave-1 bytes; moved only at wave 5, back since wave 6)
The Sidebar builder stayed inside the filter band. No shared row rule was reached, and the settled 8px row corner was not touched by anyone.

WINDOW-WELCOME CONFINEMENT: 2,118 changed pixels in y0..47, ZERO in y48..899. Every changed pixel sits in y13..33. The titlebar builder did not leak, and the count matches titlebar.png's own total exactly.

WINDOW-SESSION ATTRIBUTION:
  titlebar.png   2,118
  sidebar.png    6,171
  chat.png     129,167
  sum          137,456
  window-session.png 137,456      REMAINDER 0
Component-level correspondence is 1:1 as well: chat.png's components reappear at +248x/+48y, sidebar.png's at +0x/+48y, titlebar.png's at +0/+0.

WINDOW-SESSION-SHORT ATTRIBUTION (dimensions differ, 1440x1009 -> 1440x1061, so accounted by band): titlebar strip y0..47 = 2,118 (matches titlebar.png exactly); rail band y48..200 = 6,171 (matches sidebar.png exactly); y201..353 = 0; y354..end = the tool-card reflow. The +52 height closes arithmetically too: card inner heights 108->134 and 109->135, +26 and +26, sum 52. REMAINDER 0.

### markControl

BYTE-IDENTICAL AT ALL THREE SITES, as a control only — the 2px geometric-offset underlay was not built, for the structural reason the brief gives.

  titlebar.png logo-mark   x14..35 y13..34   0 differing px   IDENTICAL
  welcome.png welcome-mark x513..556 y242..285  0 differing px  IDENTICAL (whole file byte-identical)
  chat.png avatar          x211..238 y111..138  660 differing px in place, 0 differing px at dy=-52  IDENTICAL

The avatar reading is the interesting one and it is not an exception: chat.png's transcript scrolled up 52px, so comparing the avatar in place compares it against its neighbour content. Compared at the reflow offset it is byte-perfect, which is independent confirmation that the reflow is a pure translation with no re-render.

Reinforcing control: titlebar.png changed ZERO pixels in x0..x39, so the mark and its 14px window inset were untouched even though the element immediately to their right moved 5px.

The colour-ramp mechanism stays closed and I did not reopen it. Hue spreads unchanged: logo-mark 1.90 deg over 436 chromatic px, welcome-mark 3.08 over 1,764, avatar 3.11 over 612 — a hue-preserving multiply, no rotation.

### findings

1. THE WAVE'S SEAM: two builders answered the SAME brief class in opposite vocabularies, in the same wave, and neither matched the other. Sidebar was told its control 'reads as passive muted copy at rest' and answered with 6,171 px of new resting GROUND (rgb(29,34,35), OKLCH delta L +0.08 over 223x28). Chat was told its rows 'read as a caption rather than an operable row' and answered with ZERO new painted pixels — the label ink is x266..349 in both waves and the toggle keeps background: transparent, border: 0 — spending 13px of AIR per row instead. The app now holds two contradictory answers to 'how does a quiet control announce it is operable'. They agree only on the 28px housing number. No per-surface critic can see this; it is the whole reason this pass exists.

2. THE FILTER FIELD'S GROUND IS THE SAME TOKEN AS THE HAIRLINES IT TOUCHES, so the affordance erased two rules to add one field. `background: var(--border)` renders rgb(29,34,35), byte-identical to the section rule at y115 and the band's border-bottom at y144, and the band has zero vertical padding so the 28px field sits flush between them at y116..143. Column x120 now reads a CONTINUOUS 30-row block y115..144; at wave 6 the same column read two isolated 1-row rules with 27 rows of ground between. Three full-width rules still exist in the DOM (y43, y115, y144) but only y43 still reads as one. The field has no visible top or bottom edge and its 8px corners read as notches under a rule.

3. THE FIELD INVERTS THE HOUSE FORM ITS OWN COMMENT NAMES AS ITS MODEL. Every other resting input housing in the app is surface fill + 1px border: composer pill interior rgb(11,15,17) / border rgb(29,35,35); tool card interior rgb(11,15,17) / border rgb(29,35,35). The filter field is now the ONLY control in the app whose resting ground is the border token and which carries no border. rails.css's own block says 'the band brightens on focus the way the composer pill does' — the build moved away from the pill rather than toward it.

4. THE PLACEHOLDER NOW HAS 0px INSET INSIDE ITS OWN GROUND. Field left edge x16, placeholder ink left edge x16, in both waves. At wave 6 that was correct because the field was bare and x16 was the shared content edge — which I confirm the group headings and row chips still use. Filling the box without insetting the text turns a correct alignment into text touching a visible edge.

5. THE TITLEBAR'S BREAK RATIO COLLAPSED BELOW THE THRESHOLD ITS OWN FILE RECORDS. Painted clearances went 4 / 12 / 4 to 9 / 13 / 4 (declared 4 / 13 / 4 to 9 / 14.5 / 4). The break's ratio to the wider inside interval fell from 12/4 = 3.00x to 13/9 = 1.44x painted, 1.61x declared. titlebar.css records 1.3x as 'far too weak to break the run' and 1.63x as 'enough'. The critic's 8-10px tick was delivered at 9px, and paid for by dissolving the lockup the break existed to protect: the group no longer reads [mark name] | [pill pill], it reads as three uneven intervals.

6. THE SAME GROUPING FAILURE HAPPENED INSIDE THE TOOL CARD, independently, from a different builder. Clear between the card body and disclosure row 1, and between row 1 and row 2, was 13px / 13px (1.00x) at wave 6. It is now 20px / 26px on card 1 (1.30x) and 19px / 26px on card 2 (1.37x). The two rows are further from each other than the first is from the content above, so the pair stopped reading as a pair — at 1.30x, the exact ratio titlebar.css names as too weak to break a run. Two of three builds this wave broke a grouping by spending vertical space unevenly.

7. THE 28px ROW COSTS THE CARD 24% OF ITS HEIGHT AND BUYS NOTHING VISIBLE. Card inner heights 108 -> 134 and 109 -> 135 (+26 each, +24.1% / +23.9%); the two quiet disclosure rows now occupy 41.8% and 41.5% of card inner height, up from 27.8% and 27.5%. `align-self: stretch` painted zero pixels — the label's ink box is identical in both waves — so the full-width row is invisible at rest and 100% of the visible change is negative space. The card's own comment says it 'must read exactly as it did before when nobody is looking at it'; it is 26px taller.

8. THE TITLEBAR GAVE BACK 6 OF THE 9px IT BOUGHT AGAINST THE RAIL DIVIDER. Group painted right edge x266 -> x272; overrun past the structural column x247 went +19 -> +25px (wave 5 was +28). The divider itself is unmoved (x247 rgb(29,34,35) in both waves). The leg withdrew this target so no fence was violated — but this is a titlebar-local spacing fix regressing a titlebar-to-sidebar alignment, visible only from here.

9. THE 8px CORNER GAINED A FOURTH FAMILY MEMBER AT A HEIGHT ITS EVIDENCE BASE NEVER COVERED. I am not reopening the settled row corner; I am reporting that a new box joined the token this wave. The filter field's left-edge straight run is 18 of 28 rows = 64.29% at r=8. The three heights that settled 8px measured 89.2% / 87.7% / 83.7% at 74 / 65 / 49px, a 5.5-point spread. A 28px box is roughly half the shortest of those and lands 19.4 points below the worst, reopening the spread to 24.9 points. Instrument validated: my comparator reproduces the 74px row at 89.19% against the recorded 89.2%.

10. TWO OF THE THREE CHANGED DECLARATIONS NOW SIT UNDER COMMENT BLOCKS THAT CITE RETIRED FACTS — the gate I proposed last wave, firing on its first real opportunity. titlebar.css still says 'the left group reads 4 / 13 / 4' and cites 'mark 14..36, app name 40..137, backend pill 149..207, permission pill 211..267' and '4 / 13 / 4 lands at x267 ... leaving +20'; measured now, 9 / 14.5 / 4 declared, x272 painted, +25. rails.css still says the band has 'no control chrome of its own' and 'the input is bare'; it now has a fill and an 8px radius. The one build whose comment survived intact is tool-card.css — the one that painted nothing.

11. HARNESS OBSERVATION FOR THE LEG, not a design finding and not caused by these builds: the PREwave DOM baseline dropped from 36/39 to 35/39 between waves. gui-124 is newly FAIL and gui-78 does not appear in the wave-7 run at all. Both are pre-build state captured at 16:55 against captures at 17:02, so this is baseline drift to re-baseline before it is blamed on a change.


### notFindings

1. chat.png's 129,167 changed pixels and 210 components are NOT a spacing regression and no future wave should refile them as one. Zero changed pixels below y545; both card bottom borders sit at y545 in both waves; the avatar is byte-identical at dy=-52. The bottom-anchored viewport absorbed 52px of content growth by scrolling upward. The top-anchored short frame proves the converse — card TOPS pinned at y354, zero change in y201..353, everything below translated exactly +52. Two opposite anchors, one cause.

2. The disclosure label sitting 1.0px below its 28px row centre is NOT a centring error. It is systematic across both rows of both cards, and it is the ink-versus-line-box asymmetry of uppercase micro-caps: CSS centres the line box, and cap-height ink has no descender to balance it. Do not refile as 'label not vertically centred'.

3. The new 6,244px filter ground did NOT move the identity floor. sidebar.png mint is 144 px = 0.07% in both waves, to the pixel, because rgb(29,34,35) has OKLCH chroma 0.0074 — below the 0.05 chromatic threshold. An achromatic fill cannot touch a floor counted by hue. The titlebar's +30 mint px are the two accent pills translating 6px and re-antialiasing, not a new mint site.

4. The three docks are byte-identical to wave 6 and to wave 1, so nobody touched a shared row rule and the settled 8px row corner was not reopened by any builder. That control is clean.

5. Flank symmetry did NOT move despite the titlebar group's painted right edge moving +6px. Session title ink x685..754, midpoint 720.00, displacement 0.00px — the fourth consecutive wave at those exact numbers. The mechanism holds because 267 is the flank's min-content floor while 272 is its painted extent, and at 1440 neither flank is frozen. Do not refile the group's growth as a centring risk at this width.

6. The mark's 14px inset and 22x22 size were not raided to pay for the new interval. titlebar.png has ZERO changed pixels in x0..x39; the 5px came from a new margin on .app-name and was spent rightward.

7. The -5px jog is unchanged and the tool-card build did not touch it. Transcript x464..1223, composer x459..1218, jog -5.00px in the short frame; 0.00px in the overflowing frame. Content moved vertically inside the column; the column's left edge, right edge and width are unchanged. Do not refile the +52 reflow as a column shift.

8. The date divider's 1.00px tracking debt is STABLE, not drifting. Rows y88..106 contain zero changed pixels between waves. Rule segments 348/348, asymmetry 0, gap midpoint dead on the column centre, label displacement -1.00px, left/right air 11px/13px. The defect is exactly where it was.

9. The type scale's 0.342px worst deviation (the 11px micro rung) is unchanged and inside the 0.35 tolerance. No font-size declaration was touched by any build, and glyph ink widths are identical on all three changed elements. Do not refile as drift.

10. The filter band did not grow. First session row top edge y202 at waves 5, 6 and 7; the entire sidebar change is one 223x28 component inside the existing 28px input. No landed build was reversed.

11. The Welcome hero's +0.50px centring and the marks' colour-ramp mechanism were not touched and are not defects — welcome.png is byte-identical, and mark hue spreads are 1.90 / 3.08 / 3.11 degrees, a hue-preserving multiply with no rotation.


### newPieceProposal

NONE — and my answer to the missing-artifact question is still A GATE, now backed by evidence rather than prediction.

Why no piece. The decomposition is not visibly missing a surface. The obvious candidate is ToolCard, and this wave makes its case louder than ever — Chat's entire 129,167-pixel headline is tool-card reflow and nothing else — but it stays PARKED for the stated structural reason: adopting it requires rewriting a human-owned scoping rule, and a loop body must not edit the boundary of its own scope. The genuinely unowned concern this wave surfaced is a control vocabulary spanning Sidebar, Chat and InputBar, and that has no capture of its own, so it would be a piece with nothing to photograph. It is this pass's job, not a sixth piece's. A churning piece list would destroy the plateau signal for no gain.

Why the gate, restated. Last wave I proposed a check that a changed declaration's own comment block no longer cites the retired number. This wave gave it three chances and it fired on two: titlebar.css still reads "the left group reads 4 / 13 / 4" and cites four box ranges and an x267 landing, against a measured 9 / 14.5 / 4 declared and x272 painted with +25 overrun; rails.css still reads "no control chrome of its own" and "the input is bare", against a fill and an 8px radius. The third, tool-card.css, is the only clean one — and it is clean because that build painted nothing, so its "reads exactly as it did before" claim survives on colour while quietly failing on 26px of height. That is a 2-of-3 hit rate on first contact, on two different files by two builders who could not see each other, and it is cheap: the check is textual, needs no capture, and runs in the gate the leg already owns. Four consecutive passes said the missing artifact was a test; the leg built it and it paid. This is the same shape one level up — the stylesheet's prose is load-bearing in this repo, every builder reads it before editing, and it is currently the only artifact in the tree with no verification at all.
