import { FileX2 } from "lucide-react";

interface UnsupportedFileProps {
  fileName: string;
}

export const UnsupportedFile = ({ fileName }: UnsupportedFileProps) => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <FileX2 size={64} className="text-muted-foreground/50" />
        <h2 className="mt-6 text-2xl font-bold">不支持的文件类型</h2>
        <p className="mt-2 text-muted-foreground">
          zmark 仅支持编辑 Markdown 文件
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">{fileName}</p>
      </div>
    </div>
  );
};
