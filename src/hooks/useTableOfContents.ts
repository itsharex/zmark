import type { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";

export type TocItem = {
  id: string;
  text: string;
  level: number;
  pos: number;
  indent?: number;
};

export const useTableOfContents = (editor: Editor | null) => {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateToc = () => {
      const headings: TocItem[] = [];
      const { doc } = editor.state;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          // Ignore empty headings
          if (node.textContent.trim().length === 0) {
            return;
          }

          const id = `heading-${pos}`;

          headings.push({
            id,
            text: node.textContent,
            level: node.attrs.level,
            pos,
          });
        }
      });

      // Calculate relative indentation
      const minLevel = headings.reduce(
        (min, item) => Math.min(min, item.level),
        6,
      );

      const headingsWithIndent = headings.map((item) => ({
        ...item,
        indent: item.level - minLevel,
      }));

      setItems(headingsWithIndent);
    };

    // Initial update
    updateToc();

    editor.on("update", updateToc);

    return () => {
      editor.off("update", updateToc);
    };
  }, [editor]);

  return items;
};
