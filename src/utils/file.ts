import {
  BaseDirectory,
  dirname,
  documentDir,
  join,
} from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, writeFile } from "@tauri-apps/plugin-fs";
import type { TreeItem } from "@/types";

/**
 * 获取数据目录路径
 */
export async function getDataDir() {
  // 尝试创建 markdowns 目录，如果已存在则忽略错误
  try {
    await mkdir("markdowns", {
      baseDir: BaseDirectory.Document,
      recursive: true,
    });
  } catch (_error) {
    // 如果目录已存在，忽略错误
    console.error("error", _error);
  }
  // 无论是否创建成功，都返回完整的路径
  return join(await documentDir(), "markdowns");
}

async function buildFileTree(dirPath: string): Promise<TreeItem[]> {
  const entries = await readDir(dirPath);
  const fileTree: TreeItem[] = [];

  for (const entry of entries) {
    if (entry.isFile) {
      fileTree.push(entry.name as string);
    } else if (entry.isDirectory) {
      const subTree = await buildFileTree(await join(dirPath, entry.name));
      fileTree.push([entry.name, ...subTree] as TreeItem);
    }
  }

  return fileTree;
}

export async function getFileTree() {
  const dataDir = await getDataDir();
  return await buildFileTree(dataDir);
}

export function getTreeKey(item: TreeItem) {
  return typeof item === "string" ? item : String(item[0]);
}

export async function isDir(path: string) {
  try {
    const fileStat = await stat(path);
    return fileStat.isDirectory;
  } catch (error) {
    console.error("Error checking if path is directory:", error);
    return false;
  }
}

export async function createFile(filePath: string, basePath?: string) {
  const dataDir = basePath || (await getDataDir());
  let finalPath: string;
  if (basePath) {
    const isDirectory = await isDir(basePath);
    if (isDirectory) {
      finalPath = await join(basePath, filePath);
    } else {
      finalPath = await join(await dirname(basePath), filePath);
    }
  } else {
    finalPath = await join(dataDir, filePath);
  }

  if (!(await exists(finalPath))) {
    await writeFile(finalPath, new Uint8Array());
  }
}

export async function createDirectory(dirPath: string, basePath?: string) {
  const dataDir = basePath || (await getDataDir());
  let finalPath: string;
  if (basePath) {
    const isDirectory = await isDir(basePath);
    if (isDirectory) {
      finalPath = await join(basePath, dirPath);
    } else {
      finalPath = await join(await dirname(basePath), dirPath);
    }
  } else {
    finalPath = await join(dataDir, dirPath);
  }
  if (!(await exists(finalPath))) {
    await mkdir(finalPath);
  }
}
