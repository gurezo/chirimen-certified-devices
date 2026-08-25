import { afterEach, describe, expect, it } from "vitest";
import { generateDevices } from "./generate-devices.js";
import {
  createTempRepo,
  fixturePaths,
  makeValidMeta,
  type TempRepo,
} from "./validate-devices.test-helpers.js";

const FIXED_GENERATED_AT = "2026-01-01T00:00:00.000Z";

let tempRepo: TempRepo | undefined;

afterEach(async () => {
  await tempRepo?.cleanup();
  tempRepo = undefined;
});

async function runGenerate(
  devices: Parameters<typeof createTempRepo>[0]["devices"],
  aliasesFile = "aliases-minimal.yml",
) {
  tempRepo = await createTempRepo({ devices });
  const paths = fixturePaths(aliasesFile);
  return generateDevices({
    repoRoot: tempRepo.root,
    aliasesPath: paths.aliasesPath,
    platformsPath: paths.platformsPath,
    generatedAt: FIXED_GENERATED_AT,
  });
}

describe("generateDevices", () => {
  it("sorts devices by id", async () => {
    const result = await runGenerate({
      ZZZ999: { meta: makeValidMeta({ id: "ZZZ999", model: "ZZZ999" }) },
      AAA111: { meta: makeValidMeta({ id: "AAA111", model: "AAA111" }) },
    });

    expect(result.issues).toEqual([]);
    expect(result.deviceCount).toBe(2);
    expect(result.devicesJson.devices.map((device) => device.id)).toEqual([
      "AAA111",
      "ZZZ999",
    ]);
  });

  it("adds platformLabel to examples from platforms.yml", async () => {
    const result = await runGenerate({
      TEST001: { meta: makeValidMeta() },
    });

    expect(result.devicesJson.devices[0]?.meta.examples[0]).toMatchObject({
      platform: "pizero-esm",
      platformLabel: "Pi Zero / Raspberry Pi (ESM)",
    });
  });

  it("sorts examples by platform then status", async () => {
    const result = await runGenerate({
      ADS1015: {
        meta: makeValidMeta({
          id: "ADS1015",
          model: "ADS1015",
          examples: [
            {
              platform: "legacy-gc-i2c",
              status: "archive",
              upstreamRepository: "chirimen-oh/chirimen",
              upstreamPath: "gc/i2c/i2c-ADS1015",
              upstreamPathUrl:
                "https://github.com/chirimen-oh/chirimen/tree/master/gc/i2c/i2c-ADS1015",
              circuitUrl: null,
              driver: "none",
              verified: false,
            },
            {
              platform: "pizero-esm",
              status: "primary",
              upstreamRepository: "chirimen-oh/chirimen.org",
              upstreamPath: "pizero/src/esm-examples/ads1015",
              upstreamPathUrl:
                "https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples/ads1015",
              circuitUrl: null,
              driver: "none",
              verified: false,
            },
          ],
        }),
      },
    });

    const examples = result.devicesJson.devices[0]?.meta.examples ?? [];
    expect(examples.map((example) => example.platform)).toEqual([
      "legacy-gc-i2c",
      "pizero-esm",
    ]);
  });

  it("includes README front matter in output", async () => {
    const result = await runGenerate({
      ADS1015: {
        meta: makeValidMeta({ id: "ADS1015", model: "ADS1015" }),
        readme: `---
title: "ADS1015"
model: "ADS1015"
category: "ADC"
description: "Single device"
---

## 概要
`,
      },
    });

    expect(result.devicesJson.devices[0]?.readme).toEqual({
      path: "devices/ADS1015/README.md",
      frontmatter: {
        title: "ADS1015",
        model: "ADS1015",
        category: "ADC",
        description: "Single device",
      },
    });
  });

  it("handles composite device ids", async () => {
    const result = await runGenerate({
      PCA9685_MX1508: {
        meta: makeValidMeta({
          id: "PCA9685_MX1508",
          model: "PCA9685_MX1508",
          tag: "I2C",
          category: "Motor controller",
        }),
      },
    });

    expect(result.devicesJson.devices[0]).toMatchObject({
      id: "PCA9685_MX1508",
      directory: "devices/PCA9685_MX1508",
      meta: {
        model: "PCA9685_MX1508",
      },
    });
  });

  it("handles remote device ids", async () => {
    const result = await runGenerate({
      remote_ADT7410: {
        meta: makeValidMeta({
          id: "remote_ADT7410",
          model: "ADT7410",
          examples: [
            {
              platform: "remote-connection",
              status: "incubator",
              upstreamRepository: "chirimen-oh/remote-connection",
              upstreamPath: "examples/adt7410",
              upstreamPathUrl:
                "https://github.com/chirimen-oh/remote-connection/tree/master/examples/adt7410",
              circuitUrl: null,
              driver: "none",
              verified: false,
            },
          ],
        }),
      },
    });

    expect(result.devicesJson.devices[0]?.meta.examples[0]).toMatchObject({
      platform: "remote-connection",
      platformLabel: "Remote Connection",
    });
  });

  it("reports missing meta.yml", async () => {
    tempRepo = await createTempRepo({
      devices: {
        TEST001: { meta: makeValidMeta() },
      },
    });

    const { rm } = await import("node:fs/promises");
    const paths = fixturePaths();
    await rm(`${tempRepo.root}/devices/TEST001/meta.yml`);

    const result = await generateDevices({
      repoRoot: tempRepo.root,
      aliasesPath: paths.aliasesPath,
      platformsPath: paths.platformsPath,
      generatedAt: FIXED_GENERATED_AT,
    });

    expect(result.issues).toEqual([
      {
        path: "devices/TEST001/meta.yml",
        message: "meta.yml is missing",
      },
    ]);
  });

  it("matches snapshot for a minimal fixture", async () => {
    const result = await runGenerate({
      TEST001: {
        meta: makeValidMeta(),
        readme: `---
title: "TEST001"
model: "TEST001"
---

## 概要
`,
      },
    });

    expect(result.devicesJson).toMatchSnapshot();
  });
});
