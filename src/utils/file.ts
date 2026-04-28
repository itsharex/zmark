import { convertFileSrc } from "@tauri-apps/api/core";
import {
  BaseDirectory,
  dirname,
  documentDir,
  join,
} from "@tauri-apps/api/path";
import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  stat,
  writeFile,
} from "@tauri-apps/plugin-fs";
import { useEditorStore } from "@/stores/editor";
import type { TreeItem } from "@/types/editor";
import type { FileContent } from "@/types/search";
import { to } from "./error-handler";
import { logError } from "./log";
import { addOrUpdateFile, removeFile as removeSearchIndex } from "./search";

const MARKDOWNS_DIR_NAME = "markdowns";
const MARKDOWN_IMAGE_RE = /!\[(.*?)\]\((.*?)\)/g;

function shouldSkipDirEntryName(name: string | null | undefined) {
  return !name || name.startsWith(".") || name === ".DS_Store";
}

async function resolveTargetPath(
  nameOrPath: string,
  basePath: string | undefined,
  dataDir: string,
) {
  if (!basePath) {
    return await join(dataDir, nameOrPath);
  }

  const baseIsDir = await isDir(basePath);
  if (baseIsDir) {
    return await join(basePath, nameOrPath);
  }

  return await join(await dirname(basePath), nameOrPath);
}

function getSafeFileExtension(name: string, fallback: string) {
  if (!name.includes(".")) {
    return fallback;
  }

  const ext = name.split(".").pop()?.trim();
  if (!ext) {
    return fallback;
  }

  const normalized = ext.toLowerCase();
  if (!/^[a-z0-9]{1,16}$/.test(normalized)) {
    return fallback;
  }

  return normalized;
}

function isResolvedAssetSrc(src: string) {
  return (
    src.startsWith("asset://") ||
    /^https?:\/\/asset\.localhost(?::\d+)?\//i.test(src)
  );
}

function normalizeAbsolutePathFromImageSrc(src: string) {
  if (isResolvedAssetSrc(src)) {
    try {
      const url = new URL(src);
      let absolutePath = decodeURIComponent(url.pathname);
      if (
        absolutePath.match(/^\/[a-zA-Z]:\//) ||
        absolutePath.match(/^\/[a-zA-Z]:\\/)
      ) {
        absolutePath = absolutePath.substring(1);
      }
      return absolutePath;
    } catch {
      return undefined;
    }
  }

  if (src.startsWith("/")) {
    return src;
  }

  if (/^[a-zA-Z]:[\\/]/.test(src)) {
    return src;
  }

  return undefined;
}

async function replaceMarkdownImages(
  markdown: string,
  replacer: (params: {
    alt: string;
    src: string;
  }) => Promise<string | undefined>,
) {
  const re = new RegExp(MARKDOWN_IMAGE_RE.source, MARKDOWN_IMAGE_RE.flags);
  const matches = Array.from(markdown.matchAll(re));
  if (matches.length === 0) {
    return markdown;
  }

  let result = "";
  let lastIndex = 0;

  for (const match of matches) {
    const fullMatch = match[0] ?? "";
    const alt = match[1] ?? "";
    const src = match[2] ?? "";
    const startIndex = match.index ?? 0;
    const endIndex = startIndex + fullMatch.length;

    result += markdown.slice(lastIndex, startIndex);

    const replacement = await replacer({ alt, src });
    result += replacement ?? fullMatch;

    lastIndex = endIndex;
  }

  result += markdown.slice(lastIndex);
  return result;
}

/**
 * 获取数据目录路径
 */
export async function getDataDir(): Promise<string> {
  // 尝试创建 markdowns 目录，如果已存在则忽略错误
  await to(
    mkdir(MARKDOWNS_DIR_NAME, {
      baseDir: BaseDirectory.Document,
      recursive: true,
    }),
  );
  // 无论是否创建成功，都返回完整的路径
  return join(await documentDir(), MARKDOWNS_DIR_NAME);
}

async function buildFileTree(dirPath: string): Promise<TreeItem[]> {
  const entries = await readDir(dirPath);
  const fileTree: TreeItem[] = [];

  for (const entry of entries) {
    const name = entry.name;
    // 过滤掉隐藏文件（以.开头）和无效文件
    if (shouldSkipDirEntryName(name)) {
      continue;
    }
    if (entry.isFile) {
      fileTree.push(name);
    } else if (entry.isDirectory) {
      const subTree = await buildFileTree(await join(dirPath, name));
      fileTree.push([name, ...subTree] as TreeItem);
    }
  }

  return fileTree;
}

export async function getFileTree(): Promise<TreeItem[]> {
  const dataDir = await getDataDir();
  return await buildFileTree(dataDir);
}

export function getTreeKey(item: TreeItem) {
  return typeof item === "string" ? item : String(item[0]);
}

export function getDisplayFilename(filePath: string) {
  return filePath.split(/[/\\]/).pop() || filePath;
}

export async function isDir(path: string): Promise<boolean> {
  const [err, fileStat] = await to(stat(path));
  if (err) {
    logError("Error checking if path is directory:", err);
    return false;
  }
  return fileStat?.isDirectory ?? false;
}

export async function createFile(filePath: string, basePath?: string) {
  const dataDir = await getDataDir();
  const finalPath = await resolveTargetPath(filePath, basePath, dataDir);

  if (!(await exists(finalPath))) {
    await writeFile(finalPath, new Uint8Array());
    addOrUpdateFile({
      path: finalPath,
      name: getDisplayFilename(finalPath),
      content: "",
    });
  }
}

export async function createDirectory(dirPath: string, basePath?: string) {
  const dataDir = await getDataDir();
  const finalPath = await resolveTargetPath(dirPath, basePath, dataDir);
  const alreadyExists = await exists(finalPath);
  if (alreadyExists) {
    const existingIsDir = await isDir(finalPath);
    if (!existingIsDir) {
      throw new Error("Target path exists and is not a directory");
    }
    return;
  }

  await mkdir(finalPath, { recursive: true });
}

export const handleImageUpload = async (
  file: File,
  _onProgress?: (event: { progress: number }) => void,
  _abortSignal?: AbortSignal,
): Promise<string> => {
  const { curPath } = useEditorStore.getState();

  if (!curPath) {
    throw new Error("请先保存文档，再上传图片");
  }

  const docDir = await dirname(curPath);
  const assetsDir = await join(docDir, "assets");

  await mkdir(assetsDir, { recursive: true });

  const ext = getSafeFileExtension(file.name, "png");
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = await join(assetsDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filePath, new Uint8Array(arrayBuffer));

  return convertFileSrc(filePath);
};

async function readAllMarkdownFiles(dirPath: string): Promise<FileContent[]> {
  const entries = await readDir(dirPath);
  const files: FileContent[] = [];

  for (const entry of entries) {
    const name = entry.name;
    if (shouldSkipDirEntryName(name)) {
      continue;
    }

    const fullPath = await join(dirPath, name);

    if (entry.isFile && name.endsWith(".md")) {
      const [err, content] = await to(readTextFile(fullPath));
      if (err) {
        logError(`Failed to read file ${fullPath}`, err);
      } else if (content !== undefined) {
        files.push({ path: fullPath, name, content });
      }
    } else if (entry.isDirectory) {
      const subFiles = await readAllMarkdownFiles(fullPath);
      files.push(...subFiles);
    }
  }

  return files;
}

export async function getAllMarkdownFiles(): Promise<FileContent[]> {
  const dataDir = await getDataDir();
  return await readAllMarkdownFiles(dataDir);
}

/**
 * 将 Markdown 中的相对图片路径转换为 asset:// 路径，以便在编辑器中显示
 */
export async function resolveMarkdownImages(
  markdown: string,
  filePath: string,
) {
  const docDir = await dirname(filePath);
  return await replaceMarkdownImages(markdown, async ({ alt, src }) => {
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:") ||
      isResolvedAssetSrc(src)
    ) {
      return undefined;
    }

    const [err, absolutePath] = await to(join(docDir, src));
    if (err || !absolutePath) {
      logError(`Failed to resolve image path: ${src}`, err);
      return undefined;
    }

    const [existErr, isExist] = await to(exists(absolutePath));
    if (existErr) {
      logError(`Failed to check image existence: ${src}`, existErr);
      return undefined;
    }

    if (!isExist) {
      return undefined;
    }

    return `![${alt}](${convertFileSrc(absolutePath)})`;
  });
}

