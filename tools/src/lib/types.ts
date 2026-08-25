export type DeviceTag =
  | "I2C"
  | "GPIO"
  | "Analog"
  | "Actuator"
  | "Other"
  | "BoardComputer";

export type PlatformId =
  | "pizero-esm"
  | "legacy-gc-i2c"
  | "legacy-gc-gpio"
  | "microbit-driver"
  | "remote-connection";

export type ExampleStatus =
  | "primary"
  | "archive"
  | "legacy"
  | "incubator"
  | "special";

export type PartslistRow = string[];

export interface RawExampleUrls {
  chirimen?: string;
  microbit?: string;
  piZero?: string;
}

export interface ParsedPartslistDevice {
  model: string;
  tag: DeviceTag;
  category: string;
  description: string;
  imagePath: string;
  productUrl: string;
  circuitUrl?: string;
  datasheetUrl?: string;
  referenceUrl?: string;
  noteUrl?: string;
  specUrl?: string;
  instructionsUrl?: string;
  guideUrl?: string;
  rawExampleUrls: RawExampleUrls;
  /** Prefer null circuitUrl over guessed schematic paths when building meta. */
  omitGuessedCircuitUrl?: boolean;
}

/** Upstream-backed device entry not present in partslist.csv. */
export interface SupplementalDeviceEntry {
  model: string;
  tag: DeviceTag;
  category: string;
  description: string;
  imagePath?: string;
  productUrl: string;
  circuitUrl?: string | null;
  datasheetUrl?: string | null;
  referenceUrl?: string | null;
  rawExampleUrls: RawExampleUrls;
  /**
   * When true, generated examples keep circuitUrl as null instead of a guessed
   * schematic.png path (use for upstream dirs without schematic assets).
   */
  omitGuessedCircuitUrl?: boolean;
}

export interface SupplementalDevicesConfig {
  devices: Record<string, SupplementalDeviceEntry>;
}

export interface ClassifiedExample {
  platform: PlatformId;
  status: ExampleStatus;
  codeUrl: string;
}

export interface PlatformDefinition {
  id: PlatformId;
  label: string;
  defaultStatus: ExampleStatus;
  allowedStatuses: ExampleStatus[];
  upstreamRepository: string;
  upstreamBasePath: string;
  legacyCodeUrlPatterns: string[];
}

export interface PlatformsConfig {
  platforms: Record<string, PlatformDefinition>;
}

export interface ExampleNameAlias {
  directoryId: string;
  exampleDeviceId: string;
  legacyExampleNames: string[];
}

export interface CompositeDevice {
  models: string[];
  description: string;
}

export interface RemoteDevice {
  baseModel: string;
  models?: string[];
  description: string;
}

export interface AliasesConfig {
  directoryRules?: {
    single: string;
    composite: string;
    remoteSingle: string;
    remoteComposite: string;
  };
  compositeDevices?: Record<string, CompositeDevice>;
  remoteDevices?: Record<string, RemoteDevice>;
  exampleNameAliases?: Record<string, ExampleNameAlias>;
}

export interface ParsedPartslistDeviceWithId extends ParsedPartslistDevice {
  id: string;
}

export type SyncDeviceKind = "single" | "composite" | "remote";

export interface SyncDeviceEntry extends ParsedPartslistDevice {
  id: string;
  kind: SyncDeviceKind;
}

export interface ChirimenDriversConfig {
  packages: string[];
}

export interface MetaExample {
  platform: PlatformId;
  status: ExampleStatus;
  upstreamRepository: string;
  upstreamPath: string;
  upstreamPathUrl: string;
  circuitUrl: string | null;
  driver: string;
  verified: boolean;
}

export interface MetaYamlContent {
  id: string;
  model: string;
  tag: DeviceTag;
  category: string;
  description: string;
  image: string;
  productUrl: string;
  examples: MetaExample[];
  circuit: string | null;
  datasheet: string | null;
  reference: string | null;
  packages: string[];
  platform: PlatformId;
  status: ExampleStatus;
  verified: boolean;
}

export interface ReadmeFrontmatter {
  title?: string;
  model?: string;
  category?: string;
  description?: string;
}

export interface GeneratedMetaExample extends MetaExample {
  platformLabel: string;
}

export interface GeneratedMeta extends Omit<MetaYamlContent, "examples"> {
  examples: GeneratedMetaExample[];
}

export interface GeneratedReadme {
  path: string;
  frontmatter: ReadmeFrontmatter | null;
}

export interface GeneratedDevice {
  id: string;
  directory: string;
  meta: GeneratedMeta;
  readme: GeneratedReadme;
}

export interface DevicesJson {
  version: 1;
  generatedAt: string;
  platforms: PlatformsConfig;
  aliases: AliasesConfig;
  devices: GeneratedDevice[];
}
