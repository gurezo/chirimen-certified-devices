import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import { loadYamlFile } from "./load-yaml.js";
import type {
  AliasesConfig,
  ExampleStatus,
  MetaYamlContent,
  PlatformsConfig,
} from "./types.js";

const ALLOWED_STATUSES = new Set<ExampleStatus>([
  "primary",
  "archive",
  "legacy",
  "incubator",
  "special",
]);

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidateDevicesOptions {
  repoRoot: string;
  devicesDir?: string;
  schemaPath?: string;
  aliasesPath?: string;
  platformsPath?: string;
}

export interface ValidateDevicesResult {
  issues: ValidationIssue[];
  deviceCount: number;
}

function issue(devicePath: string, message: string): ValidationIssue {
  return { path: devicePath, message };
}

async function compileMetaValidator(schemaPath: string): Promise<ValidateFunction> {
  const schema = await readFile(schemaPath, "utf8");
  return new Ajv2020({ allErrors: true, strict: false }).compile(JSON.parse(schema));
}

function formatSchemaErrors(
  metaPath: string,
  errors: ValidateFunction["errors"],
): ValidationIssue[] {
  if (!errors || errors.length === 0) {
    return [issue(metaPath, "schema validation failed")];
  }

  return errors.map((error) => {
    const location = error.instancePath || "/";
    return issue(metaPath, `${location}: ${error.message ?? "invalid value"}`);
  });
}

function validateIdModelConsistency(
  dirName: string,
  meta: MetaYamlContent,
  metaPath: string,
  aliases: AliasesConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (dirName !== meta.id) {
    issues.push(
      issue(
        metaPath,
        `directory name "${dirName}" does not match meta id "${meta.id}"`,
      ),
    );
  }

  const compositeIds = new Set(Object.keys(aliases.compositeDevices ?? {}));
  const remoteIds = new Set(Object.keys(aliases.remoteDevices ?? {}));

  if (remoteIds.has(meta.id)) {
    const expectedId = `remote_${meta.model}`;
    if (meta.id !== expectedId) {
      issues.push(
        issue(
          metaPath,
          `remote device id "${meta.id}" does not match remote_${meta.model}`,
        ),
      );
    }
    return issues;
  }

  if (compositeIds.has(meta.id)) {
    if (meta.id !== meta.model) {
      issues.push(
        issue(
          metaPath,
          `composite device id "${meta.id}" must equal model "${meta.model}"`,
        ),
      );
    }
    return issues;
  }

  if (meta.id.startsWith("remote_")) {
    const expectedId = `remote_${meta.model}`;
    if (meta.id !== expectedId) {
      issues.push(
        issue(
          metaPath,
          `remote device id "${meta.id}" does not match remote_${meta.model}`,
        ),
      );
    }
  }

  return issues;
}

function validateExamples(
  meta: MetaYamlContent,
  metaPath: string,
  platformIds: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [index, example] of meta.examples.entries()) {
    const examplePath = `${metaPath}#examples[${index}]`;

    if (!platformIds.has(example.platform)) {
      issues.push(
        issue(
          examplePath,
          `platform "${example.platform}" is not defined in platforms.yml`,
        ),
      );
    }

    if (!ALLOWED_STATUSES.has(example.status)) {
      issues.push(
        issue(
          examplePath,
          `status "${example.status}" is not an allowed value (${[...ALLOWED_STATUSES].join(", ")})`,
        ),
      );
    }
  }

  return issues;
}

function validateAliasDevicePresence(
  devicesDirPath: string,
  deviceDirNames: Set<string>,
  aliases: AliasesConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const compositeId of Object.keys(aliases.compositeDevices ?? {})) {
    if (!deviceDirNames.has(compositeId)) {
      issues.push(
        issue(
          devicesDirPath,
          `composite device "${compositeId}" from aliases.yml is missing under devices/`,
        ),
      );
    }
  }

  for (const remoteId of Object.keys(aliases.remoteDevices ?? {})) {
    if (!deviceDirNames.has(remoteId)) {
      issues.push(
        issue(
          devicesDirPath,
          `remote device "${remoteId}" from aliases.yml is missing under devices/`,
        ),
      );
    }
  }

  return issues;
}

async function listDeviceDirectories(devicesDirPath: string): Promise<string[]> {
  const entries = await readdir(devicesDirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

export async function validateDevices(
  options: ValidateDevicesOptions,
): Promise<ValidateDevicesResult> {
  const devicesDir = options.devicesDir ?? "devices";
  const devicesDirPath = path.join(options.repoRoot, devicesDir);
  const schemaPath =
    options.schemaPath ?? path.join(options.repoRoot, "schema/meta.schema.json");
  const aliasesPath =
    options.aliasesPath ?? path.join(options.repoRoot, "data/aliases.yml");
  const platformsPath =
    options.platformsPath ?? path.join(options.repoRoot, "data/platforms.yml");

  const [validateMeta, aliases, platforms, dirNames] = await Promise.all([
    compileMetaValidator(schemaPath),
    loadYamlFile<AliasesConfig>(aliasesPath),
    loadYamlFile<PlatformsConfig>(platformsPath),
    listDeviceDirectories(devicesDirPath),
  ]);

  const platformIds = new Set(Object.keys(platforms.platforms ?? {}));
  const deviceDirNames = new Set(dirNames);
  const issues: ValidationIssue[] = [];

  issues.push(
    ...validateAliasDevicePresence(devicesDirPath, deviceDirNames, aliases),
  );

  for (const dirName of dirNames) {
    const deviceDir = path.join(devicesDirPath, dirName);
    const metaPath = path.join(deviceDir, "meta.yml");
    const readmePath = path.join(deviceDir, "README.md");
    const relativeMetaPath = path.join(devicesDir, dirName, "meta.yml");
    const relativeReadmePath = path.join(devicesDir, dirName, "README.md");

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

    if (!validateMeta(meta)) {
      issues.push(...formatSchemaErrors(relativeMetaPath, validateMeta.errors));
      continue;
    }

    issues.push(
      ...validateIdModelConsistency(dirName, meta, relativeMetaPath, aliases),
    );
    issues.push(...validateExamples(meta, relativeMetaPath, platformIds));
  }

  return {
    issues,
    deviceCount: dirNames.length,
  };
}
