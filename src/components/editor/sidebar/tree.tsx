import { join, sep } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { ChevronRight, File, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCollapse } from "@/providers/collapse-provider";
import { useEditorStore } from "@/stores/editor";
import type { TreeItem } from "@/types/editor";
import { getTreeKey } from "@/utils/file";
import { TruncatedTooltip } from "../../common/truncated-tooltip";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "../../ui/sidebar";

interface ITreeProps {
  item: TreeItem;
  basePath: string;
}

export const Tree = (props: ITreeProps) => {
  const { item, basePath } = props;
  const [isOpen, setIsOpen] = useState(
    typeof item !== "string" && (item[0] === "components" || item[0] === "ui"),
  );
  const { subscribe } = useCollapse();

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setIsOpen(false);
    });
    return unsubscribe;
  }, [subscribe]);

  const { curPath, setCurPath, setContent, setPreviewPath, previewPath } =
    useEditorStore();
  if (typeof item === "string") {
    const handleClick = async () => {
      const path = await join(basePath, item);
      setPreviewPath(path);
    };

    const handleDoubleClick = async () => {
      const path = await join(basePath, item);
      setCurPath(path);
      const content = await readTextFile(path);
      setContent(content);
    };

    const isActive = curPath.split(sep()).pop() === item;
    const isPreview =
      !isActive && !!previewPath && previewPath.split(sep()).pop() === item;

    return (
      <SidebarMenuButton
        isActive={isActive}
        data-preview={isPreview}
        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground! data-[active=true]:hover:bg-primary/80! data-[preview=true]:bg-primary/10 dark:data-[preview=true]:bg-primary/20"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <File />
        <TruncatedTooltip content={item} />
      </SidebarMenuButton>
    );
  }

  const [name, ...items] = item;
  const isEmpty = items.length === 0;

  const handleClick = async () => {
    const path = await join(basePath, name as string);
    setPreviewPath(path);
  };

  const isPreview = !!previewPath && previewPath.split(sep()).pop() === name;

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            data-preview={isPreview}
            className="data-[preview=true]:bg-primary/10 dark:data-[preview=true]:bg-primary/20"
            onClick={handleClick}
          >
            <ChevronRight className="transition-transform" />
            <Folder />
            <TruncatedTooltip content={name} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {!isEmpty && (
            <SidebarMenuSub>
              {items.map((subItem) => (
                <Tree
                  key={getTreeKey(subItem)}
                  item={subItem}
                  basePath={`${basePath}/${name as string}`}
                />
              ))}
            </SidebarMenuSub>
          )}
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
