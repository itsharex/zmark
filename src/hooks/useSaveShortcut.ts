import { useGlobalShortcut } from "./useGlobalShortcut";

export const useSaveShortcut = (onSave: () => void) => {
  useGlobalShortcut({
    key: "s",
    onTrigger: onSave,
    requireMod: true,
  });
};
