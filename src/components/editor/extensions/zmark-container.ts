import { Node } from "@tiptap/core";

type MarkdownItLike = {
  use: (plugin: (md: MarkdownItLike) => void) => void;
  block: {
    ruler: {
      before: (
        afterName: string,
        ruleName: string,
        rule: (
          state: MarkdownItStateBlock,
          startLine: number,
          endLine: number,
          silent: boolean,
        ) => boolean,
        options?: { alt?: string[] },
      ) => void;
    };
  };
  renderer: {
    rules: Record<string, unknown>;
  };
  utils: {
    escapeHtml: (value: string) => string;
  };
};

type MarkdownToken = {
  type: string;
  tag: string;
  nesting: number;
  block?: boolean;
  markup?: string;
  info?: string;
  meta?: Record<string, unknown>;
};

type MarkdownItStateBlock = {
  bMarks: number[];
  tShift: number[];
  eMarks: number[];
  src: string;
  parentType: string;
  lineMax: number;
  line: number;
  md: {
    block: {
      tokenize: (
        state: MarkdownItStateBlock,
        startLine: number,
        endLine: number,
      ) => void;
    };
  };
  push: (type: string, tag: string, nesting: number) => MarkdownToken;
};

type MarkdownSerializerStateLike = {
  write: (content: string) => void;
  ensureNewLine: () => void;
  renderContent: (node: ProseMirrorNodeLike) => void;
  closeBlock: (node: ProseMirrorNodeLike) => void;
};

type ProseMirrorNodeLike = {
  attrs: Record<string, unknown>;
};

type ContainerHeader = {
  kind: string;
  initialContent: string | null;
};

type ParagraphFactorySchema = {
  nodes: {
    paragraph?: {
      create: (
        attrs?: Record<string, never> | null,
        content?: unknown,
      ) => unknown;
    };
  };
  text: (text: string) => unknown;
};

type ContainerSelectionContext = {
  depth: number;
  node: {
    type: { name: string };
    firstChild: unknown;
    childCount: number;
    nodeSize: number;
  };
  pos: number;
};

/**
 * 解析三冒号语法
 * @returns result.kind 容器类型
 * @returns result.initialContent 容器内容
 */
function parseContainerHeader(raw: string): ContainerHeader | null {
  const normalized = raw.trim();
  if (!normalized) {
    return {
      kind: "note",
      initialContent: null,
    };
  }

  const match = normalized.match(/^([A-Za-z0-9_-]+)(?:\s+(.+))?\s*$/);
  if (!match) return null;

  const kind = match[1] || "note";
  const initialContent = match[2]?.trim() || null;

  return {
    kind,
    initialContent,
  };
}

function createContainerParagraph<TSchema extends ParagraphFactorySchema>(
  schema: TSchema,
  text?: string | null,
): ReturnType<NonNullable<TSchema["nodes"]["paragraph"]>["create"]> | null {
  const paragraph = schema.nodes.paragraph;
  if (!paragraph) return null;

  return paragraph.create(
    null,
    text ? schema.text(text) : undefined,
  ) as ReturnType<NonNullable<TSchema["nodes"]["paragraph"]>["create"]>;
}

function getContainerSelectionContext(selection: {
  $from: {
    depth: number;
    node: (depth?: number | null) => {
      type: { name: string };
      firstChild: unknown;
      childCount: number;
      nodeSize: number;
    };
    before: (depth?: number | null) => number;
    parent: {
      type: { name: string };
      textContent: string;
    };
    parentOffset: number;
  };
  empty: boolean;
  from: number;
  to: number;
}): ContainerSelectionContext | null {
  const { $from } = selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "zmarkContainer") {
      return {
        depth,
        node,
        pos: $from.before(depth),
      };
    }
  }

  return null;
}

function isContainerNodeSelection(selection: unknown): selection is {
  node: { type: { name: string } };
  from: number;
  to: number;
} {
  if (!selection || typeof selection !== "object") return false;
  if (
    !("node" in selection) ||
    !("from" in selection) ||
    !("to" in selection)
  ) {
    return false;
  }

  const nodeSelection = selection as {
    node?: { type?: { name?: string } };
  };

  return nodeSelection.node?.type?.name === "zmarkContainer";
}

