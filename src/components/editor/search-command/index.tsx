import { readTextFile } from "@tauri-apps/plugin-fs";
import { File } from "lucide-react";
import type { SearchResult } from "minisearch";
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEditorStore, useSearchStore } from "@/stores";
import { resolveMarkdownImages, search, subscribeToSearch } from "@/utils";

export function SearchCommand() {
  const { isOpen, setIsOpen, toggle } = useSearchStore();
  const { setCurPath, setContent } = useEditorStore();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);

  // 监听搜索索引变化
  React.useEffect(() => {
    const unsubscribe = subscribeToSearch(async () => {
      // 当索引更新时，如果当前有搜索词，重新执行搜索
      if (query) {
        const searchResults = await search(query);
        setResults(searchResults);
      }
    });
    return unsubscribe;
  }, [query]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // 使用 Cmd+P (VSCode 风格) 或 Cmd+Shift+F，避免与 Cmd+K (Link) 冲突
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  React.useEffect(() => {
    const fetchResults = async () => {
      if (query) {
        const searchResults = await search(query);
        setResults(searchResults);
      } else {
        setResults([]);
      }
    };
    fetchResults();
  }, [query]);

  const handleSelect = async (path: string) => {
    try {
      const content = await readTextFile(path);
      const resolvedContent = await resolveMarkdownImages(content, path);
      setContent(resolvedContent);
      setCurPath(path);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  // 辅助函数：截取匹配内容片段并高亮
  const renderHighlightedSnippet = (content: string, query: string) => {
    if (!content || !query) return null;

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return (
        <span>
          {content.slice(0, 100) + (content.length > 100 ? "..." : "")}
        </span>
      );
    }

    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + 80);

    const snippet =
      (start > 0 ? "..." : "") +
      content.slice(start, end) +
      (end < content.length ? "..." : "");

    // 简单的关键词高亮处理
    const parts = snippet.split(new RegExp(`(${query})`, "gi"));

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === lowerQuery ? (
            <span
              key={`${i}-${part}`}
              className="bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 rounded px-0.5 font-medium"
            >
              {part}
            </span>
          ) : (
            <span
              key={`${
                // biome-ignore lint/suspicious/noArrayIndexKey: <temp>
                i
              }-text`}
            >
              {part}
            </span>
          ),
        )}
      </span>
    );
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Documents">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={`${result.title} ${result.path} ${result.content}`}
                onSelect={() => handleSelect(result.id)}
              >
                <File className="mr-2 h-4 w-4 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium">{result.title}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {renderHighlightedSnippet(result.content, query)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
