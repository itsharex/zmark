// zustand store for editor content
import { create } from "zustand";

interface IEditorStore {
  content: string;
  setContent: (content: string) => void;
  curPath: string;
  setCurPath: (curPath: string) => void;
  previewPath: string;
  setPreviewPath: (previewPath: string) => void;
}

export const useEditorStore = create<IEditorStore>((set) => ({
  content: "",
  setContent: (content: string) => set({ content }),
  curPath: "",
  setCurPath: (curPath: string) => set({ curPath }),
  previewPath: "",
  setPreviewPath: (previewPath: string) => set({ previewPath }),
}));
