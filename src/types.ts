import type { Storage } from "@tiptap/core";

export type TreeItem = string | TreeItem[];

export type EditorStorage = Storage & {
  markdown: {
    getMarkdown: () => string;
  };
};
