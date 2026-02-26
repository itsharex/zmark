import { Toaster } from "sonner";
import Editor from "./components/editor";
import { AppSidebar } from "./components/sidebar";
import { ThemeProvider } from "./provider/theme-provider";
import { SidebarProvider } from "./components/ui/sidebar";
import { TooltipProvider } from "./components/ui/tooltip";

import { useEditorStore } from "./stores/editor";

const App = () => {
  const { curPath } = useEditorStore();
  return (
    <ThemeProvider>
      <SidebarProvider>
        <TooltipProvider>
          <AppSidebar />
          <div className="content flex-1">
            <Editor key={curPath} />
          </div>
          <Toaster />
        </TooltipProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default App;
