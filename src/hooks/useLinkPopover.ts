import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";

export function useLinkPopover(editor: Editor | null) {
  const [url, setUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateUrl = () => {
      const { href } = editor.getAttributes("link");
      if (href) {
        setUrl(href);
      } else {
        setUrl("");
      }
    };

    editor.on("selectionUpdate", updateUrl);
    return () => {
      editor.off("selectionUpdate", updateUrl);
    };
  }, [editor]);

  const setLink = useCallback(
    (linkUrl: string) => {
      if (!linkUrl || !editor) return;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setIsOpen(false);
    },
    [editor],
  );

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setUrl("");
    setIsOpen(false);
  }, [editor]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    setIsOpen((prev) => !prev);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        toggleLink();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, toggleLink]);

  return {
    url,
    setUrl,
    setLink,
    removeLink,
    toggleLink,
    isOpen,
    setIsOpen,
  };
}
