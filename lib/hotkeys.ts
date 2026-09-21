export const HOTKEYS = {
  focusProductSearch: "F2",
  print: "F4",
  deleteLine: "F8",
  save: "F9",
  newDocument: "F10",
  saveAndNew: "F12",
  close: "Escape",
  globalSearch: "mod+k",
} as const;

export type HotkeyAction = keyof typeof HOTKEYS;

const FUNCTION_KEYS = new Set(["F2", "F4", "F8", "F9", "F10", "F12"]);

export function isFunctionKeyBinding(key: string): boolean {
  return FUNCTION_KEYS.has(key);
}
