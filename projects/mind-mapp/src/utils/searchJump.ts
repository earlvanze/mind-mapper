export type SearchJumpModifiers = {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export function shouldKeepSearchOpen(modifiers: SearchJumpModifiers): boolean {
  return !!(modifiers.metaKey || modifiers.ctrlKey || modifiers.shiftKey || modifiers.altKey);
}
