import { GalleryVerticalEndIcon } from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  createDirectory,
  createFile,
  getDataDir,
  getFileTree,
  getTreeKey,
} from "@/utils/file";
import { useEffect, useState } from "react";
import { Tree, TreeItem } from "./tree";
import { InputDialog } from "./input-dialog";
import { CollapseProvider } from "./collapse-provider";
import { ActionButtons } from "./action-buttons";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [fileTree, setFileTree] = useState<TreeItem[]>([]);
  const [basePath, setBasePath] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    onConfirm: (value: string) => void;
  } | null>(null);

  const refreshFileTree = async () => {
    const files = await getFileTree();
    setFileTree(files);
  };

  useEffect(() => {
    const fetchMdFiles = async () => {
      const files = await getFileTree();
      const dataDir = await getDataDir();
      setBasePath(dataDir);
      setFileTree(files);
      console.log(files);
    };
    fetchMdFiles();
  }, []);

  const handleCreateFile = () => {
    setDialogConfig({
      title: "创建新文件",
      onConfirm: async (fileName) => {
        if (fileName) {
          const finalFileName = fileName.endsWith(".md")
            ? fileName
            : `${fileName}.md`;
          await createFile(finalFileName);
          await refreshFileTree();
        }
      },
    });
    setDialogOpen(true);
  };

  const handleCreateDirectory = () => {
    setDialogConfig({
      title: "创建新文件夹",
      onConfirm: async (dirName) => {
        if (dirName) {
          await createDirectory(dirName);
          await refreshFileTree();
        }
      },
    });
    setDialogOpen(true);
  };

  return (
    <Sidebar
      variant="floating"
      className="border-r border-border bg-background"
      {...props}
    >
      <SidebarHeader className="border-b border-border pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <CollapseProvider>
          <SidebarGroup className="space-y-4">
            <div className="flex items-center justify-between px-3">
              <span className="font-medium text-sm">文件</span>
              <ActionButtons
                handleCreateFile={handleCreateFile}
                handleCreateDirectory={handleCreateDirectory}
                refreshFileTree={refreshFileTree}
              />
            </div>
            <SidebarMenu className="px-1">
              {fileTree.map((item) => (
                <Tree key={getTreeKey(item)} item={item} basePath={basePath} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </CollapseProvider>
      </SidebarContent>
      {dialogConfig && (
        <InputDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
        />
      )}
    </Sidebar>
  );
}
