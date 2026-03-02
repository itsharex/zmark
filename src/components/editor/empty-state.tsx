import { GalleryVerticalEndIcon } from "lucide-react";
import { useKeyDisplay } from "@/hooks/use-key-display";

const Shortcut = ({ label }: { label: string }) => {
  const { shortcuts } = useKeyDisplay();
  const shortcut = shortcuts[label as keyof typeof shortcuts];

  if (typeof shortcut !== "string") return null;

  const keys = shortcut.split("+");

  return (
    <div className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="flex h-5 w-5 items-center justify-center rounded-md border border-b-2 bg-muted font-sans text-xs! font-medium text-muted-foreground shadow-sm"
        >
          {k}
        </kbd>
      ))}
    </div>
  );
};

const SHORTCUTS_CONFIG = [
  { label: "save", text: "保存文件" },
  { label: "bold", text: "切换粗体" },
  { label: "italic", text: "切换斜体" },
];

export const EmptyEditor = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <GalleryVerticalEndIcon
          size={64}
          className="text-muted-foreground/50"
        />
        <h2 className="mt-6 text-2xl font-bold">欢迎使用 zmark</h2>
        <p className="mt-2 text-muted-foreground">
          从左侧文件树选择一个文件开始编辑
        </p>

        <div className="mt-12 grid grid-cols-[auto_auto] justify-center gap-x-8 gap-y-4">
          {SHORTCUTS_CONFIG.map((item) => (
            <div key={item.label} className="contents">
              <p className="text-base text-muted-foreground self-center justify-self-end">
                {item.text}
              </p>
              <Shortcut label={item.label} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
