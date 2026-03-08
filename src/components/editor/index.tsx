import "./styles/index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { markInputRule, markPasteRule } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight, { inputRegex, pasteRegex } from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { ListKit } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { useState } from "react";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import { DEFAULT_HIGHLIGHT_COLOR } from "@/consts/highlight";
import { useSaveShortcut } from "@/hooks/use-save-shortcut";
import { useEditorStore } from "@/stores/editor";
import type { EditorStorage } from "@/types/editor.ts";
import { handleImageUpload } from "@/utils/file";
import { addOrUpdateFile } from "@/utils/search";
import { EmptyEditor } from "./fallback/empty-state.tsx";
import { UnsupportedFile } from "./fallback/unsupported-file.tsx";
import { MenuBar } from "./menubar/index.tsx";
import { SlashCommand, slashSuggestion } from "./slash-command/slash-extension";
import { TableOfContents } from "./toc";

const lowlight = createLowlight(common);

const extensions = [
  Placeholder.configure({
    placeholder: "Write something …",
  }),
  TextStyleKit,
  ListKit,
  StarterKit.configure({
    link: false,
    bulletList: false,
    listItem: false,
    listKeymap: false,
    orderedList: false,
    codeBlock: false,
  }),
  Markdown.configure({ html: true }),
  SlashCommand.configure({
    suggestion: slashSuggestion,
  }),
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
  Image.configure({
    allowBase64: true,
  }),
  Link.extend({
    addInputRules() {
      return [
        markInputRule({
          find: /\[(.+?)\]\((.+?)\)\s$/,
          type: this.type,
          getAttributes: (match) => {
            const url = match[2];
            // 简单的 URL 安全性过滤
            if (url.startsWith("javascript:") || url.startsWith("vbscript:")) {
              return { href: "" };
            }
            return {
              href: url,
            };
          },
        }),
      ];
    },
  }).configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    validate: (url) => !!url && !url.startsWith("javascript:"),
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
                  console.log("Image uploaded to:", url);
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

  const handleSave = () => {
    if (curPath && editor) {
      const storage = editor.storage as EditorStorage;
      const markdown = storage.markdown.getMarkdown();
      writeTextFile(curPath, markdown);

      addOrUpdateFile({
        path: curPath,
        name: curPath.split("/").pop() || "Untitled",
        content: markdown,
      });

      toast.success("保存成功");
    }
  };

  useSaveShortcut(handleSave);

  const showEditor = curPath;
  const isMdFile = curPath.endsWith(".md");
  const fileName = curPath.split("/").pop() || curPath;
  const [isTocOpen, setIsTocOpen] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {showEditor ? (
        isMdFile ? (
          editor && (
            <>
              <MenuBar
                editor={editor}
                onSave={handleSave}
                isTocOpen={isTocOpen}
                onToggleToc={() => setIsTocOpen(!isTocOpen)}
              />
              <div className="flex flex-1 overflow-hidden relative">
                <EditorContent
                  editor={editor}
                  className="flex-1 h-full overflow-y-auto"
                />
                {isTocOpen && <TableOfContents editor={editor} />}
              </div>
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
