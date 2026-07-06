import { afterEach, describe, expect, it } from "vitest";
import { validateDevices } from "./validate-devices.js";
import {
  createTempRepo,
  fixturePaths,
  makeValidMeta,
  type TempRepo,
} from "./validate-devices.test-helpers.js";

let tempRepo: TempRepo | undefined;

afterEach(async () => {
  await tempRepo?.cleanup();
  tempRepo = undefined;
});

async function runValidation(
  devices: Parameters<typeof createTempRepo>[0]["devices"],
  aliasesFile = "aliases-minimal.yml",
) {
  tempRepo = await createTempRepo({ devices });
  return validateDevices({
    repoRoot: tempRepo.root,
    ...fixturePaths(aliasesFile),
  });
}

describe("validateDevices", () => {
  it("accepts a valid single device", async () => {
    const result = await runValidation({
      TEST001: { meta: makeValidMeta() },
    });

    expect(result.issues).toEqual([]);
    expect(result.deviceCount).toBe(1);
  });

  it("accepts a valid remote device", async () => {
    const result = await runValidation({
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
              verified: false,
            },
          ],
        }),
      },
    });

    expect(result.issues).toEqual([]);
  });

  it("reports missing README.md", async () => {
    const result = await runValidation({
      TEST001: { meta: makeValidMeta(), readme: false },
    });

    expect(result.issues).toEqual([
      {
        path: "devices/TEST001/README.md",
        message: "README.md is missing",
      },
    ]);
  });

  it("reports schema violations with file path", async () => {
    const result = await runValidation({
      TEST001: {
        meta: makeValidMeta({ description: undefined as unknown as string }),
      },
    });

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.path).toBe("devices/TEST001/meta.yml");
    expect(result.issues[0]?.message).toContain("description");
  });

  it("reports directory name and meta id mismatch", async () => {
    const result = await runValidation({
      WRONG_DIR: {
        meta: makeValidMeta({ id: "TEST001", model: "TEST001" }),
      },
    });

    expect(result.issues).toContainEqual({
      path: "devices/WRONG_DIR/meta.yml",
      message: 'directory name "WRONG_DIR" does not match meta id "TEST001"',
    });
  });

  it("reports remote id and model mismatch", async () => {
    const result = await runValidation({
      remote_ADT7410: {
        meta: makeValidMeta({
          id: "remote_ADT7410",
          model: "WRONG_MODEL",
        }),
      },
    });

    expect(result.issues).toContainEqual({
      path: "devices/remote_ADT7410/meta.yml",
      message:
        'remote device id "remote_ADT7410" does not match remote_WRONG_MODEL',
    });
  });

  it("reports missing composite device from aliases.yml", async () => {
    const result = await runValidation(
      {
        TEST001: { meta: makeValidMeta() },
      },
      "aliases.yml",
    );

    expect(result.issues).toContainEqual({
      path: expect.stringContaining("devices"),
      message:
        'composite device "MISSING_COMPOSITE" from aliases.yml is missing under devices/',
    });
  });

  it("reports undefined example platform", async () => {
    const result = await runValidation({
      TEST001: {
        meta: makeValidMeta({
          examples: [
            {
              platform: "unknown-platform" as "pizero-esm",
              status: "primary",
              upstreamRepository: "chirimen-oh/chirimen.org",
              upstreamPath: "pizero/src/esm-examples/test",
              upstreamPathUrl:
                "https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples/test",
              circuitUrl: null,
              verified: false,
            },
          ],
        }),
      },
    });

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.path).toBe("devices/TEST001/meta.yml");
    expect(result.issues[0]?.message).toMatch(/platform|enum/i);
  });

  it("reports example platform missing from platforms.yml", async () => {
    const result = await runValidation({
      TEST001: {
        meta: makeValidMeta({
          examples: [
            {
              platform: "legacy-gc-i2c",
              status: "archive",
              upstreamRepository: "chirimen-oh/chirimen",
              upstreamPath: "gc/i2c/test",
              upstreamPathUrl:
                "https://github.com/chirimen-oh/chirimen/tree/master/gc/i2c/test",
              circuitUrl: null,
              verified: false,
            },
          ],
        }),
      },
    });

    expect(result.issues).toContainEqual({
      path: "devices/TEST001/meta.yml#examples[0]",
      message:
        'platform "legacy-gc-i2c" is not defined in platforms.yml',
    });
  });

  it("reports invalid example status", async () => {
    const invalidMeta = `id: TEST001
model: TEST001
tag: I2C
category: Test
description: Test device
image: https://example.com/image.jpg
productUrl: https://example.com/product
examples:
  - platform: pizero-esm
    status: not-a-status
    upstreamRepository: chirimen-oh/chirimen.org
    upstreamPath: pizero/src/esm-examples/test
    upstreamPathUrl: https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples/test
    circuitUrl: null
    verified: false
circuit: null
datasheet: null
reference: null
packages:
  - "@chirimen/test"
platform: pizero-esm
status: primary
verified: false
`;

    const result = await runValidation({
      TEST001: { meta: invalidMeta },
    });

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.path).toBe("devices/TEST001/meta.yml");
    expect(result.issues[0]?.message).toMatch(/status|enum/i);
  });
});
