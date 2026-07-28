import type { TranscriptMessage } from './session-types'

// Deriving a readable label for a session whose recorded title is a bare slash
// command. Both halves are pure and both are measured against the real store
// (499 sessions, 2026-07-28) rather than guessed — the shapes below are copied
// off disk, not invented.

// Titles worth enriching: `/`-leading AND at most this many whitespace tokens.
// 93 summaries start with `/`; 65 are within the bound and 28 are informative
// prose that merely opens with a command (`/relay N=1 read and follow
// .claude/relay-leg.md`). The bound is what protects those 28 — it is the whole
// difference between relabelling noise and overwriting a good title.
//
// No guard against clobbering a user-set `/rename` title is needed: 0 of 325
// custom titles start with `/`, so a `/`-leading title is provably not one.
const MAX_TOKENS = 3

export const needsEnrichment = (title: string): boolean => {
  const t = title.trim()
  return t.startsWith('/') && t.split(/\s+/).length <= MAX_TOKENS
}

// The CLI's skill expansion, persisted as a user message. Injected context, not
// something anyone typed: 12 of the 15 labels this function could otherwise
// derive were this block, and they share a ~40-character identical prefix — so
// accepting them would leave the rows as mutually indistinguishable as the bare
// commands they replaced, which is the defect being fixed.
// ponytail: one literal prefix, because the CLI offers no other marker. If the
// wording changes these rows fall back to their existing title, which is the
// same place they are today.
const SKILL_BODY = 'Base directory for this skill:'

// A slash-command invocation persists in TWO shapes — `<command-message>` first
// and `<command-name>` first — and the transcript parser's unwrapper only
// recognises the former, so the latter reaches us as raw markup. It is also the
// COMMON one: 59 of the 65 enrichable rows lead with it, which is the difference
// between this ticket relabelling those rows usefully and relabelling them with
// a wall of XML. `<local-command-caveat>` / `<local-command-stdout>` are the
// CLI's own caveat and command output (the latter carrying ANSI escapes);
// neither is a prompt. A bare `/x` is what the unwrapper turns shape one into,
// and what typing a command looks like.
const isSubstantive = (text: string): boolean => {
  const t = text.trim()
  if (!t) return false
  if (t.startsWith('/')) return false
  if (t.startsWith('<command-message>') || t.startsWith('<command-name>')) return false
  if (t.startsWith('<local-command-')) return false
  if (t.startsWith(SKILL_BODY)) return false
  return true
}

// First user message that is an actual prompt, trimmed and otherwise VERBATIM —
// not summarized, not whitespace-collapsed, not truncated (rows ellipsise in
// CSS). null when the session has none, which is the common case and an answer,
// not a failure: most `/clear` and `/model` sessions genuinely contain no prompt
// and keep the title they already have.
export const firstSubstantivePrompt = (
  messages: readonly TranscriptMessage[]
): string | null => {
  for (const message of messages) {
    if (message.role !== 'user') continue
    if (isSubstantive(message.text)) return message.text.trim()
  }
  return null
}
