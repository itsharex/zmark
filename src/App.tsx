import { AppSidebar } from "./components/app-sidebar";
import Editor from "./components/editor";
import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "sonner";

const App = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="content">
        <Editor />
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default App;