function zmarkContainerMarkdownItPlugin(md: MarkdownItLike): void {
  const markerCharCode = 0x3a;

  md.block.ruler.before(
    "fence",
    "zmark_container",
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];

      if (start + 3 > max) return false;
      if (state.src.charCodeAt(start) !== markerCharCode) return false;

      let pos = start;
      let markerCount = 0;
      while (pos < max && state.src.charCodeAt(pos) === markerCharCode) {
        markerCount++;
        pos++;
      }
      if (markerCount < 3) return false;

      const params = state.src.slice(pos, max).trim();
      const header = parseContainerHeader(params);
      if (!header) return false;

      const { kind, initialContent } = header;

      let nextLine = startLine;
      let found = false;
      while (++nextLine < endLine) {
        const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
        const lineMax = state.eMarks[nextLine];

        if (lineStart >= lineMax) continue;
        if (state.src.charCodeAt(lineStart) !== markerCharCode) continue;

        let endPos = lineStart;
        let endMarkerCount = 0;
        while (
          endPos < lineMax &&
          state.src.charCodeAt(endPos) === markerCharCode
        ) {
          endMarkerCount++;
          endPos++;
        }
        if (endMarkerCount < markerCount) continue;

        const rest = state.src.slice(endPos, lineMax).trim();
        if (rest) continue;

        found = true;
        break;
      }

      if (!found) return false;
      if (silent) return true;

      const oldParent = state.parentType;
      const oldLineMax = state.lineMax;

      state.parentType = "container";
      state.lineMax = nextLine;

      const tokenOpen = state.push("zmark_container_open", "div", 1);
      tokenOpen.block = true;
      tokenOpen.markup = state.src.slice(start, start + markerCount);
      tokenOpen.info = kind;
      tokenOpen.meta = {
        initialContent,
      };

      state.md.block.tokenize(state, startLine + 1, nextLine);

      const tokenClose = state.push("zmark_container_close", "div", -1);
      tokenClose.block = true;
      tokenClose.markup = state.src.slice(start, start + markerCount);

      state.parentType = oldParent;
      state.lineMax = oldLineMax;
      state.line = nextLine + 1;

      return true;
    },
    {
      alt: ["paragraph", "reference", "blockquote", "list"],
    },
  );

  md.renderer.rules.zmark_container_open = (
    tokens: MarkdownToken[],
    idx: number,
  ) => {
    const token = tokens[idx];
    const kind = token.info || "note";
    const initialContent =
      typeof token.meta?.initialContent === "string"
        ? token.meta.initialContent.trim()
        : "";

    const opening = `<div data-type="zmark-container" data-kind="${md.utils.escapeHtml(
      kind,
    )}">\n`;

    if (!initialContent) return opening;

    return `${opening}<p>${md.utils.escapeHtml(initialContent)}</p>\n`;
  };

  md.renderer.rules.zmark_container_close = () => "</div>\n";
}

export const ZMarkContainer = Node.create({
  name: "zmarkContainer", // 自定义容器名称
  group: "block", // 容器展现类型 块级和行级
  content: "block+", // 容器内部必须有一个及以上块级节点
  isolating: true,
  defining: true,

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        if ($from.parent.type.name !== "paragraph") return false;

        const raw = $from.parent.textContent;
        const header = parseContainerHeader(raw.replace(/^:::/, ""));
        if (!raw.startsWith(":::") || !header) return false;

        const { kind, initialContent } = header;
        const parentFrom = $from.before();
        const parentTo = $from.after();
        const paragraph = createContainerParagraph(
          state.schema,
          initialContent,
        );
        if (!paragraph) return false;

        const container = this.type.create({ kind }, [paragraph]);
        const tr = state.tr
          .replaceRangeWith(parentFrom, parentTo, container)
          .scrollIntoView();

        this.editor.view.dispatch(tr);

        const textOffset = initialContent ? initialContent.length : 0;
        this.editor.commands.setTextSelection(parentFrom + 2 + textOffset);
        return true;
      },
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;

        if (isContainerNodeSelection(selection)) {
          const paragraph = createContainerParagraph(state.schema);
          if (!paragraph) return false;

          const tr = state.tr.replaceWith(
            selection.from,
            selection.to,
            paragraph,
          );
          this.editor.view.dispatch(tr.scrollIntoView());
          this.editor.commands.setTextSelection(selection.from + 1);
          return true;
        }

        if (!selection.empty) return false;

        const container = getContainerSelectionContext(selection);
        if (!container) return false;
        if (selection.$from.parent.type.name !== "paragraph") return false;
        if (selection.$from.parentOffset !== 0) return false;
        if (selection.$from.parent.textContent.length !== 0) return false;
        if (container.node.childCount !== 1) return false;
        if (container.node.firstChild !== selection.$from.parent) return false;

        const paragraph = createContainerParagraph(state.schema);
        if (!paragraph) return false;

        const tr = state.tr.replaceWith(
          container.pos,
          container.pos + container.node.nodeSize,
          paragraph,
        );
        this.editor.view.dispatch(tr.scrollIntoView());
        this.editor.commands.setTextSelection(container.pos + 1);
        return true;
      },
      Delete: () => {
        const { state } = this.editor;
        const { selection } = state;

        if (!isContainerNodeSelection(selection)) return false;

        const paragraph = createContainerParagraph(state.schema);
        if (!paragraph) return false;

        const tr = state.tr.replaceWith(
          selection.from,
          selection.to,
          paragraph,
        );
        this.editor.view.dispatch(tr.scrollIntoView());
        this.editor.commands.setTextSelection(selection.from + 1);
        return true;
      },
    };
  },

  addAttributes() {
    return {
      kind: {
        default: "note",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="zmark-container"]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;

          const kind = element.getAttribute("data-kind") || "note";
          return { kind };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const kind = (node.attrs.kind as string) || "note";

    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "zmark-container",
        "data-kind": kind,
      },
      0,
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: MarkdownSerializerStateLike,
          node: ProseMirrorNodeLike,
        ) {
          const kind = (node.attrs.kind as string) || "note";

          state.write(`:::${kind}`);
          state.ensureNewLine();
          state.write("\n");
          state.renderContent(node);
          state.ensureNewLine();
          state.write(":::");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: MarkdownItLike) {
            markdownit.use(zmarkContainerMarkdownItPlugin);
          },
        },
      },
    };
  },
});
