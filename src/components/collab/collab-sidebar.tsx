import { Copy, FileText, Link, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollabStore, useEditorStore } from "@/stores";
import { InputDialog } from "../editor/sidebar/input-dialog";

export function CollabSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { activeCollabId, setActiveCollabId } = useEditorStore();
  const { files, createFile, joinFile, removeFile } = useCollabStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const handleCreate = (name: string) => {
    if (name.trim()) {
      const newFile = createFile(name.trim());
      setActiveCollabId(newFile.id);
    }
  };

  const handleJoin = (id: string) => {
    if (id.trim()) {
      const file = joinFile(id.trim());
      setActiveCollabId(file.id);
    }
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("已复制协作文档ID");
  };

  const sortedFiles = [...files].sort((a, b) => b.lastVisited - a.lastVisited);

  return (
    <>
      <Sidebar
        variant="floating"
        className="border-border bg-background"
        {...props}
      >
        <SidebarContent className="flex flex-col">
          <SidebarGroup className="space-y-1 flex-1">
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <span className="font-medium text-sm">协作文档</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    新建文档
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setJoinDialogOpen(true)}>
                    <Link className="h-4 w-4 mr-2" />
                    通过ID加入
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="flex-1">
              <SidebarMenu className="px-1">
                {sortedFiles.map((file) => {
                  const isActive = activeCollabId === file.id;
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: ignore
                    <div
                      key={file.id}
                      className={`group flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                      }`}
                      onClick={() => setActiveCollabId(file.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setActiveCollabId(file.id);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Users className="h-4 w-4 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(file.id);
                              }}
                            >
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>复制协作ID</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeCollabId === file.id) {
                                  setActiveCollabId(null);
                                }
                                removeFile(file.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>移除记录</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                {files.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    暂无协作文档
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>

            {activeCollabId && (
              <div className="mt-2 px-3 py-2 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setActiveCollabId(null)}
                >
                  退出当前协作
                </Button>
              </div>
            )}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <InputDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onConfirm={handleCreate}
        title="新建协作文档"
        placeholder="例如: 需求设计文档"
      />

      <InputDialog
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        onConfirm={handleJoin}
        title="加入协作文档"
        placeholder="请输入协作文档的ID"
      />
    </>
  );
}
