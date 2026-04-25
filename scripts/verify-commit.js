import { readFileSync } from "node:fs";

const msgPath = process.argv[2];
const msg = readFileSync(msgPath, "utf-8").trim();

// Remove comments
const lines = msg.split("\n").filter((line) => !line.trim().startsWith("#"));
const cleanMsg = lines.join("\n").trim();

if (!cleanMsg) {
  process.exit(0);
}

// 1. Check for scope: type(scope): ...
// Conventional commits pattern with scope
// const scopeRegex = /^[a-z]+\s*\([^)]+\):/;
// if (scopeRegex.test(cleanMsg)) {
//   console.error(
//     "\x1b[31m%s\x1b[0m",
//     'ERROR: Commit message must not contain a scope (e.g., "feat(scope):").',
//   );
//   console.error("\x1b[31m%s\x1b[0m", "Please remove the scope and try again.");
//   process.exit(1);
// }

// 2. Check for description (body)
// If there is more than one line of content (excluding empty lines between subject and body if any)
// Actually, if cleanMsg has multiple lines, it likely has a body.
// However, some people write multi-line subjects? Not recommended.
// Let's assume description means "body".
// If lines.length > 1, it has a body.
if (lines.length > 1) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "ERROR: Commit message must not contain a description/body.",
  );
  console.error(
    "\x1b[31m%s\x1b[0m",
    "Please keep the commit message to a single line subject.",
  );
  process.exit(1);
}

// 3. Check for Chinese-English spacing
// Pattern: Chinese char followed by English/Number OR English/Number followed by Chinese char
const noSpaceRegex =
  /([\u4e00-\u9fa5][a-zA-Z0-9])|([a-zA-Z0-9][\u4e00-\u9fa5])/;

if (noSpaceRegex.test(cleanMsg)) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "ERROR: Commit message must have a space between Chinese and English characters.",
  );
  // Show where the error is
  const match = cleanMsg.match(noSpaceRegex);
  if (match) {
    console.error("\x1b[33m%s\x1b[0m", `Found issue at: "...${match[0]}..."`);
  }
  process.exit(1);
}

process.exit(0);
