import { FileText, Library, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SearchCommand } from "@/components/search-command";
import { getAllMarkdownFiles } from "@/utils/file";
import { indexFiles } from "@/utils/search";
import { LoginButton } from "./components/auth/LoginButton";
import { UserAvatar } from "./components/auth/UserAvatar";
import { ThemeToggle } from "./components/common/theme-toggle";
import Editor from "./components/editor";
import { AppSidebar } from "./components/editor/sidebar";
import { ChatPanel } from "./components/kb/chat-panel";
import { KbSidebar } from "./components/kb/kb-sidebar";
import { Button } from "./components/ui/button";
import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme-provider";
import { useAuthStore } from "./stores/authStore";
import { useEditorStore } from "./stores/editor";

const App = () => {
  const { curPath } = useEditorStore();
  const [mode, setMode] = useState<"editor" | "kb">("editor");
  const { initialize, isInitializing, session, logout } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // 启动时建立搜索索引
    const buildIndex = async () => {
      try {
        const files = await getAllMarkdownFiles();
        indexFiles(files);
        console.log("Search index built with", files.length, "files");
      } catch (error) {
        console.error("Failed to build search index:", error);
      }
    };
    buildIndex();
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("已成功退出登录");
  };

  const navItems = [
    {
      id: "editor",
      icon: FileText,
      title: "编辑器",
    },
    {
      id: "kb",
      icon: Library,
      title: "知识库",
    },
  ] as const;

  return (
    <ThemeProvider>
      <TooltipProvider>
        <SearchCommand />
        {isInitializing ? (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !session ? (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="w-full max-w-sm p-8 space-y-4 border rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-center mb-6">
                Welcome to ZMark
              </h1>
              <LoginButton />
            </div>
          </div>
        ) : (
          <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* 全局侧边导航栏 */}
            <div className="flex flex-col border-r bg-muted/30 w-12 items-center py-4 shrink-0 z-50 justify-between">
              <div className="flex flex-col gap-4 items-center">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      mode === item.id
                        ? "bg-[#8A4FFF]! text-white! hover:bg-[#8A4FFF]! hover:text-white!"
                        : "hover:bg-accent text-muted-foreground hover:text-black"
                    }`}
                    title={item.title}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
              <div className="flex flex-col items-center gap-4 mb-4">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-red-500"
                  title="退出登录"
                >
                  <LogOut className="size-4" />
                </Button>
                <UserAvatar />
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div className="flex-1 flex overflow-hidden relative">
              <SidebarProvider className="w-full h-full">
                <div className="flex w-full h-full">
                  {mode === "editor" ? (
                    <AppSidebar style={{ left: "3rem" }} mode={mode} />
                  ) : (
                    <KbSidebar style={{ left: "3rem" }} mode={mode} />
                  )}
                  <div className="content flex-1 overflow-hidden relative">
                    {mode === "editor" ? (
                      <Editor key={curPath} />
                    ) : (
                      <ChatPanel />
                    )}
                  </div>
                </div>
              </SidebarProvider>
            </div>
          </div>
        )}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
