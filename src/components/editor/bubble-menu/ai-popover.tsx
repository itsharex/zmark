import type { Editor } from "@tiptap/core";
import { Sparkles, Wand2 } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAiCopilot, useEnterSubmit } from "@/hooks";
import { MenuButton } from "../menubar/menu-button";

interface AiCopilotPopoverProps {
  editor: Editor | null;
  shortcut?: string;
}

type Measurable = {
  getBoundingClientRect(): DOMRect;
};

export const AiCopilotPopover = ({
  editor,
  shortcut,
}: AiCopilotPopoverProps) => {
  const {
    isOpen,
    setIsOpen,
    isGenerating,
    prompt,
    setPrompt,
    runAiCopilot,
    toggleCopilot,
    virtualElement,
  } = useAiCopilot(editor);
  const enterSubmit = useEnterSubmit({
    enabled: Boolean(prompt.trim()),
    onEnter: () => runAiCopilot(prompt),
  });

  if (!editor) return null;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          toggleCopilot();
        } else {
          setIsOpen(false);
          setPrompt("");
        }
      }}
    >
      {virtualElement ? (
        <PopoverAnchor
          virtualRef={{ current: virtualElement } as RefObject<Measurable>}
        />
      ) : null}
      <PopoverTrigger asChild>
        <MenuButton
          icon={Sparkles}
          label="AI 助手"
          shortcut={shortcut}
          isActive={isOpen || isGenerating}
          className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent text-primary hover:text-primary/80 transition-colors"
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 flex flex-col gap-3 shadow-xl"
        align="start"
        sideOffset={12}
      >
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AI Copilot</span>
        </div>
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            placeholder="告诉 AI 你想如何处理这段文本..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={enterSubmit.onKeyDown}
            onCompositionStart={enterSubmit.onCompositionStart}
            onCompositionEnd={enterSubmit.onCompositionEnd}
            disabled={isGenerating}
            className="h-9"
          />
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() => runAiCopilot("润色并改善这段文本的表达")}
            >
              ✨ 润色文本
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() => runAiCopilot("将这段文本翻译成英文")}
            >
              🌐 翻译为英文
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() => runAiCopilot("总结这段文本的核心要点")}
            >
              📝 总结要点
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() => runAiCopilot("修复这段文本中的错别字和语法错误")}
            >
              🔧 修复语法
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
