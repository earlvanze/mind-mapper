export type HelpToggleKeyState = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export function isHelpToggleEvent(event: HelpToggleKeyState, typingTarget: boolean): boolean {
  if (typingTarget) return false;

  if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key === '/') {
    return true;
  }

  return false;
}
