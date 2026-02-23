import { GalleryVerticalEndIcon } from "lucide-react";
import { useKeyDisplay } from "@/hooks/use-key-display";

const Shortcut = ({ keys }: { keys: string[] }) => {
  const keyDisplay = useKeyDisplay();

  return (
    <div className="flex items-center gap-1.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="px-2 py-1.5 text-xs font-sans rounded-md border border-b-2 bg-muted text-muted-foreground"
        >
          {keyDisplay[key] || key}
        </kbd>
      ))}
    </div>
  );
};

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
          <p className="text-sm text-muted-foreground self-center justify-self-end">
            保存文件
          </p>
          <Shortcut keys={["Mod", "S"]} />

          <p className="text-sm text-muted-foreground self-center justify-self-end">
            切换粗体
          </p>
          <Shortcut keys={["Mod", "B"]} />

          <p className="text-sm text-muted-foreground self-center justify-self-end">
            切换斜体
          </p>
          <Shortcut keys={["Mod", "I"]} />
        </div>
      </div>
    </div>
  );
};
