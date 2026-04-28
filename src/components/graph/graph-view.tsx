import { BaseDirectory, watch } from "@tauri-apps/plugin-fs";
import type { EChartsOption, EChartsType } from "echarts";
import { Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsyncAction } from "@/hooks";
import { useEditorStore } from "@/stores";
import { getAllMarkdownFiles, logError, to } from "@/utils";
import { parseMarkdown } from "@/utils/frontmatter";

type GraphViewProps = {
  onOpenFile: (path: string) => Promise<void>;
};

type RawNode = {
  id: string;
  path: string;
  title: string;
  tags: string[];
};

type RawEdge = {
  source: string;
  target: string;
};

/**
 * 归一化 tags 字段值，将其转换为字符串数组
 * @param value 文章的 frontmatter 里的 tags 字段值
 * @returns tags 值数组
 */
function normalizeTagValue(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

/**
 * 移除文件名的扩展名（.md）
 * @param filename 文件名
 * @returns 移除扩展名后的文件名
 */
function stripExtension(filename: string) {
  return filename.endsWith(".md") ? filename.slice(0, -3) : filename;
}

/**
 * 从 Markdown 文本中提取提及的节点 ID
 * @param markdownBody Markdown 文本
 * @returns 提取到的节点 ID 数组
 */
function extractMentionTargets(markdownBody: string): string[] {
  const targets: string[] = [];

  // HTML 回退捕获引用文档
  const htmlMentionRe =
    /data-type=(?:"mention"|'mention')[\s\S]*?data-id=(?:"([^"]+)"|'([^']+)')/gi;
  for (const match of markdownBody.matchAll(htmlMentionRe)) {
    const id = (match[1] || match[2] || "").trim();
    if (id) targets.push(id);
  }

  // 正常case 捕获@文档
  const markdownMentionRe = /@\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of markdownBody.matchAll(markdownMentionRe)) {
    const id = (match[1] || "").trim();
    if (id) targets.push(id);
  }

  return Array.from(new Set(targets));
}

function buildLocalSubgraph(params: {
  centerId: string;
  nodes: RawNode[];
  edges: RawEdge[];
  maxDepth: number;
  maxNodes: number;
}) {
  const { centerId, nodes, edges, maxDepth, maxNodes } = params;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Set<string>>();

  const addNeighbor = (a: string, b: string) => {
    const set = adjacency.get(a) ?? new Set<string>();
    set.add(b);
    adjacency.set(a, set);
  };

  for (const e of edges) {
    addNeighbor(e.source, e.target);
    addNeighbor(e.target, e.source);
  }

  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: centerId, depth: 0 },
  ];

  while (queue.length) {
    const cur = queue.shift();
    if (!cur) break;
    if (visited.has(cur.id)) continue;
    if (!nodeMap.has(cur.id)) continue;

    visited.add(cur.id);
    if (visited.size >= maxNodes) break;

    if (cur.depth >= maxDepth) continue;
    const neighbors = adjacency.get(cur.id);
    if (!neighbors) continue;
    for (const next of neighbors) {
      if (!visited.has(next)) {
        queue.push({ id: next, depth: cur.depth + 1 });
      }
    }
  }

  const visibleNodes = nodes.filter((n) => visited.has(n.id));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
  );

  return { nodes: visibleNodes, edges: visibleEdges };
}

