import { describe, expect, it } from "vitest";
import {
  buildMetaExamples,
  buildMetaYamlContent,
  buildPackages,
  deriveExampleDeviceId,
  pickPrimaryExample,
  resolveExampleCircuitUrl,
} from "./build-examples.js";
import type { AliasesConfig, PlatformsConfig, SyncDeviceEntry } from "./types.js";

const platforms: PlatformsConfig = {
  platforms: {
    "pizero-esm": {
      id: "pizero-esm",
      label: "Pi Zero / Raspberry Pi (ESM)",
      defaultStatus: "primary",
      allowedStatuses: ["primary", "special"],
      upstreamRepository: "chirimen-oh/chirimen.org",
      upstreamBasePath: "pizero/src/esm-examples",
      legacyCodeUrlPatterns: ["tutorial.chirimen.org/pizero/esm-examples"],
    },
    "legacy-gc-i2c": {
      id: "legacy-gc-i2c",
      label: "Legacy CHIRIMEN GC (I2C)",
      defaultStatus: "archive",
      allowedStatuses: ["archive", "legacy"],
      upstreamRepository: "chirimen-oh/chirimen",
      upstreamBasePath: "gc/i2c",
      legacyCodeUrlPatterns: ["r.chirimen.org/examples"],
    },
    "microbit-driver": {
      id: "microbit-driver",
      label: "micro:bit",
      defaultStatus: "legacy",
      allowedStatuses: ["legacy", "incubator", "special"],
      upstreamRepository: "chirimen-oh/chirimen-drivers",
      upstreamBasePath: "microbit-examples",
      legacyCodeUrlPatterns: ["chirimen.org/chirimen-micro-bit/examples"],
    },
    "remote-connection": {
      id: "remote-connection",
      label: "Remote Connection",
      defaultStatus: "incubator",
      allowedStatuses: ["incubator", "special", "primary"],
      upstreamRepository: "chirimen-oh/remote-connection",
      upstreamBasePath: "examples",
      legacyCodeUrlPatterns: [],
    },
  },
};

const aliases: AliasesConfig = {
  exampleNameAliases: {
    ADS1015: {
      directoryId: "ADS1015",
      exampleDeviceId: "ads1015",
      legacyExampleNames: ["I2C-ADS1015"],
    },
    PCA9685_MX1508: {
      directoryId: "PCA9685_MX1508",
      exampleDeviceId: "pca9685_mx1508",
      legacyExampleNames: ["I2C-PCA9685"],
    },
  },
};

function makeDevice(overrides: Partial<SyncDeviceEntry> = {}): SyncDeviceEntry {
  return {
    id: "ADS1015",
    model: "ADS1015",
    kind: "single",
    tag: "I2C",
    category: "ADC",
    description: "ADC device",
    imagePath: "partsImgs/ADS1015.jpg",
    productUrl: "https://www.switch-science.com/catalog/1136/",
    rawExampleUrls: {
      chirimen: "https://r.chirimen.org/examples/#I2C-ADS1015",
      piZero: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_ads1015",
    },
    ...overrides,
  };
}

describe("deriveExampleDeviceId", () => {
  it("derives adt7410 from piZero url when alias is missing", () => {
    expect(
      deriveExampleDeviceId(
        makeDevice({
          id: "ADT7410",
          model: "ADT7410",
          rawExampleUrls: {
            piZero: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_adt7410",
          },
        }),
        aliases,
      ),
    ).toBe("adt7410");
  });

  it("prefers alias exampleDeviceId over piZero url", () => {
    expect(deriveExampleDeviceId(makeDevice(), aliases)).toBe("ads1015");
  });
});

