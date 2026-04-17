import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { Editor } from "@tiptap/core";
import { toast } from "sonner";
import type { CollabFile } from "@/stores/collab";
import type { EditorStorage } from "@/types/editor";
import { addOrUpdateFile, unresolveMarkdownImages } from "@/utils";

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

    if (collabId && currentFile) {
      // 协作模式且没有关联本地文件：调用 Tauri 的另存为对话框
      try {
        const filePath = await save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
          defaultPath: `${currentFile.name}.md`,
        });

        if (filePath) {
          const unresolvedMarkdown = await unresolveMarkdownImages(
            markdown,
            filePath,
          );
          await writeTextFile(filePath, unresolvedMarkdown);
          toast.success("协作文档已保存到本地");
        }
      } catch (err) {
        console.error("Save dialog failed:", err);
        toast.error("保存失败");
      }
      return;
    }

    if (curPath) {
      // 单机模式或已关联本地文件的保存逻辑
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

  return handleSave;
}
