import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  ensureAuthCallbackListener,
  getSession,
  loginWithGitHub,
  logoutFromGitHub,
  sendLoginMagicLink,
} from "../utils/auth";
import { to } from "../utils/error-handler";
import { supabase } from "../utils/supabase-client";

export interface UserProfile {
  id: string;
  email: string | undefined;
  name: string | null;
  avatar_url: string | null;
  user_name: string | null;
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: () => Promise<string | null>;
  sendLoginMagicLink: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateAccount: (input: {
    name?: string | null;
    avatar_url?: string | null;
  }) => Promise<string | null>;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// 辅助函数：从 Supabase User 中提取 UserProfile
function extractUserProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  const metadata = user.user_metadata || {};

  const customName = normalizeOptionalString(metadata.zmark_name);
  const customAvatarUrl = normalizeOptionalString(metadata.zmark_avatar_url);

  return {
    id: user.id,
    email: user.email,
    name:
      customName ||
      normalizeOptionalString(metadata.full_name) ||
      normalizeOptionalString(metadata.name) ||
      null,
    avatar_url:
      customAvatarUrl || normalizeOptionalString(metadata.avatar_url) || null,
    user_name:
      normalizeOptionalString(metadata.user_name) ||
      normalizeOptionalString(metadata.preferred_username) ||
      null,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  isInitializing: true,
  error: null,

  login: async () => {
    set({ loading: true, error: null });
    const [err, res] = await to(loginWithGitHub());

    set({ loading: false });

    if (err) {
      const message = err.message || "登录过程中发生未知错误";
      set({ error: message });
      return message;
    }

    if (res?.error) {
      const message =
        res.error instanceof Error ? res.error.message : String(res.error);
      set({ error: message });
      return message;
    }

    return null;
  },

  sendLoginMagicLink: async (email) => {
    set({ loading: true, error: null });
    const [err, res] = await to(sendLoginMagicLink(email));

    set({ loading: false });

    if (err) {
      const message = err.message || "发送登录链接失败";
      set({ error: message });
      return message;
    }

    if (res?.error) {
      const message =
        res.error instanceof Error ? res.error.message : String(res.error);
      set({ error: message });
      return message;
    }

    return null;
  },

  logout: async () => {
    set({ loading: true, error: null });
    const [err, res] = await to(logoutFromGitHub());

    set({ loading: false });

    if (err) {
      set({ error: err.message || "退出登录过程中发生未知错误" });
      return;
    }

    if (res?.error) {
      set({ error: res.error.message });
      return;
    }

    set({ session: null, user: null });
  },

  initialize: async () => {
    ensureAuthCallbackListener({
      onError: (message) => set({ error: message }),
    });

    // 1. 获取初始 Session
    const [err, res] = await to(getSession());

    set({ isInitializing: false });

    if (err) {
      set({ error: err.message || "初始化 Session 失败" });
    } else if (res?.error) {
      set({ error: res.error.message });
    } else {
      set({
        session: res?.session || null,
        user: extractUserProfile(res?.session?.user ?? null),
      });
    }

    // 2. 监听 Auth 状态变化
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: extractUserProfile(session?.user ?? null),
      });
    });
  },

  updateAccount: async (input) => {
    const currentUser = get().user;
    if (!currentUser) return "未登录";

    set({ loading: true, error: null });

    const dataPayload: Record<string, string | null> = {};
    if ("name" in input)
      dataPayload.zmark_name = normalizeOptionalString(input.name);
    if ("avatar_url" in input)
      dataPayload.zmark_avatar_url = normalizeOptionalString(input.avatar_url);

    const hasData = Object.keys(dataPayload).length > 0;
    const [err, res] = await to(
      supabase.auth.updateUser({
        ...(hasData ? { data: dataPayload } : {}),
      }),
    );

    set({ loading: false });

    if (err) {
      const message = err.message || "更新账号信息失败";
      set({ error: message });
      return message;
    }

    if (res?.error) {
      set({ error: res.error.message });
      return res.error.message;
    }

    if (res?.data) {
      const nextLocal = extractUserProfile(res.data.user ?? null);
      set({
        user: nextLocal,
      });
    }
    return null;
  },
}));
