import { describe, expect, it } from "vitest";
import {
  applyDriverToExamples,
  applyDriverToMeta,
  DRIVER_NONE,
  jsdelivrPackageUrl,
  resolveDriver,
  toKnownPackageSet,
} from "./chirimen-drivers.js";
import type { MetaExample, MetaYamlContent } from "./types.js";

const knownPackages = toKnownPackageSet([
  "@chirimen/ads1015",
  "@chirimen/pca9685",
]);

function makeExample(overrides: Partial<MetaExample> = {}): MetaExample {
  return {
    platform: "pizero-esm",
    status: "primary",
    upstreamRepository: "chirimen-oh/chirimen.org",
    upstreamPath: "pizero/src/esm-examples/ads1015",
    upstreamPathUrl:
      "https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples/ads1015",
    circuitUrl: null,
    driver: DRIVER_NONE,
    verified: false,
    ...overrides,
  };
}

describe("resolveDriver", () => {
  it("returns chirimen-drivers package url for pizero-esm with a known package", () => {
    expect(
      resolveDriver(["@chirimen/ads1015"], "pizero-esm", knownPackages),
    ).toBe(
      "https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages/ads1015",
    );
  });

  it("returns none for non-pizero platforms even when the package is known", () => {
    expect(
      resolveDriver(["@chirimen/ads1015"], "legacy-gc-i2c", knownPackages),
    ).toBe(DRIVER_NONE);
    expect(
      resolveDriver(["@chirimen/ads1015"], "microbit-driver", knownPackages),
    ).toBe(DRIVER_NONE);
    expect(
      resolveDriver(["@chirimen/ads1015"], "remote-connection", knownPackages),
    ).toBe(DRIVER_NONE);
  });

  it("returns none when the package is not in the allowlist", () => {
    expect(
      resolveDriver(["@chirimen/hello-real-world"], "pizero-esm", knownPackages),
    ).toBe(DRIVER_NONE);
  });

  it("uses the first allowlisted package when several are present", () => {
    expect(
      resolveDriver(
        ["@chirimen/unknown", "@chirimen/pca9685"],
        "pizero-esm",
        knownPackages,
      ),
    ).toBe(
      "https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages/pca9685",
    );
  });
});

describe("applyDriverToExamples", () => {
  it("sets driver per platform", () => {
    const examples = applyDriverToExamples(
      [
        makeExample({ platform: "pizero-esm" }),
        makeExample({
          platform: "legacy-gc-i2c",
          status: "archive",
          upstreamRepository: "chirimen-oh/chirimen",
          upstreamPath: "gc/i2c/i2c-ADS1015",
        }),
      ],
      ["@chirimen/ads1015"],
      knownPackages,
    );

    expect(examples[0]?.driver).toBe(
      "https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages/ads1015",
    );
    expect(examples[1]?.driver).toBe(DRIVER_NONE);
  });
});

describe("applyDriverToMeta", () => {
  it("rewrites example driver from packages", () => {
    const meta: MetaYamlContent = {
      id: "ADS1015",
      model: "ADS1015",
      tag: "I2C",
      category: "ADC",
      description: "ADC",
      image: "https://example.com/image.jpg",
      productUrl: "https://example.com/product",
      examples: [makeExample()],
      circuit: null,
      datasheet: null,
      reference: null,
      packages: ["@chirimen/ads1015"],
      platform: "pizero-esm",
      status: "primary",
      verified: false,
    };

    expect(applyDriverToMeta(meta, knownPackages).examples[0]?.driver).toBe(
      "https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages/ads1015",
    );
  });
});

describe("jsdelivrPackageUrl", () => {
  it("builds the jsDelivr npm package url", () => {
    expect(jsdelivrPackageUrl("@chirimen/ads1015")).toBe(
      "https://www.jsdelivr.com/package/npm/@chirimen/ads1015",
    );
  });
});
