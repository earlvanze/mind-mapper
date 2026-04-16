export type HelpToggleKeyState = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export function isHelpToggleEvent(event: HelpToggleKeyState, typingTarget: boolean): boolean {
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key === '/') {
    return true;
  }

  if (typingTarget) return false;

  if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    return true;
  }

  return false;
}
