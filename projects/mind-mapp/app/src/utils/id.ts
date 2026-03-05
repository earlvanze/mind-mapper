export function uid(prefix = 'n') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
