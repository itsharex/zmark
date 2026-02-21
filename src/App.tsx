import { AppSidebar } from "./components/sidebar";
import Editor from "./components/editor";
import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

import { useEditorStore } from "./stores/editor";

const App = () => {
  const { curPath } = useEditorStore();
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar />
        <div className="content flex-1">
          <Editor key={curPath} />
        </div>
        <Toaster />
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default App;
