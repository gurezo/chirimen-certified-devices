import { describe, expect, it } from "vitest";
import { groupSyncDevices } from "./group-sync-devices.js";
import type { AliasesConfig, ParsedPartslistDeviceWithId } from "./types.js";

const aliases: AliasesConfig = {
  compositeDevices: {
    PCA9685_MX1508: {
      models: ["PCA9685", "MX1508"],
      description: "PCA9685 + MX1508 composite",
    },
  },
  remoteDevices: {
    remote_ADT7410: {
      baseModel: "ADT7410",
      description: "ADT7410 over remote connection",
    },
  },
};

function makeDevice(
  model: string,
  overrides: Partial<ParsedPartslistDeviceWithId> = {},
): ParsedPartslistDeviceWithId {
  return {
    id: model,
    model,
    tag: "I2C",
    category: "cat",
    description: `${model} description`,
    imagePath: `partsImgs/${model}.jpg`,
    productUrl: "https://example.com/",
    rawExampleUrls: {},
    ...overrides,
  };
}

describe("groupSyncDevices", () => {
  it("keeps single devices like ADS1015", () => {
    const devices = [makeDevice("ADS1015"), makeDevice("PCA9685"), makeDevice("MX1508")];
    const result = groupSyncDevices(devices, aliases);
    const ids = result.map((entry) => entry.id);

    expect(ids).toContain("ADS1015");
    expect(result.find((entry) => entry.id === "ADS1015")?.kind).toBe("single");
  });

  it("excludes composite components and creates PCA9685_MX1508", () => {
    const devices = [makeDevice("ADS1015"), makeDevice("PCA9685"), makeDevice("MX1508")];
    const result = groupSyncDevices(devices, aliases);
    const ids = result.map((entry) => entry.id);

    expect(ids).not.toContain("PCA9685");
    expect(ids).not.toContain("MX1508");
    expect(ids).toContain("PCA9685_MX1508");

    const composite = result.find((entry) => entry.id === "PCA9685_MX1508");
    expect(composite?.kind).toBe("composite");
    expect(composite?.description).toBe("PCA9685 + MX1508 composite");
    expect(composite?.model).toBe("PCA9685_MX1508");
  });

  it("merges example urls from composite components", () => {
    const devices = [
      makeDevice("PCA9685", {
        rawExampleUrls: { chirimen: "https://r.chirimen.org/examples/#I2C-PCA9685" },
      }),
      makeDevice("MX1508", {
        tag: "GPIO",
        rawExampleUrls: { piZero: "https://tutorial.chirimen.org/pizero/esm-examples/#GPIO_hbridge1" },
      }),
    ];
    const result = groupSyncDevices(devices, aliases);
    const composite = result.find((entry) => entry.id === "PCA9685_MX1508");

    expect(composite?.rawExampleUrls.chirimen).toBe(
      "https://r.chirimen.org/examples/#I2C-PCA9685",
    );
    expect(composite?.rawExampleUrls.piZero).toBe(
      "https://tutorial.chirimen.org/pizero/esm-examples/#GPIO_hbridge1",
    );
  });

  it("creates remote_ADT7410 from ADT7410 base", () => {
    const devices = [makeDevice("ADT7410", { description: "temp sensor" })];
    const result = groupSyncDevices(devices, aliases);
    const remote = result.find((entry) => entry.id === "remote_ADT7410");

    expect(remote?.kind).toBe("remote");
    expect(remote?.model).toBe("ADT7410");
    expect(remote?.description).toBe("ADT7410 over remote connection");
  });
});
