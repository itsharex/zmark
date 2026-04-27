import { readTextFile } from "@tauri-apps/plugin-fs";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { File } from "lucide-react";
import { useEditorStore } from "@/stores/editor";
import { resolveMarkdownImages, to } from "@/utils";
import { parseMarkdown } from "@/utils/frontmatter";

export const MentionNodeView = (props: NodeViewProps) => {
  const { setCurPath, setContent, setFrontmatter } = useEditorStore();
  const { node } = props;

  const id = node.attrs.id; // file path
  const label = node.attrs.label; // file name

  const handleClick = async () => {
    if (!id) return;

    let frontmatter = {};
    const [err, content] = await to(
      readTextFile(id).then((text) => {
        const parsed = parseMarkdown(text);
        frontmatter = parsed.frontmatter;
        return resolveMarkdownImages(parsed.body, id);
      }),
    );

    if (err) {
      console.error("Failed to read file:", err);
      return;
    }

    if (content !== undefined) {
      setFrontmatter(frontmatter);
      setContent(content);
      setCurPath(id);
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      className="inline-flex items-center gap-1 bg-accent/50 hover:bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md cursor-pointer transition-colors duration-200 select-none align-middle text-sm font-medium"
      onClick={handleClick}
      contentEditable={false}
    >
      <File className="w-3.5 h-3.5" />
      <span>{label}</span>
    </NodeViewWrapper>
  );
};
