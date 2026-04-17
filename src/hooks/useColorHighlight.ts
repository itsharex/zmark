import type { Editor } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { DEFAULT_HIGHLIGHT_COLOR } from "../consts/highlight";

export const COLOR_HIGHLIGHT_SHORTCUT_KEY = "mod+shift+h";

export function useColorHighlight(editor: Editor | null) {
  const isActive = editor?.isActive("highlight") ?? false;
  const currentColor = editor?.getAttributes("highlight").color ?? null;

  const handleColorHighlight = useCallback(() => {
    if (!editor) return false;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      const $to = editor.state.selection.$to;
      const highlightMarkType = editor.schema.marks.highlight;
      const nodeAfter = $to.nodeAfter;
      const nextHasHighlight = nodeAfter?.marks.some(
        (m) => m.type === highlightMarkType,
      );
      const isAtHighlightEnd = isActive && !nextHasHighlight;

      if (isAtHighlightEnd) {
        return editor.chain().focus().unsetHighlight().run();
      }
      return false;
    }

    if (isActive) {
      return editor.chain().focus().unsetHighlight().run();
    }

    return editor
      .chain()
      .focus()
      .setHighlight({ color: DEFAULT_HIGHLIGHT_COLOR })
      .run();
  }, [editor, isActive]);

  const handleRemoveHighlight = useCallback(() => {
    if (!editor) return false;
    return editor.chain().focus().unsetHighlight().run();
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const isH = event.key.toLowerCase() === "h";

      if (isMod && isShift && isH) {
        event.preventDefault();
        handleColorHighlight();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, handleColorHighlight]);

  return {
    isActive,
    currentColor,
    handleColorHighlight,
    handleRemoveHighlight,
    canHighlight:
      editor
        ?.can()
        .chain()
        .setHighlight({ color: DEFAULT_HIGHLIGHT_COLOR })
        .run() ?? false,
  };
}
