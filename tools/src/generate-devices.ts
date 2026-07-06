import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatDevicesJson,
  generateDevices,
} from "./lib/generate-devices.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

interface CliOptions {
  dryRun: boolean;
  devicesDir: string;
  outputPath: string;
}

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let devicesDir = "devices";
  let outputPath = "generated/devices.json";

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--devices-dir") {
      const value = argv[++index];
      if (!value) throw new Error("Missing value for --devices-dir");
      devicesDir = value;
    } else if (arg === "--output") {
      const value = argv[++index];
      if (!value) throw new Error("Missing value for --output");
      outputPath = value;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, devicesDir, outputPath };
}

function printHelp(): void {
  console.log(`Usage: pnpm generate:devices [options]

Options:
  --dry-run              Print JSON to stdout without writing files
  --devices-dir <path>   Input directory (default: devices/)
  --output <path>        Output file (default: generated/devices.json)
  -h, --help             Show this help message
`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { devicesJson, deviceCount, issues } = await generateDevices({
    repoRoot: REPO_ROOT,
    devicesDir: options.devicesDir,
  });

  if (issues.length > 0) {
    for (const generateIssue of issues) {
      console.error(`${generateIssue.path}: ${generateIssue.message}`);
    }
    process.exit(1);
  }

  const json = formatDevicesJson(devicesJson);

  if (options.dryRun) {
    process.stdout.write(json);
    console.log(`generate-devices: dry-run ${deviceCount} device(s)`);
    return;
  }

  const outputPath = path.resolve(REPO_ROOT, options.outputPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, json, "utf8");

  console.log(
    `generate-devices: wrote ${deviceCount} device(s) to ${path.relative(REPO_ROOT, outputPath)}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
