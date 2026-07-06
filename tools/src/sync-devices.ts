import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse as parseYaml } from "yaml";
import { buildMetaYamlContent } from "./lib/build-examples.js";
import { assignUniqueDeviceIds } from "./lib/device-id.js";
import { groupSyncDevices } from "./lib/group-sync-devices.js";
import { parsePartslistDevices } from "./lib/parse-partslist.js";
import { toImageUrl } from "./lib/to-image-url.js";
import type {
  AliasesConfig,
  MetaYamlContent,
  PlatformsConfig,
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

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      dryRun = true;
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

  return { dryRun, csvUrl, devicesDir };
}

function printHelp(): void {
  console.log(`Usage: pnpm sync:devices [options]

Options:
  --dry-run              Show planned changes without writing files
  --csv-url <url>        Override partslist.csv URL
  --devices-dir <path>   Output directory (default: devices/)
  -h, --help             Show this help message
`);
}

async function loadYamlFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(REPO_ROOT, relativePath);
  const content = await readFile(filePath, "utf8");
  return parseYaml(content) as T;
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
  csvText: string,
): Promise<{ outputs: DeviceOutput[]; skipped: string[] }> {
  const parsed = parsePartslistDevices(csvText);
  const withIds = assignUniqueDeviceIds(parsed, aliases);
  const grouped = groupSyncDevices(withIds, aliases);
  const devicesRoot = path.resolve(REPO_ROOT, options.devicesDir);
  const outputs: DeviceOutput[] = [];
  const skipped: string[] = [];

  for (const device of grouped) {
    const imageUrl = toImageUrl(device.imagePath);
    const meta = buildMetaYamlContent(device, platforms, aliases, imageUrl);
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
      readme: renderReadme(meta),
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
  const [aliases, platforms, csvText] = await Promise.all([
    loadYamlFile<AliasesConfig>("data/aliases.yml"),
    loadYamlFile<PlatformsConfig>("data/platforms.yml"),
    fetchCsv(options.csvUrl),
  ]);

  const schema = await readFile(path.join(REPO_ROOT, "schema/meta.schema.json"), "utf8");
  const validateMeta = new Ajv2020({ allErrors: true, strict: false }).compile(
    JSON.parse(schema),
  );

  const { outputs, skipped } = await buildDeviceOutputs(
    options,
    aliases,
    platforms,
    csvText,
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
  console.log(
    `sync-devices: ${mode} ${outputs.length} device(s)` +
      (skipped.length > 0 ? `, skipped ${skipped.length}` : ""),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
