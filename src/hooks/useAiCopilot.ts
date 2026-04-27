import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Editor } from "@tiptap/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useKbStore } from "@/stores/kb";
import type { EditorStorage } from "@/types/editor";
import { logError, logWarn } from "@/utils";
import { useGlobalShortcut } from "./useGlobalShortcut";

export function useAiCopilot(editor: Editor | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectionRange, setSelectionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  const [virtualElement, setVirtualElement] = useState<{
    getBoundingClientRect: () => DOMRect;
  } | null>(null);

  const { apiKey } = useKbStore();

  const toggleCopilot = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.warning("请先选中一段文本");
      return;
    }

    // 获取当前选区的屏幕坐标作为虚拟锚点
    const { view } = editor;
    const startCoords = view.coordsAtPos(from);
    const endCoords = view.coordsAtPos(to);

    setVirtualElement({
      getBoundingClientRect: () =>
        new DOMRect(
          startCoords.left,
          startCoords.top,
          endCoords.right - startCoords.left,
          endCoords.bottom - startCoords.top,
        ),
    });

    setSelectionRange({ from, to });
    setIsOpen((prev) => !prev);
  }, [editor]);

  const runAiCopilot = async (customPrompt?: string) => {
    if (!editor || !selectionRange) return;

    if (!apiKey) {
      toast.error("未配置 SiliconFlow API Key，请在知识库面板中设置");
      return;
    }

    const { from, to } = selectionRange;
    const $from = editor.state.doc.resolve(from);
    const $to = editor.state.doc.resolve(to);
    const sharedDepth = $from.sharedDepth(to);

    let expandedFrom = from;
    let expandedTo = to;

    // 智能扩展选区：如果选区跨越了多个块级节点，且共同祖先不是 doc，我们扩展到共同祖先
    // 如果选区在同一个块级节点内（如同一个段落或代码块），不扩展，只处理用户选中的内容
    if ($from.parent !== $to.parent && sharedDepth > 0) {
      expandedFrom = $from.before(sharedDepth);
      expandedTo = $to.after(sharedDepth);
    }

    const expandedRange = { from: expandedFrom, to: expandedTo };
    const slice = editor.state.doc.slice(expandedFrom, expandedTo);
    let textToProcess = "";

    // 判断当前选区是否在同一个块级节点内
    const isInlineSelection = $from.parent === $to.parent;
    // 判断当前选区是否在一个代码块内
    const isInsideCodeBlock =
      isInlineSelection && $from.parent.type.name === "codeBlock";

    try {
      if (isInsideCodeBlock) {
        // 如果在代码块内，直接获取纯文本，避免 doc.create 失败
        textToProcess = slice.content.textBetween(0, slice.content.size, "\n");
      } else {
        // 尝试使用 tiptap-markdown 导出选区的 markdown 格式，以保留列表、代码块等结构
        // 如果是行内选区，需要包裹在段落中才能构建合法的 doc
        const content = isInlineSelection
          ? [editor.schema.nodes.paragraph.create(null, slice.content)]
          : slice.content;
        const tempDoc = editor.schema.nodes.doc.create(null, content);
        textToProcess = (
          editor.storage as EditorStorage
        ).markdown.serializer.serialize(tempDoc);
        // 如果是行内选区，去掉段落带来的多余换行符
        if (isInlineSelection) {
          textToProcess = textToProcess.trim();
        }
      }
    } catch (e) {
      logWarn("Failed to serialize markdown, fallback to plain text", e);
      textToProcess = editor.state.doc.textBetween(
        expandedRange.from,
        expandedRange.to,
        "\n",
      );
    }

    if (!textToProcess) return;

    setIsGenerating(true);
    setIsOpen(false);
    setPrompt(""); // 触发后清空输入框

    let firstChunk = true;
    let accumulatedText = "";

    // 监听流式输出
    const unlistenStream = await listen<string>(
      "ai-copilot-stream",
      (event) => {
        const chunk = event.payload;
        accumulatedText += chunk;

        if (firstChunk) {
          // 第一次收到数据时，直接替换扩展后的选区
          // 为了防止插入的纯文本被自动合并到上一个代码块中，我们强制将其包裹在一个段落节点中
          // 但如果在块级节点内部（段落或代码块）替换，我们必须直接插入纯文本，否则会打断段落/代码块
          const hasNewline = chunk.includes("\n");

          if (isInlineSelection) {
            editor.chain().focus().insertContentAt(expandedRange, chunk).run();
          } else {
            editor
              .chain()
              .focus()
              .insertContentAt(expandedRange, {
                type: "paragraph",
                content:
                  !hasNewline && chunk ? [{ type: "text", text: chunk }] : [],
              })
              .run();

            if (hasNewline) {
              editor
                .chain()
                .focus()
                .insertContentAt(editor.state.selection.to, chunk)
                .run();
            }
          }
          firstChunk = false;
        } else {
          // 后续数据追加在当前光标处
          // 由于 insertContentAt 会自动更新光标位置，我们可以通过 selection.to 确定插入点
          const endPos = editor.state.selection.to;
          editor.chain().focus().insertContentAt(endPos, chunk).run();
        }
      },
    );

    const unlistenDone = await listen("ai-copilot-done", () => {
      setIsGenerating(false);

      if (accumulatedText) {
        const startPos = expandedRange.from;
        const endPos = editor.state.selection.to;

        // 尝试获取 tiptap-markdown 的解析器将 markdown 转换为 HTML
        let parsedContent = accumulatedText;
        try {
          // 如果在代码块内部，不要使用 markdown 解析器，否则会将纯文本解析为段落等节点，导致破坏原有的代码块
          if (
            !isInsideCodeBlock &&
            (editor.storage as EditorStorage).markdown?.parser
          ) {
            parsedContent = (
              editor.storage as EditorStorage
            ).markdown.parser.parse(accumulatedText);
          }
        } catch (e) {
          logWarn("Failed to parse markdown, fallback to plain text", e);
        }

        editor
          .chain()
          .focus()
          .insertContentAt({ from: startPos, to: endPos }, parsedContent)
          .run();
      }

      unlistenStream();
      unlistenDone();
    });

    const finalPrompt = customPrompt || prompt;

    try {
      await invoke("ai_copilot", {
        prompt: finalPrompt,
        content: textToProcess,
        apiKey,
      });
    } catch (err) {
      logError(err);
      toast.error("AI 处理失败");
      setIsGenerating(false);
      unlistenStream();
      unlistenDone();
    }
  };

  useGlobalShortcut({
    key: "j",
    onTrigger: toggleCopilot,
    requireMod: true,
    enabled: Boolean(editor),
  });

  return {
    isOpen,
    setIsOpen,
    isGenerating,
    prompt,
    setPrompt,
    runAiCopilot,
    toggleCopilot,
    virtualElement,
  };
}
