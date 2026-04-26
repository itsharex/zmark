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
import { addOrUpdateFile, removeFile as removeSearchIndex } from "./search";

/**
 * 获取数据目录路径
 */
export async function getDataDir() {
  // 尝试创建 markdowns 目录，如果已存在则忽略错误
  await to(
    mkdir("markdowns", {
      baseDir: BaseDirectory.Document,
      recursive: true,
    }),
  );
  // 无论是否创建成功，都返回完整的路径
  return join(await documentDir(), "markdowns");
}

async function buildFileTree(dirPath: string): Promise<TreeItem[]> {
  const entries = await readDir(dirPath);
  const fileTree: TreeItem[] = [];

  for (const entry of entries) {
    const name = entry.name;
    // 过滤掉隐藏文件（以.开头）和无效文件
    if (!name || name.startsWith(".") || name === ".DS_Store") {
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

export async function getFileTree() {
  const dataDir = await getDataDir();
  return await buildFileTree(dataDir);
}

export function getTreeKey(item: TreeItem) {
  return typeof item === "string" ? item : String(item[0]);
}

export async function isDir(path: string) {
  const [err, fileStat] = await to(stat(path));
  if (err) {
    console.error("Error checking if path is directory:", err);
    return false;
  }
  return fileStat?.isDirectory ?? false;
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
    // Add new file to search index
    addOrUpdateFile({
      path: finalPath,
      name: finalPath.split("/").pop() || "",
      content: "",
    });
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

async function readAllMarkdownFiles(dirPath: string): Promise<FileContent[]> {
  const entries = await readDir(dirPath);
  let files: FileContent[] = [];

  for (const entry of entries) {
    const name = entry.name;
    if (!name || name.startsWith(".") || name === ".DS_Store") {
      continue;
    }

    const fullPath = await join(dirPath, name);

    if (entry.isFile && name.endsWith(".md")) {
      const [err, content] = await to(readTextFile(fullPath));
      if (err) {
        console.error(`Failed to read file ${fullPath}`, err);
      } else if (content !== undefined) {
        files.push({
          path: fullPath,
          name: name,
          content: content,
        });
      }
    } else if (entry.isDirectory) {
      const subFiles = await readAllMarkdownFiles(fullPath);
      files = [...files, ...subFiles];
    }
  }

  return files;
}

export async function getAllMarkdownFiles() {
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

  // 使用正则表达式匹配 Markdown 中的图片语法 ! [alt](path)
  const matches = Array.from(markdown.matchAll(/!\[(.*?)\]\((.*?)\)/g));
  let result = markdown;

  for (const match of matches) {
    const [fullMatch, alt, src] = match;

    // 如果是远程路径或已经是 asset:// 路径或 base64，跳过
    if (
      src.startsWith("http") ||
      src.startsWith("asset://") ||
      src.startsWith("data:")
    ) {
      continue;
    }

    // 解析相对路径为绝对路径
    const [err, absolutePath] = await to(join(docDir, src));
    if (err) {
      console.error(`Failed to resolve image path: ${src}`, err);
      continue;
    }

    // 检查文件是否存在
    const [existErr, isExist] = await to(exists(absolutePath as string));
    if (existErr) {
      console.error(`Failed to check image existence: ${src}`, existErr);
      continue;
    }

    if (isExist) {
      const assetUrl = convertFileSrc(absolutePath as string);
      result = result.replace(fullMatch, `![${alt}](${assetUrl})`);
    }
  }

  return result;
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

  const matches = Array.from(markdown.matchAll(/!\[(.*?)\]\((.*?)\)/g));
  let result = markdown;

  for (const match of matches) {
    const [fullMatch, alt, src] = match;

    let absolutePath = "";

    if (src.startsWith("asset://")) {
      const url = new URL(src);
      // decodeURIComponent(url.pathname) 可能会包含前导斜杠
      absolutePath = decodeURIComponent(url.pathname);
      // 在 macOS 上，absolutePath 如果以 /Users/... 开头，则它是绝对路径
      // 在 Windows 上，absolutePath 如果以 /C:/... 开头，需要去掉前面的 /
      if (
        absolutePath.match(/^\/[a-zA-Z]:\//) ||
        absolutePath.match(/^\/[a-zA-Z]:\\/)
      ) {
        absolutePath = absolutePath.substring(1);
      }
    } else if (
      src.startsWith("/") ||
      (src.includes(":") && !src.startsWith("http"))
    ) {
      // 看起来像绝对路径
      absolutePath = src;
    } else {
      // 已经是相对路径或远程路径
      continue;
    }

    if (absolutePath) {
      // 计算从文档目录到图片目录的相对路径
      const relPath = getRelativePath(docDir, absolutePath);
      // 确保使用正斜杠
      const webRelPath = relPath.replace(/\\/g, "/");

      result = result.replace(fullMatch, `![${alt}](${webRelPath})`);
    }
  }

  return result;
}

export async function deleteFileOrDir(path: string) {
  const isDirectory = await isDir(path);
  const [err] = await to(remove(path, { recursive: true }));

  if (err) {
    console.error("Failed to delete:", err);
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
    console.error("Failed to rename:", renameErr);
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
      console.error("Failed to re-index renamed file:", readErr);
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
