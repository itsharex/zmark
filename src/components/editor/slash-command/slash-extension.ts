import { type Editor, Extension, type Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { renderItems } from "./render-suggestion";
import { getSuggestionItems } from "./suggestion-list";
import type { SuggestionItem } from "./type";

export const SlashCommand = Extension.create({
  name: "slash-command",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        /**
         * 当用户从 React 菜单中选中一项时触发
         * @param params.editor 编辑器实例
         * @param params.range 输入 "/" 的文本范围
         * @param params.props 用户选中的那个 Item 对象 (在 React 中通过 onSelect 传回)
         */
        command: (params: {
          editor: Editor;
          range: Range;
          props: SuggestionItem;
        }) => {
          const { editor, range, props: selectedItem } = params;
          // 执行选中项自带的业务逻辑
          selectedItem.run({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const slashSuggestion = {
  char: "/",
  items: ({ query }: { query: string }) => {
    return getSuggestionItems()
      .filter((item) =>
        item.title.toLowerCase().startsWith(query.toLowerCase()),
      )
      .slice(0, 10);
  },
  render: renderItems,
};
