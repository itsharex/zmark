import {
  Bot,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { TruncatedTooltip } from "@/components/common/truncated-tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CHAT_ROLE_UI_CONFIG,
  type ChatRole,
  PRELOAD_IMAGES,
} from "@/consts/chat";
import { useKbStore } from "@/stores/kb";
import type { ChatMessage, ChatSession } from "@/types/kb";
import { formatTime } from "@/utils";
import { to } from "@/utils/error-handler";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

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

const getConversationPreview = (session: ChatSession) => {
  const latestMessage = [...session.messages]
    .reverse()
    .find((message) => message.content.trim());

  if (!latestMessage) return "新建对话，开始提问";

  const normalized = latestMessage.content.replace(/\s+/g, " ").trim();
  return normalized.length > 56 ? `${normalized.slice(0, 56)}...` : normalized;
};

const getDisplayFilename = (filename: string) =>
  filename.split(/[/\\]/).pop() || filename;

export const ChatPanel = () => {
  const isEnvApiKeyConfigured = Boolean(
    import.meta.env.VITE_SILICONFLOW_API_KEY?.trim(),
  );
  const {
    currentKbId,
    knowledgeBases,
    chatSessions,
    currentConversationId,
    isStreaming,
    apiKey,
    setApiKey,
    sendMessage,
    clearMessages,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useKbStore();

  const [input, setInput] = useState("");
  const [tempKey, setTempKey] = useState(apiKey);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversations = currentKbId
    ? [...chatSessions]
        .filter((session) => session.kbId === currentKbId)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    : [];
  const activeConversation =
    conversations.find((session) => session.id === currentConversationId) ??
    null;
  const messages = activeConversation?.messages ?? [];
  const currentKbName =
    knowledgeBases.find((kb) => kb.id === currentKbId)?.name ?? "未选择知识库";

  useEffect(() => {
    // 预加载头像图片
    PRELOAD_IMAGES.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  useEffect(() => {
    if (messages && scrollRef.current) {
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
    const [err] = await to(sendMessage(question));
    if (err) {
      toast.error(`发送失败: ${err}`);
    }
  };

  const handleCreateConversation = () => {
    if (!currentKbId) {
      toast.error("请先选择知识库");
      return;
    }
    createConversation();
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (isStreaming) {
      toast.error("AI 回复中，暂时无法删除对话");
      return;
    }
    deleteConversation(conversationId);
  };

  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full bg-background relative">
      <aside className="w-72 shrink-0 border-r bg-muted/20 flex flex-col">
        <div className="border-b px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">对话历史</div>
              <div className="text-xs text-muted-foreground">
                {currentKbId
                  ? `${currentKbName} · ${conversations.length} 个会话`
                  : "先选择知识库后再开始对话"}
              </div>
            </div>
            <div className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
              {conversations.length}
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={handleCreateConversation}
            disabled={!currentKbId || isStreaming}
          >
            <Plus className="h-4 w-4" />
            新建对话
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {!currentKbId && (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                在左侧知识库栏中选择一个知识库，这里的历史会自动按知识库分组展示。
              </div>
            )}

            {currentKbId && conversations.length === 0 && (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                当前知识库还没有会话，点击上方“新建对话”即可开始。
              </div>
            )}

            {conversations.map((session) => {
              const isActive = session.id === activeConversation?.id;

              return (
                <button
                  key={session.id}
                  type="button"
                  className={`group w-full rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent hover:border-border hover:bg-background/70"
                  }`}
                  onClick={() => selectConversation(session.id)}
                  disabled={isStreaming}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {session.title}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {formatTime(session.updatedAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteConversation(session.id);
                      }}
                      disabled={isStreaming}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {getConversationPreview(session)}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
          <div className="min-w-0">
            <h2 className="truncate font-medium">
              {activeConversation?.title || "AI 问答"}
            </h2>
            <p className="text-xs text-muted-foreground">
              当前知识库：{currentKbName} · 自动携带会话上下文与检索结果
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateConversation}
                  disabled={!currentKbId || isStreaming}
                  title="新建对话"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>新建对话</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  disabled={!activeConversation || isStreaming}
                  title="清空当前对话"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>清空当前对话</p>
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
              <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>设置 SiliconFlow API Key</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={tempKey}
                    disabled={isEnvApiKeyConfigured}
                    onChange={(e) => setTempKey(e.target.value)}
                  />
                  {isEnvApiKeyConfigured ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      当前使用环境变量中的 API Key，设置面板中的本地 Key
                      不生效。
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Key 将保存在本地存储中。
                    </p>
                  )}
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
                    disabled={isEnvApiKeyConfigured}
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
            <div className="flex flex-col gap-2 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  {!currentKbId ? (
                    <>
                      <Bot className="mb-4 h-12 w-12 opacity-20" />
                      <p>先选择一个知识库，再开始 AI 问答。</p>
                    </>
                  ) : !activeConversation ? (
                    <>
                      <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                      <p>当前知识库还没有会话。</p>
                      <Button
                        className="mt-4 gap-2"
                        variant="secondary"
                        onClick={handleCreateConversation}
                        disabled={isStreaming}
                      >
                        <Plus className="h-4 w-4" />
                        新建对话
                      </Button>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mb-4 h-12 w-12 opacity-20" />
                      <p>这个对话还没有消息，开始你的第一轮提问吧。</p>
                    </>
                  )}
                </div>
              )}
              {messages.map((msg: ChatMessage, i: number) => (
                <div
                  key={`${
                    // biome-ignore lint/suspicious/noArrayIndexKey: <temp>
                    i
                  }-${msg.role}`}
                  className="flex gap-4 p-4 hover:bg-muted/50 rounded-xl transition-colors"
                >
                  <ChatAvatar role={msg.role} />
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium text-sm mb-1.5 opacity-90">
                      {CHAT_ROLE_UI_CONFIG[msg.role as ChatRole].label}
                    </div>
                    {CHAT_ROLE_UI_CONFIG[msg.role as ChatRole].features
                      .showThinking &&
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
                                  key={`${doc.filename}-${
                                    // biome-ignore lint/suspicious/noArrayIndexKey: <temp>
                                    idx
                                  }`}
                                  className="bg-background rounded p-2 text-xs border shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="min-w-0 flex-1 font-medium text-xs text-primary block w-full">
                                      <TruncatedTooltip
                                        content={getDisplayFilename(
                                          doc.filename,
                                        )}
                                      />
                                    </div>
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
                      {CHAT_ROLE_UI_CONFIG[msg.role as ChatRole].features
                        .showCursor &&
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

        <div className="border-t bg-background/80 p-4 backdrop-blur-sm shrink-0">
          <div className="mx-auto mb-3 flex max-w-4xl items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            当前提问会自动携带该会话的历史上下文，并结合所选知识库内容回答。
          </div>
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              className="flex-1"
              placeholder={currentKbId ? "输入您的问题..." : "请先选择知识库"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
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
      </section>
    </div>
  );
};
