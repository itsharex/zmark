import "katex/dist/katex.min.css";
import "./styles/index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { EditorContent, useEditor } from "@tiptap/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSaveShortcut, useTableOfContents } from "@/hooks";
import { useEditorStore } from "@/stores";
import type { EditorStorage } from "@/types/editor.ts";
import {
  addOrUpdateFile,
  handleImageUpload,
  unresolveMarkdownImages,
} from "@/utils";
import { EditorBubbleMenu } from "./bubble-menu";
import { extensions } from "./extensions";
import { EmptyEditor } from "./fallback/empty-state.tsx";
import { UnsupportedFile } from "./fallback/unsupported-file.tsx";
import { MenuBar } from "./menubar/index.tsx";
import { TableOfContents } from "./toc";
import { VersionHistory } from "./version-history";

export default () => {
  const { content, curPath } = useEditorStore();
  const editor = useEditor(
    {
      extensions,
      content: content,
      editorProps: {
        handleDOMEvents: {
          click: (_, event) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest("a");
            if (anchor) {
              const href = anchor.getAttribute("href");
              const { metaKey, ctrlKey } = event;

              if (href) {
                if (metaKey || ctrlKey) {
                  openUrl(href).catch((error) => {
                    console.error("Failed to open URL:", error);
                    toast.error("无法打开链接");
                  });
                }
                // 彻底阻止所有默认点击行为，防止浏览器或 Tiptap 扩展自动打开链接
                event.preventDefault();
                event.stopPropagation();
                return true;
              }
            }
            return false;
          },
        },
        handlePaste: (view, event) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) =>
            item.type.startsWith("image/"),
          );

          if (imageItem) {
            event.preventDefault();
            const file = imageItem.getAsFile();
            if (file) {
              handleImageUpload(file)
                .then((url) => {
                  if (editor) {
                    editor.chain().focus().setImage({ src: url }).run();
                  } else {
                    view.dispatch(
                      view.state.tr.replaceSelectionWith(
                        view.state.schema.nodes.image.create({ src: url }),
                      ),
                    );
                  }
                  toast.success("图片已上传");
                })
                .catch((err) => {
                  console.error("Image upload failed:", err);
                  const errorMessage =
                    err instanceof Error ? err.message : String(err);
                  toast.error(`图片上传失败: ${errorMessage}`);
                });
              return true;
            }
          }
          return false;
        },
      },
    },
    [content],
  );

  const handleSave = async () => {
    if (curPath && editor) {
      const storage = editor.storage as EditorStorage;
      const markdown = storage.markdown.getMarkdown();

      // 将图片路径转换为相对路径后再保存
      const unresolvedMarkdown = await unresolveMarkdownImages(
        markdown,
        curPath,
      );
      await writeTextFile(curPath, unresolvedMarkdown);

      addOrUpdateFile({
        path: curPath,
        name: curPath.split("/").pop() || "Untitled",
        content: unresolvedMarkdown,
      });

      toast.success("保存成功");
    }
  };

  useSaveShortcut(handleSave);

  const showEditor = curPath;
  const isMdFile = curPath.endsWith(".md");
  const fileName = curPath.split("/").pop() || curPath;
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const tocItems = useTableOfContents(editor);

  return (
    <div className="flex flex-col h-full">
      {showEditor ? (
        isMdFile ? (
          editor && (
            <>
              <EditorBubbleMenu editor={editor} />
              <MenuBar
                editor={editor}
                isTocOpen={isTocOpen}
                onToggleToc={() => setIsTocOpen(!isTocOpen)}
                hasHeadings={tocItems.length > 0}
                isHistoryOpen={isHistoryOpen}
                onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
              />
              <div className="flex flex-1 overflow-hidden relative">
                <EditorContent
                  editor={editor}
                  className="flex-1 h-full overflow-y-auto"
                />
                {isTocOpen && (
                  <TableOfContents editor={editor} items={tocItems} />
                )}
              </div>
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetContent
                  side="right"
                  className="w-[90vw]! max-w-[90vw]! gap-0"
                >
                  <SheetHeader>
                    <SheetTitle>版本对比</SheetTitle>
                  </SheetHeader>
                  <div className="h-full">
                    <VersionHistory
                      curPath={curPath}
                      getContent={() => {
                        const storage = editor.storage as EditorStorage;
                        return storage.markdown.getMarkdown();
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )
        ) : (
          <UnsupportedFile fileName={fileName} />
        )
      ) : (
        <EmptyEditor />
      )}
    </div>
  );
};
