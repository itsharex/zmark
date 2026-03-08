import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from "lucide-react";
import type { MenuBarState } from "@/stores/editor";

type HeadingPickerProps = {
  editor: Editor;
  editorState: MenuBarState;
  onClose: () => void;
};

export const HeadingPicker = ({
  editor,
  editorState,
  onClose,
}: HeadingPickerProps) => {
  const headings = [
    {
      level: 1,
      icon: Heading1,
      label: "标题 1",
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editorState.isHeading1,
    },
    {
      level: 2,
      icon: Heading2,
      label: "标题 2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editorState.isHeading2,
    },
    {
      level: 3,
      icon: Heading3,
      label: "标题 3",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editorState.isHeading3,
    },
    {
      level: 4,
      icon: Heading4,
      label: "标题 4",
      onClick: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
      isActive: editorState.isHeading4,
    },
    {
      level: 5,
      icon: Heading5,
      label: "标题 5",
      onClick: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
      isActive: editorState.isHeading5,
    },
    {
      level: 6,
      icon: Heading6,
      label: "标题 6",
      onClick: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
      isActive: editorState.isHeading6,
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1">
      {headings.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`flex items-center justify-center w-8 h-8 rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
            item.isActive ? "bg-accent text-accent-foreground" : ""
          }`}
          title={item.label}
        >
          <item.icon className="h-4 w-4 shrink-0" />
        </button>
      ))}
    </div>
  );
};
