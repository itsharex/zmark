import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useKbStore } from "@/stores/kb";
import { to } from "@/utils/error-handler";

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

    const textToProcess = editor.state.doc.textBetween(
      selectionRange.from,
      selectionRange.to,
      " ",
    );

    if (!textToProcess) return;

    setIsGenerating(true);
    setIsOpen(false);
    setPrompt(""); // 触发后清空输入框

    let firstChunk = true;

    // 监听流式输出
    const unlistenStream = await listen<string>(
      "ai-copilot-stream",
      (event) => {
        const chunk = event.payload;
        if (firstChunk) {
          // 第一次收到数据时，替换原文本（或者可以在原文本后追加，这里选择替换）
          editor
            .chain()
            .focus()
            .deleteRange(selectionRange)
            .insertContent(chunk)
            .run();
          firstChunk = false;
        } else {
          // 后续数据追加在当前光标处
          editor.chain().focus().insertContent(chunk).run();
        }
      },
    );

    const unlistenDone = await listen("ai-copilot-done", () => {
      setIsGenerating(false);
      unlistenStream();
      unlistenDone();
    });

    const finalPrompt = customPrompt || prompt;

    const [err] = await to(
      invoke("ai_copilot", {
        prompt: finalPrompt,
        content: textToProcess,
        apiKey,
      }),
    );

    if (err) {
      console.error(err);
      toast.error("AI 处理失败");
      setIsGenerating(false);
      unlistenStream();
      unlistenDone();
    }
  };

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "j") {
        event.preventDefault();
        toggleCopilot();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, toggleCopilot]);

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
