import type { Editor } from "@tiptap/core";
import {
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Highlighter,
  History,
  List,
  ListChecks,
  ListOrdered,
  ListTree,
  TableOfContents,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMenuBar } from "@/hooks";
import { handleImageUpload } from "@/utils";
import { to } from "@/utils/error-handler";
import { HeadingPicker } from "./heading-picker";
import { HighlightColorPicker } from "./highlight-picker";
import { LinkPopover } from "./link-popover";
import { ListPicker } from "./list-picker";
import { MathPopover } from "./math-popover";
import { MenuButton } from "./menu-button";

type MenuBarProps = {
  editor: Editor;
  isTocOpen: boolean;
  onToggleToc: () => void;
  hasHeadings: boolean;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
};

export const MenuBar = ({
  editor,
  isTocOpen,
  onToggleToc,
  hasHeadings,
  isHistoryOpen,
  onToggleHistory,
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
      const [err, url] = await to(handleImageUpload(file));
      if (err) {
        const errorMessage = err.message || String(err);
        toast.error(`图片上传失败: ${errorMessage}`);
      } else if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("图片已上传");
      }
    }
    // 重置 input，方便下次选择同一张图
    event.target.value = "";
  };

  const {
    highlightPopoverOpen,
    setHighlightPopoverOpen,
    headingPopoverOpen,
    setHeadingPopoverOpen,
    listPopoverOpen,
    setListPopoverOpen,
    historyActions,
    textActions,
    insertActions,
    shortcuts,
    editorState,
  } = useMenuBar(editor, handleImageButtonClick);

  // 计算当前应该显示的标题图标
  const getCurrentHeadingIcon = () => {
    if (editorState.isHeading1) return Heading1;
    if (editorState.isHeading2) return Heading2;
    if (editorState.isHeading3) return Heading3;
    if (editorState.isHeading4) return Heading4;
    if (editorState.isHeading5) return Heading5;
    if (editorState.isHeading6) return Heading6;
    return Heading;
  };

  // 计算当前应该显示的列表图标
  const getCurrentListIcon = () => {
    if (editorState.isOrderedList) return ListOrdered;
    if (editorState.isTaskList) return ListChecks;
    if (editorState.isBulletList) return List;
    return ListTree;
  };

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
            {historyActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <Popover
              open={headingPopoverOpen}
              onOpenChange={setHeadingPopoverOpen}
            >
              <PopoverTrigger asChild>
                <MenuButton
                  icon={getCurrentHeadingIcon()}
                  label="标题"
                  isActive={
                    editorState.isHeading1 ||
                    editorState.isHeading2 ||
                    editorState.isHeading3 ||
                    editorState.isHeading4 ||
                    editorState.isHeading5 ||
                    editorState.isHeading6
                  }
                />
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="center"
                side="bottom"
              >
                <HeadingPicker
                  editor={editor}
                  editorState={editorState}
                  onClose={() => setHeadingPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            {textActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

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
              <PopoverContent className="w-auto p-2" side="bottom">
                <HighlightColorPicker
                  editor={editor}
                  currentColor={editorState.currentHighlightColor}
                  onClose={() => setHighlightPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            <LinkPopover editor={editor} shortcut={shortcuts.link} />
            <MathPopover editor={editor} />

            {insertActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <Popover open={listPopoverOpen} onOpenChange={setListPopoverOpen}>
              <PopoverTrigger asChild>
                <MenuButton
                  icon={getCurrentListIcon()}
                  label="列表"
                  isActive={
                    editorState.isBulletList ||
                    editorState.isOrderedList ||
                    editorState.isTaskList
                  }
                />
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="center"
                side="bottom"
              >
                <ListPicker
                  editor={editor}
                  editorState={editorState}
                  onClose={() => setListPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            <MenuButton
              icon={TableOfContents}
              label={isTocOpen ? "隐藏目录" : "显示目录"}
              onClick={onToggleToc}
              isActive={isTocOpen}
              isVisible={hasHeadings}
            />

            <MenuButton
              icon={History}
              label={isHistoryOpen ? "隐藏对比" : "版本对比"}
              onClick={onToggleHistory}
              isActive={isHistoryOpen}
            />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
