import type { Editor } from "@tiptap/core";
import { Highlighter, List } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMenuBar } from "@/hooks/use-menu-bar";
import { handleImageUpload } from "@/utils/file";
import { HighlightColorPicker } from "./highlight-picker";
import { LinkPopover } from "./link-popover";
import { MenuButton } from "./menu-button";

type MenuBarProps = {
  editor: Editor;
  onSave: () => void;
  isTocOpen: boolean;
  onToggleToc: () => void;
};

export const MenuBar = ({
  editor,
  onSave,
  isTocOpen,
  onToggleToc,
}: MenuBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 菜单栏图片按钮的点击回调，通过 ref 间接点击隐藏的 input
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const url = await handleImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("图片已上传");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(`图片上传失败: ${errorMessage}`);
      }
    }
    // 重置 input，方便下次选择同一张图
    event.target.value = "";
  };

  const {
    highlightPopoverOpen,
    setHighlightPopoverOpen,
    mainActions,
    nodeActions,
    historyActions,
    shortcuts,
    editorState,
  } = useMenuBar(editor, onSave, handleImageButtonClick);

  return (
    <div className="w-full sticky top-2 z-10 flex justify-center">
      {/* 隐藏的文件输入框：
          1. 用于调用系统的文件选择器（浏览器安全限制必须使用原生 input）
          2. 设置为 hidden 隐藏默认样式，通过 fileInputRef.current?.click() 被间接触发
      */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="rounded-lg border border-border bg-background/95 p-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.15)] backdrop-blur-md">
        <div className="button-group">
          <TooltipProvider>
            {mainActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <LinkPopover editor={editor} shortcut={shortcuts.link} />

            <Popover
              open={highlightPopoverOpen}
              onOpenChange={setHighlightPopoverOpen}
            >
              <PopoverTrigger asChild>
                <MenuButton
                  icon={Highlighter}
                  label="高亮"
                  shortcut={shortcuts.highlight}
                  disabled={!editorState.canHighlight}
                  isActive={editorState.isHighlight}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <HighlightColorPicker
                  editor={editor}
                  currentColor={editorState.currentHighlightColor}
                  onClose={() => setHighlightPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            {nodeActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            {historyActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <MenuButton
              icon={List}
              label={isTocOpen ? "隐藏目录" : "显示目录"}
              onClick={onToggleToc}
              isActive={isTocOpen}
            />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