describe("buildMetaExamples", () => {
  it("builds pizero-esm for ADT7410 without alias entry", () => {
    const examples = buildMetaExamples(
      makeDevice({
        id: "ADT7410",
        model: "ADT7410",
        rawExampleUrls: {
          chirimen: "https://r.chirimen.org/examples/#I2C-ADT7410",
          microbit: "https://chirimen.org/chirimen-micro-bit/examples/#I2C1_ADT7410",
          piZero: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_adt7410",
        },
      }),
      platforms,
      aliases,
    );

    const pizero = examples.find((example) => example.platform === "pizero-esm");
    const legacy = examples.find((example) => example.platform === "legacy-gc-i2c");
    expect(pizero).toMatchObject({
      platform: "pizero-esm",
      status: "primary",
      upstreamPath: "pizero/src/esm-examples/adt7410",
      circuitUrl:
        "https://github.com/chirimen-oh/chirimen.org/blob/master/pizero/src/esm-examples/adt7410/schematic.png",
    });
    expect(legacy?.circuitUrl).toBe(
      "https://github.com/chirimen-oh/chirimen/blob/master/gc/i2c/i2c-ADT7410/schematic.png",
    );
    expect(examples).toHaveLength(3);
  });

  it("derives per-platform circuitUrl for ADS1015", () => {
    const examples = buildMetaExamples(makeDevice(), platforms, aliases);

    expect(examples).toHaveLength(2);
    expect(examples[0]).toMatchObject({
      platform: "pizero-esm",
      status: "primary",
      upstreamRepository: "chirimen-oh/chirimen.org",
      upstreamPath: "pizero/src/esm-examples/ads1015",
      circuitUrl:
        "https://github.com/chirimen-oh/chirimen.org/blob/master/pizero/src/esm-examples/ads1015/schematic.png",
      verified: false,
    });
    expect(examples[1]).toMatchObject({
      platform: "legacy-gc-i2c",
      status: "archive",
      upstreamPath: "gc/i2c/i2c-ADS1015",
      circuitUrl:
        "https://github.com/chirimen-oh/chirimen/blob/master/gc/i2c/i2c-ADS1015/schematic.png",
    });
  });

  it("adds remote-connection example for remote devices", () => {
    const examples = buildMetaExamples(
      makeDevice({
        id: "remote_ADT7410",
        model: "ADT7410",
        kind: "remote",
        rawExampleUrls: {
          chirimen: "https://r.chirimen.org/examples/#I2C-ADT7410",
        },
      }),
      platforms,
      {
        exampleNameAliases: {
          ADT7410: {
            directoryId: "ADT7410",
            exampleDeviceId: "adt7410",
            legacyExampleNames: [],
          },
        },
      },
    );

    expect(examples.some((example) => example.platform === "remote-connection")).toBe(
      true,
    );
  });
});

describe("resolveExampleCircuitUrl", () => {
  it("returns null for remote-connection", () => {
    expect(
      resolveExampleCircuitUrl(
        "remote-connection",
        "chirimen-oh/remote-connection",
        "examples/adt7410",
        "ADT7410",
        "adt7410",
      ),
    ).toBeNull();
  });
});

describe("pickPrimaryExample", () => {
  it("prefers pizero-esm primary", () => {
    const examples = buildMetaExamples(makeDevice(), platforms, aliases);
    const primary = pickPrimaryExample(examples);
    expect(primary?.platform).toBe("pizero-esm");
    expect(primary?.status).toBe("primary");
  });
});

describe("buildPackages", () => {
  it("uses first segment of composite exampleDeviceId", () => {
    expect(
      buildPackages(
        makeDevice({ id: "PCA9685_MX1508", model: "PCA9685_MX1508" }),
        aliases,
      ),
    ).toEqual(["@chirimen/pca9685"]);
  });

  it("returns empty array when example device id cannot be derived", () => {
    expect(
      buildPackages(
        makeDevice({
          id: "UNKNOWN",
          model: "日本語のみ",
          rawExampleUrls: {},
        }),
        aliases,
      ),
    ).toEqual([]);
  });
});

describe("buildMetaYamlContent", () => {
  it("returns null when no examples can be built", () => {
    const result = buildMetaYamlContent(
      makeDevice({ rawExampleUrls: {} }),
      platforms,
      aliases,
      "https://example.com/image.jpg",
    );
    expect(result).toBeNull();
  });

  it("builds full meta content for ADS1015", () => {
    const result = buildMetaYamlContent(
      makeDevice(),
      platforms,
      aliases,
      "https://raw.githubusercontent.com/chirimen-oh/chirimen.org/master/partsImgs/ADS1015.jpg",
    );

    expect(result).toMatchObject({
      id: "ADS1015",
      model: "ADS1015",
      platform: "pizero-esm",
      status: "primary",
      packages: ["@chirimen/ads1015"],
      verified: false,
    });
    expect(result?.examples).toHaveLength(2);
  });
});
