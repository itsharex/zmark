import { Bot, User } from "lucide-react";
export const CHAT_ROLE = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export type ChatRole = (typeof CHAT_ROLE)[keyof typeof CHAT_ROLE];

export const CHAT_ROLE_UI_CONFIG = {
  [CHAT_ROLE.USER]: {
    label: "You",
    avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
    avatarAlt: "User Avatar",
    fallbackClass: "bg-background text-foreground",
    Icon: User,
    features: {
      showThinking: false,
      showCursor: false,
    },
  },
  [CHAT_ROLE.ASSISTANT]: {
    label: "AI Assistant",
    avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=Zoey",
    avatarAlt: "AI Assistant Avatar",
    fallbackClass: "bg-primary/10 text-primary",
    Icon: Bot,
    features: {
      showThinking: true,
      showCursor: true,
    },
  },
} as const;

export const PRELOAD_IMAGES = Object.values(CHAT_ROLE_UI_CONFIG)
  .map((config) => config.avatar)
  .filter(Boolean);
