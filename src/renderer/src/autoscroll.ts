export function isNearBottom(
  el: { scrollTop: number; scrollHeight: number; clientHeight: number },
  slack = 40
): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= slack
}
