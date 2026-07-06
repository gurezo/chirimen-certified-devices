import { describe, expect, it } from "vitest";
import { assignUniqueDeviceIds, modelToBaseId, slugifyModel } from "./device-id.js";
import type { AliasesConfig, ParsedPartslistDevice } from "./types.js";

const aliases: AliasesConfig = {
  exampleNameAliases: {
    ADS1015: {
      directoryId: "ADS1015",
      exampleDeviceId: "ads1015",
      legacyExampleNames: ["I2C-ADS1015", "ads1015", "ADS1015"],
    },
  },
};

function makeDevice(model: string): ParsedPartslistDevice {
  return {
    model,
    tag: "I2C",
    category: "",
    description: "",
    imagePath: "",
    productUrl: "",
    rawExampleUrls: {},
  };
}

describe("modelToBaseId", () => {
  it("returns model as-is when it matches device id pattern", () => {
    expect(modelToBaseId("ADS1015", aliases)).toBe("ADS1015");
  });

  it("returns alias directoryId for legacy example names", () => {
    expect(modelToBaseId("I2C-ADS1015", aliases)).toBe("ADS1015");
  });

  it("slugifies Japanese model names", () => {
    expect(modelToBaseId("HT16K33搭載 8x8LEDモジュール（その１）")).toBe(
      "ht16k33-8x8led",
    );
  });
});

describe("slugifyModel", () => {
  it("converts to lowercase slug", () => {
    expect(slugifyModel("ADS1015")).toBe("ads1015");
  });

  it("replaces non-alphanumeric with hyphens", () => {
    expect(slugifyModel("HT16K33 8x8")).toBe("ht16k33-8x8");
  });

  it("returns device for empty string", () => {
    expect(slugifyModel("")).toBe("device");
  });
});

describe("assignUniqueDeviceIds", () => {
  it("assigns unique ids for duplicate base ids", () => {
    const devices = [makeDevice("ADS1015"), makeDevice("ADS1015")];
    const result = assignUniqueDeviceIds(devices, aliases);
    expect(result[0].id).toBe("ADS1015");
    expect(result[1].id).toBe("ADS1015-1");
  });

  it("assigns unique ids when slugified models collide", () => {
    const devices = [
      makeDevice("HT16K33搭載 8x8LEDモジュール（その１）"),
      makeDevice("HT16K33搭載 8x8LEDモジュール（その２）"),
    ];
    const result = assignUniqueDeviceIds(devices);
    expect(result[0].id).toBe("ht16k33-8x8led");
    expect(result[1].id).toBe("ht16k33-8x8led-1");
  });
});
