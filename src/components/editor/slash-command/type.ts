import type { Editor, Range } from "@tiptap/core";

/**
 * 具体的命令执行参数
 */
export interface ActionParams {
  editor: Editor;
  range: Range;
}

/**
 * 单个菜单项的结构
 */
export interface SuggestionItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  /**
   * 具体的业务执行逻辑 (如: 变标题、插代码块)
   */
  run: (params: ActionParams) => void;
}

/**
 * React 列表组件接收的 Props
 */
export interface SuggestionListProps {
  /**
   * 要显示的命令项列表
   */
  items: SuggestionItem[];
  /**
   * 当用户选中某一项后的回调函数 (由 Tiptap 自动生成并传入)
   */
  onSelect: (item: SuggestionItem) => void;
}

/**
 * SuggestionList 通过 forwardRef 暴露出的方法
 */
export interface SuggestionListRef {
  onKeyDown: (params: { event: KeyboardEvent }) => boolean;
}
