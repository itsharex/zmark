import type { Editor } from "@tiptap/core";
import {
  Bold,
  Code,
  CodeSquare,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  ListX,
  Minus,
  Pilcrow,
  Quote,
  Redo,
  Save,
  Strikethrough,
  Subscript,
  Superscript,
  Undo,
  WrapText,
} from "lucide-react";
import type { useKeyDisplay } from "@/hooks/use-key-display";
import type { MenuBarState } from "@/stores/editor";
import type { MenuButtonProps } from "./menu-button";

interface GetActionsParams {
  editor: Editor;
  editorState: MenuBarState;
  onSave: () => void;
  onImageUpload?: () => void;
  shortcuts: ReturnType<typeof useKeyDisplay>["shortcuts"];
}

export const getMainActions = ({
  editor,
  editorState,
  onSave,
  onImageUpload,
  shortcuts,
}: GetActionsParams): MenuButtonProps[] => [
  {
    icon: Save,
    label: "保存",
    shortcut: shortcuts.save,
    onClick: onSave,
  },
  {
    icon: Image,
    label: "上传图片",
    onClick: onImageUpload || (() => {}),
  },
  {
    icon: Bold,
    label: "加粗",
    shortcut: shortcuts.bold,
    onClick: () => editor.chain().focus().toggleBold().run(),
    isActive: editorState.isBold,
    disabled: !editorState.canBold,
  },
  {
    icon: Italic,
    label: "斜体",
    shortcut: shortcuts.italic,
    onClick: () => editor.chain().focus().toggleItalic().run(),
    isActive: editorState.isItalic,
    disabled: !editorState.canItalic,
  },
  {
    icon: Strikethrough,
    label: "删除线",
    onClick: () => editor.chain().focus().toggleStrike().run(),
    isActive: editorState.isStrike,
    disabled: !editorState.canStrike,
  },
  {
    icon: Superscript,
    label: "上标",
    shortcut: shortcuts.superscript,
    onClick: () => editor.chain().focus().toggleSuperscript().run(),
    isActive: editorState.isSuperscript,
    disabled: !editorState.canSuperscript,
  },
  {
    icon: Subscript,
    label: "下标",
    shortcut: shortcuts.subscript,
    onClick: () => editor.chain().focus().toggleSubscript().run(),
    isActive: editorState.isSubscript,
    disabled: !editorState.canSubscript,
  },
  {
    icon: Code,
    label: "代码",
    shortcut: shortcuts.code,
    onClick: () => editor.chain().focus().toggleCode().run(),
    isActive: editorState.isCode,
    disabled: !editorState.canCode,
  },
];

export const getNodeActions = ({
  editor,
  editorState,
  shortcuts,
}: GetActionsParams): MenuButtonProps[] => [
  {
    icon: ListX,
    label: "清除格式",
    onClick: () => editor.chain().focus().unsetAllMarks().run(),
  },
  {
    icon: WrapText,
    label: "清除节点",
    onClick: () => editor.chain().focus().clearNodes().run(),
  },
  {
    icon: Pilcrow,
    label: "段落",
    shortcut: shortcuts.paragraph,
    onClick: () => editor.chain().focus().setParagraph().run(),
    isActive: editorState.isParagraph,
  },
  {
    icon: List,
    label: "无序列表",
    shortcut: shortcuts.bulletList,
    onClick: () => editor.chain().focus().toggleBulletList().run(),
    isActive: editorState.isBulletList,
  },
  {
    icon: ListOrdered,
    label: "有序列表",
    shortcut: shortcuts.orderedList,
    onClick: () => editor.chain().focus().toggleOrderedList().run(),
    isActive: editorState.isOrderedList,
  },
  {
    icon: ListChecks,
    label: "任务列表",
    shortcut: shortcuts.taskList,
    onClick: () => editor.chain().focus().toggleTaskList().run(),
    isActive: editorState.isTaskList,
  },
  {
    icon: CodeSquare,
    label: "代码块",
    shortcut: shortcuts.codeBlock,
    onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    isActive: editorState.isCodeBlock,
  },
  {
    icon: Quote,
    label: "引用",
    shortcut: shortcuts.blockquote,
    onClick: () => editor.chain().focus().toggleBlockquote().run(),
    isActive: editorState.isBlockquote,
  },
  {
    icon: Minus,
    label: "水平线",
    onClick: () => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    icon: WrapText,
    label: "硬换行",
    shortcut: shortcuts.hardBreak,
    onClick: () => editor.chain().focus().setHardBreak().run(),
  },
];

export const getHistoryActions = ({
  editor,
  editorState,
  shortcuts,
}: GetActionsParams): MenuButtonProps[] => [
  {
    icon: Undo,
    label: "撤销",
    shortcut: shortcuts.undo,
    onClick: () => editor.chain().focus().undo().run(),
    disabled: !editorState.canUndo,
  },
  {
    icon: Redo,
    label: "重做",
    shortcut: shortcuts.redo,
    onClick: () => editor.chain().focus().redo().run(),
    disabled: !editorState.canRedo,
  },
];
