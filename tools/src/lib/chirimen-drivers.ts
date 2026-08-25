import type { MetaExample, MetaYamlContent, PlatformId } from "./types.js";

export const DRIVER_NONE = "none";

const CHIRIMEN_DRIVERS_PACKAGE_TREE =
  "https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages";

export const JSDELIVR_NPM_PACKAGE_BASE = "https://www.jsdelivr.com/package/npm";

export function toKnownPackageSet(packages: string[]): Set<string> {
  return new Set(packages);
}

export function isKnownChirimenPackage(
  pkg: string,
  knownPackages: ReadonlySet<string>,
): boolean {
  return knownPackages.has(pkg);
}

export function jsdelivrPackageUrl(pkg: string): string {
  return `${JSDELIVR_NPM_PACKAGE_BASE}/${pkg}`;
}

export function resolveDriver(
  packages: string[],
  platform: PlatformId,
  knownPackages: ReadonlySet<string>,
): string {
  if (platform !== "pizero-esm") return DRIVER_NONE;

  const matched = packages.find((pkg) => knownPackages.has(pkg));
  if (!matched) return DRIVER_NONE;

  const slug = matched.replace(/^@chirimen\//, "");
  return `${CHIRIMEN_DRIVERS_PACKAGE_TREE}/${slug}`;
}

export function applyDriverToExamples(
  examples: MetaExample[],
  packages: string[],
  knownPackages: ReadonlySet<string>,
): MetaExample[] {
  return examples.map((example) => ({
    ...example,
    driver: resolveDriver(packages, example.platform, knownPackages),
  }));
}

export function applyDriverToMeta(
  meta: MetaYamlContent,
  knownPackages: ReadonlySet<string>,
): MetaYamlContent {
  return {
    ...meta,
    examples: applyDriverToExamples(meta.examples, meta.packages, knownPackages),
  };
}
