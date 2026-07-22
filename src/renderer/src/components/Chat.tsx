function Avatar() {
  return <span className="avatar" aria-hidden="true" />
}

export default function Chat() {
  return (
    <main className="chat">
      <div className="chat-column">
        <div className="date-divider">
          <span className="date-divider-line" />
          <span className="date-divider-label">TODAY</span>
          <span className="date-divider-line" />
        </div>

        <div className="msg msg-user">
          <div className="bubble">What does this repo do?</div>
        </div>

        <div className="msg msg-assistant">
          <Avatar />
          <div className="assistant-body">
            <p>It wraps the Claude Code CLI in a desktop app:</p>
            <ul className="assistant-list">
              <li>
                <span className="list-marker" aria-hidden="true">
                  –
                </span>
                <span>
                  <strong>Chat UI</strong>: sessions read as conversation, not scrollback.
                </span>
              </li>
              <li>
                <span className="list-marker" aria-hidden="true">
                  –
                </span>
                <span>
                  <strong>Tool cards</strong>: every command Claude runs, visible.
                </span>
              </li>
              <li>
                <span className="list-marker" aria-hidden="true">
                  –
                </span>
                <span>
                  <strong>Native glass</strong>: Win11 acrylic, no terminal chrome.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="msg msg-user">
          <div className="bubble">Nice. Where should I start reading?</div>
        </div>

        <div className="msg msg-assistant">
          <Avatar />
          <div className="typing" aria-label="Typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </main>
  )
}
