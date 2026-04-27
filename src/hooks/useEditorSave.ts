import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { Editor } from "@tiptap/core";
import { toast } from "sonner";
import { useEditorStore } from "@/stores";
import type { CollabFile } from "@/stores/collab";
import type { EditorStorage } from "@/types/editor";
import { addOrUpdateFile, to, unresolveMarkdownImages } from "@/utils";
import { stringifyMarkdown } from "@/utils/frontmatter";

interface UseEditorSaveProps {
  editor: Editor | null;
  collabId: string | null;
  currentFile: CollabFile | undefined | null;
  curPath: string;
}

export function useEditorSave({
  editor,
  collabId,
  currentFile,
  curPath,
}: UseEditorSaveProps) {
  const handleSave = async () => {
    if (!editor) return;

    const storage = editor.storage as EditorStorage;
    const markdown = storage.markdown.getMarkdown();
    const frontmatter = useEditorStore.getState().frontmatter;
    const finalMarkdown = stringifyMarkdown(markdown, frontmatter);

    if (collabId && currentFile) {
      // 协作模式且没有关联本地文件：调用 Tauri 的另存为对话框
      const [dialogErr, filePath] = await to(
        save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
          defaultPath: `${currentFile.name}.md`,
        }),
      );

      if (dialogErr) {
        console.error("Save dialog failed:", dialogErr);
        toast.error("弹出保存对话框失败");
        return;
      }

      if (filePath) {
        const [writeErr] = await to(
          unresolveMarkdownImages(finalMarkdown, filePath).then((unresolved) =>
            writeTextFile(filePath, unresolved),
          ),
        );

        if (writeErr) {
          toast.error("写入文件失败");
          return;
        }

        toast.success("协作文档已保存到本地");
      }
      return;
    }

    if (curPath) {
      // 单机模式或已关联本地文件的保存逻辑
      const [writeErr, unresolvedMarkdown] = await to(
        unresolveMarkdownImages(finalMarkdown, curPath).then((unresolved) =>
          writeTextFile(curPath, unresolved).then(() => unresolved),
        ),
      );

      if (writeErr) {
        toast.error("保存失败");
        return;
      }

      addOrUpdateFile({
        path: curPath,
        name: curPath.split("/").pop() || "Untitled",
        content: unresolvedMarkdown,
      });

      toast.success("保存成功");
    }
  };

  return handleSave;
}
