import { Command } from "lucide-react";
import React from "react";
import { useIsMac } from "./use-is-mac";

export const useKeyDisplay = (): { [key: string]: React.ReactNode } => {
  const isMac = useIsMac();

  return {
    Mod: isMac ? React.createElement(Command, { size: 14 }) : "Ctrl",
  };
};