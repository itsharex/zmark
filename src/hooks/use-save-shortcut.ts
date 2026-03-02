import { useEffect } from "react";
import { useKeyDisplay } from "./use-key-display";

export const useSaveShortcut = (onSave: () => void) => {
  const keyDisplay = useKeyDisplay();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut =
        keyDisplay.shortcuts.save === "Ctrl"
          ? event.ctrlKey && event.key === "s"
          : event.metaKey && event.key === "s";

      if (isSaveShortcut) {
        event.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, keyDisplay]);
};