export function GraphView({ onOpenFile }: GraphViewProps) {
  const { curPath } = useEditorStore();
  const chartElRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<EChartsType | null>(null);
  const latestOptionRef = React.useRef<EChartsOption | null>(null);

  const [scope, setScope] = React.useState<"global" | "local">(
    curPath ? "local" : "global",
  );
  const [searchText, setSearchText] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string>("__all__");

  const [rawNodes, setRawNodes] = React.useState<RawNode[]>([]);
  const [rawEdges, setRawEdges] = React.useState<RawEdge[]>([]);

  const loadGraph = React.useCallback(async () => {
    const files = await getAllMarkdownFiles();
    const nodeList: RawNode[] = [];
    const filePaths = new Set(files.map((f) => f.path));

    for (const f of files) {
      const parsed = parseMarkdown(f.content);
      const titleVal = parsed.frontmatter.title;
      const title =
        typeof titleVal === "string" && titleVal.trim()
          ? titleVal.trim()
          : stripExtension(f.name);

      const tags = normalizeTagValue(parsed.frontmatter.tags);

      nodeList.push({ id: f.path, path: f.path, title, tags });
    }

    const edgeSet = new Set<string>();
    const edgeList: RawEdge[] = [];

    for (const f of files) {
      const parsed = parseMarkdown(f.content);
      const targets = extractMentionTargets(parsed.body);
      for (const targetId of targets) {
        if (!filePaths.has(targetId)) continue;
        const key = `${f.path}→${targetId}`;
        if (edgeSet.has(key)) continue;
        edgeSet.add(key);
        edgeList.push({ source: f.path, target: targetId });
      }
    }

    setRawNodes(nodeList);
    setRawEdges(edgeList);

    if (nodeList.length > 300 && curPath) {
      setScope("local");
    }

    return { nodeCount: nodeList.length, edgeCount: edgeList.length };
  }, [curPath]);

  const buildErrorMessage = React.useCallback(
    (e: Error) => `构建图谱失败：${e.message}`,
    [],
  );

  const handleBuildSuccess = React.useCallback(
    (stats?: { nodeCount: number; edgeCount: number }) => {
      if (!stats) return;
      if (stats.nodeCount === 0) {
        toast.message("未找到任何 Markdown 文件");
      }
    },
    [],
  );

  const asyncOptions = React.useMemo(
    () => ({
      loadingMessage: "正在构建知识图谱…",
      successMessage: "知识图谱已更新",
      errorMessage: buildErrorMessage,
      onSuccess: handleBuildSuccess,
    }),
    [buildErrorMessage, handleBuildSuccess],
  );

  const { execute: refresh, isLoading } = useAsyncAction(
    loadGraph,
    asyncOptions,
  );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    let unwatchFn: (() => void) | null = null;

    const setupWatcher = async () => {
      const [err, unwatch] = await to(
        watch(
          "markdowns",
          () => {
            void loadGraph();
          },
          {
            baseDir: BaseDirectory.Document,
            recursive: true,
            delayMs: 500,
          },
        ),
      );

      if (err) {
        logError("Failed to setup file watcher in GraphView:", err);
      } else if (unwatch) {
        unwatchFn = unwatch;
      }
    };

    void setupWatcher();

    return () => {
      if (unwatchFn) {
        unwatchFn();
      }
    };
  }, [loadGraph]);

  const availableTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const n of rawNodes) {
      for (const t of n.tags) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawNodes]);

  const filtered = React.useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const baseNodes =
      tagFilter === "__all__" && !normalizedSearch
        ? rawNodes
        : rawNodes.filter((n) => {
            if (tagFilter !== "__all__" && !n.tags.includes(tagFilter)) {
              return false;
            }
            if (
              normalizedSearch &&
              !n.title.toLowerCase().includes(normalizedSearch)
            ) {
              return false;
            }
            return true;
          });

    const nodeIdSet = new Set(baseNodes.map((n) => n.id));
    const baseEdges = rawEdges.filter(
      (e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target),
    );

    if (scope === "local" && curPath) {
      return buildLocalSubgraph({
        centerId: curPath,
        nodes: baseNodes,
        edges: baseEdges,
        maxDepth: 2,
        maxNodes: 300,
      });
    }

    return { nodes: baseNodes, edges: baseEdges };
  }, [curPath, rawEdges, rawNodes, scope, searchText, tagFilter]);

  const chartData = React.useMemo(() => {
    const degreeMap = new Map<string, number>();
    for (const e of filtered.edges) {
      degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
    }

    const nodes = filtered.nodes.map((n) => {
      const degree = degreeMap.get(n.id) ?? 0;
      const baseSize = 14 + Math.min(28, degree * 2);
      const isCenter = curPath && n.id === curPath;
      const color = isCenter ? "#8b5cf6" : "#3b82f6";

      return {
        id: n.id,
        name: n.title,
        value: degree,
        tags: n.tags,
        symbolSize: isCenter ? baseSize + 12 : baseSize,
        draggable: true,
        itemStyle: {
          color,
          opacity: 1,
          borderColor: "rgba(255, 255, 255, 0.8)",
          borderWidth: isCenter ? 2 : 1,
          shadowBlur: isCenter ? 12 : 6,
          shadowColor: color,
        },
        label: {
          show: true,
          position: "right" as const,
          color: "hsl(0 0% 98%)",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: [3, 6],
          borderRadius: 4,
          fontSize: 11,
          distance: 8,
        },
      };
    });

    const links = filtered.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    return { nodes, links };
  }, [curPath, filtered.edges, filtered.nodes]);

  const chartOption = React.useMemo<EChartsOption>(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(17, 24, 39, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        textStyle: { color: "#f9fafb" },
        padding: [12, 16],
        borderRadius: 8,
        formatter: (params: unknown) => {
          const p = params as {
            dataType?: string;
            data?: { name?: string; value?: number; tags?: string[] };
            color?: string;
          };
          if (p.dataType === "node" && p.data) {
            const { name, value, tags } = p.data;
            const color = p.color || "#3b82f6";

            let tagsHtml = "";
            if (tags && tags.length > 0) {
              tagsHtml =
                `<div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">` +
                tags
                  .map(
                    (t) =>
                      `<span style="background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-size: 11px;">#${t}</span>`,
                  )
                  .join("") +
                `</div>`;
            }

            return `
              <div style="max-width: 240px; white-space: normal;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${color};"></span>
                  ${name}
                </div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.7);">连接数: ${value}</div>
                ${tagsHtml}
              </div>
            `;
          }
          return "";
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          cursor: "pointer",
          scaleLimit: {
            min: 0.8,
            max: 2.5,
          },
          data: chartData.nodes,
          links: chartData.links,
          force: {
            repulsion: 200,
            edgeLength: [50, 160],
            gravity: 0.05,
            friction: 0.6,
          },
          lineStyle: {
            width: 1.5,
            opacity: 0.3,
            color: "hsl(215 16% 50%)",
            curveness: 0.2,
          },
          emphasis: {
            focus: "none" as const,
            scale: false,
            label: { show: true },
            itemStyle: {
              color: "inherit",
              opacity: 1,
            },
            lineStyle: {
              color: "inherit",
              opacity: 0.35,
              width: 1.2,
            },
          },
          blur: {
            itemStyle: {
              opacity: 1,
            },
            lineStyle: {
              opacity: 0.35,
            },
          },
        },
      ],
    }),
    [chartData],
  );

  React.useEffect(() => {
    latestOptionRef.current = chartOption;
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(chartOption, { notMerge: true });
  }, [chartOption]);

  React.useEffect(() => {
    const el = chartElRef.current;
    if (!el) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    void import("echarts").then((echarts) => {
      if (disposed) return;

      const chart = echarts.init(el, undefined, { renderer: "canvas" });
      chartRef.current = chart;
      if (latestOptionRef.current) {
        chart.setOption(latestOptionRef.current, { notMerge: true });
      }

      // ECharts has built-in `roam: true` which handles both panning and zooming perfectly.
      // We just need to prevent the default browser scroll/pinch behavior so it doesn't
      // interfere with ECharts' own canvas events.
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
      };

      el.addEventListener("wheel", onWheel, { passive: false });

      const onClick = (params: unknown) => {
        const p = params as { dataType?: string; data?: { id?: string } };
        if (p.dataType !== "node") return;
        const id = p.data?.id;
        if (!id) return;
        void onOpenFile(id);
      };

      chart.off("click", onClick);
      chart.on("click", onClick);

      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(el);

      cleanup = () => {
        ro.disconnect();
        el.removeEventListener("wheel", onWheel);
        chart.off("click", onClick);
        chart.dispose();
        chartRef.current = null;
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [onOpenFile]);

  const isLargeGraph = rawNodes.length > 300;
  const statsText = `${filtered.nodes.length} 节点 / ${filtered.edges.length} 连接`;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background">
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 border-b border-border/40 bg-background/60 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={scope === "local" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 shadow-none"
            onClick={() => setScope("local")}
            disabled={!curPath}
          >
            以当前文档为中心
          </Button>
          <Button
            type="button"
            variant={scope === "global" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 shadow-none"
            onClick={() => setScope("global")}
          >
            全局
          </Button>
        </div>

        <div className="ml-2 w-[220px]">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索节点…"
            className="h-8 bg-background/50 shadow-none"
          />
        </div>

        <div className="w-[160px]">
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="h-8 bg-background/50 shadow-none">
              <SelectValue placeholder="标签" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部标签</SelectItem>
              {availableTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs font-medium text-muted-foreground">
            {statsText}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => void refresh()}
            disabled={isLoading}
            title="刷新图谱"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isLargeGraph && scope === "global" ? (
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/40 bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md">
          当前图谱较大，建议使用“以当前文档为中心”以获得更流畅的交互。
        </div>
      ) : null}

      <div className="absolute inset-0">
        <div ref={chartElRef} className="h-full w-full" />
      </div>
    </div>
  );
}
