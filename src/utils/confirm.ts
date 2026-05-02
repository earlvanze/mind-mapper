export function confirmAction(message: string): boolean {
  try {
    if (typeof window?.confirm !== 'function') {
      return false;
    }
    return window.confirm(message);
  } catch {
    return false;
  }
}
