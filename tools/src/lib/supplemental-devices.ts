import type {
  ParsedPartslistDevice,
  SupplementalDeviceEntry,
  SupplementalDevicesConfig,
} from "./types.js";

const ALLOWED_TAGS = new Set([
  "I2C",
  "GPIO",
  "Analog",
  "Actuator",
  "Other",
  "BoardComputer",
]);

function optionalUrl(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function supplementalEntryToParsedDevice(
  entry: SupplementalDeviceEntry,
): ParsedPartslistDevice {
  if (!ALLOWED_TAGS.has(entry.tag)) {
    throw new Error(`supplemental device "${entry.model}" has invalid tag "${entry.tag}"`);
  }

  const rawExampleUrls = { ...entry.rawExampleUrls };
  if (
    !rawExampleUrls.chirimen &&
    !rawExampleUrls.microbit &&
    !rawExampleUrls.piZero
  ) {
    throw new Error(
      `supplemental device "${entry.model}" requires at least one rawExampleUrls entry`,
    );
  }

  return {
    model: entry.model.trim(),
    tag: entry.tag,
    category: entry.category.trim(),
    description: entry.description.trim(),
    imagePath: entry.imagePath?.trim() ?? "",
    productUrl: entry.productUrl.trim(),
    circuitUrl: optionalUrl(entry.circuitUrl ?? undefined),
    datasheetUrl: optionalUrl(entry.datasheetUrl ?? undefined),
    referenceUrl: optionalUrl(entry.referenceUrl ?? undefined),
    rawExampleUrls,
    omitGuessedCircuitUrl: entry.omitGuessedCircuitUrl === true,
  };
}

export function parseSupplementalDevices(
  config: SupplementalDevicesConfig,
): ParsedPartslistDevice[] {
  const devices = config.devices ?? {};
  const parsed: ParsedPartslistDevice[] = [];

  for (const [key, entry] of Object.entries(devices)) {
    if (!entry?.model?.trim()) {
      throw new Error(`supplemental device "${key}" is missing model`);
    }
    parsed.push(supplementalEntryToParsedDevice(entry));
  }

  return parsed;
}

/**
 * Merge supplemental devices into the partslist-derived list.
 * When the same model exists in both, partslist wins.
 */
export function mergeSupplementalDevices(
  partslistDevices: ParsedPartslistDevice[],
  supplementalDevices: ParsedPartslistDevice[],
): ParsedPartslistDevice[] {
  const partslistModels = new Set(
    partslistDevices.map((device) => device.model.trim().toLowerCase()),
  );

  const extras = supplementalDevices.filter(
    (device) => !partslistModels.has(device.model.trim().toLowerCase()),
  );

  return [...partslistDevices, ...extras];
}
