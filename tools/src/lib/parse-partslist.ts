import type { DeviceTag, ParsedPartslistDevice, PartslistRow } from "./types.js";

export const INTERFACE_TO_TAG: Record<string, DeviceTag> = {
  I2C: "I2C",
  GPIO: "GPIO",
  アナログ: "Analog",
  アクチュエータ: "Actuator",
  その他: "Other",
  ボードコンピューター: "BoardComputer",
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === "," || char === "\n") {
        current.push(field.trim());
        field = "";
        if (char === "\n") {
          if (current.some((c) => c !== "")) {
            rows.push(current);
          }
          current = [];
        }
      } else {
        field += char;
      }
    }
  }

  if (field !== "" || current.length > 0) {
    current.push(field.trim());
    rows.push(current);
  }

  return rows;
}

function optionalUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

export function rowToParsedDevice(row: PartslistRow): ParsedPartslistDevice | null {
  const padded = [...row, ...Array(16).fill("")].slice(0, 16);
  const [
    iface,
    category,
    model,
    productUrl,
    description,
    imageUrl,
    chirimenUrl,
    circuitUrl,
    datasheetUrl,
    referenceUrl,
    noteUrl,
    specUrl,
    instructionsUrl,
    guideUrl,
    microbitUrl,
    piZeroUrl,
  ] = padded;

  const tag = INTERFACE_TO_TAG[iface?.trim() ?? ""];
  if (!tag) return null;

  const trimmedModel = model?.trim() ?? "";
  if (!trimmedModel) return null;

  const rawExampleUrls: ParsedPartslistDevice["rawExampleUrls"] = {};
  const chirimen = optionalUrl(chirimenUrl);
  const microbit = optionalUrl(microbitUrl);
  const piZero = optionalUrl(piZeroUrl);
  if (chirimen) rawExampleUrls.chirimen = chirimen;
  if (microbit) rawExampleUrls.microbit = microbit;
  if (piZero) rawExampleUrls.piZero = piZero;

  return {
    model: trimmedModel,
    tag,
    category: category?.trim() ?? "",
    description: description?.trim() ?? "",
    imagePath: imageUrl?.trim() ?? "",
    productUrl: productUrl?.trim() ?? "",
    circuitUrl: optionalUrl(circuitUrl),
    datasheetUrl: optionalUrl(datasheetUrl),
    referenceUrl: optionalUrl(referenceUrl),
    noteUrl: optionalUrl(noteUrl),
    specUrl: optionalUrl(specUrl),
    instructionsUrl: optionalUrl(instructionsUrl),
    guideUrl: optionalUrl(guideUrl),
    rawExampleUrls,
  };
}

export function parsePartslistDevices(csvText: string): ParsedPartslistDevice[] {
  const rows = parseCsv(csvText);
  const dataRows = rows.slice(1);
  const devices: ParsedPartslistDevice[] = [];

  for (const row of dataRows) {
    const device = rowToParsedDevice(row);
    if (device) devices.push(device);
  }

  return devices;
}
