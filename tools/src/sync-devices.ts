import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { buildMetaYamlContent } from "./lib/build-examples.js";
import { assignUniqueDeviceIds } from "./lib/device-id.js";
import { groupSyncDevices } from "./lib/group-sync-devices.js";
import { loadYamlFile } from "./lib/load-yaml.js";
import { parsePartslistDevices } from "./lib/parse-partslist.js";
import {
  mergeSupplementalDevices,
  parseSupplementalDevices,
} from "./lib/supplemental-devices.js";
import { toImageUrl } from "./lib/to-image-url.js";
import { toKnownPackageSet } from "./lib/chirimen-drivers.js";
import type {
  AliasesConfig,
  ChirimenDriversConfig,
  MetaYamlContent,
  PlatformsConfig,
  SupplementalDevicesConfig,
} from "./lib/types.js";
import { renderMetaYml } from "./templates/meta-yml.js";
import { renderReadme } from "./templates/readme.js";

const DEFAULT_CSV_URL =
  "https://raw.githubusercontent.com/chirimen-oh/chirimen.org/master/_data/partslist.csv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

interface CliOptions {
  dryRun: boolean;
  csvUrl: string;
  devicesDir: string;
  onlySupplemental: boolean;
}

interface DeviceOutput {
  id: string;
  dirPath: string;
  meta: MetaYamlContent;
  metaYml: string;
  readme: string;
}

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let csvUrl = DEFAULT_CSV_URL;
  let devicesDir = "devices";
  let onlySupplemental = false;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--only-supplemental") {
      onlySupplemental = true;
    } else if (arg === "--csv-url") {
      const value = argv[++index];
      if (!value) throw new Error("Missing value for --csv-url");
      csvUrl = value;
    } else if (arg === "--devices-dir") {
      const value = argv[++index];
      if (!value) throw new Error("Missing value for --devices-dir");
      devicesDir = value;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, csvUrl, devicesDir, onlySupplemental };
}

function printHelp(): void {
  console.log(`Usage: pnpm sync:devices [options]

Options:
  --dry-run              Show planned changes without writing files
  --only-supplemental    Write only data/supplemental-devices.yml entries
  --csv-url <url>        Override partslist.csv URL
  --devices-dir <path>   Output directory (default: devices/)
  -h, --help             Show this help message
`);
}

async function fetchCsv(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch partslist.csv (${response.status} ${response.statusText})`);
  }
  return response.text();
}

async function buildDeviceOutputs(
  options: CliOptions,
  aliases: AliasesConfig,
  platforms: PlatformsConfig,
  partslistDevices: ReturnType<typeof parsePartslistDevices>,
  supplementalDevices: ReturnType<typeof parseSupplementalDevices>,
  knownPackages: ReadonlySet<string>,
): Promise<{ outputs: DeviceOutput[]; skipped: string[] }> {
  const merged = options.onlySupplemental
    ? supplementalDevices
    : mergeSupplementalDevices(partslistDevices, supplementalDevices);
  const withIds = assignUniqueDeviceIds(merged, aliases);
  const grouped = groupSyncDevices(withIds, aliases);
  const devicesRoot = path.resolve(REPO_ROOT, options.devicesDir);
  const outputs: DeviceOutput[] = [];
  const skipped: string[] = [];

  for (const device of grouped) {
    const imageUrl = toImageUrl(device.imagePath);
    const meta = buildMetaYamlContent(
      device,
      platforms,
      aliases,
      imageUrl,
      knownPackages,
    );
    if (!meta) {
      skipped.push(device.id);
      console.warn(`sync-devices: skip ${device.id} (no examples)`);
      continue;
    }

    outputs.push({
      id: device.id,
      dirPath: path.join(devicesRoot, device.id),
      meta,
      metaYml: renderMetaYml(meta),
      readme: renderReadme(meta, knownPackages),
    });
  }

  return { outputs, skipped };
}

async function writeDeviceOutputs(
  outputs: DeviceOutput[],
  dryRun: boolean,
): Promise<void> {
  for (const output of outputs) {
    if (dryRun) {
      console.log(`[create] ${path.relative(REPO_ROOT, output.dirPath)}/`);
      continue;
    }

    await rm(output.dirPath, { recursive: true, force: true });
    await mkdir(output.dirPath, { recursive: true });
    await writeFile(path.join(output.dirPath, "meta.yml"), output.metaYml, "utf8");
    await writeFile(path.join(output.dirPath, "README.md"), output.readme, "utf8");
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const supplementalPath = path.join(REPO_ROOT, "data/supplemental-devices.yml");

  const [aliases, platforms, supplementalConfig, chirimenDrivers, csvText] =
    await Promise.all([
      loadYamlFile<AliasesConfig>(path.join(REPO_ROOT, "data/aliases.yml")),
      loadYamlFile<PlatformsConfig>(path.join(REPO_ROOT, "data/platforms.yml")),
      loadYamlFile<SupplementalDevicesConfig>(supplementalPath),
      loadYamlFile<ChirimenDriversConfig>(
        path.join(REPO_ROOT, "data/chirimen-drivers.yml"),
      ),
      options.onlySupplemental ? Promise.resolve("") : fetchCsv(options.csvUrl),
    ]);
  const knownPackages = toKnownPackageSet(chirimenDrivers.packages ?? []);

  const supplementalDevices = parseSupplementalDevices(supplementalConfig);
  const partslistDevices = options.onlySupplemental
    ? []
    : parsePartslistDevices(csvText);

  const schema = await readFile(path.join(REPO_ROOT, "schema/meta.schema.json"), "utf8");
  const validateMeta = new Ajv2020({ allErrors: true, strict: false }).compile(
    JSON.parse(schema),
  );

  const { outputs, skipped } = await buildDeviceOutputs(
    options,
    aliases,
    platforms,
    partslistDevices,
    supplementalDevices,
    knownPackages,
  );

  for (const output of outputs) {
    if (!validateMeta(output.meta)) {
      const details = validateMeta.errors
        ?.map((error: { message?: string }) => error.message)
        .join("; ");
      throw new Error(`meta.yml schema validation failed for ${output.id}: ${details}`);
    }
  }

  await writeDeviceOutputs(outputs, options.dryRun);

  const mode = options.dryRun ? "dry-run" : "wrote";
  const scope = options.onlySupplemental ? " (supplemental only)" : "";
  console.log(
    `sync-devices: ${mode} ${outputs.length} device(s)${scope}` +
      (skipped.length > 0 ? `, skipped ${skipped.length}` : ""),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
