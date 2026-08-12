import { useEffect, useState } from 'react'
import type { SlashCommandInfo } from '../../../shared/command-types'

// Commands dock (#39): structural twin of the agents dock — same right slot,
// same titlebar toggle, same folder gate; App enforces that opening one closes
// the other. Mount IS open, so a plain fetch-on-mount is the no-cache
// contract: the list is read live each open and forgotten on close. Browsing
// never sends — a click only hands the command name up to fill the composer.
const CommandsDock = ({
  onInsert,
  onClose
}: {
  onInsert: (name: string) => void
  onClose: () => void
}) => {
  // null = loading. [] after load is the honest empty state: with no live
  // query there is simply nothing to say yet — that is not an error.
  const [commands, setCommands] = useState<SlashCommandInfo[] | null>(null)

  useEffect(() => {
    let live = true
    void window.api.listCommands().then((list) => {
      if (live) setCommands(list)
    })
    return () => {
      live = false
    }
  }, [])

  return (
    <aside className="agents-dock commands-dock" aria-label="Commands">
      <div className="agents-dock-head">
        <span className="agents-dock-title">Commands</span>
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Close commands panel"
          onClick={onClose}
        >
          {/* One mark on three surfaces: the three dock closes draw this X from
              identical coordinates, so it is kept byte-identical here, in
              AgentsDock and in AppearanceDock. Span is 1.5 to 10.5 — 9 of path
              plus the grid's 1.4 stroke, the 10.4 optical extent the 14-grid
              plus already lands on. It was 3 to 9, which inked 7.4 square and
              made this the smallest mark on a housing thirteen buttons share.
              The derivation is on the map glyph in AgentsDock. */}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M1.5 1.5l9 9M10.5 1.5l-9 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {commands === null ? (
        <div className="agents-dock-empty" role="status">
          Loading…
        </div>
      ) : commands.length === 0 ? (
        <div className="agents-dock-empty" role="status">
          No commands available yet.
        </div>
      ) : (
        <ul className="command-list">
          {commands.map((c) => (
            <li key={c.name} className="command-row">
              <button
                type="button"
                className="command-row-btn"
                onClick={() => onInsert(c.name)}
              >
                {/* Name and hint on ONE line. The hint is a fragment of the
                    command's signature, not a second fact about it, and as its
                    own line it made the list three different row shapes deep.
                    The wrapper is local to this dock: the two spans inside it
                    also render in the composer's slash popover, so the fix goes
                    around them and never on them (#94). rails.css owns the
                    alignment and the row's floor height. */}
                <span className="command-row-head">
                  <span className="command-row-name">/{c.name}</span>
                  {c.argumentHint ? (
                    <span className="command-row-hint">{c.argumentHint}</span>
                  ) : null}
                </span>
                {c.description ? (
                  <span className="command-row-desc" title={c.description}>
                    {c.description}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

export default CommandsDock
