# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2026-03-23

### ✨ New Features

- **Collaboration**: 添加协作文档功能并重构协作模块
- **Auth**: 添加开发环境免登功能

## [1.4.0] - 2026-03-20

### ✨ New Features

- **Collaboration**: 添加实时协作编辑功能

### 🐛 Bug Fixes

- **Auth**: 移除开发环境模拟以启用真实认证流程

## [1.3.0] - 2026-03-14

### ✨ New Features

- **Version Control**: 实现文档版本对比功能与历史版本 Drawer UI
- **Editor**: BubbleMenu 支持及清除格式功能
- **Search**: 实现基于 Web Worker 的异步搜索功能
- **Markdown**: 添加 markdown 图片路径转换功能

### 🐛 Bug Fixes

- **Search**: 搜索 markdown 文件时需要解析图片引用

### ⚡ Performance

- **Build**: 添加压缩插件并更新依赖版本

### ♻️ Refactor

- **Cleanup**: 移除调试用的 console.log 语句
- **Config**: 更新 biome.json 配置并修复数组索引 key 警告

## [1.2.0] - 2026-03-08

### ✨ New Features

- **File System**: 实现智能目录导航功能
- **File System**: 为文件树添加右键菜单支持删除和重命名功能
- **Search**: 添加全局搜索功能

### 🐛 Bug Fixes

- **File System**: 仅对 markdown 文件读取内容
- **StarterKit**: 禁用 StarterKit 中重复的功能

### ♻️ Refactor

- **Structure**: 文件目录规范
- **Editor**: 重构标题选择

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
