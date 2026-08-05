// The id a user message is addressed by (#129).
//
// WHY THE HOST STAMPS IT AT ALL. `rewind_files` takes a USER MESSAGE id, and
// there is nothing to scrape one off: the CLI never echoes the prompt back, so
// the only `type: 'user'` messages on the stream are TOOL RESULTS (#127 measured
// this, after an earlier version of its own probe addressed a tool_result and
// would have reported a confident false negative). The host chooses the id and
// the CLI stores the message under exactly it — asserted, not assumed, by both
// spikes reading the transcript back with `getSessionMessages`.
//
// The SDK types `SDKUserMessage.uuid` as node's `UUID`, a template literal type
// that a plain `string` is not assignable to. That type is restated here rather
// than imported from `crypto`, because this module is imported by the RENDERER
// as well, and `tsconfig.web.json` does not carry node's types.
export type MessageUuid = `${string}-${string}-${string}-${string}-${string}`

// Trust boundary AND the narrowing in one. The uuid is minted in the renderer
// and crosses IPC twice — out with the prompt, back with the rewind — so main
// must not hand an arbitrary string to the SDK on the strength of a cast.
//
// A malformed id is not dangerous (the CLI answers an id it has no checkpoint
// for by THROWING `No file checkpoint found for this message.`, measured in
// #129, and main catches that). It is refused here anyway, because the
// alternative is `as MessageUuid` at two call sites, which types the value as
// checked without anything having checked it.
export const isMessageUuid = (v: unknown): v is MessageUuid =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
