import { diffLines, diffWords } from "diff";
import { ArrowRightLeft, GitCompare, History, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type GitCommitVersion,
  getGitVersionContent,
  getGitVersions,
  getVersions,
  saveVersion,
  to,
  toSync,
  type Version,
} from "@/utils";

interface VersionHistoryProps {
  curPath: string;
  getContent: () => string;
}

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击
 * @param s 需要转义的字符串
 * @returns 转义后的字符串
 */
const escapeHtml = (s: string) => {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

interface DiffRow {
  id: number;
  oldLine: string | null;
  newLine: string | null;
  type: "same" | "del" | "add" | "change";
  wordDiffs?: {
    oldLine?: { value: string; removed?: boolean }[];
    newLine?: { value: string; added?: boolean }[];
  };
}

const computeDiff = (oldContent: string[], newContent: string[]): DiffRow[] => {
  const oldText = oldContent.join("\n");
  const newText = newContent.join("\n");
  const changes = diffLines(oldText, newText);

  const result: DiffRow[] = [];
  let diffRowId = 0;

  for (let i = 0; i < changes.length; i++) {
    const part = changes[i];
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") {
      lines.pop();
    }

    if (part.removed) {
      if (i + 1 < changes.length && changes[i + 1].added) {
        const nextPart = changes[i + 1];
        const nextLines = nextPart.value.split("\n");
        if (nextLines[nextLines.length - 1] === "") {
          nextLines.pop();
        }

        const commonLen = Math.min(lines.length, nextLines.length);

        for (let j = 0; j < commonLen; j++) {
          const oldLineStr = lines[j];
          const newLineStr = nextLines[j];

          // 对这行内容进行单词级对比
          const wordChanges = diffWords(oldLineStr, newLineStr);

          result.push({
            id: diffRowId++,
            oldLine: oldLineStr,
            newLine: newLineStr,
            type: "change",
            wordDiffs: {
              oldLine: wordChanges.filter((w) => !w.added),
              newLine: wordChanges.filter((w) => !w.removed),
            },
          });
        }

        for (let j = commonLen; j < lines.length; j++) {
          result.push({
            id: diffRowId++,
            oldLine: lines[j],
            newLine: null,
            type: "del",
          });
        }

        for (let j = commonLen; j < nextLines.length; j++) {
          result.push({
            id: diffRowId++,
            oldLine: null,
            newLine: nextLines[j],
            type: "add",
          });
        }

        i++;
      } else {
        lines.forEach((line) => {
          result.push({
            id: diffRowId++,
            oldLine: line,
            newLine: null,
            type: "del",
          });
        });
      }
    } else if (part.added) {
      lines.forEach((line) => {
        result.push({
          id: diffRowId++,
          oldLine: null,
          newLine: line,
          type: "add",
        });
      });
    } else {
      lines.forEach((line) => {
        result.push({
          id: diffRowId++,
          oldLine: line,
          newLine: line,
          type: "same",
        });
      });
    }
  }

  return result;
};

