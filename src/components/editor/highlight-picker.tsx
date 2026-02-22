import type { Editor } from "@tiptap/core";
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLORS } from "./const";

export const HighlightColorPicker = ({
  editor,
  currentColor,
  onClose,
}: {
  editor: Editor;
  currentColor: string | null;
  onClose: () => void;
}) => {
  const effectiveColor = currentColor || DEFAULT_HIGHLIGHT_COLOR;

  const handleColorClick = (color: string) => {
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      onClose();
      return;
    }

    if (effectiveColor === color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    onClose();
  };

  return (
    <div className="flex gap-1.5 p-1">
      {HIGHLIGHT_COLORS.map(({ name, color }) => (
        <button
          key={name}
          type="button"
          onClick={() => handleColorClick(color)}
          className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
            effectiveColor === color
              ? "border-gray-800 ring-2 ring-gray-400 ring-offset-1"
              : "border-gray-300"
          }`}
          style={{ backgroundColor: color }}
          title={name}
        />
      ))}
    </div>
  );
};
