import { FilePlus, FolderPlus, FoldVertical, RefreshCw } from "lucide-react";
import type React from "react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCollapse } from "../../provider/collapse-provider";

interface ActionButtonProps {
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}

const ActionButton = ({ onClick, tooltip, children }: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <SidebarMenuButton
        size="sm"
        className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent transition-colors"
        onClick={onClick}
      >
        {children}
      </SidebarMenuButton>
    </TooltipTrigger>
    <TooltipContent>
      <p>{tooltip}</p>
    </TooltipContent>
  </Tooltip>
);

export const ActionButtons = ({
  handleCreateFile,
  handleCreateDirectory,
  refreshFileTree,
}: {
  handleCreateFile: () => void;
  handleCreateDirectory: () => void;
  refreshFileTree: () => void;
}) => {
  const { collapseAll } = useCollapse();

  const buttons = [
    {
      key: "create-file",
      onClick: handleCreateFile,
      tooltip: "新建文件",
      icon: <FilePlus className="size-4" />,
    },
    {
      key: "create-directory",
      onClick: handleCreateDirectory,
      tooltip: "新建文件夹",
      icon: <FolderPlus className="size-4" />,
    },
    {
      key: "refresh-file-tree",
      onClick: refreshFileTree,
      tooltip: "刷新",
      icon: <RefreshCw className="size-4" />,
    },
    {
      key: "collapse-all",
      onClick: collapseAll,
      tooltip: "全部折叠",
      icon: <FoldVertical className="size-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {buttons.map((button) => (
        <ActionButton
          key={button.key}
          onClick={button.onClick}
          tooltip={button.tooltip}
        >
          {button.icon}
        </ActionButton>
      ))}
    </div>
  );
};
