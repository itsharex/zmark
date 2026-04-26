# ZMark 功能迭代计划表 (Roadmap)

以下是基于当前项目架构（Tauri + React + Tiptap + Yjs + Supabase）的功能增强建议列表。你可以通过勾选复选框来标记开发进度。

## 1. 桌面端原生体验增强 (Tauri 特性)
- [ ] **全局快捷键与 Quick Capture (快速记录)**：注册系统全局快捷键（如 `Cmd/Ctrl + Shift + Space`），在任何软件中呼出悬浮窗快速记录灵感（类似 Raycast 或 Logseq）。
- [x] **系统托盘 (System Tray)**：最小化到系统托盘，后台保持 Yjs 的协作同步和 WebSocket 连接。
- [x] **文件关联 (File Associations)**：在系统层面注册 `.md` 或专属的 `.zmark` 扩展名，双击本地文件直接通过 ZMark 打开。
- [x] **本地优先的 SQLite 存储**：结合 `@tauri-apps/plugin-sql`，将文档缓存和索引存储在本地 SQLite 中，实现离线可用，连网后自动同步（Local-first 架构）。

## 2. 知识库与双向链接 (KB Enhancements)
- [ ] **双向链接 (Bi-directional Links)**：支持 `[[页面名称]]` 语法，自动关联其他文档。
- [ ] **知识图谱 (Graph View)**：基于双向链接的数据，使用 D3.js 或 ECharts 渲染文档间的关系网状图。
- [ ] **Frontmatter / 属性面板**：为每篇文档添加元数据（标签、状态、创建时间、自定义字段），方便在侧边栏或全局进行过滤。
- [ ] **多工作区 (Workspaces)**：支持本地文件夹作为工作区，或 Supabase 云端多团队切换。

## 3. 编辑器深度功能 (Tiptap 扩展)
- [ ] **块级拖拽 (Block Drag & Drop)**：类似 Notion 的左侧拖拽手柄，方便用户重新排列段落、列表或代码块。
- [ ] **丰富的嵌入块 (Embeds)**：支持粘贴链接自动转换为 YouTube 视频、Figma 画板、Twitter 甚至 Excalidraw 白板。
- [ ] **行内批注与评论 (Comments & Annotations)**：在协作模式下，除了光标同步，增加针对特定文本划线评论的功能（类似 Google Docs）。
- [x] **代码块增强 (Code Block Execution)**：在代码高亮的基础上，增加“一键复制”或类似 Jupyter 的代码运行功能。

## 4. AI 与智能化 (AI Integration)
- [x] **AI 辅助写作 (AI Copilot)**：在编辑器中按下 `Space` 或特定快捷键，触发 AI 续写、润色、翻译或总结选中文本。
- [x] **RAG 本地知识问答**：结合本地文件系统，使用本地大模型（如 Ollama）或云端向量数据库（Supabase pgvector），让 AI 能够“阅读”整个知识库来回答问题。
- [ ] **自动打标签与分类**：AI 自动分析当前文档内容，生成标签或推荐存放在哪个文件夹。

## 5. 导出与发布 (Export & Publish)
- [ ] **多格式导出**：利用 Tauri 后端调用 Pandoc 或原生功能，支持将文档导出为 PDF、Word、HTML 或标准 Markdown。
- [ ] **静态发布**：提供一键分享功能，生成一个公开的 Web 链接，或者将选中的文档/文件夹打包成静态网页博客。
