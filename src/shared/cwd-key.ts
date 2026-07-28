// Fold a project directory into a COMPARISON/GROUPING key: separators
// normalised, trailing separators dropped, case folded. Never join() this onto
// anything — it is deliberately not a real path, and deriving a store location
// from a cwd is exactly the bug the storage index exists to kill.
//
// Lives in shared/ because both sides need the same answer: the main process
// breaks duplicate-id ties with it, and the renderer groups the global session
// list with it. The store really does hold both `d:\…` and `D:\…` spellings of
// one directory, and two headings for one project is the visible defect.
export const cwdKey = (cwd: string): string =>
  cwd.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
