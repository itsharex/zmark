import { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "sonner";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      toast.error(`渲染错误: ${error.message}`);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认的降级 UI
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-500">
            抱歉，应用遇到了意外错误
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {this.state.error?.message}
          </p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            刷新页面重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
