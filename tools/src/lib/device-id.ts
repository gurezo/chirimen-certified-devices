import type {
  AliasesConfig,
  ParsedPartslistDevice,
  ParsedPartslistDeviceWithId,
} from "./types.js";

const DEVICE_ID_PATTERN = /^(remote_)?[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function slugifyModel(model: string): string {
  return (
    model
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "device"
  );
}

function findAliasDirectoryId(
  model: string,
  aliases: AliasesConfig,
): string | undefined {
  const exampleNameAliases = aliases.exampleNameAliases ?? {};
  for (const [key, alias] of Object.entries(exampleNameAliases)) {
    if (key === model) return alias.directoryId;
    if (alias.legacyExampleNames.includes(model)) return alias.directoryId;
  }
  return undefined;
}

export function modelToBaseId(model: string, aliases: AliasesConfig = {}): string {
  const aliasId = findAliasDirectoryId(model, aliases);
  if (aliasId) return aliasId;
  if (DEVICE_ID_PATTERN.test(model)) return model;
  return slugifyModel(model);
}

export function assignUniqueDeviceIds(
  devices: ParsedPartslistDevice[],
  aliases: AliasesConfig = {},
): ParsedPartslistDeviceWithId[] {
  const idCount = new Map<string, number>();

  return devices.map((device) => {
    const baseId = modelToBaseId(device.model, aliases);
    const count = idCount.get(baseId) ?? 0;
    idCount.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    return { ...device, id };
  });
}
