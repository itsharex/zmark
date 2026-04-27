export function parseMarkdown(fileContent: string) {
  try {
    const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = fileContent.match(regex);

    if (!match) {
      return { frontmatter: {}, body: fileContent };
    }

    const yamlStr = match[1];
    const body = match[2];
    const frontmatter: Record<string, string | string[]> = {};
    const lines = yamlStr.split(/\r?\n/);

    let currentKey = "";
    let isArray = false;

    for (const line of lines) {
      if (!line.trim()) continue;

      // Array items (e.g. "  - tag1")
      if (line.startsWith("  - ") || line.startsWith("  -")) {
        if (currentKey && isArray) {
          const val = line.replace(/^ {2}-\s*/, "").trim();
          const vals = frontmatter[currentKey] as string[];
          frontmatter[currentKey] = vals.concat(val);
        }
        continue;
      }

      // Key-value pairs (e.g. "title: Hello")
      const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kvMatch) {
        currentKey = kvMatch[1];
        const val = kvMatch[2].trim();

        if (val === "") {
          isArray = true;
          frontmatter[currentKey] = [];
        } else {
          isArray = false;
          frontmatter[currentKey] = val;
        }
      }
    }

    return { frontmatter, body };
  } catch (err) {
    console.error("Failed to parse frontmatter:", err);
    return { frontmatter: {}, body: fileContent };
  }
}

export function stringifyMarkdown(
  body: string,
  frontmatter: Record<string, string | string[]>,
) {
  try {
    if (!frontmatter || Object.keys(frontmatter).length === 0) return body;

    let yamlStr = "---\n";
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yamlStr += `${key}:\n`;
        for (const item of value) {
          yamlStr += `  - ${item}\n`;
        }
      } else {
        yamlStr += `${key}: ${value}\n`;
      }
    }
    yamlStr += "---\n";

    return yamlStr + body;
  } catch (err) {
    console.error("Failed to stringify frontmatter:", err);
    return body;
  }
}
