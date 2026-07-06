import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadYamlFile } from "./load-yaml.js";
import { parseReadmeFrontmatter } from "./parse-readme-frontmatter.js";
import type {
  AliasesConfig,
  DevicesJson,
  GeneratedDevice,
  GeneratedMeta,
  GeneratedMetaExample,
  MetaExample,
  MetaYamlContent,
  PlatformsConfig,
} from "./types.js";

export interface GenerateDevicesIssue {
  path: string;
  message: string;
}

export interface GenerateDevicesOptions {
  repoRoot: string;
  devicesDir?: string;
  aliasesPath?: string;
  platformsPath?: string;
  generatedAt?: string;
}

export interface GenerateDevicesResult {
  devicesJson: DevicesJson;
  deviceCount: number;
  issues: GenerateDevicesIssue[];
}

function issue(devicePath: string, message: string): GenerateDevicesIssue {
  return { path: devicePath, message };
}

async function listDeviceDirectories(devicesDirPath: string): Promise<string[]> {
  const entries = await readdir(devicesDirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
}

function compareExamples(a: MetaExample, b: MetaExample): number {
  const platformCompare = a.platform.localeCompare(b.platform);
  if (platformCompare !== 0) {
    return platformCompare;
  }
  return a.status.localeCompare(b.status);
}

function normalizeMeta(
  meta: MetaYamlContent,
  platforms: PlatformsConfig,
): GeneratedMeta {
  const sortedExamples = [...meta.examples]
    .sort(compareExamples)
    .map((example): GeneratedMetaExample => {
      const platformDefinition = platforms.platforms[example.platform];
      return {
        ...example,
        platformLabel: platformDefinition?.label ?? example.platform,
      };
    });

  return {
    ...meta,
    packages: [...meta.packages].sort((a, b) => a.localeCompare(b)),
    examples: sortedExamples,
  };
}

function sortDevices(devices: GeneratedDevice[]): GeneratedDevice[] {
  return [...devices].sort((a, b) => a.id.localeCompare(b.id));
}

export function formatDevicesJson(devicesJson: DevicesJson): string {
  return `${JSON.stringify(devicesJson, null, 2)}\n`;
}

export async function generateDevices(
  options: GenerateDevicesOptions,
): Promise<GenerateDevicesResult> {
  const devicesDir = options.devicesDir ?? "devices";
  const devicesDirPath = path.join(options.repoRoot, devicesDir);
  const aliasesPath =
    options.aliasesPath ?? path.join(options.repoRoot, "data/aliases.yml");
  const platformsPath =
    options.platformsPath ?? path.join(options.repoRoot, "data/platforms.yml");

  const [aliases, platforms, dirNames] = await Promise.all([
    loadYamlFile<AliasesConfig>(aliasesPath),
    loadYamlFile<PlatformsConfig>(platformsPath),
    listDeviceDirectories(devicesDirPath),
  ]);

  const issues: GenerateDevicesIssue[] = [];
  const devices: GeneratedDevice[] = [];

  for (const dirName of dirNames) {
    const deviceDir = path.join(devicesDirPath, dirName);
    const metaPath = path.join(deviceDir, "meta.yml");
    const readmePath = path.join(deviceDir, "README.md");
    const relativeMetaPath = path.join(devicesDir, dirName, "meta.yml");
    const relativeReadmePath = path.join(devicesDir, dirName, "README.md");
    const relativeDirectory = path.join(devicesDir, dirName);

    const [metaExists, readmeExists] = await Promise.all([
      stat(metaPath).then(() => true).catch(() => false),
      stat(readmePath).then(() => true).catch(() => false),
    ]);

    if (!metaExists) {
      issues.push(issue(relativeMetaPath, "meta.yml is missing"));
      continue;
    }

    if (!readmeExists) {
      issues.push(issue(relativeReadmePath, "README.md is missing"));
    }

    let meta: MetaYamlContent;
    try {
      meta = await loadYamlFile<MetaYamlContent>(metaPath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed to parse meta.yml";
      issues.push(issue(relativeMetaPath, message));
      continue;
    }

    let frontmatter = null;
    if (readmeExists) {
      try {
        const readmeContent = await readFile(readmePath, "utf8");
        frontmatter = parseReadmeFrontmatter(readmeContent);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "failed to parse README.md";
        issues.push(issue(relativeReadmePath, message));
        continue;
      }
    }

    devices.push({
      id: meta.id,
      directory: relativeDirectory,
      meta: normalizeMeta(meta, platforms),
      readme: {
        path: relativeReadmePath,
        frontmatter,
      },
    });
  }

  const devicesJson: DevicesJson = {
    version: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    platforms,
    aliases,
    devices: sortDevices(devices),
  };

  return {
    devicesJson,
    deviceCount: devices.length,
    issues,
  };
}
