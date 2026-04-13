export function confirmAction(message: string): boolean {
  try {
    return window.confirm(message) ?? false;
  } catch {
    return false;
  }
}
