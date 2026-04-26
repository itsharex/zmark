import type { SearchResult } from "minisearch";
import type { FileContent, SearchAction, SearchResponse } from "@/types/search";
import { safeExecute } from "./error-handler";
import SearchWorker from "./search.worker?worker";

// 创建 Worker 实例
const worker = new SearchWorker();

// 挂起中的搜索请求
const pendingSearches = new Map<string, (results: SearchResult[]) => void>();

// 事件总线，用于通知搜索索引更新
type SearchListener = () => void;
const listeners: SearchListener[] = [];

// 监听来自 Worker 的消息
worker.onmessage = (e: MessageEvent<SearchResponse>) => {
  const response = e.data;

  switch (response.type) {
    case "SEARCH_RESULTS": {
      const { results, id } = response.payload;
      const resolve = pendingSearches.get(id);
      if (resolve) {
        resolve(results);
        pendingSearches.delete(id);
      }
      break;
    }
    case "INDEX_UPDATED": {
      notifyListeners();
      break;
    }
    case "ERROR": {
      console.error("Search worker error:", response.payload);
      break;
    }
  }
};

export function subscribeToSearch(listener: SearchListener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

function notifyListeners() {
  [...listeners].forEach(
    safeExecute(
      async (listener) => listener(),
      (error) => console.error("Error in search listener:", error),
    ),
  );
}

export function indexFiles(files: FileContent[]) {
  worker.postMessage({ type: "INDEX_FILES", payload: files } as SearchAction);
}

export function addOrUpdateFile(file: FileContent) {
  worker.postMessage({
    type: "ADD_OR_UPDATE_FILE",
    payload: file,
  } as SearchAction);
}

export function removeFile(path: string) {
  worker.postMessage({ type: "REMOVE_FILE", payload: path } as SearchAction);
}

export function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return Promise.resolve([]);
  }

  const id = Math.random().toString(36).substring(7);
  return new Promise((resolve) => {
    pendingSearches.set(id, resolve);
    worker.postMessage({
      type: "SEARCH",
      payload: { query, id },
    } as SearchAction);
  });
}
