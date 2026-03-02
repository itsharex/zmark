import type { LucideIcon } from "lucide-react";

export interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
}
