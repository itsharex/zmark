import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  ensureAuthCallbackListener,
  getSession,
  loginWithGitHub,
  logoutFromGitHub,
  sendLoginMagicLink,
} from "../utils/auth";
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
}

// 辅助函数：从 Supabase User 中提取 UserProfile
function extractUserProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email,
    name: metadata.full_name || metadata.name || null,
    avatar_url: metadata.avatar_url || null,
    user_name: metadata.user_name || metadata.preferred_username || null,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  isInitializing: true,
  error: null,

  login: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await loginWithGitHub();
      if (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, loading: false });
        return message;
      }
      set({ loading: false });
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : "登录过程中发生未知错误";
      set({ error: message, loading: false });
      return message;
    }
  },

  sendLoginMagicLink: async (email) => {
    set({ loading: true, error: null });
    try {
      const { error } = await sendLoginMagicLink(email);
      if (error) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, loading: false });
        return message;
      }
      set({ loading: false });
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : "发送登录链接失败";
      set({ error: message, loading: false });
      return message;
    }
  },

  logout: async () => {
    // 开发环境模拟登出
    // if (import.meta.env.DEV) {
    //   return;
    // }

    set({ loading: true, error: null });
    try {
      const { error } = await logoutFromGitHub();
      if (error) {
        set({ error: error.message, loading: false });
      } else {
        set({ session: null, user: null, loading: false });
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "退出登录过程中发生未知错误",
        loading: false,
      });
    }
  },

  initialize: async () => {
    // 开发环境直接模拟已登录状态
    // if (import.meta.env.DEV) {
    //   const mockUser: UserProfile = {
    //     id: "dev-user-id",
    //     email: "dev@example.com",
    //     name: "Developer",
    //     avatar_url: "https://github.com/shadcn.png",
    //     user_name: "dev_user",
    //   };

    //   // 构造一个模拟的 Session 对象
    //   const mockSession = {
    //     access_token: "mock-token",
    //     refresh_token: "mock-refresh-token",
    //     expires_in: 3600,
    //     token_type: "bearer",
    //     user: {
    //       id: mockUser.id,
    //       app_metadata: {},
    //       user_metadata: {
    //         full_name: mockUser.name,
    //         avatar_url: mockUser.avatar_url,
    //         preferred_username: mockUser.user_name,
    //       },
    //       aud: "authenticated",
    //       created_at: new Date().toISOString(),
    //     } as User,
    //   } as Session;

    //   set({
    //     session: mockSession,
    //     user: mockUser,
    //     isInitializing: false,
    //   });
    //   return;
    // }

    ensureAuthCallbackListener({
      onError: (message) => set({ error: message }),
    });

    // 1. 获取初始 Session
    try {
      const { session, error } = await getSession();
      if (error) {
        set({ error: error.message, isInitializing: false });
      } else {
        set({
          session,
          user: extractUserProfile(session?.user ?? null),
          isInitializing: false,
        });
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "初始化 Session 失败",
        isInitializing: false,
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
}));
