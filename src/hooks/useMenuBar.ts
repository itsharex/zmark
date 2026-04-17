import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useState } from "react";
import {
  getHistoryActions,
  getInsertActions,
  getListActions,
  getTextActions,
} from "@/components/editor/menubar/actions";
import { useColorHighlight, useKeyDisplay } from "@/hooks";
import { menuBarStateSelector } from "@/stores";

export const useMenuBar = (editor: Editor, onImageUpload?: () => void) => {
  const { shortcuts } = useKeyDisplay();
  const [highlightPopoverOpen, setHighlightPopoverOpen] = useState(false);
  const [headingPopoverOpen, setHeadingPopoverOpen] = useState(false);
  const [listPopoverOpen, setListPopoverOpen] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  useColorHighlight(editor);

  const actionParams = {
    editor,
    editorState,
    onImageUpload,
    shortcuts,
  };

  return {
    highlightPopoverOpen,
    setHighlightPopoverOpen,
    headingPopoverOpen,
    setHeadingPopoverOpen,
    listPopoverOpen,
    setListPopoverOpen,
    historyActions: getHistoryActions(actionParams),
    textActions: getTextActions(actionParams),
    listActions: getListActions(actionParams),
    insertActions: getInsertActions(actionParams),
    shortcuts,
    editorState,
  };
};
