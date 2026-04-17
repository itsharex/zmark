import { useEffect } from "react";
import { useKeyDisplay } from "./useKeyDisplay";

export const useSaveShortcut = (onSave: () => void) => {
  const { isMac } = useKeyDisplay();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut = isMac
        ? event.metaKey && event.key.toLowerCase() === "s"
        : event.ctrlKey && event.key.toLowerCase() === "s";

      if (isSaveShortcut) {
        event.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, isMac]);
};
