import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { File, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TruncatedTooltip } from "@/components/common/truncated-tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKbStore } from "@/stores";
import type { Document, KnowledgeBase } from "@/types/kb";
import { getDisplayFilename, to } from "@/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function KbSidebar({
  mode,
  ...props
}: React.ComponentProps<typeof Sidebar> & { mode: "editor" | "kb" }) {
  const {
    currentKbId,
    knowledgeBases,
    documents,
    setCurrentKbId,
    fetchKnowledgeBases,
    fetchDocuments,
    createKnowledgeBase,
    addDocument,
    deleteDocument,
  } = useKbStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newKbName, setNewKbName] = useState("");

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  useEffect(() => {
    if (currentKbId) {
      fetchDocuments(currentKbId);
    }
  }, [currentKbId, fetchDocuments]);

  const handleCreateKb = async () => {
    if (!newKbName.trim()) return;
    const [err] = await to(createKnowledgeBase(newKbName));
    if (err) {
      toast.error(`创建失败: ${err}`);
    } else {
      setNewKbName("");
      toast.success("知识库创建成功");
    }
    setIsCreating(false);
  };

  const handleAddDocument = async () => {
    if (!currentKbId) return;
    const [openErr, selected] = await to(
      open({
        multiple: true,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      }),
    );

    if (openErr) {
      toast.error(`文件选择失败: ${openErr}`);
      return;
    }

    if (!selected || !Array.isArray(selected)) return;

    for (const filePath of selected) {
      const filename = getDisplayFilename(filePath);
      const loadingToast = toast.loading(`正在处理 ${filename}...`);

      const [addErr] = await to(
        readTextFile(filePath).then((text) =>
          addDocument(currentKbId, filename, text),
        ),
      );

      if (addErr) {
        toast.error(`${filename} 添加失败: ${addErr}`, { id: loadingToast });
      } else {
        toast.success(`${filename} 添加成功`, { id: loadingToast });
      }
    }
  };

  return (
    <>
      <Sidebar
        variant="floating"
        className="border-border bg-background"
        {...props}
      >
        <SidebarContent className="flex flex-col">
          <SidebarGroup className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Select value={currentKbId || ""} onValueChange={setCurrentKbId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择知识库" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {knowledgeBases.map((kb: KnowledgeBase) => (
                    <SelectItem key={kb.id} value={kb.id}>
                      {kb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>新建知识库</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1">
              <SidebarMenu className="px-1">
                {documents.map((doc: Document) => (
                  <SidebarMenuItem key={doc.id}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <SidebarMenuButton>
                          <File />
                          <TruncatedTooltip
                            content={getDisplayFilename(doc.filename)}
                          />
                        </SidebarMenuButton>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => deleteDocument(doc.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </SidebarMenuItem>
                ))}
                {currentKbId && documents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    暂无文档
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>

            <div className="mt-2 px-1">
              <Button
                variant="secondary"
                className="w-full gap-2"
                disabled={!currentKbId}
                onClick={handleAddDocument}
              >
                <Upload className="h-4 w-4" />
                添加文档
              </Button>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建知识库</DialogTitle>
            <DialogDescription>请输入新知识库的名称</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="知识库名称"
              value={newKbName}
              onChange={(e) => setNewKbName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateKb()}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsCreating(false)}>
              取消
            </Button>
            <Button variant="secondary" onClick={handleCreateKb}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
