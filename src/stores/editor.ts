// zustand store for editor content
import type { Editor } from "@tiptap/core";
import type { EditorStateSnapshot } from "@tiptap/react";
import { create } from "zustand";

interface EditorState {
  content: string;
  setContent: (content: string) => void;
  curPath: string;
  setCurPath: (path: string) => void;
  previewPath: string;
  setPreviewPath: (path: string) => void;

  // 协作文件ID状态
  activeCollabId: string | null;
  setActiveCollabId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: "",
  setContent: (content) => set({ content }),
  curPath: "",
  setCurPath: (curPath) => set({ curPath }),
  previewPath: "",
  setPreviewPath: (previewPath) => set({ previewPath }),

  activeCollabId: null,
  setActiveCollabId: (id) => set({ activeCollabId: id }),
}));

/**
 * State selector for the MenuBar component.
 * Extracts the relevant editor state for rendering menu buttons.
 */
export function menuBarStateSelector(ctx: EditorStateSnapshot<Editor>) {
  return {
    // Text formatting
    isBold: ctx.editor.isActive("bold") ?? false,
    canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
    isItalic: ctx.editor.isActive("italic") ?? false,
    canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
    isStrike: ctx.editor.isActive("strike") ?? false,
    canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
    isCode: ctx.editor.isActive("code") ?? false,
    canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
    isHighlight: ctx.editor.isActive("highlight") ?? false,
    canHighlight: ctx.editor.can().chain().toggleHighlight().run() ?? false,
    currentHighlightColor: ctx.editor.getAttributes("highlight").color ?? null,
    canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
    isSuperscript: ctx.editor.isActive("superscript") ?? false,
    canSuperscript: ctx.editor.can().chain().toggleSuperscript().run() ?? false,
    isSubscript: ctx.editor.isActive("subscript") ?? false,
    canSubscript: ctx.editor.can().chain().toggleSubscript().run() ?? false,
    isInlineMath: ctx.editor.isActive("inlineMath") ?? false,

    // Block types
    isParagraph: ctx.editor.isActive("paragraph") ?? false,
    isHeading1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
    isHeading2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
    isHeading3: ctx.editor.isActive("heading", { level: 3 }) ?? false,
    isHeading4: ctx.editor.isActive("heading", { level: 4 }) ?? false,
    isHeading5: ctx.editor.isActive("heading", { level: 5 }) ?? false,
    isHeading6: ctx.editor.isActive("heading", { level: 6 }) ?? false,

    // Lists and blocks
    isBulletList: ctx.editor.isActive("bulletList") ?? false,
    isOrderedList: ctx.editor.isActive("orderedList") ?? false,
    isTaskList: ctx.editor.isActive("taskList") ?? false,
    isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
    isBlockquote: ctx.editor.isActive("blockquote") ?? false,

    // History
    canUndo: ctx.editor.can().chain().undo().run() ?? false,
    canRedo: ctx.editor.can().chain().redo().run() ?? false,
  };
}

export type MenuBarState = ReturnType<typeof menuBarStateSelector>;
