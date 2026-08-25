import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import type { MetaYamlContent } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const FIXTURE_ROOT = path.join(__dirname, "__fixtures__/validate-devices");

export function fixturePaths(
  aliasesFile = "aliases-minimal.yml",
) {
  return {
    schemaPath: path.join(REPO_ROOT, "schema/meta.schema.json"),
    aliasesPath: path.join(FIXTURE_ROOT, "data", aliasesFile),
    platformsPath: path.join(FIXTURE_ROOT, "data/platforms.yml"),
  };
}

export function makeValidMeta(overrides: Partial<MetaYamlContent> = {}): MetaYamlContent {
  return {
    id: "TEST001",
    model: "TEST001",
    tag: "I2C",
    category: "Test",
    description: "Test device",
    image: "https://example.com/image.jpg",
    productUrl: "https://example.com/product",
    examples: [
      {
        platform: "pizero-esm",
        status: "primary",
        upstreamRepository: "chirimen-oh/chirimen.org",
        upstreamPath: "pizero/src/esm-examples/test",
        upstreamPathUrl:
          "https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples/test",
        circuitUrl: null,
        driver: "none",
        verified: false,
      },
    ],
    circuit: null,
    datasheet: null,
    reference: null,
    packages: ["@chirimen/test"],
    platform: "pizero-esm",
    status: "primary",
    verified: false,
    ...overrides,
  };
}

export interface TempRepoOptions {
  devices: Record<
    string,
    {
      meta: MetaYamlContent | string;
      readme?: boolean | string;
    }
  >;
}

export interface TempRepo {
  root: string;
  cleanup: () => Promise<void>;
}

export async function createTempRepo(options: TempRepoOptions): Promise<TempRepo> {
  const root = await mkdtemp(path.join(os.tmpdir(), "validate-devices-"));
  const devicesDir = path.join(root, "devices");
  await mkdir(devicesDir, { recursive: true });

  for (const [dirName, device] of Object.entries(options.devices)) {
    const deviceDir = path.join(devicesDir, dirName);
    await mkdir(deviceDir, { recursive: true });

    const metaContent =
      typeof device.meta === "string"
        ? device.meta
        : stringifyYaml(device.meta);
    await writeFile(path.join(deviceDir, "meta.yml"), metaContent, "utf8");

    if (device.readme !== false) {
      const readmeContent =
        typeof device.readme === "string" ? device.readme : `# ${dirName}\n`;
      await writeFile(path.join(deviceDir, "README.md"), readmeContent, "utf8");
    }
  }

  return {
    root,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true });
    },
  };
}
