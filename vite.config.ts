import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// import { compression } from "vite-plugin-compression2";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // compression({
    //   include: [/\.(js)$/, /\.(css)$/, /\.(html)$/],
    //   threshold: 1400,
    //   algorithms: ["brotliCompress"],
    // }),
  ],

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,

    // Tauri 开发时需要显式 host
    host: host ?? "localhost",

    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      ignored: ["**/src-tauri/**", "**/*.md", "**/*.zmark"],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("lowlight")) {
              return "lowlight";
            }
            if (
              id.includes("@tiptap") ||
              id.includes("tiptap") ||
              id.includes("prosemirror")
            ) {
              return "editor";
            }
            if (
              id.includes("react-markdown") ||
              id.includes("remark") ||
              id.includes("rehype")
            ) {
              return "markdown";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("@tauri-apps")) {
              return "tauri";
            }
            if (
              id.includes("lucide-react") ||
              id.includes("radix-ui") ||
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge") ||
              id.includes("sonner")
            ) {
              return "ui";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
