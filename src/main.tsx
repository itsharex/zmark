import React from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";
import App from "./App";
import { ErrorBoundary } from "./components/error-boundary";
import "./index.css";

import { toSync } from "@/utils/error-handler";

// 全局错误捕获
window.addEventListener("error", (event) => {
  console.error("Global Error:", event.error);
  toast.error(`应用错误: ${event.message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Rejection:", event.reason);
  toast.error(
    `异步操作失败: ${event.reason?.message || event.reason || "未知错误"}`,
  );
});

console.log("App starting...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  const [err] = toSync(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  });

  if (err) {
    console.error("Failed to mount app:", err);
  } else {
    console.log("App mounted");
  }
}
