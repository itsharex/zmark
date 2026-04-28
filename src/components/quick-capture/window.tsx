import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks";
import { to } from "@/utils/error-handler";
import { getDataDir } from "@/utils/file";
import { addOrUpdateFile } from "@/utils/search";

export function QuickCaptureWindow() {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hideWindow = useCallback(async (clearContent = false) => {
    await invoke("hide_capture_window");
    if (clearContent) {
      setContent("");
    }
  }, []);

  useEffect(() => {
    // 监听窗口聚焦事件，自动聚焦输入框
    const unlisten = getCurrentWindow().onFocusChanged(
      ({ payload: focused }) => {
        if (focused) {
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
          // 失去焦点时自动隐藏窗口
          hideWindow(false);
        }
      },
    );

    // 初始加载时也尝试聚焦
    setTimeout(() => inputRef.current?.focus(), 100);

    return () => {
      unlisten.then((f) => f());
    };
  }, [hideWindow]);

  const { execute: saveCapture, isLoading: saving } = useAsyncAction(
    async (text: string) => {
      const baseDir = await getDataDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `Capture-${timestamp}.md`;
      const finalPath = await join(baseDir, filename);

      const [err] = await to(writeTextFile(finalPath, text));
      if (err) {
        throw err;
      }

      addOrUpdateFile({ path: finalPath, name: filename, content: text });
      return null;
    },
    {
      successMessage: "灵感已记录",
      errorMessage: "保存失败",
      onSuccess: () => hideWindow(true),
    },
  );

  const handleSave = async () => {
    if (!content.trim()) return;
    await saveCapture(content);
  };

  return (
    <div className="h-screen w-screen flex flex-col box-border overflow-hidden">
      <div className="flex flex-col flex-1 bg-background border border-border shadow-xl rounded-xl overflow-hidden relative min-h-0">
        <div
          data-tauri-drag-region
          className="h-6 w-full absolute top-0 left-0 bg-transparent cursor-move"
        />
        <div className="flex flex-col p-4 flex-1 mt-2 min-h-0">
          <textarea
            ref={inputRef}
            className="w-full flex-1 resize-none bg-transparent outline-none text-lg placeholder:text-muted-foreground min-h-0"
            placeholder="随时记录你的灵感... (Markdown 格式)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                hideWindow(false);
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              Esc 取消 • Ctrl/Cmd + Enter 保存
            </span>
            <Button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
