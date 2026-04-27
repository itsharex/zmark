import type { Editor } from "@tiptap/core";
import { CornerDownLeft, Link2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useEnterSubmit, useLinkPopover } from "@/hooks";
import { MenuButton } from "./menu-button";

export const LinkPopoverContent = ({
  internalUrl,
  setInternalUrl,
  handleSetLink,
  removeLink,
}: {
  internalUrl: string;
  setInternalUrl: (url: string) => void;
  handleSetLink: () => void;
  removeLink: () => void;
}) => (
  <div className="flex items-center gap-1 px-3 py-1.5 w-[320px]">
    <LinkInput
      internalUrl={internalUrl}
      setInternalUrl={setInternalUrl}
      handleSetLink={handleSetLink}
    />
    <Button
      size="icon"
      variant="ghost"
      onClick={handleSetLink}
      className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
      title="应用 (Enter)"
    >
      <CornerDownLeft className="h-4 w-4" />
    </Button>
    <Separator orientation="vertical" className="h-8 mx-1 bg-border" />
    <Button
      size="icon"
      variant="ghost"
      onClick={removeLink}
      className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
      title="移除链接"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

const LinkInput = ({
  internalUrl,
  setInternalUrl,
  handleSetLink,
}: {
  internalUrl: string;
  setInternalUrl: (url: string) => void;
  handleSetLink: () => void;
}) => {
  const enterSubmit = useEnterSubmit({ onEnter: handleSetLink });

  return (
    <Input
      placeholder="输入链接地址..."
      value={internalUrl}
      onChange={(e) => setInternalUrl(e.target.value)}
      onKeyDown={enterSubmit.onKeyDown}
      onCompositionStart={enterSubmit.onCompositionStart}
      onCompositionEnd={enterSubmit.onCompositionEnd}
      className="flex-1 h-8 text-sm border-none shadow-none focus-visible:ring-0 px-1 bg-transparent hover:bg-transparent!"
    />
  );
};

export const LinkPopover = ({
  editor,
  shortcut,
}: {
  editor: Editor;
  shortcut?: string;
}) => {
  const { url, setUrl, setLink, removeLink, isOpen, setIsOpen } =
    useLinkPopover(editor);
  const [internalUrl, setInternalUrl] = useState(url);

  useEffect(() => {
    setInternalUrl(url);
  }, [url]);

  const handleSetLink = useCallback(() => {
    setUrl(internalUrl);
    setLink(internalUrl);
    setIsOpen(false);
  }, [internalUrl, setLink, setIsOpen, setUrl]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton
          icon={Link2}
          label="链接"
          shortcut={shortcut}
          onClick={() => setIsOpen(true)}
          isActive={editor.isActive("link")}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-full shadow-lg border border-border bg-background overflow-hidden"
        align="start"
        sideOffset={8}
      >
        <LinkPopoverContent
          internalUrl={internalUrl}
          setInternalUrl={setInternalUrl}
          handleSetLink={handleSetLink}
          removeLink={removeLink}
        />
      </PopoverContent>
    </Popover>
  );
};
