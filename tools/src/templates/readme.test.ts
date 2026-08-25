import { describe, expect, it } from "vitest";
import { DRIVER_NONE } from "../lib/chirimen-drivers.js";
import type { MetaYamlContent } from "../lib/types.js";
import { renderReadme } from "./readme.js";

const knownPackages = new Set(["@chirimen/ads1015"]);

function makeMeta(overrides: Partial<MetaYamlContent> = {}): MetaYamlContent {
  return {
    id: "ADS1015",
    model: "ADS1015",
    tag: "I2C",
    category: "ADC",
    description: "ADC device",
    image: "https://example.com/image.jpg",
    productUrl: "https://example.com/product",
    examples: [
      {
        platform: "pizero-esm",
        status: "primary",
        upstreamRepository: "chirimen-oh/chirimen.org",
        upstreamPath: "pizero/src/esm-examples/ads1015",
        upstreamPathUrl:
          "https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples/ads1015",
        circuitUrl: null,
        driver: DRIVER_NONE,
        verified: false,
      },
    ],
    circuit: null,
    datasheet: null,
    reference: null,
    packages: ["@chirimen/ads1015"],
    platform: "pizero-esm",
    status: "primary",
    verified: false,
    ...overrides,
  };
}

describe("renderReadme", () => {
  it("links allowlisted packages to jsDelivr", () => {
    const readme = renderReadme(makeMeta(), knownPackages);
    expect(readme).toContain(
      "- [@chirimen/ads1015](https://www.jsdelivr.com/package/npm/@chirimen/ads1015)",
    );
    expect(readme).not.toContain("- `@chirimen/ads1015`");
  });

  it("keeps unknown packages as code spans", () => {
    const readme = renderReadme(
      makeMeta({ packages: ["@chirimen/hello-real-world"] }),
      knownPackages,
    );
    expect(readme).toContain("- `@chirimen/hello-real-world`");
    expect(readme).not.toContain("jsdelivr.com/package/npm/@chirimen/hello-real-world");
  });
});
