import type { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useMemo } from "react";
import type { Doc } from "yjs";
import { extensions } from "../extensions";

interface UseEditorExtensionsProps {
  collabId: string | null;
  ydoc: Doc;
  provider: HocuspocusProvider | null;
  userInfo: { name: string; color: string };
}

export function useEditorExtensions({
  collabId,
  ydoc,
  provider,
  userInfo,
}: UseEditorExtensionsProps) {
  return useMemo(() => {
    const base = [...extensions];

    // 只有在开启协作模式（有 collabId）时，才注入协作相关的扩展
    if (collabId) {
      base.push(
        Collaboration.configure({
          document: ydoc,
          field: "content", // 显式指定同步的字段
        }),
      );

      if (provider) {
        base.push(
          CollaborationCursor.configure({
            provider: provider,
            user: userInfo,
          }),
        );
      }
    }

    return base;
  }, [ydoc, provider, userInfo, collabId]);
}
