import type { AuthError, Session } from "@supabase/supabase-js";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { open } from "@tauri-apps/plugin-shell";
import { supabase } from "./supabase";

export interface AuthResult {
  session: Session | null;
  error: AuthError | Error | null;
}

/**
 * 启动 GitHub OAuth 登录流程
 */
export async function loginWithGitHub(): Promise<AuthResult> {
  try {
    console.log("[Auth] 开始 GitHub 登录流程...");
    // 1. 启动 OAuth 流程获取认证 URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: "zmark://callback",
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error("[Auth] 获取认证 URL 失败:", error);
      return {
        session: null,
        error: new Error(`启动登录失败: ${error.message}`),
      };
    }

    if (!data.url) {
      console.error("[Auth] 未获取到 URL");
      return { session: null, error: new Error("未能获取到登录 URL") };
    }

    console.log("[Auth] 获取认证 URL 成功:", data.url);

    // 2. 返回 Promise 等待回调
    return new Promise<AuthResult>((resolve) => {
      let unlistenDeepLink: UnlistenFn | undefined;
      let unlistenEvent: UnlistenFn | undefined;

      // 清理监听器的函数
      const cleanup = () => {
        if (unlistenDeepLink) unlistenDeepLink();
        if (unlistenEvent) unlistenEvent();
      };

      // 处理回调 URL 的核心逻辑
      const handleUrl = async (url: string) => {
        console.log("[Auth] 收到 Deep Link:", url);
        try {
          // 解析 URL 参数
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get("code");
          const errorParam = urlObj.searchParams.get("error");
          const errorDescription = urlObj.searchParams.get("error_description");

          if (errorParam || errorDescription) {
            console.error(
              "[Auth] Deep Link 包含错误:",
              errorParam,
              errorDescription,
            );
            cleanup();
            resolve({
              session: null,
              error: new Error(
                `认证出错: ${decodeURIComponent(errorDescription || errorParam || "未知错误")}`,
              ),
            });
            return;
          }

          if (code) {
            console.log("[Auth] 获取到 Authorization Code:", code);
            // 使用 code 换取 session
            console.log("[Auth] 正在使用 code 换取 session...");
            const { data: sessionData, error: sessionError } =
              await supabase.auth.exchangeCodeForSession(code);

            cleanup();

            if (sessionError) {
              console.error("[Auth] 换取 Session 失败:", sessionError);
              resolve({
                session: null,
                error: new Error(`换取 Session 失败: ${sessionError.message}`),
              });
            } else {
              console.log(
                "[Auth] 登录成功! User:",
                sessionData.session?.user.email,
              );
              resolve({ session: sessionData.session, error: null });
            }
          } else {
            console.warn("[Auth] Deep Link 中未找到 code 参数");
          }
        } catch (e) {
          console.error("[Auth] 处理 Deep Link 时发生异常:", e);
          cleanup();
          resolve({
            session: null,
            error:
              e instanceof Error ? e : new Error("处理回调 URL 时发生未知错误"),
          });
        }
      };

      // 异步设置监听器并打开浏览器
      (async () => {
        try {
          // 监听 App 未运行时启动的情况 (系统直接通过 URL 唤起)
          unlistenDeepLink = await onOpenUrl((urls) => {
            console.log("[Auth] onOpenUrl 触发:", urls);
            for (const url of urls) {
              if (url.startsWith("zmark://")) {
                handleUrl(url);
                break;
              }
            }
          });
          console.log("[Auth] onOpenUrl 监听器已设置");

          // 监听 App 已运行时的情况 (通过 Rust 插件 single-instance 转发的事件)
          unlistenEvent = await listen<string>(
            "deep-link-received",
            (event) => {
              console.log("[Auth] deep-link-received 事件触发:", event.payload);
              handleUrl(event.payload);
            },
          );
          console.log("[Auth] deep-link-received 监听器已设置");

          // 监听器设置完成后，打开浏览器
          console.log("[Auth] 正在打开浏览器...");
          await open(data.url);
          console.log("[Auth] 浏览器已打开");
        } catch (err) {
          console.error("[Auth] 设置监听或打开浏览器失败:", err);
          cleanup();
          resolve({
            session: null,
            error:
              err instanceof Error
                ? err
                : new Error("设置监听或打开浏览器失败"),
          });
        }
      })();
    });
  } catch (e) {
    console.error("[Auth] 登录流程异常:", e);
    return {
      session: null,
      error: e instanceof Error ? e : new Error("登录过程中发生未知错误"),
    };
  }
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
