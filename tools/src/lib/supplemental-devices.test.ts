import { describe, expect, it } from "vitest";
import {
  mergeSupplementalDevices,
  parseSupplementalDevices,
  supplementalEntryToParsedDevice,
} from "./supplemental-devices.js";
import type { ParsedPartslistDevice, SupplementalDevicesConfig } from "./types.js";

describe("supplementalEntryToParsedDevice", () => {
  it("maps a supplemental entry to ParsedPartslistDevice", () => {
    const parsed = supplementalEntryToParsedDevice({
      model: "MCP9808",
      tag: "I2C",
      category: "温度センサ",
      description: "高精度温度センサ",
      productUrl: "https://example.com/mcp9808",
      omitGuessedCircuitUrl: true,
      rawExampleUrls: {
        piZero: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_mcp9808",
      },
    });

    expect(parsed.model).toBe("MCP9808");
    expect(parsed.omitGuessedCircuitUrl).toBe(true);
    expect(parsed.rawExampleUrls.piZero).toContain("mcp9808");
  });

  it("rejects entries without example urls", () => {
    expect(() =>
      supplementalEntryToParsedDevice({
        model: "X",
        tag: "I2C",
        category: "c",
        description: "d",
        productUrl: "https://example.com",
        rawExampleUrls: {},
      }),
    ).toThrow(/rawExampleUrls/);
  });
});

describe("mergeSupplementalDevices", () => {
  const partslist: ParsedPartslistDevice[] = [
    {
      model: "ADS1015",
      tag: "I2C",
      category: "ADC",
      description: "adc",
      imagePath: "partsImgs/ADS1015.jpg",
      productUrl: "https://example.com/ads1015",
      rawExampleUrls: {
        piZero: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_ads1015",
      },
    },
  ];

  it("appends supplemental models that are not in partslist", () => {
    const supplemental = parseSupplementalDevices({
      devices: {
        MCP9808: {
          model: "MCP9808",
          tag: "I2C",
          category: "温度センサ",
          description: "temp",
          productUrl: "https://example.com/mcp9808",
          rawExampleUrls: {
            piZero:
              "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_mcp9808",
          },
        },
      },
    } satisfies SupplementalDevicesConfig);

    const merged = mergeSupplementalDevices(partslist, supplemental);
    expect(merged.map((device) => device.model)).toEqual(["ADS1015", "MCP9808"]);
  });

  it("prefers partslist when the same model exists in both", () => {
    const supplemental = parseSupplementalDevices({
      devices: {
        ADS1015: {
          model: "ADS1015",
          tag: "I2C",
          category: "override",
          description: "should not win",
          productUrl: "https://example.com/override",
          rawExampleUrls: {
            piZero:
              "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_ads1015",
          },
        },
      },
    } satisfies SupplementalDevicesConfig);

    const merged = mergeSupplementalDevices(partslist, supplemental);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.category).toBe("ADC");
  });
});
