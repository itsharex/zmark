import "./index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import TurndownService from "turndown";
import { useSaveShortcut } from "@/hooks/use-save-shortcut.ts";
import { useEditorStore } from "@/stores/editor.ts";
import { EmptyEditor } from "./empty-editor.tsx";
import { MenuBar } from "./menubar.tsx";

const extensions = [TextStyleKit, StarterKit, Markdown];

export default () => {
  const { content, curPath } = useEditorStore();
  const editor = useEditor(
    {
      extensions,
      content: content,
    },
    [content],
  );

  const tdInstance = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
    bulletListMarker: "-",
  });

  const handleSave = () => {
    if (curPath && editor) {
      const html = editor.getHTML();
      const markdown = tdInstance.turndown(html);
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
