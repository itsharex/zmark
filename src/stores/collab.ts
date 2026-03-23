import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CollabFile {
  id: string;
  name: string;
  lastVisited: number;
}

interface CollabState {
  files: CollabFile[];
  createFile: (name: string) => CollabFile;
  joinFile: (id: string, name?: string) => CollabFile;
  removeFile: (id: string) => void;
  updateLastVisited: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
}

export const useCollabStore = create<CollabState>()(
  persist(
    (set, get) => ({
      files: [],
      createFile: (name) => {
        const newFile = {
          id: crypto.randomUUID(),
          name,
          lastVisited: Date.now(),
        };
        set((state) => ({ files: [...state.files, newFile] }));
        return newFile;
      },
      joinFile: (id, name) => {
        const state = get();
        const existing = state.files.find((f) => f.id === id);
        if (existing) {
          set((state) => ({
            files: state.files.map((f) =>
              f.id === id ? { ...f, lastVisited: Date.now() } : f,
            ),
          }));
          return existing;
        }
        const newFile = {
          id,
          name: name || "未命名协作文档",
          lastVisited: Date.now(),
        };
        set((state) => ({
          files: [...state.files, newFile],
        }));
        return newFile;
      },
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        })),
      updateLastVisited: (id) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, lastVisited: Date.now() } : f,
          ),
        })),
      renameFile: (id, newName) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: newName } : f,
          ),
        })),
    }),
    {
      name: "collab-storage",
    },
  ),
);
