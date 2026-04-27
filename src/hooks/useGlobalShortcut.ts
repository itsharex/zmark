import { useEffect } from "react";
import { useIsMac } from "./useIsMac";

interface UseGlobalShortcutOptions {
  key: string;
  onTrigger: () => void;
  requireMod?: boolean;
  enabled?: boolean;
}

export function useGlobalShortcut({
  key,
  onTrigger,
  requireMod = true,
  enabled = true,
}: UseGlobalShortcutOptions) {
  const isMac = useIsMac();

  useEffect(() => {
    if (!enabled) return;

    const expectedKey = key.toLowerCase();
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchedKey = event.key.toLowerCase() === expectedKey;
      if (!matchedKey) return;

      if (requireMod) {
        const hasMod = isMac ? event.metaKey : event.ctrlKey;
        if (!hasMod) return;
      }

      event.preventDefault();
      onTrigger();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, isMac, key, onTrigger, requireMod]);
}
