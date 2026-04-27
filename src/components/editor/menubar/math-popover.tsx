import type { Editor } from "@tiptap/core";
import { Check, Sigma } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEnterSubmit, useMathPopover } from "@/hooks";
import { MenuButton } from "./menu-button";

export const MathPopoverContent = ({
  latex,
  setLatex,
  handleSetMath,
}: {
  latex: string;
  setLatex: (val: string) => void;
  handleSetMath: () => void;
}) => (
  <div className="flex items-center gap-1 px-3 py-1.5 w-[320px]">
    <MathInput
      latex={latex}
      setLatex={setLatex}
      handleSetMath={handleSetMath}
    />
    <Button
      size="icon"
      variant="ghost"
      onClick={handleSetMath}
      className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
      title="应用 (Enter)"
    >
      <Check className="h-4 w-4" />
    </Button>
  </div>
);

const MathInput = ({
  latex,
  setLatex,
  handleSetMath,
}: {
  latex: string;
  setLatex: (val: string) => void;
  handleSetMath: () => void;
}) => {
  const enterSubmit = useEnterSubmit({ onEnter: handleSetMath });

  return (
    <Input
      placeholder="输入 LaTeX 公式..."
      value={latex}
      onChange={(e) => setLatex(e.target.value)}
      onKeyDown={enterSubmit.onKeyDown}
      onCompositionStart={enterSubmit.onCompositionStart}
      onCompositionEnd={enterSubmit.onCompositionEnd}
      className="flex-1 h-8 text-sm border-none shadow-none focus-visible:ring-0 px-1 bg-transparent hover:bg-transparent!"
    />
  );
};

export const MathPopover = ({ editor }: { editor: Editor }) => {
  const { latex, setMath, isOpen, setIsOpen } = useMathPopover(editor);
  const [internalLatex, setInternalLatex] = useState(latex);

  useEffect(() => {
    setInternalLatex(latex);
  }, [latex]);

  const handleSetMath = useCallback(() => {
    setMath(internalLatex);
  }, [internalLatex, setMath]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton
          icon={Sigma}
          label="数学公式"
          onClick={() => setIsOpen(true)}
          isActive={
            editor.isActive("inlineMath") || editor.isActive("blockMath")
          }
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-full shadow-lg border border-border bg-background overflow-hidden"
        align="start"
        sideOffset={8}
      >
        <MathPopoverContent
          latex={internalLatex}
          setLatex={setInternalLatex}
          handleSetMath={handleSetMath}
        />
      </PopoverContent>
    </Popover>
  );
};
