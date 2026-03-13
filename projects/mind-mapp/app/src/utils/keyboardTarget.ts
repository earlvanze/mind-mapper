export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;

  const maybeElement = target as {
    closest?: (selector: string) => unknown;
    isContentEditable?: boolean;
  };

  if (typeof maybeElement.closest === 'function') {
    const editable = maybeElement.closest(
      'input, textarea, select, [contenteditable], [role="textbox"]',
    );
    if (editable) return true;
  }

  return !!maybeElement.isContentEditable;
}
