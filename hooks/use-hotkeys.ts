"use client";

import { useEffect } from "react";
import { HOTKEYS, isFunctionKeyBinding, type HotkeyAction } from "@/lib/hotkeys";

type HotkeyMap = Partial<Record<HotkeyAction, (event: KeyboardEvent) => void>>;

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function matchesBinding(event: KeyboardEvent, binding: string): boolean {
  if (binding === "mod+k") {
    return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
  }
  return event.key === binding;
}

export function useHotkeys(map: HotkeyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      for (const [action, handler] of Object.entries(map)) {
        if (!handler) continue;
        const binding = HOTKEYS[action as HotkeyAction];
        if (!matchesBinding(event, binding)) continue;
        if (isTextInputTarget(event.target) && !isFunctionKeyBinding(binding)) continue;
        event.preventDefault();
        handler(event);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, map]);
}
