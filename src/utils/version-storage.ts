import { invoke } from "@tauri-apps/api/core";
import { toSync } from "./error-handler";

export interface Version {
  id: string;
  label: string;
  date: string;
  content: string[];
  timestamp: number;
}

export interface GitCommitVersion {
  id: string;
  label: string;
  date: string;
  author: string;
  message: string;
  timestamp: number;
}

const STORAGE_PREFIX = "zmark_versions_";

export const getVersions = (path: string): Version[] => {
  if (!path) return [];
  const key = `${STORAGE_PREFIX}${path}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  console.log("Loaded versions:", stored);
  const [err, parsed] = toSync<Version[]>(() => JSON.parse(stored));
  if (err) {
    console.error("Failed to load versions", err);
    return [];
  }
  return parsed as Version[];
};

export const getGitVersions = async (
  path: string,
  limit = 50,
  skip = 0,
): Promise<GitCommitVersion[]> => {
  const commits = await invoke<
    { id: string; author: string; message: string; timestamp: number }[]
  >("git_file_history", { path, limit, skip });

  return commits.map((c) => {
    const date = new Date(c.timestamp * 1000).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return {
      id: c.id,
      label: c.id.slice(0, 7),
      date,
      author: c.author,
      message: c.message,
      timestamp: c.timestamp * 1000,
    };
  });
};

export const getGitVersionContent = async (
  path: string,
  commitId: string,
): Promise<string> => {
  return await invoke<string>("git_file_content", { path, commit: commitId });
};

export const saveVersion = (
  path: string,
  content: string,
  label?: string,
): Version => {
  if (!path) throw new Error("Path is required");

  const versions = getVersions(path);
  const now = new Date();
  const timestamp = now.getTime();
  const dateStr = now.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const newVersion: Version = {
    id: `v_${timestamp}`,
    label: label || `v${versions.length + 1}.0`,
    date: dateStr,
    content: content.split("\n"),
    timestamp,
  };

  const newVersions = [newVersion, ...versions]; // Newest first

  const [err] = toSync(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}${path}`,
      JSON.stringify(newVersions),
    );
  });

  if (err) {
    console.error("Failed to save version", err);
    throw err;
  }

  return newVersion;
};
