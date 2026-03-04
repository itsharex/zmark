import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useState } from "react";
import {
  getHistoryActions,
  getMainActions,
  getNodeActions,
} from "@/components/editor/menubar/actions";
import { useColorHighlight } from "@/hooks/use-color-highlight";
import { useKeyDisplay } from "@/hooks/use-key-display";
import { menuBarStateSelector } from "@/stores/editor";

export const useMenuBar = (
  editor: Editor,
  onSave: () => void,
  onImageUpload?: () => void,
) => {
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
    onImageUpload,
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
