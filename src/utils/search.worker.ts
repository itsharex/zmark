import MiniSearch from "minisearch";
import type { SearchAction, SearchResponse } from "@/types/search";
import { safeExecute } from "./error-handler";

const miniSearch = new MiniSearch({
  fields: ["title", "content"], // fields to index for full-text search
  storeFields: ["title", "path", "content"], // fields to return with search results
  searchOptions: {
    boost: { title: 2 }, // boost title matches
    fuzzy: 0.2, // fuzzy matching
    prefix: true, // prefix matching
  },
  idField: "path", // use file path as unique ID
});

self.onmessage = safeExecute(
  async (e: MessageEvent<SearchAction>) => {
    const action = e.data;

    switch (action.type) {
      case "INDEX_FILES": {
        miniSearch.removeAll();
        const docs = action.payload.map((file) => ({
          path: file.path,
          title: file.name,
          content: file.content,
        }));
        miniSearch.addAll(docs);
        self.postMessage({ type: "INDEX_UPDATED" } as SearchResponse);
        break;
      }

      case "ADD_OR_UPDATE_FILE": {
        const file = action.payload;
        if (miniSearch.has(file.path)) {
          miniSearch.remove({ path: file.path });
        }
        miniSearch.add({
          path: file.path,
          title: file.name,
          content: file.content,
        });
        self.postMessage({ type: "INDEX_UPDATED" } as SearchResponse);
        break;
      }

      case "REMOVE_FILE": {
        const path = action.payload;
        if (miniSearch.has(path)) {
          miniSearch.remove({ path });
        }
        self.postMessage({ type: "INDEX_UPDATED" } as SearchResponse);
        break;
      }

      case "SEARCH": {
        const { query, id } = action.payload;
        const results = miniSearch.search(query, {
          prefix: true,
          fuzzy: 0.5,
          boost: { title: 2 },
        });
        self.postMessage({
          type: "SEARCH_RESULTS",
          payload: { results, id },
        } as SearchResponse);
        break;
      }

      case "CLEAR_INDEX": {
        miniSearch.removeAll();
        self.postMessage({ type: "INDEX_UPDATED" } as SearchResponse);
        break;
      }
    }
  },
  (error) => {
    self.postMessage({
      type: "ERROR",
      payload: error instanceof Error ? error.message : String(error),
    } as SearchResponse);
  },
);
