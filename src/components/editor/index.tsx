import "./index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { markInputRule, markPasteRule } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight, { inputRegex, pasteRegex } from "@tiptap/extension-highlight";
import { ListKit } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import { useSaveShortcut } from "@/hooks/use-save-shortcut.ts";
import { useEditorStore } from "@/stores/editor.ts";
import type { EditorStorage } from "@/types.ts";
import { DEFAULT_HIGHLIGHT_COLOR } from "./const";
import { EmptyEditor } from "./empty-editor.tsx";
import { MenuBar } from "./menubar.tsx";
import { UnsupportedFile } from "./unsupported-file.tsx";

const lowlight = createLowlight(common);

const extensions = [
  Placeholder.configure({
    placeholder: "Write something …",
  }),
  TextStyleKit,
  ListKit,
  StarterKit,
  Markdown.configure({ html: true }),
  Highlight.extend({
    addKeyboardShortcuts() {
      return {};
    },
    addInputRules() {
      return [
        markInputRule({
          find: inputRegex,
          type: this.type,
          getAttributes: () => ({
            color: DEFAULT_HIGHLIGHT_COLOR,
          }),
        }),
      ];
    },
    addPasteRules() {
      return [
        markPasteRule({
          find: pasteRegex,
          type: this.type,
          getAttributes: () => ({
            color: DEFAULT_HIGHLIGHT_COLOR,
          }),
        }),
      ];
    },
  }).configure({
    multicolor: true,
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Superscript,
  Subscript,
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
  const isMdFile = curPath.endsWith(".md");
  const fileName = curPath.split("/").pop() || curPath;

  return (
    <div className="flex flex-col h-full">
      {showEditor ? (
        isMdFile ? (
          editor && (
            <>
              <MenuBar editor={editor} onSave={handleSave} />
              <EditorContent
                editor={editor}
                className="flex-1 overflow-y-auto"
              />
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
