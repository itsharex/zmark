import { sep } from "@tauri-apps/api/path";
import { ask } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { ChevronRight, File, Folder, PenLine, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TruncatedTooltip } from "@/components/common/truncated-tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { useCollapse } from "@/providers/collapse-provider";
import { useEditorStore } from "@/stores";
import type { TreeItem } from "@/types/editor";
import {
  deleteFileOrDir,
  getTreeKey,
  renameFileOrDir,
  resolveMarkdownImages,
  to,
} from "@/utils";
import { parseMarkdown } from "@/utils/frontmatter";
import { InputDialog } from "./input-dialog";

interface ITreeProps {
  item: TreeItem;
  basePath: string;
  onRefresh?: () => void;
}

export const Tree = (props: ITreeProps) => {
  const { item, basePath, onRefresh } = props;
  const [isOpen, setIsOpen] = useState(
    typeof item !== "string" && (item[0] === "components" || item[0] === "ui"),
  );
  const { subscribe } = useCollapse();

  // Rename state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setIsOpen(false);
    });
    return unsubscribe;
  }, [subscribe]);

  const {
    curPath,
    setCurPath,
    setContent,
    setFrontmatter,
    setPreviewPath,
    previewPath,
  } = useEditorStore();

  const separator = sep();
  const itemName = typeof item === "string" ? item : (item[0] as string);
  const fullPath = basePath.endsWith(separator)
    ? `${basePath}${itemName}`
    : `${basePath}${separator}${itemName}`;

  const handleRename = () => {
    // If it's a markdown file, remove extension for display
    if (typeof item === "string" && itemName.endsWith(".md")) {
      setRenameValue(itemName.slice(0, -3));
    } else {
      setRenameValue(itemName);
    }
    setRenameOpen(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!newName) return;
    let finalName = newName;
    // If file, ensure extension
    if (typeof item === "string" && !finalName.endsWith(".md")) {
      finalName += ".md";
    }

    if (finalName === itemName) return;

    const [err, newPath] = await to(renameFileOrDir(fullPath, finalName));
    if (err) {
      console.error(err);
      toast.error("重命名失败");
      return;
    }

    toast.success("重命名成功");

    if (newPath) {
      if (curPath === fullPath) {
        setCurPath(newPath);
      } else if (curPath.startsWith(fullPath + separator)) {
        // Update path if parent directory was renamed
        const suffix = curPath.slice(fullPath.length);
        setCurPath(newPath + suffix);
      }
    }

    onRefresh?.();
  };

  const handleDelete = async () => {
    const confirmed = await ask(`确定要删除 "${itemName}" 吗？`, {
      title: "确认删除",
      kind: "warning",
    });

    if (confirmed) {
      const [err] = await to(deleteFileOrDir(fullPath));
      if (err) {
        console.error(err);
        toast.error("删除失败");
        return;
      }

      toast.success("删除成功");

      // If current file is deleted, clear editor?
      if (curPath === fullPath) {
        setCurPath("");
        setContent("");
      }

      onRefresh?.();
    }
  };

  if (typeof item === "string") {
    const handleClick = async () => {
      setPreviewPath(fullPath);
    };

    const handleDoubleClick = async () => {
      setCurPath(fullPath);
      // Only read content for markdown files
      if (fullPath.endsWith(".md")) {
        const content = await readTextFile(fullPath);
        const { frontmatter, body } = parseMarkdown(content);
        const resolvedContent = await resolveMarkdownImages(body, fullPath);
        setFrontmatter(frontmatter);
        setContent(resolvedContent);
      } else {
        setFrontmatter({});
        setContent(""); // Clear content for unsupported files
      }
    };

    const isActive = curPath === fullPath;
    const isPreview = !isActive && previewPath === fullPath;

    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleRename}>
              <PenLine className="mr-2 h-4 w-4" />
              重命名
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <InputDialog
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
          onConfirm={handleConfirmRename}
          title="重命名"
          initialValue={renameValue}
        />
      </>
    );
  }

  const [name, ...items] = item;
  const isEmpty = items.length === 0;

  const handleClick = async () => {
    setPreviewPath(fullPath);
  };

  const isPreview = previewPath === fullPath;

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleRename}>
              <PenLine className="mr-2 h-4 w-4" />
              重命名
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <CollapsibleContent>
          {!isEmpty && (
            <SidebarMenuSub>
              {items.map((subItem) => (
                <Tree
                  key={getTreeKey(subItem)}
                  item={subItem}
                  basePath={fullPath}
                  onRefresh={onRefresh}
                />
              ))}
            </SidebarMenuSub>
          )}
        </CollapsibleContent>
      </Collapsible>
      <InputDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onConfirm={handleConfirmRename}
        title="重命名"
        initialValue={renameValue}
      />
    </SidebarMenuItem>
  );
};
