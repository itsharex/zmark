import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// 错误捕获
window.addEventListener("error", (event) => {
  console.error("Global Error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Rejection:", event.reason);
});

console.log("App starting...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log("App mounted");
  } catch (error) {
    console.error("Failed to mount app:", error);
  }
}
