import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
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
  Italic,
  List,
  ListOrdered,
  ListX,
  Minus,
  Pilcrow,
  Quote,
  Redo,
  Save,
  Strikethrough,
  Undo,
  WrapText,
} from "lucide-react";
import { menuBarStateSelector } from "./menubar-state.ts";
import { useEffect, useState } from "react";

type MenuBarProps = {
  editor: Editor | null;
  onSave: () => void;
};

export const MenuBar = ({ editor, onSave }: MenuBarProps) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  if (!editor) return null;
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  const modKey = isMac ? "⌘" : "Ctrl";
  const altKey = isMac ? "⌥" : "Alt";

  return (
    <div className="sticky top-2 z-10 flex justify-center">
      <div className="rounded-lg border border-white/60 bg-white/50 p-2 shadow-md backdrop-blur-md">
        <div className="button-group">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onSave}>
                  <Save size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>保存 ({modKey}+S)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={!editorState.canBold}
                  className={editorState.isBold ? "is-active" : ""}
                >
                  <Bold size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>加粗 ({modKey}+B)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={!editorState.canItalic}
                  className={editorState.isItalic ? "is-active" : ""}
                >
                  <Italic size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>斜体 ({modKey}+I)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  disabled={!editorState.canStrike}
                  className={editorState.isStrike ? "is-active" : ""}
                >
                  <Strikethrough size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除线</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  disabled={!editorState.canCode}
                  className={editorState.isCode ? "is-active" : ""}
                >
                  <Code size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>代码 ({modKey}+E)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().unsetAllMarks().run()}
                >
                  <ListX size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>清除格式</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().clearNodes().run()}
                >
                  <WrapText size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>清除节点</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  className={editorState.isParagraph ? "is-active" : ""}
                >
                  <Pilcrow size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>段落 ({modKey}+{altKey}+0)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={editorState.isHeading1 ? "is-active" : ""}
                >
                  <Heading1 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标题 1 ({modKey}+{altKey}+1)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={editorState.isHeading2 ? "is-active" : ""}
                >
                  <Heading2 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标题 2 ({modKey}+{altKey}+2)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={editorState.isHeading3 ? "is-active" : ""}
                >
                  <Heading3 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标题 3 ({modKey}+{altKey}+3)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 4 }).run()
                  }
                  className={editorState.isHeading4 ? "is-active" : ""}
                >
                  <Heading4 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标题 4 ({modKey}+{altKey}+4)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 5 }).run()
                  }
                  className={editorState.isHeading5 ? "is-active" : ""}
                >
                  <Heading5 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标题 5 ({modKey}+{altKey}+5)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 6 }).run()
                  }
                  className={editorState.isHeading6 ? "is-active" : ""}
                >
                  <Heading6 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标题 6 ({modKey}+{altKey}+6)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className={editorState.isBulletList ? "is-active" : ""}
                >
                  <List size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>无序列表 ({modKey}+Shift+8)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className={editorState.isOrderedList ? "is-active" : ""}
                >
                  <ListOrdered size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>有序列表 ({modKey}+Shift+7)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleCodeBlock().run()
                  }
                  className={editorState.isCodeBlock ? "is-active" : ""}
                >
                  <CodeSquare size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>代码块 ({modKey}+{altKey}+C)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className={editorState.isBlockquote ? "is-active" : ""}
                >
                  <Quote size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>引用 ({modKey}+Shift+B)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                >
                  <Minus size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>水平线</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().setHardBreak().run()}
                >
                  <WrapText size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>硬换行 (Shift+Enter)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editorState.canUndo}
                >
                  <Undo size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>撤销 ({modKey}+Z)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editorState.canRedo}
                >
                  <Redo size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>重做 ({isMac ? `${modKey}+Shift+Z` : `${modKey}+Y`})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
