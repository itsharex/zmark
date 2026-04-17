import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

export function useMathPopover(editor: Editor) {
  const [latex, setLatex] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      if (editor.isActive("inlineMath")) {
        const { latex } = editor.getAttributes("inlineMath");
        setLatex(latex || "");
      } else if (editor.isActive("blockMath")) {
        const { latex } = editor.getAttributes("blockMath");
        setLatex(latex || "");
      } else {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to);
        setLatex(text);
      }
    };

    editor.on("selectionUpdate", updateState);
    editor.on("transaction", updateState);

    return () => {
      editor.off("selectionUpdate", updateState);
      editor.off("transaction", updateState);
    };
  }, [editor]);

  const setMath = useCallback(
    (latexInput: string) => {
      if (!editor) return;

      if (editor.isActive("inlineMath")) {
        editor
          .chain()
          .focus()
          .updateAttributes("inlineMath", { latex: latexInput })
          .run();
      } else if (editor.isActive("blockMath")) {
        editor
          .chain()
          .focus()
          .updateAttributes("blockMath", { latex: latexInput })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "inlineMath",
            attrs: { latex: latexInput },
          })
          .run();
      }
      setIsOpen(false);
    },
    [editor],
  );

  return {
    latex,
    setMath,
    isOpen,
    setIsOpen,
  };
}
