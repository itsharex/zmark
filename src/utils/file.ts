import { convertFileSrc } from "@tauri-apps/api/core";
import {
  BaseDirectory,
  dirname,
  documentDir,
  join,
} from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, writeFile } from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editor";
import type { TreeItem } from "@/types/editor";

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

export const handleImageUpload = async (
  file: File,
  _onProgress?: (event: { progress: number }) => void,
  _abortSignal?: AbortSignal,
): Promise<string> => {
  // 1. 获取当前编辑文件的路径
  const { curPath } = useEditorStore.getState();

  if (!curPath) {
    throw new Error("请先保存文档，再上传图片");
  }

  // 2. 确定图片保存目录 (当前文档目录下的 assets 文件夹)
  const docDir = await dirname(curPath);
  const assetsDir = await join(docDir, "assets");

  // 3. 确保目录存在
  const assetsExists = await exists(assetsDir);
  if (!assetsExists) {
    await mkdir(assetsDir, { recursive: true });
  }

  // 4. 生成文件名
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = await join(assetsDir, fileName);

  // 5. 读取文件内容并写入
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  await writeFile(filePath, uint8Array);

  // 6. 返回可预览的 URL
  // 使用 convertFileSrc 将本地路径转换为 asset:// 协议的 URL
  const assetUrl = convertFileSrc(filePath);

  return assetUrl;
};
