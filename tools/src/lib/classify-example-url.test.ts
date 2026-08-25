import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyExampleUrl } from "./classify-example-url.js";
import { loadYamlFile } from "./load-yaml.js";
import type { PlatformsConfig } from "./types.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const platforms: PlatformsConfig = {
  platforms: {
    "pizero-esm": {
      id: "pizero-esm",
      label: "Pi Zero / Raspberry Pi (ESM)",
      defaultStatus: "primary",
      allowedStatuses: ["primary", "special"],
      upstreamRepository: "chirimen-oh/chirimen.org",
      upstreamBasePath: "pizero/src/esm-examples",
      legacyCodeUrlPatterns: [
        "chirimen.org/pizero/esm-examples",
        "chirimen.org/pizero/",
        "tutorial.chirimen.org/pizero/esm-examples",
        "tutorial.chirimen.org/pizero/",
      ],
    },
    "legacy-gc-i2c": {
      id: "legacy-gc-i2c",
      label: "Legacy CHIRIMEN GC (I2C)",
      defaultStatus: "archive",
      allowedStatuses: ["archive", "legacy"],
      upstreamRepository: "chirimen-oh/chirimen",
      upstreamBasePath: "gc/i2c",
      legacyCodeUrlPatterns: [
        "r.chirimen.org/examples",
        "chirimen.org/chirimen/gc/top/examples",
      ],
    },
    "legacy-gc-gpio": {
      id: "legacy-gc-gpio",
      label: "Legacy CHIRIMEN GC (GPIO)",
      defaultStatus: "archive",
      allowedStatuses: ["archive", "legacy"],
      upstreamRepository: "chirimen-oh/chirimen",
      upstreamBasePath: "gc/gpio",
      legacyCodeUrlPatterns: [
        "r.chirimen.org/examples",
        "tutorial.chirimen.org/raspi",
      ],
    },
    "microbit-driver": {
      id: "microbit-driver",
      label: "micro:bit (chirimen-drivers)",
      defaultStatus: "legacy",
      allowedStatuses: ["legacy", "incubator", "special"],
      upstreamRepository: "chirimen-oh/chirimen-drivers",
      upstreamBasePath: "microbit-examples",
      legacyCodeUrlPatterns: [
        "chirimen.org/chirimen-micro-bit/examples",
        "tutorial.chirimen.org/microbit",
      ],
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

describe("classifyExampleUrl", () => {
  it("classifies i2c-grove-gesture-paj7620u2 examples", () => {
    expect(
      classifyExampleUrl(
        "https://r.chirimen.org/examples/#I2C-Grove-Gesture",
        platforms,
      ),
    ).toEqual({
      platform: "legacy-gc-i2c",
      status: "archive",
      codeUrl: "https://r.chirimen.org/examples/#I2C-Grove-Gesture",
    });

    expect(
      classifyExampleUrl(
        "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_paj7620",
        platforms,
      ),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_paj7620",
    });
  });

  it("classifies gpio-led examples across three platforms", () => {
    expect(
      classifyExampleUrl("https://r.chirimen.org/examples/#GPIO-Blink", platforms),
    ).toEqual({
      platform: "legacy-gc-i2c",
      status: "archive",
      codeUrl: "https://r.chirimen.org/examples/#GPIO-Blink",
    });

    expect(
      classifyExampleUrl(
        "https://chirimen.org/chirimen-micro-bit/examples/#GPIO1",
        platforms,
      ),
    ).toEqual({
      platform: "microbit-driver",
      status: "incubator",
      codeUrl: "https://chirimen.org/chirimen-micro-bit/examples/#GPIO1",
    });

    expect(
      classifyExampleUrl(
        "https://tutorial.chirimen.org/pizero/esm-examples/#GPIO_hello-world",
        platforms,
      ),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://tutorial.chirimen.org/pizero/esm-examples/#GPIO_hello-world",
    });
  });

  it("classifies actuator-device-1 microbit and non-esm pizero urls", () => {
    expect(
      classifyExampleUrl("https://tutorial.chirimen.org/microbit/iot_actuate", platforms),
    ).toEqual({
      platform: "microbit-driver",
      status: "incubator",
      codeUrl: "https://tutorial.chirimen.org/microbit/iot_actuate",
    });

    expect(
      classifyExampleUrl("https://tutorial.chirimen.org/pizero/#gpio-2", platforms),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://tutorial.chirimen.org/pizero/#gpio-2",
    });
  });

  it("does not classify gc example urls as pizero-esm", () => {
    expect(
      classifyExampleUrl(
        "http://chirimen.org/chirimen/gc/top/examples/#I2C-VL53L1X",
        platforms,
      ),
    ).toEqual({
      platform: "legacy-gc-i2c",
      status: "archive",
      codeUrl: "http://chirimen.org/chirimen/gc/top/examples/#I2C-VL53L1X",
    });
  });

  it("classifies current chirimen.org pizero urls", () => {
    expect(
      classifyExampleUrl(
        "https://chirimen.org/pizero/esm-examples/#I2C_vl53l1x",
        platforms,
      ),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://chirimen.org/pizero/esm-examples/#I2C_vl53l1x",
    });

    expect(
      classifyExampleUrl("https://chirimen.org/pizero/#gpio-2", platforms),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://chirimen.org/pizero/#gpio-2",
    });
  });

  it("classifies current chirimen.org pizero urls with production platforms.yml", async () => {
    const production = await loadYamlFile<PlatformsConfig>(
      path.join(REPO_ROOT, "data/platforms.yml"),
    );

    expect(
      classifyExampleUrl(
        "https://chirimen.org/pizero/esm-examples/#I2C_vl53l1x",
        production,
      ),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://chirimen.org/pizero/esm-examples/#I2C_vl53l1x",
    });

    expect(
      classifyExampleUrl("https://chirimen.org/pizero/#gpio-2", production),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://chirimen.org/pizero/#gpio-2",
    });

    expect(
      classifyExampleUrl(
        "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_mcp9808",
        production,
      ),
    ).toEqual({
      platform: "pizero-esm",
      status: "primary",
      codeUrl: "https://tutorial.chirimen.org/pizero/esm-examples/#I2C_mcp9808",
    });
  });

  it("returns null for github urls", () => {
    expect(
      classifyExampleUrl(
        "https://github.com/SeeedDocument/Grove-Water-Level-Sensor/blob/master/water-level-sensor-demo.ino",
        platforms,
      ),
    ).toBeNull();
  });

  it("returns null for empty or unknown urls", () => {
    expect(classifyExampleUrl("", platforms)).toBeNull();
    expect(classifyExampleUrl("https://example.com/unknown", platforms)).toBeNull();
  });
});
