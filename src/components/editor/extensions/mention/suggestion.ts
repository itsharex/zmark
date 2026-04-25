import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import tippy, {
  type GetReferenceClientRect,
  type Instance,
  type Props,
} from "tippy.js";
import { useEditorStore } from "@/stores/editor";
import { getAllMarkdownFiles } from "@/utils";
import { MentionList } from "./mention-list";

export const getMentionSuggestion = (): Omit<
  SuggestionOptions,
  "editor" | "command"
> => ({
  char: "@",
  items: async ({ query }) => {
    const files = await getAllMarkdownFiles();
    const curPath = useEditorStore.getState().curPath;

    const mappedFiles = files
      .filter((f) => f.path !== curPath)
      .map((f) => ({
        name: f.name.endsWith(".md") ? f.name.slice(0, -3) : f.name,
        path: f.path,
      }));

    if (!query) {
      return mappedFiles.slice(0, 10);
    }
    return mappedFiles
      .filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  },
  render: () => {
    let component: ReactRenderer | null = null;
    let popup: Instance<Props>[] | null = null;

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
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

      onUpdate(props) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0].setProps({
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup?.[0].hide();
          return true;
        }

        // biome-ignore lint/suspicious/noExplicitAny: Required for React component ref access
        return (component?.ref as any)?.onKeyDown(props);
      },

      onExit() {
        popup?.[0].destroy();
        component?.destroy();
      },
    };
  },
});
