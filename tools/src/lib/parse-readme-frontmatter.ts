import { parse as parseYaml } from "yaml";
import type { ReadmeFrontmatter } from "./types.js";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export function parseReadmeFrontmatter(content: string): ReadmeFrontmatter | null {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) {
    return null;
  }

  const parsed = parseYaml(match[1]);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  return parsed as ReadmeFrontmatter;
}
