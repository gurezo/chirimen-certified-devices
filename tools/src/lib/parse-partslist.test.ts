import { describe, expect, it } from "vitest";
import { parseCsv, rowToParsedDevice } from "./parse-partslist.js";

describe("parseCsv", () => {
  it("parses simple CSV", () => {
    const result = parseCsv("a,b,c\n1,2,3");
    expect(result).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    const result = parseCsv('a,"b,c",d\n1,2,3');
    expect(result).toEqual([
      ["a", "b,c", "d"],
      ["1", "2", "3"],
    ]);
  });
});

describe("rowToParsedDevice", () => {
  it("returns null for unknown interface", () => {
    const row = [
      "Unknown",
      "cat",
      "name",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    expect(rowToParsedDevice(row)).toBeNull();
  });

  it("returns null for empty model", () => {
    const row = ["I2C", "cat", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
    expect(rowToParsedDevice(row)).toBeNull();
  });

  it("converts I2C row to ParsedPartslistDevice", () => {
    const row = [
      "I2C",
      "ADC(アナログ電圧測定)",
      "ADS1015",
      "https://example.com/",
      "説明",
      "partsImgs/ADS1015.jpg",
      "https://r.chirimen.org/examples/#I2C-ADS1015",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_ads1015",
    ];
    const device = rowToParsedDevice(row);
    expect(device).not.toBeNull();
    if (device) {
      expect(device.model).toBe("ADS1015");
      expect(device.tag).toBe("I2C");
      expect(device.category).toBe("ADC(アナログ電圧測定)");
      expect(device.imagePath).toBe("partsImgs/ADS1015.jpg");
      expect(device.rawExampleUrls.chirimen).toBe(
        "https://r.chirimen.org/examples/#I2C-ADS1015",
      );
      expect(device.rawExampleUrls.piZero).toBe(
        "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_ads1015",
      );
    }
  });

  it("keeps image path as relative when empty image URL", () => {
    const row = [
      "I2C",
      "cat",
      "TestDevice",
      "https://example.com/",
      "desc",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    const device = rowToParsedDevice(row);
    expect(device).not.toBeNull();
    if (device) {
      expect(device.imagePath).toBe("");
    }
  });
});
