// The slice of the SDK's SlashCommand the dock renders. Name arrives WITHOUT
// the leading slash (SDK contract); the renderer adds it for display/insert.
export type SlashCommandInfo = {
  name: string
  description: string
  argumentHint: string
  // Alternate names that resolve to this command (/cost → /usage). Absent —
  // not empty — when the SDK reports none; autocomplete (#40) matches on them.
  aliases?: string[]
}
