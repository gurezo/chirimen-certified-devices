import type {
  ClassifiedExample,
  ExampleStatus,
  PlatformId,
  PlatformsConfig,
  RawExampleUrls,
} from "./types.js";

const PLATFORM_ORDER: PlatformId[] = [
  "pizero-esm",
  "microbit-driver",
  "legacy-gc-i2c",
  "legacy-gc-gpio",
  "remote-connection",
];

const STATUS_OVERRIDES: Partial<Record<PlatformId, ExampleStatus>> = {
  "microbit-driver": "incubator",
};

interface UrlRule {
  pattern: string;
  platform: PlatformId;
  status: ExampleStatus;
}

function buildUrlRules(platforms: PlatformsConfig): UrlRule[] {
  const rules: UrlRule[] = [];

  for (const platformId of PLATFORM_ORDER) {
    const platform = platforms.platforms[platformId];
    if (!platform) continue;

    const status = STATUS_OVERRIDES[platformId] ?? platform.defaultStatus;
    for (const pattern of platform.legacyCodeUrlPatterns) {
      rules.push({ pattern, platform: platformId, status });
    }
  }

  return rules;
}

function matchesPattern(url: string, pattern: string): boolean {
  return url.toLowerCase().includes(pattern.toLowerCase());
}

export function classifyExampleUrl(
  codeUrl: string,
  platforms: PlatformsConfig,
): ClassifiedExample | null {
  const normalized = codeUrl.trim();
  if (!normalized) return null;
  if (/github\.com/i.test(normalized)) return null;

  const rules = buildUrlRules(platforms);
  for (const rule of rules) {
    if (matchesPattern(normalized, rule.pattern)) {
      return {
        platform: rule.platform,
        status: rule.status,
        codeUrl: normalized,
      };
    }
  }

  return null;
}

export function classifyExampleUrls(
  rawUrls: RawExampleUrls,
  platforms: PlatformsConfig,
): ClassifiedExample[] {
  const urls = [rawUrls.chirimen, rawUrls.microbit, rawUrls.piZero].filter(
    (url): url is string => Boolean(url?.trim()),
  );
  const seen = new Set<string>();
  const results: ClassifiedExample[] = [];

  for (const url of urls) {
    const classified = classifyExampleUrl(url, platforms);
    if (!classified || seen.has(classified.codeUrl)) continue;
    seen.add(classified.codeUrl);
    results.push(classified);
  }

  return results;
}
