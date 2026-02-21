import { CollapseContext, useCollapse } from "@/contexts/collapse-context";
import { useState, useCallback } from "react";

export function CollapseProvider({ children }: { children: React.ReactNode }) {
  const [listeners, setListeners] = useState<(() => void)[]>([]);

  const subscribe = useCallback((callback: () => void) => {
    setListeners((prev) => [...prev, callback]);
    return () => {
      setListeners((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const collapseAll = useCallback(() => {
    listeners.forEach((callback) => callback());
  }, [listeners]);

  return (
    <CollapseContext.Provider value={{ collapseAll, subscribe }}>
      {children}
    </CollapseContext.Provider>
  );
}

export { useCollapse };
