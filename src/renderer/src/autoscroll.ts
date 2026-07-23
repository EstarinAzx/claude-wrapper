export const isNearBottom = (
  el: { scrollTop: number; scrollHeight: number; clientHeight: number },
  slack = 40
): boolean => el.scrollHeight - el.scrollTop - el.clientHeight <= slack
