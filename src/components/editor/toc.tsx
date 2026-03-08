import type { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TocItem = {
  id: string;
  text: string;
  level: number;
  pos: number;
  indent?: number;
};

interface TableOfContentsProps {
  editor: Editor | null;
}

export const TableOfContents = ({ editor }: TableOfContentsProps) => {
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

  if (!editor || items.length === 0) {
    return null;
  }

  const handleItemClick = (pos: number) => {
    if (!editor) return;

    // 1. 设置选中状态并聚焦
    editor.commands.setTextSelection(pos);
    editor.commands.focus();

    // 2. 自定义平滑滚动到屏幕中间
    // 使用 requestAnimationFrame 确保在 Tiptap 默认滚动之后执行
    requestAnimationFrame(() => {
      const scrollContainer = editor.view.dom.parentElement;
      if (scrollContainer) {
        const node = editor.view.nodeDOM(pos) as HTMLElement;
        if (node) {
          // 使用 getBoundingClientRect 计算相对位置，避免 offsetTop 的上下文问题
          const containerRect = scrollContainer.getBoundingClientRect();
          const nodeRect = node.getBoundingClientRect();

          // 当前元素中心相对于视口的位置
          const nodeCenter = nodeRect.top + nodeRect.height / 2;
          // 容器中心相对于视口的位置
          const containerCenter = containerRect.top + containerRect.height / 2;

          // 需要滚动的距离
          const delta = nodeCenter - containerCenter;

          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + delta,
            behavior: "smooth",
          });
        }
      }
    });
  };

  return (
    <div className="w-64 border-l bg-background/50 p-4 shrink-0 h-full overflow-y-auto">
      <div className="font-medium text-sm mb-4 text-muted-foreground">大纲</div>
      <div className="flex flex-col space-y-1">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handleItemClick(item.pos)}
            className={cn(
              "text-left text-sm transition-colors hover:text-foreground py-1 block w-full truncate text-muted-foreground",
            )}
            style={{ paddingLeft: `${(item.indent || 0) * 16}px` }}
            title={item.text}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
};
