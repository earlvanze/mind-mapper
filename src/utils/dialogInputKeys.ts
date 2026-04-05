export type DialogInputKeyState = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
};

function normalizedKey(value: string): string {
  return value.toLowerCase();
}

function isTextEntryTarget(target: EventTarget | null | undefined): boolean {
  const element = target as { tagName?: string; isContentEditable?: boolean } | null;
  if (!element) return false;

  if (element.isContentEditable) return true;

  const tagName = element.tagName;
  if (typeof tagName !== 'string') return false;

  const normalized = tagName.toLowerCase();
  return normalized === 'input' || normalized === 'textarea';
}

export function isDialogFocusInputEvent(event: DialogInputKeyState): boolean {
  return !!(event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && normalizedKey(event.key) === 'f';
}

export function isDialogSelectInputEvent(event: DialogInputKeyState): boolean {
  return !!(event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && normalizedKey(event.key) === 'a';
}

export function isDialogClearInputEvent(event: DialogInputKeyState): boolean {
  return !!(event.metaKey || event.ctrlKey) && !event.altKey && !!event.shiftKey && normalizedKey(event.key) === 'k';
}

export function shouldSkipDialogSelectShortcut(event: DialogInputKeyState): boolean {
  return isTextEntryTarget(event.target);
}
