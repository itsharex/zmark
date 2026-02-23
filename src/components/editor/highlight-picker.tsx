import type { Editor } from "@tiptap/core";
import { Ban } from "lucide-react";
import { HIGHLIGHT_COLORS } from "./const";

export const HighlightColorPicker = ({
  editor,
  currentColor,
  onClose,
}: {
  editor: Editor;
  currentColor: string | null;
  onClose: () => void;
}) => {
  const handleColorClick = (color: string) => {
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      // 如果光标不在内容内部 表示接下来输入的不要高光了
      const $to = editor.state.selection.$to;
      const highlightMarkType = editor.schema.marks.highlight;
      const nodeAfter = $to.nodeAfter;
      const nextHasSameHighlight = nodeAfter?.marks.some(
        (m) => m.type === highlightMarkType && m.attrs.color === color
      );
      const isAtHighlightEnd = currentColor === color && !nextHasSameHighlight;

      if (isAtHighlightEnd) {
        editor.chain().focus().unsetHighlight().run();
      }
      onClose();
      return;
    }

    if (currentColor === color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 p-1">
      {HIGHLIGHT_COLORS.map(({ label, value, border }) => (
        <button
          key={label}
          type="button"
          onClick={() => handleColorClick(value)}
          className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
            currentColor === value
              ? "ring-2 ring-offset-1 ring-gray-400"
              : ""
          }`}
          style={{
            backgroundColor: value,
            borderColor: border,
            borderRadius: "50%",
          }}
          title={label}
        />
      ))}
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().unsetHighlight().run();
          onClose();
        }}
        className="p-0! w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
        title="取消高亮"
      >
        <Ban size={22} />
      </button>
    </div>
  );
};
