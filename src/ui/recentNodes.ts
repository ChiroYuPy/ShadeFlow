const KEY = 'shadeflow:recent-nodes'
const MAX = 4

/** Node types added most recently, newest first. */
export function recentNodeTypes(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string').slice(0, MAX) : []
  } catch {
    return []
  }
}

export function rememberNodeType(type: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([type, ...recentNodeTypes().filter((t) => t !== type)].slice(0, MAX)))
  } catch {
    // Storage blocked: the list is a convenience, nothing breaks.
  }
}
