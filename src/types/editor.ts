import type { Storage } from "@tiptap/core";
import type { Node } from "prosemirror-model";

export type TreeItem = string | TreeItem[];

export type EditorStorage = Storage & {
  markdown: {
    getMarkdown: () => string;
    serializer: {
      serialize: (doc: Node) => string;
    };
    parser: {
      parse: (text: string) => string;
    };
  };
};
