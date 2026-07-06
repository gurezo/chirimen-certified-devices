import { classifyExampleUrls } from "./classify-example-url.js";
import type {
  AliasesConfig,
  ClassifiedExample,
  ExampleNameAlias,
  ExampleStatus,
  MetaExample,
  MetaYamlContent,
  PlatformId,
  PlatformsConfig,
  SyncDeviceEntry,
} from "./types.js";

const PLATFORM_ORDER: PlatformId[] = [
  "pizero-esm",
  "microbit-driver",
  "legacy-gc-i2c",
  "legacy-gc-gpio",
  "remote-connection",
];

function sortExamples(examples: MetaExample[]): MetaExample[] {
  return [...examples].sort(
    (left, right) =>
      PLATFORM_ORDER.indexOf(left.platform) - PLATFORM_ORDER.indexOf(right.platform),
  );
}

function findExampleAlias(
  device: SyncDeviceEntry,
  aliases: AliasesConfig,
): ExampleNameAlias | undefined {
  const exampleNameAliases = aliases.exampleNameAliases ?? {};
  for (const [key, alias] of Object.entries(exampleNameAliases)) {
    if (alias.directoryId === device.id || key === device.id || key === device.model) {
      return alias;
    }
  }
  return undefined;
}

function exampleDeviceIdFromPiZeroUrl(url: string): string | null {
  const fragment = extractUrlFragment(url);
  if (!fragment) return null;

  const stripped = fragment.replace(/^(I2C|GPIO|Analog|Actuator)_/i, "");
  const normalized = stripped.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return normalized || null;
}

function exampleDeviceIdFromModel(model: string): string | null {
  const normalized = model.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return normalized || null;
}

export function deriveExampleDeviceId(
  device: SyncDeviceEntry,
  aliases: AliasesConfig,
): string | undefined {
  const alias = findExampleAlias(device, aliases);
  if (alias?.exampleDeviceId) return alias.exampleDeviceId;

  const piZeroUrl = device.rawExampleUrls.piZero;
  if (piZeroUrl) {
    const fromPiZero = exampleDeviceIdFromPiZeroUrl(piZeroUrl);
    if (fromPiZero) return fromPiZero;
  }

  return exampleDeviceIdFromModel(device.model) ?? undefined;
}

function extractUrlFragment(url: string): string | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;
  const fragment = url.slice(hashIndex + 1).trim();
  return fragment || null;
}

function legacyPathFromFragment(fragment: string, basePath: string): string {
  const normalized = fragment.replace(/^I2C-/i, "i2c-").replace(/^GPIO-/i, "gpio-");
  return `${basePath}/${normalized}`;
}

function resolveUpstreamPath(
  classified: ClassifiedExample,
  platforms: PlatformsConfig,
  exampleDeviceId: string | undefined,
): string | null {
  const platform = platforms.platforms[classified.platform];
  if (!platform) return null;

  if (classified.platform === "pizero-esm") {
    if (!exampleDeviceId) return null;
    return `${platform.upstreamBasePath}/${exampleDeviceId}`;
  }

  if (classified.platform === "remote-connection") {
    const slug = exampleDeviceId ?? "device";
    return `${platform.upstreamBasePath}/${slug}`;
  }

  const fragment = extractUrlFragment(classified.codeUrl);
  if (!fragment) return null;

  if (
    classified.platform === "legacy-gc-i2c" ||
    classified.platform === "legacy-gc-gpio"
  ) {
    return legacyPathFromFragment(fragment, platform.upstreamBasePath);
  }

  if (classified.platform === "microbit-driver") {
    return `${platform.upstreamBasePath}/${fragment}`;
  }

  return null;
}

function buildUpstreamPathUrl(
  upstreamRepository: string,
  upstreamPath: string,
): string {
  return `https://github.com/${upstreamRepository}/tree/master/${upstreamPath}`;
}

