# Changelog

All notable changes to this project will be documented in this file.

## [1.1.2] - 2026-03-07

### 🐛 Bug Fixes

- **Release**: 修复生产环境缺失环境变量导致的白屏问题
- **Auth**: 优化 Supabase 初始化逻辑，避免应用崩溃

## [1.1.1] - 2026-03-07

### ⚡ Performance

- **Build**: 优化构建配置，解决 Chunk Size Warning，拆分 vendor 包以提升加载性能

## [1.1.0] - 2026-03-07

### ✨ New Features

- **Auth**: 实现基于 Supabase 和 GitHub OAuth 的认证系统
- **Editor**:
    - 添加任务列表 (Task List) 功能支持
    - 添加斜杠命令 (Slash Command) 扩展支持
    - 添加图片上传功能
    - 添加链接功能支持

### 🐛 Bug Fixes

- **File System**: 过滤隐藏文件并优化路径处理

### ♻️ Refactor

- 重构项目结构
- 重构通用组件与编辑器菜单栏组件
- 优化代码组织

### 📝 Documentation

- 更新项目文档

---

## [1.0.0] - 2026-03-01

### ✨ New Features

- **Knowledge Base**: 实现知识库问答功能 (RAG)
- **UI/UX**:
    - 实现暗黑模式 (Dark Mode) 支持
    - 优化 UI 提示与按钮样式
- **Editor**:
    - 添加代码块语法高亮 (Syntax Highlighting)
    - 添加上下标功能支持
    - 添加列表扩展支持
    - 优化高亮颜色选择器
    - 添加占位符显示

### 🐛 Bug Fixes

- 修复滚动与定位问题
- 修复 Biome 格式化问题

### ⚙️ CI/CD

- 添加 Tauri 发布工作流 (GitHub Actions)
