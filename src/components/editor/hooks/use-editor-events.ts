import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { handleImageUpload } from "@/utils";

export function useEditorEvents() {
  return {
    click: (_: any, event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        const { metaKey, ctrlKey } = event;

        if (href) {
          if (metaKey || ctrlKey) {
            openUrl(href).catch((error) => {
              console.error("Failed to open URL:", error);
              toast.error("无法打开链接");
            });
          }
          // 彻底阻止所有默认点击行为，防止浏览器或 Tiptap 扩展自动打开链接
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
      return false;
    },
    paste: (view: any, event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          handleImageUpload(file)
            .then((url) => {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: url }),
                ),
              );
              toast.success("图片已上传");
            })
            .catch((err) => {
              console.error("Image upload failed:", err);
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              toast.error(`图片上传失败: ${errorMessage}`);
            });
          return true;
        }
      }
      return false;
    },
  };
}