function classifiedToMetaExample(
  classified: ClassifiedExample,
  platforms: PlatformsConfig,
  exampleDeviceId: string | undefined,
  circuitUrl: string | null,
): MetaExample | null {
  const platform = platforms.platforms[classified.platform];
  if (!platform) return null;

  const upstreamPath = resolveUpstreamPath(classified, platforms, exampleDeviceId);
  if (!upstreamPath) return null;

  return {
    platform: classified.platform,
    status: classified.status,
    upstreamRepository: platform.upstreamRepository,
    upstreamPath,
    upstreamPathUrl: buildUpstreamPathUrl(platform.upstreamRepository, upstreamPath),
    circuitUrl,
    verified: false,
  };
}

export function buildMetaExamples(
  device: SyncDeviceEntry,
  platforms: PlatformsConfig,
  aliases: AliasesConfig,
): MetaExample[] {
  const exampleDeviceId = deriveExampleDeviceId(device, aliases);
  const circuitUrl = device.circuitUrl ?? null;

  const classified = classifyExampleUrls(device.rawExampleUrls, platforms);
  const examples: MetaExample[] = [];
  const seenPlatforms = new Set<PlatformId>();

  for (const item of classified) {
    const metaExample = classifiedToMetaExample(
      item,
      platforms,
      exampleDeviceId,
      circuitUrl,
    );
    if (!metaExample || seenPlatforms.has(metaExample.platform)) continue;
    seenPlatforms.add(metaExample.platform);
    examples.push(metaExample);
  }

  if (device.kind === "remote") {
    const remotePlatform = platforms.platforms["remote-connection"];
    if (remotePlatform && !seenPlatforms.has("remote-connection")) {
      const slug = exampleDeviceId ?? device.model.toLowerCase().replace(/_/g, "-");
      const upstreamPath = `${remotePlatform.upstreamBasePath}/${slug}`;
      examples.push({
        platform: "remote-connection",
        status: remotePlatform.defaultStatus,
        upstreamRepository: remotePlatform.upstreamRepository,
        upstreamPath,
        upstreamPathUrl: buildUpstreamPathUrl(
          remotePlatform.upstreamRepository,
          upstreamPath,
        ),
        circuitUrl,
        verified: false,
      });
    }
  }

  return sortExamples(examples);
}

export function pickPrimaryExample(
  examples: MetaExample[],
): MetaExample | undefined {
  const primaryPizero = examples.find(
    (example) => example.platform === "pizero-esm" && example.status === "primary",
  );
  if (primaryPizero) return primaryPizero;
  return examples[0];
}

export function buildPackages(
  device: SyncDeviceEntry,
  aliases: AliasesConfig,
): string[] {
  const exampleDeviceId = deriveExampleDeviceId(device, aliases);
  if (!exampleDeviceId) return [];

  const packageId = exampleDeviceId.includes("_")
    ? exampleDeviceId.split("_")[0]
    : exampleDeviceId;

  return [`@chirimen/${packageId}`];
}

function requireUri(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed.startsWith("http")) return trimmed;
  return fallback;
}

export function buildMetaYamlContent(
  device: SyncDeviceEntry,
  platforms: PlatformsConfig,
  aliases: AliasesConfig,
  imageUrl: string | null,
): MetaYamlContent | null {
  const examples = buildMetaExamples(device, platforms, aliases);
  if (examples.length === 0) return null;

  const primary = pickPrimaryExample(examples);
  if (!primary) return null;

  return {
    id: device.id,
    model: device.model,
    tag: device.tag,
    category: device.category,
    description: device.description,
    image: requireUri(
      imageUrl ?? undefined,
      "https://raw.githubusercontent.com/chirimen-oh/chirimen.org/master/partsImgs/placeholder.jpg",
    ),
    productUrl: requireUri(device.productUrl, "https://chirimen.org/"),
    examples,
    circuit: device.circuitUrl ?? null,
    datasheet: device.datasheetUrl ?? null,
    reference: device.referenceUrl ?? null,
    packages: buildPackages(device, aliases),
    platform: primary.platform,
    status: primary.status as ExampleStatus,
    verified: false,
  };
}
