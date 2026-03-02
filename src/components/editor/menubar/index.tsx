import type { Editor } from "@tiptap/core";
import { Highlighter } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HighlightColorPicker } from "./highlight-picker";
import { MenuButton } from "./menu-button";
import { useMenuBar } from "./use-menu-bar";

type MenuBarProps = {
  editor: Editor;
  onSave: () => void;
};

export const MenuBar = ({ editor, onSave }: MenuBarProps) => {
  const {
    highlightPopoverOpen,
    setHighlightPopoverOpen,
    mainActions,
    nodeActions,
    historyActions,
    shortcuts,
    editorState,
  } = useMenuBar(editor, onSave);

  return (
    <div className="w-full sticky top-2 z-10 flex justify-center">
      <div className="rounded-lg border border-border bg-background/95 p-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.15)] backdrop-blur-md">
        <div className="button-group">
          <TooltipProvider>
            {mainActions.map((action) => (
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
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
