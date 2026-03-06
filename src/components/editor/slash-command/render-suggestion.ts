import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance, type Props } from "tippy.js";
import { SuggestionList } from "./suggestion-list";
import type { SuggestionListRef } from "./type";

export const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: Instance<Props>[] | null = null;

  return {
    onStart: (props: SuggestionProps) => {
      component = new ReactRenderer(SuggestionList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy("body", {
        // biome-ignore lint/suspicious/noExplicitAny: <Tiptap 提供的 clientRect 返回值类型与 Tippy 要求的 DOMRect 略有不匹配，这种情况下使用断言是目前最稳妥的处理方式>
        getReferenceClientRect: props.clientRect as any,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props: SuggestionProps) {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup?.[0].setProps({
        // biome-ignore lint/suspicious/noExplicitAny: <Tiptap 提供的 clientRect 返回值类型与 Tippy 要求的 DOMRect 略有不匹配，这种情况下使用断言是目前最稳妥的处理方式>
        getReferenceClientRect: props.clientRect as any,
      });
    },

    onKeyDown(props: { event: KeyboardEvent }) {
      if (props.event.key === "Escape") {
        popup?.[0].hide();
        return true;
      }

      return (component?.ref as SuggestionListRef)?.onKeyDown(props);
    },

    onExit() {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};
