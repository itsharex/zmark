import { useIsMac } from "./useIsMac";

type ShortcutKey = "Mod" | "Alt" | "Shift" | string;

export const useKeyDisplay = () => {
  const isMac = useIsMac();

  const keyMap: Record<string, string> = {
    Mod: isMac ? "⌘" : "Ctrl",
    Alt: isMac ? "⌥" : "Alt",
    Shift: isMac ? "⇧" : "Shift",
  };

  const formatShortcut = (keys: ShortcutKey[]) => {
    return keys.map((k) => keyMap[k] || k).join("+");
  };

  const shortcuts = {
    save: formatShortcut(["Mod", "S"]),
    bold: formatShortcut(["Mod", "B"]),
    italic: formatShortcut(["Mod", "I"]),
    code: formatShortcut(["Mod", "E"]),
    highlight: formatShortcut(["Mod", "Shift", "H"]),
    superscript: formatShortcut(["Mod", "Shift", "."]),
    subscript: formatShortcut(["Mod", "Shift", ","]),
    undo: formatShortcut(["Mod", "Z"]),
    redo: isMac
      ? formatShortcut(["Mod", "Shift", "Z"])
      : formatShortcut(["Mod", "Y"]),
    paragraph: formatShortcut(["Mod", "Alt", "0"]),
    heading: (level: number) =>
      formatShortcut(["Mod", "Alt", level.toString()]),
    bulletList: formatShortcut(["Mod", "Shift", "8"]),
    orderedList: formatShortcut(["Mod", "Shift", "7"]),
    taskList: formatShortcut(["Mod", "Shift", "9"]),
    codeBlock: formatShortcut(["Mod", "Alt", "C"]),
    blockquote: formatShortcut(["Mod", "Shift", "B"]),
    hardBreak: formatShortcut(["Shift", "Enter"]),
    link: formatShortcut(["Mod", "K"]),
    aiCopilot: formatShortcut(["Mod", "J"]),
  };

  return {
    ...keyMap,
    isMac,
    formatShortcut,
    shortcuts,
  };
};
