export interface Version {
  id: string;
  label: string;
  date: string;
  content: string[];
  timestamp: number;
}

const STORAGE_PREFIX = "zmark_versions_";

export const getVersions = (path: string): Version[] => {
  if (!path) return [];
  try {
    const key = `${STORAGE_PREFIX}${path}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    console.log("Loaded versions:", stored);
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load versions", e);
    return [];
  }
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

  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${path}`,
      JSON.stringify(newVersions),
    );
  } catch (e) {
    console.error("Failed to save version", e);
    throw e;
  }

  return newVersion;
};
