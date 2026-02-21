import { ChevronRight, Folder, File } from "lucide-react";
import { useEditorStore } from "@/stores/editor";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { join, sep } from "@tauri-apps/api/path";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getTreeKey } from "@/utils/file";
import { useCollapse } from "./collapse-provider";
import { useEffect, useState } from "react";

export type TreeItem = string | TreeItem[];

interface ITreeProps {
  item: TreeItem;
  basePath: string;
}

export const Tree = (props: ITreeProps) => {
  const { item, basePath } = props;
  const [isOpen, setIsOpen] = useState(
    typeof item !== "string" && (item[0] === "components" || item[0] === "ui")
  );
  const { subscribe } = useCollapse();

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setIsOpen(false);
    });
    return unsubscribe;
  }, [subscribe]);

  const { curPath, setCurPath, setContent } = useEditorStore();
  if (typeof item === "string") {
    const handleClick = async () => {
      const path = await join(basePath, item);
      setCurPath(path);
      const content = await readTextFile(path);
      setContent(content);
    };

    const fullPath = `${basePath}${sep}${item}`;
    const isActive = curPath === fullPath;

    return (
      <SidebarMenuButton
        isActive={isActive}
        className="data-[active=true]:bg-purple-100"
        onClick={handleClick}
      >
        <File />
        {item}
      </SidebarMenuButton>
    );
  }

  const [name, ...items] = item;
  const isEmpty = items.length === 0;

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {!isEmpty && (
            <SidebarMenuSub>
              {items.map((subItem) => (
                <Tree
                  key={getTreeKey(subItem)}
                  item={subItem}
                  basePath={basePath + "/" + name}
                />
              ))}
            </SidebarMenuSub>
          )}
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