export const VersionHistory = ({
  curPath,
  getContent,
}: VersionHistoryProps) => {
  const [source, setSource] = useState<"git" | "local">("local");
  const [localVersions, setLocalVersions] = useState<Version[]>([]);
  const [gitVersions, setGitVersions] = useState<GitCommitVersion[]>([]);
  const [oldVersionId, setOldVersionId] = useState<string>("");
  const [newVersionId, setNewVersionId] = useState<string>("");
  const [diffResult, setDiffResult] = useState<DiffRow[] | null>(null);
  const [stats, setStats] = useState<{
    add: number;
    del: number;
    same: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!curPath) return;

      setIsLoading(true);
      setDiffResult(null);
      setStats(null);

      const [err, commits] = await to(getGitVersions(curPath));
      if (cancelled) return;

      if (!err && commits) {
        setSource("git");
        setGitVersions(commits);

        if (commits.length >= 2) {
          setNewVersionId(commits[0].id);
          setOldVersionId(commits[1].id);
        } else if (commits.length === 1) {
          setNewVersionId(commits[0].id);
          setOldVersionId(commits[0].id);
        } else {
          setNewVersionId("");
          setOldVersionId("");
        }
      } else {
        const loaded = getVersions(curPath);
        setSource("local");
        setLocalVersions(loaded);

        if (loaded.length >= 2) {
          setNewVersionId(loaded[0].id);
          setOldVersionId(loaded[1].id);
        } else if (loaded.length === 1) {
          setNewVersionId(loaded[0].id);
          setOldVersionId(loaded[0].id);
        } else {
          setNewVersionId("");
          setOldVersionId("");
        }
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [curPath]);

  const handleSaveVersion = () => {
    if (source !== "local") return;

    const [err, newVer] = toSync(() => {
      const content = getContent();
      return saveVersion(curPath, content);
    });

    if (err) {
      console.error(err);
      toast.error("保存版本失败");
      return;
    }

    if (newVer) {
      const newVersions = [newVer, ...localVersions];
      setLocalVersions(newVersions);
      setNewVersionId(newVer.id);
      if (newVersions.length >= 2) {
        setOldVersionId(newVersions[1].id);
      } else {
        setOldVersionId(newVer.id);
      }
      toast.success("版本保存成功");
    }
  };

  const runDiff = async () => {
    if (!oldVersionId || !newVersionId) {
      toast.error("请选择两个版本进行对比");
      return;
    }

    let oldLines: string[] = [];
    let newLines: string[] = [];

    if (source === "git") {
      const [err, contents] = await to(
        Promise.all([
          getGitVersionContent(curPath, oldVersionId),
          getGitVersionContent(curPath, newVersionId),
        ]),
      );
      if (err || !contents) {
        toast.error("获取 Git 版本内容失败");
        return;
      }
      const [oldText, newText] = contents;
      oldLines = oldText.split("\n");
      newLines = newText.split("\n");
    } else {
      const oldData = localVersions.find((v) => v.id === oldVersionId);
      const newData = localVersions.find((v) => v.id === newVersionId);

      if (!oldData || !newData) {
        toast.error("请选择两个版本进行对比");
        return;
      }

      oldLines = oldData.content;
      newLines = newData.content;
    }

    const [diffErr, diff] = toSync(() => computeDiff(oldLines, newLines));
    if (diffErr) {
      console.error(diffErr);
      toast.error("对比计算失败");
      return;
    }

    if (diff) {
      let addCount = 0;
      let delCount = 0;
      let sameCount = 0;

      diff.forEach((row) => {
        if (row.type === "same") sameCount++;
        else if (row.type === "add") addCount++;
        else if (row.type === "del") delCount++;
        else if (row.type === "change") {
          addCount++;
          delCount++;
        }
      });

      setDiffResult(diff);
      setStats({ add: addCount, del: delCount, same: sameCount });
    }
  };

  const versions = source === "git" ? gitVersions : localVersions;

  if (isLoading && !versions.length) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-6">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="mb-4">正在加载历史版本…</p>
      </div>
    );
  }

  if (!versions.length && !isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-6">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="mb-4">暂无历史版本</p>
        {source === "local" && (
          <button
            type="button"
            onClick={handleSaveVersion}
            className="px-4 py-2 bg-primary text-primary-foreground! rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/80! transition-colors"
          >
            <Save className="w-4 h-4" />
            保存当前版本
          </button>
        )}
      </div>
    );
  }

  const oldVer = versions.find((v) => v.id === oldVersionId);
  const newVer = versions.find((v) => v.id === newVersionId);

  return (
    <div className="flex flex-col h-full px-4 pb-6 pt-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">版本列表</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runDiff}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium flex items-center gap-1.5 hover:bg-secondary/80 transition-colors border shadow-sm"
            >
              <GitCompare className="w-3.5 h-3.5" />
              生成对比
            </button>
            {source === "local" && (
              <button
                type="button"
                onClick={handleSaveVersion}
                className="px-3 py-1.5 bg-primary text-primary-foreground! rounded text-xs font-medium flex items-center gap-1.5 hover:bg-primary/80! transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                保存新版本
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground mb-2 flex justify-between items-center">
            <span>选择对比版本</span>
            {stats && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
                  +{stats.add}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                  -{stats.del}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[11px] text-muted-foreground mb-1.5">
                旧版本
              </div>
              <Select value={oldVersionId} onValueChange={setOldVersionId}>
                <SelectTrigger className="w-full border border-input bg-background shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label} · {v.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center pt-5">
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1">
              <div className="text-[11px] text-muted-foreground mb-1.5">
                新版本
              </div>
              <Select value={newVersionId} onValueChange={setNewVersionId}>
                <SelectTrigger className="w-full border border-input bg-background shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label} · {v.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {diffResult && oldVer && newVer && (
        <div className="flex-1 mt-4 border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 bg-muted/50 border-b">
            <div className="px-3 py-2 text-[11px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                {oldVer.label}
              </span>
              旧版本
            </div>
            <div className="px-3 py-2 text-[11px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-2 border-l">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
                {newVer.label}
              </span>
              新版本
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)]">
            <div>
              {diffResult.map((row) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-2 ${
                    row.type === "del"
                      ? "bg-red-50 dark:bg-red-950/30"
                      : row.type === "add"
                        ? "bg-green-50 dark:bg-green-950/30"
                        : ""
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 font-mono text-xs leading-relaxed flex items-start gap-2 ${
                      row.type === "del" || row.type === "change"
                        ? "text-red-700 dark:text-red-400"
                        : row.type === "same"
                          ? "text-muted-foreground"
                          : ""
                    } ${row.type === "change" ? "bg-red-50 dark:bg-red-950/30" : ""}`}
                  >
                    <span className="w-4 text-center shrink-0">
                      {row.type === "del" || row.type === "change" ? "−" : ""}
                    </span>
                    <span className="whitespace-pre-wrap break-all min-h-4.5 inline-block w-full">
                      {row.type === "change" && row.wordDiffs?.oldLine
                        ? row.wordDiffs.oldLine.map((word, idx) => (
                            <span
                              // biome-ignore lint/suspicious/noArrayIndexKey: <一旦生成就不会改变，用 index 是安全的>
                              key={idx}
                              className={
                                word.removed
                                  ? "bg-red-200 dark:bg-red-900/60 rounded-[2px] px-px"
                                  : ""
                              }
                            >
                              {escapeHtml(word.value)}
                            </span>
                          ))
                        : row.oldLine !== null
                          ? row.oldLine === ""
                            ? " "
                            : escapeHtml(row.oldLine)
                          : " "}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1.5 font-mono text-xs leading-relaxed flex items-start gap-2 border-l ${
                      row.type === "add" || row.type === "change"
                        ? "text-green-700 dark:text-green-400"
                        : row.type === "same"
                          ? "text-muted-foreground"
                          : "bg-muted/30 opacity-50"
                    } ${row.type === "change" ? "bg-green-50 dark:bg-green-950/30" : ""}`}
                  >
                    <span className="w-4 text-center shrink-0">
                      {row.type === "add" || row.type === "change" ? "+" : ""}
                    </span>
                    <span className="whitespace-pre-wrap break-all min-h-4.5 inline-block w-full">
                      {row.type === "change" && row.wordDiffs?.newLine
                        ? row.wordDiffs.newLine.map((word, idx) => (
                            <span
                              // biome-ignore lint/suspicious/noArrayIndexKey: <一旦生成就不会改变，用 index 是安全的>
                              key={idx}
                              className={
                                word.added
                                  ? "bg-green-200 dark:bg-green-900/60 rounded-[2px] px-px"
                                  : ""
                              }
                            >
                              {escapeHtml(word.value)}
                            </span>
                          ))
                        : row.newLine !== null
                          ? row.newLine === ""
                            ? " "
                            : escapeHtml(row.newLine)
                          : " "}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {!diffResult && versions.length > 0 && oldVer && newVer && (
        <div className="flex-1 mt-4 border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 bg-muted/50 border-b">
            <div className="px-3 py-2 text-[11px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-red-50 text-red-700">
                {oldVer.label}
              </span>
              旧版本
            </div>
            <div className="px-3 py-2 text-[11px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-2 border-l">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-green-50 text-green-700">
                {newVer.label}
              </span>
              新版本
            </div>
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-320px)] text-muted-foreground text-sm">
            <div className="text-center">
              <p>选择两个版本后，</p>
              <p className="mt-1">点击「生成对比」查看差异</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
