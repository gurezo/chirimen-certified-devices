import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDevices } from "./lib/validate-devices.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

interface CliOptions {
  devicesDir: string;
}

function parseArgs(argv: string[]): CliOptions {
  let devicesDir = "devices";

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--devices-dir") {
      const value = argv[++index];
      if (!value) throw new Error("Missing value for --devices-dir");
      devicesDir = value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { devicesDir };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { issues, deviceCount } = await validateDevices({
    repoRoot: REPO_ROOT,
    devicesDir: options.devicesDir,
  });

  if (issues.length > 0) {
    for (const validationIssue of issues) {
      console.error(`${validationIssue.path}: ${validationIssue.message}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${deviceCount} device(s).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
