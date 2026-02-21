import "./index.scss";

import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MenuBar } from "./menubar.tsx";
import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor.ts";
import { defaultContent } from "./const.ts";
import { Markdown } from "tiptap-markdown";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { useSaveShortcut } from "@/hooks/use-save-shortcut.ts";
import TurndownService from "turndown";

const extensions = [TextStyleKit, StarterKit, Markdown];

export default () => {
  const content = useEditorStore((state) => state.content);
  const { curPath } = useEditorStore();
  const editor = useEditor({
    extensions,
    content: content,
  });

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
      toast.success("保存成功",{
        position:"top-center"
      });
      console.log("保存成功")
    }
  };

  useSaveShortcut(handleSave);

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <>
      <MenuBar editor={editor} onSave={handleSave} />
      <EditorContent editor={editor} />
    </>
  );
};
