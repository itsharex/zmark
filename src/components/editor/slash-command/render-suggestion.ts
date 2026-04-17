import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import tippy, {
  type GetReferenceClientRect,
  type Instance,
  type Props,
} from "tippy.js";
import { SuggestionList } from "./suggestion-list";
import type { SuggestionListRef } from "./type";

export const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: Instance<Props>[] | null = null;

  return {
    onStart: (props: SuggestionProps) => {
      component = new ReactRenderer(SuggestionList, {
        props: {
          items: props.items,
          command: props.command,
        },
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect as GetReferenceClientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props: SuggestionProps) {
      component?.updateProps({
        items: props.items,
        command: props.command,
      });

      if (!props.clientRect) {
        return;
      }

      popup?.[0].setProps({
        getReferenceClientRect: props.clientRect as GetReferenceClientRect,
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
