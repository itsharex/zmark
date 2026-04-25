import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHAT_ROLE } from "@/consts/chat";
import type {
  ChatHistoryMessage,
  ChatMessage,
  ChatSession,
  Document,
  KnowledgeBase,
  ThinkingProcess,
} from "@/types/kb";
import { to } from "@/utils";

const defaultApiKey = import.meta.env.VITE_SILICONFLOW_API_KEY?.trim() || "";
const hasEnvApiKeyConfigured = defaultApiKey.length > 0;
const DEFAULT_CHAT_TITLE = "新对话";

const sortSessions = (sessions: ChatSession[]) =>
  [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

const buildConversationTitle = (question: string) => {
  const normalized = question.replace(/\s+/g, " ").trim();
  if (!normalized) return DEFAULT_CHAT_TITLE;
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
};

const createEmptySession = (kbId: string): ChatSession => {
  const timestamp = Date.now();
  return {
    id: crypto.randomUUID(),
    kbId,
    title: DEFAULT_CHAT_TITLE,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  };
};

const resolveConversationId = (
  kbId: string | null,
  currentConversationId: string | null,
  chatSessions: ChatSession[],
) => {
  if (!kbId) return null;

  const currentSession = chatSessions.find((session) => {
    return session.id === currentConversationId && session.kbId === kbId;
  });
  if (currentSession) return currentSession.id;

  return (
    sortSessions(chatSessions.filter((session) => session.kbId === kbId))[0]
      ?.id ?? null
  );
};

const updateChatSession = (
  chatSessions: ChatSession[],
  sessionId: string,
  updater: (session: ChatSession) => ChatSession,
) => {
  return sortSessions(
    chatSessions.map((session) => {
      if (session.id !== sessionId) return session;
      return updater(session);
    }),
  );
};

interface KbState {
  currentKbId: string | null;
  knowledgeBases: KnowledgeBase[];
  documents: Document[];
  chatSessions: ChatSession[];
  currentConversationId: string | null;
  isStreaming: boolean;
  apiKey: string;

  setApiKey: (key: string) => void;
  setCurrentKbId: (id: string | null) => void;
  fetchKnowledgeBases: () => Promise<void>;
  fetchDocuments: (kbId: string) => Promise<void>;
  createKnowledgeBase: (name: string) => Promise<void>;
  addDocument: (
    kbId: string,
    filename: string,
    content: string,
  ) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  createConversation: () => string | null;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (question: string) => Promise<void>;
  clearMessages: () => void;
}

export const useKbStore = create<KbState>()(
  persist(
    (set, get) => ({
      currentKbId: null,
      knowledgeBases: [],
      documents: [],
      chatSessions: [],
      currentConversationId: null,
      isStreaming: false,
      apiKey: defaultApiKey,

      setApiKey: (apiKey) =>
        set({
          apiKey: hasEnvApiKeyConfigured ? defaultApiKey : apiKey.trim(),
        }),

      setCurrentKbId: (currentKbId) => {
        set((state) => ({
          currentKbId,
          currentConversationId: resolveConversationId(
            currentKbId,
            state.currentConversationId,
            state.chatSessions,
          ),
          documents: currentKbId ? state.documents : [],
        }));
      },

      fetchKnowledgeBases: async () => {
        const [err, kbs] = await to(
          invoke<KnowledgeBase[]>("list_knowledge_bases"),
        );
        if (err) {
          console.error("Failed to fetch knowledge bases:", err);
        } else {
          set({ knowledgeBases: kbs });
        }
      },

      fetchDocuments: async (kbId) => {
        const [err, docs] = await to(
          invoke<Document[]>("list_documents", { kbId }),
        );
        if (err) {
          console.error("Failed to fetch documents:", err);
        } else {
          set({ documents: docs });
        }
      },

      createKnowledgeBase: async (name) => {
        const [err, newKb] = await to(
          invoke<KnowledgeBase>("create_knowledge_base", {
            name,
          }),
        );
        if (err) {
          console.error("Failed to create knowledge base:", err);
          throw err;
        }
        if (newKb) {
          set((state) => ({
            knowledgeBases: [newKb, ...state.knowledgeBases],
            currentKbId: state.currentKbId || newKb.id,
          }));
        }
      },

      addDocument: async (kbId, filename, content) => {
        const { apiKey } = get();
        if (!apiKey) throw new Error("API Key is required");
        const [err, newDoc] = await to(
          invoke<Document>("add_document", {
            kbId,
            filename,
            content,
            apiKey,
          }),
        );
        if (err) {
          console.error("Failed to add document:", err);
          throw err;
        }
        if (newDoc) {
          set((state) => ({
            documents: [newDoc, ...state.documents],
          }));
        }
      },

      deleteDocument: async (docId) => {
        const [err] = await to(invoke("delete_document", { docId }));
        if (err) {
          console.error("Failed to delete document:", err);
          throw err;
        }
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== docId),
        }));
      },

      createConversation: () => {
        const { currentKbId } = get();
        if (!currentKbId) return null;

        const newSession = createEmptySession(currentKbId);
        set((state) => ({
          chatSessions: sortSessions([newSession, ...state.chatSessions]),
          currentConversationId: newSession.id,
        }));

        return newSession.id;
      },

      selectConversation: (id) => {
        set((state) => {
          const targetSession = state.chatSessions.find(
            (session) => session.id === id,
          );
          if (!targetSession) return state;

          return {
            currentKbId: targetSession.kbId,
            currentConversationId: targetSession.id,
          };
        });
      },

      deleteConversation: (id) => {
        set((state) => {
          const nextSessions = state.chatSessions.filter(
            (session) => session.id !== id,
          );
          return {
            chatSessions: sortSessions(nextSessions),
            currentConversationId:
              state.currentConversationId === id
                ? resolveConversationId(state.currentKbId, null, nextSessions)
                : state.currentConversationId,
          };
        });
      },

      sendMessage: async (question) => {
        const {
          currentKbId,
          apiKey,
          isStreaming,
          chatSessions,
          currentConversationId,
        } = get();
        const trimmedQuestion = question.trim();
        if (!currentKbId || !apiKey || isStreaming || !trimmedQuestion) return;

        const activeConversationId = resolveConversationId(
          currentKbId,
          currentConversationId,
          chatSessions,
        );
        const activeSession = chatSessions.find(
          (session) => session.id === activeConversationId,
        );
        const conversationId = activeSession?.id ?? crypto.randomUUID();
        const timestamp = Date.now();
        const history: ChatHistoryMessage[] = (activeSession?.messages ?? [])
          .filter((message) => message.content.trim())
          .map(({ role, content }) => ({
            role,
            content,
          }));

        set((state) => {
          const baseSession = state.chatSessions.find(
            (session) => session.id === conversationId,
          ) ?? {
            id: conversationId,
            kbId: currentKbId,
            title: buildConversationTitle(trimmedQuestion),
            createdAt: timestamp,
            updatedAt: timestamp,
            messages: [],
          };
          const nextMessages: ChatMessage[] = [
            ...baseSession.messages,
            { role: CHAT_ROLE.USER, content: trimmedQuestion },
            { role: CHAT_ROLE.ASSISTANT, content: "" },
          ];
          const nextSession: ChatSession = {
            ...baseSession,
            title:
              baseSession.messages.length === 0
                ? buildConversationTitle(trimmedQuestion)
                : baseSession.title,
            updatedAt: timestamp,
            messages: nextMessages,
          };

          return {
            chatSessions: sortSessions([
              nextSession,
              ...state.chatSessions.filter(
                (session) => session.id !== conversationId,
              ),
            ]),
            currentConversationId: conversationId,
            isStreaming: true,
          };
        });

        let unlistenThinking: (() => void) | undefined;
        let unlistenStream: (() => void) | undefined;
        let unlistenDone: (() => void) | undefined;

        const cleanupListeners = () => {
          unlistenThinking?.();
          unlistenStream?.();
          unlistenDone?.();
        };

        const setupListenersAndChat = async () => {
          unlistenThinking = await listen<ThinkingProcess>(
            "chat-thinking",
            (event) => {
              set((state) => {
                return {
                  chatSessions: updateChatSession(
                    state.chatSessions,
                    conversationId,
                    (session) => {
                      const nextMessages = [...session.messages];
                      const lastMessage = nextMessages[nextMessages.length - 1];
                      if (
                        lastMessage &&
                        lastMessage.role === CHAT_ROLE.ASSISTANT
                      ) {
                        lastMessage.thinking = event.payload;
                      }
                      return {
                        ...session,
                        updatedAt: Date.now(),
                        messages: nextMessages,
                      };
                    },
                  ),
                };
              });
            },
          );

          unlistenStream = await listen<string>("chat-stream", (event) => {
            set((state) => {
              return {
                chatSessions: updateChatSession(
                  state.chatSessions,
                  conversationId,
                  (session) => {
                    const nextMessages = [...session.messages];
                    const lastMessage = nextMessages[nextMessages.length - 1];
                    if (
                      lastMessage &&
                      lastMessage.role === CHAT_ROLE.ASSISTANT
                    ) {
                      lastMessage.content += event.payload;
                    }
                    return {
                      ...session,
                      updatedAt: Date.now(),
                      messages: nextMessages,
                    };
                  },
                ),
              };
            });
          });

          unlistenDone = await listen("chat-done", () => {
            set({ isStreaming: false });
            cleanupListeners();
          });

          await invoke("chat", {
            kbId: currentKbId,
            question: trimmedQuestion,
            apiKey,
            history,
          });
        };

        const [err] = await to(setupListenersAndChat());
        if (err) {
          console.error("Chat failed:", err);
          set({ isStreaming: false });
          cleanupListeners();
          throw err;
        }
      },

      clearMessages: () => {
        set((state) => {
          if (!state.currentConversationId) return state;

          return {
            chatSessions: updateChatSession(
              state.chatSessions,
              state.currentConversationId,
              (session) => ({
                ...session,
                updatedAt: Date.now(),
                messages: [],
              }),
            ),
          };
        });
      },
    }),
    {
      name: "kb-storage",
      partialize: (state) =>
        hasEnvApiKeyConfigured
          ? {
              currentKbId: state.currentKbId,
              currentConversationId: state.currentConversationId,
              chatSessions: state.chatSessions,
            }
          : {
              apiKey: state.apiKey.trim(),
              currentKbId: state.currentKbId,
              currentConversationId: state.currentConversationId,
              chatSessions: state.chatSessions,
            },
      merge: (persistedState, currentState) => {
        const persistedApiKey = (
          persistedState as Partial<KbState>
        )?.apiKey?.trim();
        const envApiKey = currentState.apiKey.trim();
        const nextState = {
          ...currentState,
          ...(persistedState as Partial<KbState>),
          apiKey: envApiKey || persistedApiKey || "",
        };

        return {
          ...nextState,
          currentConversationId: resolveConversationId(
            nextState.currentKbId,
            nextState.currentConversationId,
            nextState.chatSessions ?? [],
          ),
        };
      },
    },
  ),
);
