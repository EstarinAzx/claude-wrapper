// The slice of the SDK's SlashCommand the dock renders. Name arrives WITHOUT
// the leading slash (SDK contract); the renderer adds it for display/insert.
export type SlashCommandInfo = {
  name: string
  description: string
  argumentHint: string
}
