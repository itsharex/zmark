import type { AuthError, Session } from "@supabase/supabase-js";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { open } from "@tauri-apps/plugin-shell";
import { to } from "./error-handler";
import { supabase } from "./supabase-client";

export interface AuthResult {
  session: Session | null;
  error: AuthError | Error | null;
}

let isAuthCallbackListenerInstalled = false;
const processedAuthCodes = new Set<string>();

export function ensureAuthCallbackListener(options?: {
  onError?: (message: string) => void;
}) {
  if (isAuthCallbackListenerInstalled) return;
  isAuthCallbackListenerInstalled = true;

  let unlistenDeepLink: UnlistenFn | undefined;
  let unlistenEvent: UnlistenFn | undefined;

  const handleError = (message: string) => {
    console.error("[Auth] 回调处理失败:", message);
    options?.onError?.(message);
  };

  const handleUrl = async (url: string) => {
    if (!url.startsWith("zmark://")) return;

    const urlObj = new URL(url);
    const code = urlObj.searchParams.get("code");
    const errorParam = urlObj.searchParams.get("error");
    const errorDescription = urlObj.searchParams.get("error_description");

    if (errorParam || errorDescription) {
      handleError(
        `认证出错：${decodeURIComponent(errorDescription || errorParam || "未知错误")}`,
      );
      return;
    }

    if (!code) return;
    if (processedAuthCodes.has(code)) return;
    processedAuthCodes.add(code);

    const [err, res] = await to(supabase.auth.exchangeCodeForSession(code));
    if (err) {
      handleError(err.message || "处理回调 URL 时发生未知错误");
      return;
    }

    if (res?.error) {
      handleError(`换取 Session 失败：${res.error.message}`);
    }
  };

  (async () => {
    const setupListeners = async () => {
      unlistenDeepLink = await onOpenUrl((urls) => {
        for (const url of urls) {
          void handleUrl(url);
        }
      });

      unlistenEvent = await listen<string>("deep-link-received", (event) => {
        void handleUrl(event.payload);
      });
    };

    const [err] = await to(setupListeners());
    if (err) {
      handleError(err.message || "设置回调监听失败（可能未运行在 Tauri 环境）");
      isAuthCallbackListenerInstalled = false;
      if (unlistenDeepLink) unlistenDeepLink();
      if (unlistenEvent) unlistenEvent();
    }
  })();
}

/**
 * 启动 GitHub OAuth 登录流程
 */
export async function loginWithGitHub(): Promise<AuthResult> {
  const [err, res] = await to(
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: "zmark://callback",
        skipBrowserRedirect: true,
      },
    }),
  );

  if (err) {
    console.error("[Auth] 登录流程异常:", err);
    return {
      session: null,
      error: err instanceof Error ? err : new Error("登录过程中发生未知错误"),
    };
  }

  if (res?.error) {
    console.error("[Auth] 获取认证 URL 失败:", res.error);
    return {
      session: null,
      error: new Error(`启动登录失败：${res.error.message}`),
    };
  }

  if (!res?.data?.url) {
    console.error("[Auth] 未获取到 URL");
    return { session: null, error: new Error("未能获取到登录 URL") };
  }

  await open(res.data.url);
  return { session: null, error: null };
}

export async function sendLoginMagicLink(email: string): Promise<{
  error: AuthError | Error | null;
}> {
  const [err, res] = await to(
    supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "zmark://callback",
      },
    }),
  );

  if (err) {
    return {
      error: err instanceof Error ? err : new Error("发送登录链接失败"),
    };
  }

  return { error: res?.error ?? null };
}

/**
 * 退出登录
 */
export async function logoutFromGitHub(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 获取当前 Session
 */
export async function getSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
