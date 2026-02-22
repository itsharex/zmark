import "./index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import Highlight from "@tiptap/extension-highlight";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import { useSaveShortcut } from "@/hooks/use-save-shortcut.ts";
import { useEditorStore } from "@/stores/editor.ts";
import type { EditorStorage } from "@/types.ts";
import { EmptyEditor } from "./empty-editor.tsx";
import { MenuBar } from "./menubar.tsx";

const extensions = [
  TextStyleKit,
  StarterKit,
  Markdown.configure({ html: true }),
  Highlight.configure({
    multicolor: true,
  }),
];

export default () => {
  const { content, curPath } = useEditorStore();
  const editor = useEditor(
    {
      extensions,
      content: content,
    },
    [content],
  );

  const handleSave = () => {
    if (curPath && editor) {
      const storage = editor.storage as EditorStorage;
      const markdown = storage.markdown.getMarkdown();
      writeTextFile(curPath, markdown);
      toast.success("保存成功", {
        position: "top-center",
      });
      console.log("保存成功");
    }
  };

  useSaveShortcut(handleSave);

  const showEditor = curPath;

  return (
    <div className="flex flex-col h-full">
      {editor && showEditor ? (
        <>
          <MenuBar editor={editor} onSave={handleSave} />
          <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        </>
      ) : (
        <EmptyEditor />
      )}
    </div>
  );
};
