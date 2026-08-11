// THE SUPPORTING LINE DOES NOT RESTATE THE BUTTON. It read "Pick a project
// folder for Claude to work in.", which spent this screen's one sentence on
// the label of the control right beneath it — heading, explanation and action
// all doing the same job, and the explanation doing it worst. The line earns
// its place by saying what the button cannot: not which control to press, but
// the state pressing it puts you in.
//
// LENGTH IS LOAD-BEARING, so the wording is not free. This pane is
// photographed a second time at the enforced 640x480 minimum, where the line
// gets a 576px field and the hero has 65px of vertical headroom; a sentence
// that wraps to two lines spends 28px of that and breaks a sum argued in
// chat.css. That file's `.welcome-hint` comment quotes this string's character
// count and painted width, so a rewrite here is a correction there too.
const Welcome = ({ onPick }: { onPick: () => void }) => (
  <main className="welcome">
    <span className="welcome-mark" aria-hidden="true" />
    <h1 className="welcome-title">Start a session</h1>
    <p className="welcome-hint">Claude reads and edits the files in the folder you open.</p>
    <button type="button" className="pick-folder-btn" onClick={onPick}>
      Pick a project folder
    </button>
  </main>
)

export default Welcome
