import {
  Bot,
  ChevronRight,
  FileText,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import type { ChatRole } from "@/consts/chat";
import { CHAT_ROLE_UI_CONFIG, PRELOAD_IMAGES } from "@/consts/chat-ui";
import type { ChatMessage } from "../../types/knowledge-base";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useKbStore } from "./kb-store";

const ChatAvatar = ({ role }: { role: ChatRole }) => {
  const config = CHAT_ROLE_UI_CONFIG[role];
  const Icon = config.Icon;

  return (
    <Avatar className="h-8 w-8 border">
      <AvatarImage src={config.avatar} alt={config.avatarAlt} />
      <AvatarFallback className={config.fallbackClass}>
        <Icon className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
};

export const ChatPanel = () => {
  const {
    messages,
    isStreaming,
    apiKey,
    setApiKey,
    sendMessage,
    clearMessages,
    currentKbId,
  } = useKbStore();

  const [input, setInput] = useState("");
  const [tempKey, setTempKey] = useState(apiKey);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 预加载头像图片
    PRELOAD_IMAGES.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <messages变化说明AI还在输出，需要滚动到底部>
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !currentKbId) return;
    if (!apiKey) {
      toast.error("请先设置 API Key");
      return;
    }
    const question = input;
    setInput("");
    try {
      await sendMessage(question);
    } catch (error) {
      toast.error(`发送失败: ${error}`);
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background relative">
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <h2 className="font-medium">AI 问答</h2>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                title="清空对话"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>清空对话</p>
            </TooltipContent>
          </Tooltip>

          <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>设置 API Key</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>设置 SiliconFlow API Key</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Key 将保存在本地存储中。
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setTempKey(apiKey);
                    setOpen(false);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setApiKey(tempKey);
                    toast.success("API Key 已保存");
                    setOpen(false);
                  }}
                >
                  确认
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-20" />
                <p>选择一个知识库并开始提问吧</p>
              </div>
            )}
            {messages.map((msg: ChatMessage, i: number) => (
              <div
                key={`${i}-${msg.role}`}
                className="flex gap-4 p-4 hover:bg-muted/50 rounded-xl transition-colors"
              >
                <ChatAvatar role={msg.role} />
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium text-sm mb-1.5 opacity-90">
                    {CHAT_ROLE_UI_CONFIG[msg.role].label}
                  </div>
                  {CHAT_ROLE_UI_CONFIG[msg.role].features.showThinking &&
                    msg.thinking &&
                    msg.thinking.retrieved_docs.length > 0 && (
                      <Collapsible className="mb-3 border rounded-md bg-muted/30">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 w-full justify-start h-8 px-2 text-xs hover:bg-muted/50"
                          >
                            <ChevronRight className="h-3 w-3" />
                            <FileText className="h-3 w-3" />
                            <span>思考过程 · 参考文档</span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-2 pb-2">
                          <div className="space-y-2 pt-2 border-t">
                            {msg.thinking.retrieved_docs.map((doc, idx) => (
                              <div
                                key={`${doc.filename}-${idx}`}
                                className="bg-background rounded p-2 text-xs border shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-xs truncate flex-1 text-primary">
                                    {doc.filename}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0 bg-muted px-1.5 py-0.5 rounded-full">
                                    {(doc.similarity * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">
                                  {doc.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 dark:prose-pre:bg-muted/50 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:break-all">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                    {CHAT_ROLE_UI_CONFIG[msg.role].features.showCursor &&
                      !msg.content &&
                      isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1 align-middle rounded-full" />
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t bg-background/80 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            className="flex-1"
            placeholder={currentKbId ? "输入您的问题..." : "请先选择知识库"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={isStreaming || !currentKbId}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isStreaming || !input.trim() || !currentKbId}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
