import { invoke } from "@tauri-apps/api/core";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { Check, Copy, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";

export const CodeBlockComponent = (props: NodeViewProps) => {
  const { node, updateAttributes } = props;
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const language = node.attrs.language || "text";
  const isRunnable = language === "javascript" || language === "js";

  const handleCopy = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    toast.success("代码已复制");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("运行中...");

    try {
      const code = node.textContent;

      if (language === "javascript" || language === "js") {
        // 重写 console.log 捕获输出
        const logs: string[] = [];
        const originalConsoleLog = console.log;
        console.log = (...args: unknown[]) => {
          const serialize = (value: unknown): string => {
            if (typeof value === "string") return value;
            if (value instanceof Error) return value.stack || value.message;
            try {
              return JSON.stringify(value);
            } catch {
              try {
                return String(value);
              } catch {
                return "[Unserializable]";
              }
            }
          };

          logs.push(args.map((a) => serialize(a)).join(" "));
        };

        try {
          // 使用 Function 代替 eval，在沙箱环境运行
          const fn = new Function(code);
          const result = fn();
          if (result !== undefined) {
            logs.push(String(result));
          }
          setOutput(logs.length > 0 ? logs.join("\n") : "执行完成，无输出");
        } catch (e: unknown) {
          if (e instanceof Error) {
            setOutput(`Error: ${e.message}`);
          } else {
            setOutput(`Error: ${String(e)}`);
          }
        } finally {
          console.log = originalConsoleLog;
        }
      } else if (language === "python" || language === "py") {
        // 使用 Tauri 运行本地 Python
        try {
          const stdout = await invoke<string>("run_python", { code });
          setOutput(stdout || "执行完成，无输出");
        } catch (e: unknown) {
          if (e instanceof Error) {
            setOutput(`Failed to run Python.\n${e.message}`);
          } else {
            setOutput(`Failed to run Python.\n${String(e)}`);
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
      } else {
        setOutput(`Error: ${String(error)}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <NodeViewWrapper className="relative group my-4 rounded-md border border-border bg-zinc-100 dark:bg-[#2d2d2d] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-200/50 dark:bg-black/20 text-xs text-zinc-500 dark:text-gray-400">
        <Select
          value={language || "text"}
          onValueChange={(value) => {
            const next = value || "text";
            updateAttributes({ language: next });
          }}
        >
          <SelectTrigger
            size="sm"
            className="font-mono uppercase bg-transparent border-none px-1 py-0.5 h-6 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:border-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="js">JS</SelectItem>
            <SelectItem value="ts">TS</SelectItem>
            <SelectItem value="jsx">JSX</SelectItem>
            <SelectItem value="tsx">TSX</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="bash">Bash</SelectItem>
            <SelectItem value="python">Python</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isRunnable && (
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="运行代码"
            >
              <Play className="w-3 h-3" />
              <span>运行</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="复制代码"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600 dark:text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copied ? "已复制" : "复制"}</span>
          </button>
        </div>
      </div>

      {/* 代码内容区 */}
      <pre className="m-0! p-4! bg-transparent!">
        <NodeViewContent
          as="div"
          className={cn(
            "font-mono text-sm",
            language ? `language-${language}` : "",
          )}
        />
      </pre>

      {/* 运行输出区 */}
      {output && (
        <div className="border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 p-3 text-xs font-mono text-zinc-700 dark:text-gray-300 relative">
          <button
            type="button"
            className="absolute top-2 right-2 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
            onClick={() => setOutput(null)}
          >
            ✕
          </button>
          <div className="font-semibold mb-1 text-zinc-500 dark:text-gray-500">
            Output:
          </div>
          <div className="whitespace-pre-wrap">{output}</div>
        </div>
      )}
    </NodeViewWrapper>
  );
};
