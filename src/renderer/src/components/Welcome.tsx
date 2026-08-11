// THE SUPPORTING LINE DOES NOT RESTATE THE BUTTON. It read "Pick a project
// folder for Claude to work in.", which spent this screen's one sentence on
// the label of the control right beneath it — heading, explanation and action
// all doing the same job, and the explanation doing it worst. The line earns
// its place by saying what the button cannot: not which control to press, but
// the state pressing it puts you in.
//
// IT IS A TWO-LINE DECK NOW, AND THE SECOND BEAT IS NOT PADDING. One sentence
// said what Claude does; the second says how long it keeps doing it, which is
// the other half of the state the button drops you into — the workspace is
// held until an explicit switch (`session:switch-workspace`, main/index.ts).
// A second FACT was the only honest route to two lines: stretching one
// sentence until it wrapped would be a clamp wearing a deck's shape.
//
// LENGTH IS STILL LOAD-BEARING, and the figure moved. This pane is
// photographed a second time at the enforced 640x480 minimum, where the line
// gets a 576px field. At 112 characters this copy overruns that field on its
// own, so the wrap is real at every window size rather than a min-window
// accident, and `.welcome-hint`'s `max-width` in chat.css is what makes it
// break at this sentence's own comma instead of at whatever word the pane
// edge lands on. That file's comment carries this string's character count,
// its painted widths and the height sum it is a term of, so a rewrite here is
// a correction there too — and one that reaches a THIRD line spends another
// 27.6px of a 53.7px reserve.
const Welcome = ({ onPick }: { onPick: () => void }) => (
  <main className="welcome">
    <span className="welcome-mark" aria-hidden="true" />
    <h1 className="welcome-title">Start a session</h1>
    <p className="welcome-hint">
      Claude reads and edits the files in the folder you open, and it keeps working there until you
      switch to another.
    </p>
    <button type="button" className="pick-folder-btn" onClick={onPick}>
      Pick a project folder
    </button>
  </main>
)

export default Welcome
