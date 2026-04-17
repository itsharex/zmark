import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * 包装 Promise 以返回 [error, data] 元组，消除 try-catch 嵌套
 * 灵感来源于 await-to-js
 * @example
 * const [err, data] = await to(fetchData());
 * if (err) return handleError(err);
 */
export async function to<T, U = Error>(
  promise: Promise<T>,
  errorExt?: object,
): Promise<[U, undefined] | [null, T]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err: any) {
    if (errorExt) {
      Object.assign(err, errorExt);
    }
    return [err, undefined];
  }
}

/**
 * 包装同步函数以返回 [error, data] 元组
 */
export function toSync<T, U = Error>(
  fn: () => T,
  errorExt?: object,
): [U, undefined] | [null, T] {
  try {
    const data = fn();
    return [null, data];
  } catch (err: any) {
    if (errorExt) {
      Object.assign(err, errorExt);
    }
    return [err, undefined];
  }
}

/**
 * 安全执行同步或异步函数，自动捕获错误并返回 [error, data] 元组
 */
export function safeExecute<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T> | T,
  onError?: (err: Error) => void,
) {
  return async (...args: Args): Promise<[Error, undefined] | [null, T]> => {
    try {
      const result = await fn(...args);
      return [null, result];
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (onError) onError(error);
      return [error, undefined];
    }
  };
}

interface UseAsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string | ((err: Error) => string);
  showErrorToast?: boolean;
}

/**
 * 针对 React 组件的异步操作封装，自动处理 loading 状态和全局错误 Toast
 * @example
 * const { execute: handleSave, isLoading } = useAsyncAction(saveData, {
 *   successMessage: "保存成功",
 *   errorMessage: "保存失败"
 * });
 */
export function useAsyncAction<T, Args extends any[]>(
  action: (...args: Args) => Promise<T>,
  options: UseAsyncActionOptions<T> = {},
) {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showErrorToast = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await action(...args);
        if (successMessage) {
          toast.success(successMessage);
        }
        onSuccess?.(result);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        if (showErrorToast) {
          const msg =
            typeof errorMessage === "function"
              ? errorMessage(err)
              : errorMessage || err.message || "操作失败";
          toast.error(msg);
        }
        onError?.(err);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [action, onSuccess, onError, successMessage, errorMessage, showErrorToast],
  );

  return { execute, isLoading, error };
}
