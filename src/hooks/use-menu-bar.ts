import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useState } from "react";
import { useColorHighlight } from "@/hooks/use-color-highlight";
import { useKeyDisplay } from "@/hooks/use-key-display";
import {
  getHistoryActions,
  getMainActions,
  getNodeActions,
} from "../consts/operations";
import { menuBarStateSelector } from "../components/editor/menubar/state";

export const useMenuBar = (editor: Editor, onSave: () => void) => {
  const { shortcuts } = useKeyDisplay();
  const [highlightPopoverOpen, setHighlightPopoverOpen] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  useColorHighlight(editor);

  const actionParams = {
    editor,
    editorState,
    onSave,
    shortcuts,
  };

  return {
    highlightPopoverOpen,
    setHighlightPopoverOpen,
    mainActions: getMainActions(actionParams),
    nodeActions: getNodeActions(actionParams),
    historyActions: getHistoryActions(actionParams),
    shortcuts,
    editorState,
  };
};
