export type SearchToggleKeyState = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export function isSearchToggleEvent(event: SearchToggleKeyState): boolean {
  return (
    (event.metaKey || event.ctrlKey)
    && !event.altKey
    && !event.shiftKey
    && event.key.toLowerCase() === 'k'
  );
}
