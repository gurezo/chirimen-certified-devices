import { stringify } from "yaml";
import type { MetaYamlContent } from "../lib/types.js";

export function renderMetaYml(content: MetaYamlContent): string {
  return `${stringify(content, { lineWidth: 0 }).trimEnd()}\n`;
}
