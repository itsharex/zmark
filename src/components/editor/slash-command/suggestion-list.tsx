import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/utils";
import type {
  SuggestionItem,
  SuggestionListProps,
  SuggestionListRef,
} from "./type";

export const SuggestionList = forwardRef<
  SuggestionListRef,
  SuggestionListProps
>((editorContext: SuggestionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = editorContext.items[index];
    if (item) {
      editorContext.onSelect(item);
    }
  };

  useEffect(() => {
    if (editorContext.items.length) {
      setSelectedIndex(0);
    }
  }, [editorContext.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + editorContext.items.length - 1) %
            editorContext.items.length,
        );
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % editorContext.items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 min-w-45 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
      {editorContext.items.length ? (
        <div className="flex flex-col gap-0.5">
          {editorContext.items.map((item, index) => (
            <button
              key={item.title}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                index === selectedIndex && "bg-accent text-accent-foreground",
              )}
              onClick={() => selectItem(index)}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setSelectedIndex(index)}
              type="button"
            >
              <div className="flex h-5 w-5 items-center justify-center text-muted-foreground">
                {item.icon}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate font-medium">{item.title}</span>
                {item.description && (
                  <span className="truncate text-[10px] text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          No results
        </div>
      )}
    </div>
  );
});

SuggestionList.displayName = "SuggestionList";

export const getSuggestionItems: () => SuggestionItem[] = () => {
  return [
    {
      title: "Text",
      description: "Just start typing with plain text.",
      icon: <Type size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode("paragraph").run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading.",
      icon: <Heading1 size={16} />,
      run: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading.",
      icon: <Heading2 size={16} />,
      run: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading.",
      icon: <Heading3 size={16} />,
      run: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Bullet List",
      description: "Create a simple bulleted list.",
      icon: <List size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering.",
      icon: <ListOrdered size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Task List",
      description: "Track tasks with checkboxes.",
      icon: <ListChecks size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quotation.",
      icon: <Quote size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Code Block",
      description: "Capture a code snippet.",
      icon: <Code size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Divider",
      description: "Visually divide your content.",
      icon: <Minus size={16} />,
      run: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];
};
