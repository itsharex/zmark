import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  ListX,
  Strikethrough,
} from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useKeyDisplay } from "@/hooks";
import { menuBarStateSelector } from "@/stores";
import { HighlightColorPicker } from "../menubar/highlight-picker";
import { LinkPopover } from "../menubar/link-popover";
import { MenuButton } from "../menubar/menu-button";
import { AiCopilotPopover } from "./ai-popover";

interface BubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: BubbleMenuProps) => {
  const { shortcuts } = useKeyDisplay();
  const [highlightOpen, setHighlightOpen] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 p-1 rounded-lg border border-border bg-background shadow-md overflow-hidden"
    >
      <TooltipProvider delayDuration={400}>
        <MenuButton
          icon={Bold}
          label="加粗"
          shortcut={shortcuts.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editorState.isBold}
          className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        />
        <MenuButton
          icon={Italic}
          label="斜体"
          shortcut={shortcuts.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editorState.isItalic}
          className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        />
        <MenuButton
          icon={Strikethrough}
          label="删除线"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editorState.isStrike}
          className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        />
        <MenuButton
          icon={Code}
          label="行内代码"
          shortcut={shortcuts.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editorState.isCode}
          className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        />
        <MenuButton
          icon={ListX}
          label="清除格式"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        />

        <div className="w-px h-4 bg-border mx-0.5" />

        <AiCopilotPopover editor={editor} shortcut={shortcuts.aiCopilot} />
        <LinkPopover editor={editor} shortcut={shortcuts.link} />

        <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
          <PopoverTrigger asChild>
            <MenuButton
              icon={Highlighter}
              label="高亮"
              onClick={() => setHighlightOpen(true)}
              isActive={editorState.isHighlight}
              className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-none shadow-none bg-transparent"
            sideOffset={12}
          >
            <div className="bg-background border border-border rounded-full shadow-lg overflow-hidden">
              <HighlightColorPicker
                editor={editor}
                currentColor={editorState.currentHighlightColor}
                onClose={() => setHighlightOpen(false)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </TooltipProvider>
    </BubbleMenu>
  );
};
