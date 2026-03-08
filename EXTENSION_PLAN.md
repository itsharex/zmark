# ZNote 技术扩展方案 (毕业设计专用版)

本项目是一个基于 **Tauri + React + Tiptap** 构建的现代化技术文档编辑器。为了提升项目的深度与竞争力，以下是针对进阶功能点的详细技术实现方案，并已将其转化为可跟踪的任务列表。

---

## 1. 全文搜索系统 (Full-text Search)
*   **功能描述**：支持对本地知识库中的所有文档内容进行关键词检索，并高亮显示预览片段。
*   **技术选型**： `https://github.com/lucaong/minisearch` 或 `https://github.com/nextapps-de/flexsearch` (轻量级客户端索引库)。
*   **任务列表**：
    - [ ] **增量索引**：在文件保存逻辑中触发索引更新。
    - [ ] **检索层**：使用 Web Worker 处理大规模文档索引，避免阻塞主线程。
    - [ ] **UI 实现**：通过 Command 面板（类似 VSCode 的 `Cmd+P`）展示搜索结果，支持上下键选择和回车跳转。

## 2. 多人实时协作 (Real-time Collaboration)
*   **功能描述**：多人在不同终端同时编辑同一份文档，光标位置实时同步，无冲突合并。
*   **技术选型**： `https://yjs.dev/` (CRDT 算法) + `https://tiptap.dev/hocuspocus` (WebSocket 后端)。
*   **任务列表**：
    - [ ] **编辑器集成**：使用 Tiptap 的官方扩展 `@tiptap/extension-collaboration`。
    - [ ] **通信层**：部署一个轻量级的 Node.js 服务作为协同中转站，或使用 P2P (WebRTC) 方案实现局域网协作。
    - [ ] **光标同步**：通过 `@tiptap/extension-collaboration-cursor` 渲染其他用户的姓名 and 颜色光标。

## 3. 文档版本历史 (Version Control)
*   **功能描述**：记录文档的每一次重大修改，支持“一键回滚”到历史某个时刻。
*   **技术选型**：本地 Git 引擎 或 自定义快照存储。
*   **任务列表**：
    - [ ] **Git 驱动**：利用 Tauri 的 `Command` API 调用本地 `git` 指令（`git commit`），将每个保存点作为一次提交。
    - [ ] **差异对比**：使用 `https://github.com/kpdecker/jsdiff` 对两个版本的 JSON 树进行对比，并利用自定义 Tiptap Node 渲染差异。

## 4. Notion 级交互体验 (Interactive UI)
*   **功能描述**：支持 `/` 快捷指令菜单和选中文字后的浮动工具栏。
*   **技术选型**：Tiptap `Suggestion` 扩展。
*   **任务列表**：
    - [x] **Slash Command**：监听键盘输入 `/`，弹出快速插入菜单，支持插入代码块、图片或标题。
    - [ ] **Bubble Menu**：当检测到文本选中时，在光标上方显示浮动菜单，提供加粗、链接、高亮等常用操作。

## 5. 多格式导出引擎 (Export Engine)
*   **功能描述**：将富文本内容完美还原为 Markdown、PDF、HTML 或 Word。
*   **技术选型**：`tiptap-markdown`, `html2pdf.js`, `Pandoc` (进阶)。
*   **任务列表**：
    - [x] **Markdown**：利用现有的 `tiptap-markdown` 插件将编辑器 JSON 转换为标准 MD 字符串。
    - [ ] **PDF 导出**：渲染一个隐藏的、应用了打印样式的 HTML 容器，通过 `window.print()` 或 `html2canvas` + `jspdf` 生成 PDF 文件。
    - [ ] **Tauri 通道**：通过 Tauri 的 `save` 对话框，让用户选择导出路径。

## 6. 智能目录导航 (Dynamic ToC)
*   **功能描述**：实时提取文档标题生成大纲，点击目录自动平滑滚动到对应位置。
*   **任务列表**：
    - [x] **数据提取**：遍历 Tiptap 的文档树（Document Schema），提取所有 `heading` 节点。
    - [x] **联动效果**：实现双向联动（滚动文档时侧边栏目录自动高亮，点击目录时文档滚动）。

## 7. 附件管理与离线资源 (Asset Management)
*   **功能描述**：支持拖拽图片上传，并在本地建立 `.assets` 文件夹统一管理图片、附件。
*   **任务列表**：
    - [x] **本地化存储**：拦截图片插入动作，通过 Tauri 的 `fs` 插件将文件复制到项目根目录下的 `.assets` 文件夹。
    - [ ] **相对路径解析**：在编辑器中动态转换资源路径，确保跨设备打开时图片不丢失。
