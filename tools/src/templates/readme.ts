import {
  isKnownChirimenPackage,
  jsdelivrPackageUrl,
} from "../lib/chirimen-drivers.js";
import type { MetaExample, MetaYamlContent } from "../lib/types.js";

const PLATFORM_LABELS: Record<string, string> = {
  "pizero-esm": "Pi Zero / Raspberry Pi (ESM)",
  "legacy-gc-i2c": "Legacy CHIRIMEN GC (I2C)",
  "legacy-gc-gpio": "Legacy CHIRIMEN GC (GPIO)",
  "microbit-driver": "micro:bit",
  "remote-connection": "Remote Connection",
};

function renderFrontMatter(content: MetaYamlContent): string {
  const frontMatter = {
    title: content.model,
    model: content.model,
    category: content.category,
    description: content.description,
  };

  const lines = ["---"];
  for (const [key, value] of Object.entries(frontMatter)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function renderExampleSection(examples: MetaExample[]): string {
  if (examples.length === 0) return "";

  const lines = ["## Example", ""];
  for (const example of examples) {
    const label = PLATFORM_LABELS[example.platform] ?? example.platform;
    lines.push(
      `- **${label}** (${example.status}): [${example.upstreamPath}](${example.upstreamPathUrl})`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

function renderOptionalLink(label: string, url: string | null): string {
  if (!url) return "";
  return `- [${label}](${url})\n`;
}

function renderPackageItem(
  pkg: string,
  knownPackages: ReadonlySet<string>,
): string {
  if (isKnownChirimenPackage(pkg, knownPackages)) {
    return `- [${pkg}](${jsdelivrPackageUrl(pkg)})`;
  }
  return `- \`${pkg}\``;
}

export function renderReadme(
  content: MetaYamlContent,
  knownPackages: ReadonlySet<string> = new Set(),
): string {
  const sections = [
    renderFrontMatter(content),
    "## 概要",
    "",
    content.description,
    "",
    "## インターフェース",
    "",
    content.tag,
    "",
  ];

  if (content.packages.length > 0) {
    sections.push(
      "## 使用パッケージ",
      "",
      ...content.packages.map((pkg) => renderPackageItem(pkg, knownPackages)),
      "",
    );
  }

  sections.push(renderExampleSection(content.examples));

  if (content.image) {
    sections.push("## 画像", "", `![${content.model}](${content.image})`, "");
  }

  if (content.circuit) {
    sections.push(
      "## 回路図",
      "",
      `![${content.model} 回路図](${content.circuit})`,
      "",
    );
  }

  const links = [
    renderOptionalLink("商品ページ", content.productUrl),
    renderOptionalLink("データシート", content.datasheet),
    renderOptionalLink("参考資料", content.reference),
  ].filter(Boolean);

  if (links.length > 0) {
    sections.push("## リンク", "", ...links, "");
  }

  return sections.join("\n").trimEnd() + "\n";
}
