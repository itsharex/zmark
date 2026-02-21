import {
  FilePlus,
  FoldVertical,
  FolderPlus,
  RefreshCw,
} from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useCollapse } from "../../provider/collapse-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

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
      onClick: handleCreateFile,
      tooltip: "新建文件",
      icon: <FilePlus className="size-4" />,
    },
    {
      onClick: handleCreateDirectory,
      tooltip: "新建文件夹",
      icon: <FolderPlus className="size-4" />,
    },
    {
      onClick: refreshFileTree,
      tooltip: "刷新",
      icon: <RefreshCw className="size-4" />,
    },
    {
      onClick: collapseAll,
      tooltip: "全部折叠",
      icon: <FoldVertical className="size-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {buttons.map((button, index) => (
        <ActionButton key={index} onClick={button.onClick} tooltip={button.tooltip}>
          {button.icon}
        </ActionButton>
      ))}
    </div>
  );
};