/**
 * 计算相对路径
 */
function getRelativePath(from: string, to: string) {
  const fromParts = from.split(/[/\\]/).filter(Boolean);
  const toParts = to.split(/[/\\]/).filter(Boolean);

  let i = 0;
  while (
    i < fromParts.length &&
    i < toParts.length &&
    fromParts[i] === toParts[i]
  ) {
    i++;
  }

  const upCount = fromParts.length - i;
  const upParts = new Array(upCount).fill("..");
  const downParts = toParts.slice(i);

  const relPath = [...upParts, ...downParts].join("/");
  return relPath.startsWith(".") ? relPath : `./${relPath}`;
}

/**
 * 将 Markdown 中的 asset:// 或绝对路径转换为相对路径，以便保存
 */
export async function unresolveMarkdownImages(
  markdown: string,
  filePath: string,
) {
  const docDir = await dirname(filePath);
  return await replaceMarkdownImages(markdown, async ({ alt, src }) => {
    const isHttpSrc = src.startsWith("http://") || src.startsWith("https://");
    const isTauriAssetSrc = /^https?:\/\/asset\.localhost(?::\d+)?\//i.test(
      src,
    );

    if (isHttpSrc && !isTauriAssetSrc) {
      return undefined;
    }

    const absolutePath = normalizeAbsolutePathFromImageSrc(src);
    if (!absolutePath) {
      return undefined;
    }

    const relPath = getRelativePath(docDir, absolutePath).replace(/\\/g, "/");
    return `![${alt}](${relPath})`;
  });
}

export async function deleteFileOrDir(path: string) {
  const isDirectory = await isDir(path);
  const [err] = await to(remove(path, { recursive: true }));

  if (err) {
    logError("Failed to delete:", err);
    throw err;
  }

  if (!isDirectory) {
    removeSearchIndex(path);
  }
  return true;
}

export async function renameFileOrDir(oldPath: string, newName: string) {
  const parentDir = await dirname(oldPath);
  const newPath = await join(parentDir, newName);

  const isExists = await exists(newPath);
  if (isExists) {
    throw new Error("Target file already exists");
  }

  const [renameErr] = await to(rename(oldPath, newPath));
  if (renameErr) {
    logError("Failed to rename:", renameErr);
    throw renameErr;
  }

  // Simple approach: remove old path from index
  // Re-indexing will happen when user opens/saves the new file.
  removeSearchIndex(oldPath);

  // If it's a file, read content and add to index immediately
  const isFile = !(await isDir(newPath));
  if (isFile) {
    const [readErr, content] = await to(readTextFile(newPath));
    if (readErr) {
      logError("Failed to re-index renamed file:", readErr);
    } else if (content !== undefined) {
      addOrUpdateFile({
        path: newPath,
        name: newName,
        content: content,
      });
    }
  }

  return newPath;
}
